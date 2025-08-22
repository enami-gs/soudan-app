
// 給与所得控除
// https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm
export const SALARY_INCOME_DEDUCTION_TABLE = [
  { cap: 1_625_000, deduction: 550_000, rate: 0 },
  { cap: 1_800_000, deduction: 100_000, rate: 0.4 },
  { cap: 3_600_000, deduction: -80_000, rate: 0.3 }, // NTA formula is Amount * 0.3 + 80_000, same as Amount * 0.3 - (-80_000)
  { cap: 6_600_000, deduction: -440_000, rate: 0.2 },
  { cap: 8_500_000, deduction: -1_100_000, rate: 0.1 },
  { cap: Infinity, deduction: -1_950_000, rate: 0 }
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

// 基礎控除
export const BASIC_DEDUCTION = 480_000;

// 扶養控除 (一般)
export const DEPENDENT_DEDUCTION = 380_000;

// 社会保険料率 (令和7年度 東京)
// https://www.kyoukaikenpo.or.jp/~/media/Files/shared/hokenryouritu/r7/ippan/13tokyo.pdf
export const SOCIAL_INSURANCE_RATES = {
  health: 0.0998,
  nursingCare: 0.0182, // 40-64歳
  pension: 0.183,
};

// 標準報酬月額の上限 (簡略化のため上限額のみ使用)
export const STANDARD_REMUNERATION_CAP = {
  health: 1_390_000,
  pension: 650_000,
};