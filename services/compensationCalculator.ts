
import { SimulationInput, SimulationResultRow } from '../types';
import { 
  SALARY_INCOME_DEDUCTION_TABLE, 
  INCOME_TAX_RATES,
  RECONSTRUCTION_TAX_RATE,
  RESIDENCE_TAX_RATE,
  BASIC_DEDUCTION,
  DEPENDENT_DEDUCTION,
  SOCIAL_INSURANCE_RATES,
  STANDARD_REMUNERATION_CAP
} from '../constants';

const CORPORATE_TAX_RATE = 0.30; // 30%に固定

const calculateSalaryIncomeDeduction = (annualCompensation: number): number => {
  if (annualCompensation > 8_500_000) {
    return 1_950_000;
  }
  let previousCap = 0;
  for (const tier of SALARY_INCOME_DEDUCTION_TABLE) {
    if (annualCompensation <= tier.cap) {
        if (tier.rate === 0) { // Special cases for first and last tier
            if (annualCompensation <= 1_625_000) return 550_000;
            return 1_950_000; // This case handled above, but for safety
        }
        // NTA's table can be read as `Amount * Rate - K` or `Amount * Rate + K`.
        // The constant table is structured to be `Amount * Rate - deduction`
        if(tier.deduction > 0) {
            return Math.floor(annualCompensation * tier.rate) - tier.deduction;
        } else {
             return Math.floor(annualCompensation * tier.rate) + Math.abs(tier.deduction);
        }
    }
    previousCap = tier.cap;
  }
  return 1_950_000; // fallback for amounts over 8.5M
};


const calculateSocialInsurance = (monthlyCompensation: number, age: number): { individual: number; company: number } => {
  const healthStandard = Math.min(monthlyCompensation, STANDARD_REMUNERATION_CAP.health);
  const pensionStandard = Math.min(monthlyCompensation, STANDARD_REMUNERATION_CAP.pension);
  
  let healthRate = SOCIAL_INSURANCE_RATES.health;
  if (age >= 40 && age <= 64) {
    healthRate += SOCIAL_INSURANCE_RATES.nursingCare;
  }
  
  const healthInsurance = healthStandard * healthRate;
  const pensionInsurance = pensionStandard * SOCIAL_INSURANCE_RATES.pension;
  
  const total = healthInsurance + pensionInsurance;
  
  // 会社と個人で折半
  return {
    individual: Math.round(total / 2),
    company: Math.round(total / 2),
  };
};

const calculateIncomeTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  for (const tier of INCOME_TAX_RATES) {
    if (taxableIncome <= tier.cap) {
      tax = taxableIncome * tier.rate - tier.deduction;
      break;
    }
  }
  
  const totalTax = tax * (1 + RECONSTRUCTION_TAX_RATE);
  return Math.floor(totalTax);
};


export const runSimulation = (input: SimulationInput): SimulationResultRow[] => {
  const results: SimulationResultRow[] = [];
  const increment = input.incrementAmount;
  
  for (let i = -5; i <= 5; i++) {
    const monthlyCompensation = input.baseMonthlyCompensation + i * increment;
    if (monthlyCompensation <= 0) continue;

    const annualCompensation = monthlyCompensation * 12;

    const socialInsurance = calculateSocialInsurance(monthlyCompensation, input.age);
    const individualSocialInsurance = socialInsurance.individual * 12;
    const companySocialInsurance = socialInsurance.company * 12;

    const salaryIncomeDeduction = calculateSalaryIncomeDeduction(annualCompensation);
    const dependentsDeduction = input.dependents * DEPENDENT_DEDUCTION;
    
    const taxableIncome = Math.max(0, annualCompensation - salaryIncomeDeduction - individualSocialInsurance - BASIC_DEDUCTION - dependentsDeduction);
    
    const incomeTax = calculateIncomeTax(taxableIncome);
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
      annualCompensation,
      individualTakeHomePay,
      individualSocialInsurance,
      incomeTax,
      residenceTax,
      totalIndividualTaxes,
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