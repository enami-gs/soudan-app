// 改正後の給与所得控除 (図表9)
export const SALARY_INCOME_DEDUCTION_TABLE = [
  { cap: 1_900_000, deduction: 650_000, rate: 0 },
  { cap: 3_600_000, deduction: -80_000, rate: 0.3 },   // 収入 × 30% + 8万円
  { cap: 6_600_000, deduction: -440_000, rate: 0.2 },  // 収入 × 20% + 44万円
  { cap: 8_500_000, deduction: -1_100_000, rate: 0.1 }, // 収入 × 10% + 110万円
  { cap: Infinity, deduction: 1_950_000, rate: 0 }      // 195万円
];

// 所得税率
// https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm
export const INCOME_TAX_RATES = [
    { cap: 1_949_999, rate: 0.05, deduction: 0 },
    { cap: 3_299_999, rate: 0.1, deduction: 97_500 },
    { cap: 6_949_999, rate: 0.2, deduction: 427_500 },
    { cap: 8_999_999, rate: 0.23, deduction: 636_000 },
    { cap: 17_999_999, rate: 0.33, deduction: 1_536_000 },
    { cap: 39_999_999, rate: 0.4, deduction: 2_796_000 },
    { cap: Infinity, rate: 0.45, deduction: 4_796_000 },
];

// 復興特別所得税率
export const RECONSTRUCTION_TAX_RATE = 0.021;

// 住民税率 (簡略化)
export const RESIDENCE_TAX_RATE = 0.1;

// 改正後の基礎控除 (図表8)
// Based on 合計所得金額 (Total Income Amount)
export const BASIC_DEDUCTION_TABLE = [
    { cap: 1_320_000, deduction: 950_000 },
    { cap: 3_360_000, deduction: 880_000 },
    { cap: 4_890_000, deduction: 680_000 },
    { cap: 6_550_000, deduction: 630_000 },
    { cap: 23_500_000, deduction: 580_000 },
    { cap: 24_000_000, deduction: 480_000 },
    { cap: 24_500_000, deduction: 320_000 },
    { cap: 25_000_000, deduction: 160_000 },
    { cap: Infinity, deduction: 0 },
];

// 扶養控除 (一般)
export const DEPENDENT_DEDUCTION = 380_000;

// 法人税率
export const CORPORATE_TAX_RATE = 0.30;

// 社会保険料率
export const SOCIAL_INSURANCE_RATES = {
  health: 0.0991, // 健康保険料率
  nursingCare: 0.0159, // 介護保険料率 (40-64歳)
  pension: 0.183,
  childRearingLevy: 0.0036, // 子ども・子育て拠出金
};

// 標準報酬月額の上限
export const STANDARD_REMUNERATION_CAP = {
  health: 1_390_000,
  pension: 650_000,
};

// 標準賞与額の上限
export const STANDARD_BONUS_CAP = {
  healthCumulative: 5_730_000, // 年度累計
  pensionPerMonth: 1_500_000, // 1回あたり
};