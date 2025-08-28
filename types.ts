
export interface SimulationInput {
  companyProfitBeforeCompensation: number;
  baseMonthlyCompensation: number;
  annualBonus: number;
  age: number; // 39: under 40, 40: 40-64, 65: 65+
  dependents: number;
  incrementAmount: number;
  otherDeductions: number;
}

export interface SimulationResultRow {
  // Inputs
  monthlyCompensation: number;
  annualBonus: number;
  annualCompensation: number;
  otherDeductions: number;
  
  // Individual
  individualTakeHomePay: number;
  individualSocialInsurance: number;
  incomeTax: number;
  incomeTaxRate: number;
  incomeTaxDeduction: number;
  residenceTax: number;
  totalIndividualTaxes: number;
  salaryIncomeDeduction: number;
  basicDeduction: number;
  taxableIncome: number;

  // Company
  companySocialInsurance: number;
  totalCompanyCost: number;
  companyProfitAfterCompensation: number;
  corporateTax: number;
  companyNetProfit: number;
  
  // Combined
  totalCashRemaining: number;
}

export type AgeCategory = 'under40' | '40to64' | '65over';