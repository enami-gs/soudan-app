import jsPDF from 'jspdf';
// FIX: Import RowInput type from jspdf-autotable to correctly type table body data.
import autoTable, { RowInput } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { SimulationInput, SimulationResultRow } from '../types';
import { ipaexgBase64 } from './ipaexg-base64';
import { DEPENDENT_DEDUCTION } from '../constants';

const formatCurrency = (value: number) => `${value.toLocaleString('ja-JP')} 円`;
const FONT_NAME = 'ipaexg';

// Helper to find optimal and base results
const findOptimalResult = (results: SimulationResultRow[]) => {
  if (!results || results.length === 0) return null;
  return results.reduce((min, current) => {
    const minTotalTax = min.totalIndividualTaxes + min.corporateTax;
    const currentTotalTax = current.totalIndividualTaxes + current.corporateTax;
    return currentTotalTax < minTotalTax ? current : min;
  }, results[0]);
};

const findBaseResult = (results: SimulationResultRow[], baseMonthlyCompensation: number) => {
  if (!results) return null;
  return results.find(r => r.monthlyCompensation === baseMonthlyCompensation) || null;
};

export const exportResultsToPdf = async (
  input: SimulationInput,
  results: SimulationResultRow[],
  chartElement: HTMLElement
) => {
  const doc = new jsPDF('p', 'pt', 'a4');

  // 1. Add Japanese font
  doc.addFileToVFS(`${FONT_NAME}.ttf`, ipaexgBase64);
  doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal');
  doc.setFont(FONT_NAME);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let cursorY = margin;

  const addPageIfNeeded = (height: number) => {
    if (cursorY + height > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  const addSectionTitle = (title: string, spaceAfter = 25) => {
    addPageIfNeeded(40 + spaceAfter);
    doc.setFontSize(14);
    doc.setTextColor(23, 37, 84); // text-indigo-900
    doc.text(title, margin, cursorY);
    cursorY += spaceAfter;
  };

  // --- PDF Content ---

  // Header
  doc.setFontSize(18);
  doc.setTextColor(28, 25, 23); // text-gray-900
  doc.text('役員報酬最適化シミュレーションレポート', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 25;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // text-gray-500
  doc.text(`作成日: ${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 40;

  // Section: Simulation Conditions
  addSectionTitle('シミュレーション条件');
  const ageMap: {[key: number]: string} = { 39: '40歳未満', 40: '40歳以上65歳未満', 65: '65歳以上' };
  autoTable(doc, {
    startY: cursorY,
    body: [
      { label: '役員報酬支払い前の会社利益', value: formatCurrency(input.companyProfitBeforeCompensation) },
      { label: '基準の役員報酬（月額）', value: formatCurrency(input.baseMonthlyCompensation) },
      { label: '年間賞与額', value: formatCurrency(input.annualBonus) },
      { label: 'シミュレーションの刻み幅', value: formatCurrency(input.incrementAmount) },
      { label: '年齢', value: ageMap[input.age] },
      { label: '扶養親族の数（一般）', value: `${input.dependents} 人` },
      { label: 'その他控除', value: formatCurrency(input.otherDeductions) },
    ],
    columns: [
      { header: '項目', dataKey: 'label' },
      { header: '入力値', dataKey: 'value' },
    ],
    theme: 'grid',
    styles: { font: FONT_NAME, fontSize: 10, cellPadding: 5 },
    headStyles: { font: FONT_NAME, fillColor: [79, 70, 229] }, // bg-indigo-600
  });
  cursorY = (doc as any).lastAutoTable.finalY + 30;

  // Section: Optimal Result
  const optimalResult = findOptimalResult(results);
  if (optimalResult) {
    addSectionTitle('最適化結果');
    doc.setFillColor(239, 246, 255); // bg-indigo-50
    doc.rect(margin, cursorY, pageWidth - margin * 2, 70, 'F');
    doc.setFontSize(10);
    doc.setTextColor(67, 56, 202); // text-indigo-700
    doc.text('最適な役員報酬（月額）', pageWidth / 2, cursorY + 20, { align: 'center' });
    doc.setFontSize(18);
    doc.setTextColor(30, 27, 75); // text-indigo-900
    doc.text(formatCurrency(optimalResult.monthlyCompensation), pageWidth / 2, cursorY + 45, { align: 'center' });
    cursorY += 90;
  }
  
  // Section: Base Result Breakdown
  const baseResult = findBaseResult(results, input.baseMonthlyCompensation);
  if (baseResult) {
    addSectionTitle(`基準額（月額 ${formatCurrency(baseResult.monthlyCompensation)}）の詳細計算`);
    
    // FIX: Explicitly type `individualBody` as `RowInput[]` to resolve TypeScript error with `fontStyle`.
    const individualBody: RowInput[] = [
        ['報酬合計 (年)', formatCurrency(baseResult.annualCompensation)],
        ['(-) 給与所得控除', formatCurrency(baseResult.salaryIncomeDeduction)],
        ['(-) 社会保険料', formatCurrency(baseResult.individualSocialInsurance)],
        ['(-) 基礎控除', formatCurrency(baseResult.basicDeduction)],
        ['(-) 扶養控除', formatCurrency(input.dependents * DEPENDENT_DEDUCTION)],
        ['(-) その他控除', formatCurrency(baseResult.otherDeductions)],
        ['(=) 課税所得', { content: formatCurrency(baseResult.taxableIncome), styles: { fontStyle: 'bold' }}],
        ['(-) 所得税', formatCurrency(baseResult.incomeTax)],
        ['(-) 住民税', formatCurrency(baseResult.residenceTax)],
        ['個人の手取り額', { content: formatCurrency(baseResult.individualTakeHomePay), styles: { fontStyle: 'bold', textColor: [67, 56, 202] }}],
    ];
     autoTable(doc, {
        head: [['個人', '']],
        body: individualBody,
        startY: cursorY,
        theme: 'grid',
        styles: { font: FONT_NAME, fontSize: 9, cellPadding: 4 },
        headStyles: { font: FONT_NAME, fillColor: [107, 114, 128] },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 20;

    // FIX: Explicitly type `companyBody` as `RowInput[]` to resolve TypeScript error with `fontStyle`.
     const companyBody: RowInput[] = [
        ['支払い前の利益', formatCurrency(input.companyProfitBeforeCompensation)],
        ['(-) 報酬合計 (年)', formatCurrency(baseResult.annualCompensation)],
        ['(-) 社会保険料', formatCurrency(baseResult.companySocialInsurance)],
        ['(=) 税引前利益', { content: formatCurrency(baseResult.companyProfitAfterCompensation), styles: { fontStyle: 'bold' }}],
        ['(-) 法人税', formatCurrency(baseResult.corporateTax)],
        ['法人の手残り', { content: formatCurrency(baseResult.companyNetProfit), styles: { fontStyle: 'bold', textColor: [67, 56, 202] }}],
    ];
     autoTable(doc, {
        head: [['法人', '']],
        body: companyBody,
        startY: cursorY,
        theme: 'grid',
        styles: { font: FONT_NAME, fontSize: 9, cellPadding: 4 },
        headStyles: { font: FONT_NAME, fillColor: [107, 114, 128] },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 30;
  }

  // Section: Chart
  addSectionTitle('手残り合計額の比較');
  try {
    const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    addPageIfNeeded(imgHeight + 20);
    doc.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight);
    cursorY += imgHeight + 30;
  } catch(e) {
      doc.setTextColor(239, 68, 68); // text-red-500
      doc.text('グラフの画像変換に失敗しました。', margin, cursorY);
      cursorY += 20;
      console.error("html2canvas failed:", e);
  }
  
  // Section: Detailed Data
  addSectionTitle('詳細データ');
  autoTable(doc, {
    startY: cursorY,
    head: [['役員報酬(月)', '税金合計', '合計手残り', '個人手取り', '会社手残り', '社会保険料合計']],
    body: results.map(row => [
      formatCurrency(row.monthlyCompensation),
      formatCurrency(row.totalIndividualTaxes + row.corporateTax),
      formatCurrency(row.totalCashRemaining),
      formatCurrency(row.individualTakeHomePay),
      formatCurrency(row.companyNetProfit),
      formatCurrency(row.individualSocialInsurance + row.companySocialInsurance)
    ]),
    theme: 'striped',
    styles: { font: FONT_NAME, fontSize: 9, cellPadding: 4 },
    headStyles: { font: FONT_NAME, fillColor: [79, 70, 229] },
    didParseCell: function (data) {
        if (optimalResult && data.row.raw[0] === formatCurrency(optimalResult.monthlyCompensation)) {
            data.cell.styles.fillColor = '#e0e7ff'; // bg-indigo-200
            data.cell.styles.textColor = '#1e1b4b'; // text-indigo-900
        }
    }
  });

  // Footer with Page Numbers
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // text-gray-400
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
    doc.text('Executive Compensation Optimizer', margin, pageHeight - 20);
  }

  // Save the PDF
  doc.save('Executive-Compensation-Report.pdf');
};
