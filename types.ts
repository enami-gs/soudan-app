
export interface SimulationInput {
  companyProfitBeforeCompensation: number;
  baseMonthlyCompensation: number;
  age: number; // 39: under 40, 40: 40-64, 65: 65+
  dependents: number;
  incrementAmount: number;
}

export interface SimulationResultRow {
  // Inputs
  monthlyCompensation: number;
  annualCompensation: number;
  
  // Individual
  individualTakeHomePay: number;
  individualSocialInsurance: number;
  incomeTax: number;
  residenceTax: number;
  totalIndividualTaxes: number;

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