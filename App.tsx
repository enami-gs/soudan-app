
import React, { useState, useMemo } from 'react';
import { SimulationInput, SimulationResultRow } from './types';
import { runSimulation } from './services/compensationCalculator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- UI Helper Components ---
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white shadow-lg rounded-xl p-6 sm:p-8 ${className}`}>{children}</div>
);

const Label: React.FC<{ htmlFor: string; children: React.ReactNode; tooltip?: string }> = ({ htmlFor, children, tooltip }) => (
    <label htmlFor={htmlFor} className="flex items-center text-sm font-medium text-gray-700">
        {children}
        {tooltip && (
            <div className="group relative flex items-center justify-center ml-2">
                <span className="w-4 h-4 bg-gray-300 text-white text-xs font-bold rounded-full flex items-center justify-center cursor-pointer">?</span>
                <div className="absolute bottom-6 w-64 bg-gray-800 text-white text-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {tooltip}
                </div>
            </div>
        )}
    </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${props.className}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${props.className}`}>
    {props.children}
  </select>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props} className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 ${props.className}`}>
    {props.children}
  </button>
);

// --- Main App Component ---
export default function App() {
  const [input, setInput] = useState<SimulationInput>({
    companyProfitBeforeCompensation: 20000000,
    baseMonthlyCompensation: 1000000,
    age: 40,
    dependents: 0,
    incrementAmount: 100000,
  });
  const [results, setResults] = useState<SimulationResultRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);
    setTimeout(() => {
        const simResults = runSimulation(input);
        setResults(simResults);
        setIsLoading(false);
    }, 500);
  };
  
  const optimalResult = useMemo(() => {
    if (!results || results.length === 0) return null;
    // Find the result with the minimum total taxes (individual + corporate)
    return results.reduce((min, current) => {
        const minTotalTax = min.totalIndividualTaxes + min.corporateTax;
        const currentTotalTax = current.totalIndividualTaxes + current.corporateTax;
        return currentTotalTax < minTotalTax ? current : min;
    }, results[0]);
  }, [results]);

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('ja-JP')} 円`;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">役員報酬最適化シミュレーター</h1>
          <p className="mt-2 text-md text-gray-600">税金合計額を最小化する報酬額を見つけましょう。</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">シミュレーション条件</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="companyProfitBeforeCompensation" tooltip="役員報酬や社会保険料（会社負担分）を支払う前の、会社の利益（≒営業利益＋営業外収益－営業外費用）を入力してください。">
                    役員報酬支払い前の会社利益
                  </Label>
                  <Input type="number" name="companyProfitBeforeCompensation" id="companyProfitBeforeCompensation" value={input.companyProfitBeforeCompensation} onChange={handleInputChange} step={100000} />
                </div>
                 <div>
                  <Label htmlFor="baseMonthlyCompensation" tooltip="シミュレーションの中心としたい役員報酬の月額を入力してください。この金額を基準に、±5パターンの報酬額を比較します。">
                    基準の役員報酬（月額）
                  </Label>
                  <Input type="number" name="baseMonthlyCompensation" id="baseMonthlyCompensation" value={input.baseMonthlyCompensation} onChange={handleInputChange} step={50000} />
                </div>
                 <div>
                  <Label htmlFor="incrementAmount" tooltip="シミュレーションで比較する役員報酬の増減額（刻み幅）を入力します。例えば10万円と入力すると、基準報酬額±10万円、±20万円…といった形で比較します。">
                    シミュレーションの刻み幅
                  </Label>
                  <Input type="number" name="incrementAmount" id="incrementAmount" value={input.incrementAmount} onChange={handleInputChange} step={10000} />
                </div>
                <div>
                  <Label htmlFor="age" tooltip="経営者の方の年齢を選択してください。40歳以上65歳未満の場合、介護保険料が加算されます。">
                    年齢
                  </Label>
                  <Select name="age" id="age" value={input.age} onChange={handleInputChange}>
                    <option value={39}>40歳未満</option>
                    <option value={40}>40歳以上65歳未満</option>
                    <option value={65}>65歳以上</option>
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="dependents" tooltip="所得税の計算に使用します。配偶者控除やその他の特定の控除は考慮されませんので、一般的な扶養親族の人数を入力してください。">
                    扶養親族の数（一般）
                  </Label>
                  <Input type="number" name="dependents" id="dependents" value={input.dependents} onChange={handleInputChange} min="0" />
                </div>
                <div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? '計算中...' : 'シミュレーション実行'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {isLoading && <div className="text-center p-10"><p className="text-indigo-600">最適化ポイントを計算しています...</p></div>}
            {results && optimalResult && (
              <div className="space-y-8">
                <Card>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">シミュレーション結果</h2>
                    <p className="text-gray-600">分析の結果、税金合計額を最小化する最適な役員報酬は以下の通りです。</p>
                    <div className="mt-6 p-6 bg-indigo-50 rounded-lg text-center">
                        <p className="text-sm text-indigo-700">最適な役員報酬（月額）</p>
                        <p className="text-4xl font-bold text-indigo-900 my-2">{formatCurrency(optimalResult.monthlyCompensation)}</p>
                        <p className="text-sm text-indigo-700">その時の税金合計額（最小）</p>
                        <p className="text-2xl font-semibold text-indigo-900 mt-2">{formatCurrency(optimalResult.totalIndividualTaxes + optimalResult.corporateTax)}</p>
                    </div>
                </Card>
                
                <Card>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">手残り合計額の比較</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={results} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monthlyCompensation" tickFormatter={(tick) => `${tick / 10000}万円`} />
                                <YAxis tickFormatter={(tick) => `${(tick / 10000).toLocaleString()}万円`} />
                                <Tooltip formatter={(value:number) => [formatCurrency(value), '手残り合計']} labelFormatter={(label) => `月収: ${label/10000}万円`} />
                                <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '1rem'}} />
                                <Bar dataKey="totalCashRemaining" name="会社・個人 手残り合計" fill="#4f46e5" />
                                <Bar dataKey="individualTakeHomePay" name="個人手取り" fill="#818cf8" />
                                <Bar dataKey="companyNetProfit" name="会社手残り" fill="#c7d2fe" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">詳細データ</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役員報酬(月)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">税金合計</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計手残り</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">個人手取り</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会社手残り</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">社会保険料合計</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.map((row) => (
                          <tr key={row.monthlyCompensation} className={row.monthlyCompensation === optimalResult.monthlyCompensation ? 'bg-indigo-50' : ''}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(row.monthlyCompensation)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{formatCurrency(row.totalIndividualTaxes + row.corporateTax)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(row.totalCashRemaining)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(row.individualTakeHomePay)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(row.companyNetProfit)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(row.individualSocialInsurance + row.companySocialInsurance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
            {!results && !isLoading && (
              <Card>
                <div className="text-center text-gray-500 py-12">
                  <h3 className="text-lg font-medium">ようこそ！</h3>
                  <p className="mt-2">左のフォームに条件を入力し、「シミュレーション実行」ボタンを押してください。</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}