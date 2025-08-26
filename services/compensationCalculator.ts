
import { SimulationInput, SimulationResultRow } from '../types';
import { 
  SALARY_INCOME_DEDUCTION_TABLE, 
  INCOME_TAX_RATES,
  RECONSTRUCTION_TAX_RATE,
  RESIDENCE_TAX_RATE,
  BASIC_DEDUCTION_TABLE,
  DEPENDENT_DEDUCTION,
  SOCIAL_INSURANCE_RATES,
  STANDARD_REMUNERATION_CAP,
  STANDARD_BONUS_CAP,
  CORPORATE_TAX_RATE
} from '../constants';

const calculateSalaryIncomeDeduction = (annualCompensation: number): number => {
  for (const tier of SALARY_INCOME_DEDUCTION_TABLE) {
    if (annualCompensation <= tier.cap) {
      if (tier.rate === 0) {
        return tier.deduction;
      }
      if(tier.deduction > 0) {
          return Math.floor(annualCompensation * tier.rate) - tier.deduction;
      } else {
           return Math.floor(annualCompensation * tier.rate) + Math.abs(tier.deduction);
      }
    }
  }
  return 1_950_000;
};

const calculateBasicDeduction = (totalIncome: number): number => {
  for (const tier of BASIC_DEDUCTION_TABLE) {
    if (totalIncome <= tier.cap) {
      return tier.deduction;
    }
  }
  return 0;
};

const calculateMonthlySocialInsurance = (monthlyCompensation: number, age: number): { individual: number; company: number; pensionStandard: number } => {
  const healthStandard = Math.min(monthlyCompensation, STANDARD_REMUNERATION_CAP.health);
  const pensionStandard = Math.min(monthlyCompensation, STANDARD_REMUNERATION_CAP.pension);
  
  let healthRate = SOCIAL_INSURANCE_RATES.health;
  if (age >= 40 && age <= 64) {
    healthRate += SOCIAL_INSURANCE_RATES.nursingCare;
  }
  
  const healthInsurance = healthStandard * healthRate;
  const pensionInsurance = pensionStandard * SOCIAL_INSURANCE_RATES.pension;
  
  const total = healthInsurance + pensionInsurance;
  
  return {
    individual: Math.round(total / 2),
    company: Math.round(total / 2),
    pensionStandard: pensionStandard,
  };
};

const calculateBonusSocialInsurance = (annualBonus: number, age: number): { individual: number; company: number; pensionStandard: number } => {
    if (annualBonus <= 0) return { individual: 0, company: 0, pensionStandard: 0 };

    const standardBonusBase = Math.floor(annualBonus / 1000) * 1000;
    const standardBonusHealth = Math.min(standardBonusBase, STANDARD_BONUS_CAP.healthCumulative);
    const pensionStandard = Math.min(standardBonusBase, STANDARD_BONUS_CAP.pensionPerMonth);

    let healthRate = SOCIAL_INSURANCE_RATES.health;
    if (age >= 40 && age <= 64) {
      healthRate += SOCIAL_INSURANCE_RATES.nursingCare;
    }

    const healthInsurance = standardBonusHealth * healthRate;
    const pensionInsurance = pensionStandard * SOCIAL_INSURANCE_RATES.pension;
    const total = healthInsurance + pensionInsurance;

    return {
        individual: Math.round(total / 2),
        company: Math.round(total / 2),
        pensionStandard: pensionStandard,
    };
};


const calculateIncomeTax = (taxableIncome: number): { tax: number; rate: number; deduction: number } => {
  if (taxableIncome <= 0) return { tax: 0, rate: 0, deduction: 0 };

  let tax = 0;
  let rate = 0;
  let deduction = 0;

  for (const tier of INCOME_TAX_RATES) {
    if (taxableIncome <= tier.cap) {
      rate = tier.rate;
      deduction = tier.deduction;
      tax = taxableIncome * rate - deduction;
      break;
    }
  }
  
  const totalTax = tax * (1 + RECONSTRUCTION_TAX_RATE);
  return { tax: Math.floor(totalTax), rate, deduction };
};


export const runSimulation = (input: SimulationInput): SimulationResultRow[] => {
  const results: SimulationResultRow[] = [];
  const increment = input.incrementAmount;
  
  for (let i = -5; i <= 5; i++) {
    const monthlyCompensation = input.baseMonthlyCompensation + i * increment;
    if (monthlyCompensation <= 0) continue;

    const annualBonus = input.annualBonus;
    const annualCompensation = monthlyCompensation * 12 + annualBonus;

    // Social Insurance Calculation
    const monthlyInsurance = calculateMonthlySocialInsurance(monthlyCompensation, input.age);
    const bonusInsurance = calculateBonusSocialInsurance(annualBonus, input.age);

    const individualSocialInsurance = (monthlyInsurance.individual * 12) + bonusInsurance.individual;
    
    // Child-rearing Levy (Company only)
    const totalPensionStandard = (monthlyInsurance.pensionStandard * 12) + bonusInsurance.pensionStandard;
    const childRearingLevy = Math.floor(totalPensionStandard * SOCIAL_INSURANCE_RATES.childRearingLevy);
    
    const companySocialInsurance = (monthlyInsurance.company * 12) + bonusInsurance.company + childRearingLevy;


    const salaryIncomeDeduction = calculateSalaryIncomeDeduction(annualCompensation);
    const totalIncomeBeforeDeductions = annualCompensation - salaryIncomeDeduction;
    const basicDeduction = calculateBasicDeduction(totalIncomeBeforeDeductions);
    const dependentsDeduction = input.dependents * DEPENDENT_DEDUCTION;
    
    const taxableIncome = Math.max(0, totalIncomeBeforeDeductions - individualSocialInsurance - basicDeduction - dependentsDeduction);
    
    const { tax: incomeTax, rate: incomeTaxRate, deduction: incomeTaxDeduction } = calculateIncomeTax(taxableIncome);
    const residenceTax = Math.floor(Math.max(0, taxableIncome) * RESIDENCE_TAX_RATE);
    const totalIndividualTaxes = incomeTax + residenceTax;

    const individualTakeHomePay = annualCompensation - individualSocialInsurance - totalIndividualTaxes;

    const totalCompanyCost = annualCompensation + companySocialInsurance;
    const companyProfitAfterCompensation = input.companyProfitBeforeCompensation - totalCompanyCost;

    const corporateTax = Math.floor(Math.max(0, companyProfitAfterCompensation) * CORPORATE_TAX_RATE);
    const companyNetProfit = companyProfitAfterCompensation - corporateTax;

    const totalCashRemaining = individualTakeHomePay + companyNetProfit;
    
    results.push({
      monthlyCompensation,
      annualBonus,
      annualCompensation,
      individualTakeHomePay,
      individualSocialInsurance,
      incomeTax,
      incomeTaxRate,
      incomeTaxDeduction,
      residenceTax,
      totalIndividualTaxes,
      salaryIncomeDeduction,
      basicDeduction,
      taxableIncome,
      companySocialInsurance,
      totalCompanyCost,
      companyProfitAfterCompensation,
      corporateTax,
      companyNetProfit,
      totalCashRemaining,
    });
  }
  
  return results;
};