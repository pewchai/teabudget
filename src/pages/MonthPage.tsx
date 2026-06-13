import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBudget, getMonthTransactions, sumByCategory } from '../store/BudgetContext';
import { MONTH_NAMES } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const YEAR = 2026;

export default function MonthPage() {
  const { month: monthStr } = useParams<{ month: string }>();
  const month = parseInt(monthStr ?? '1', 10);
  const monthKey = `${YEAR}-${String(month).padStart(2, '0')}`;
  const monthName = MONTH_NAMES[month - 1];

  const { state, dispatch } = useBudget();
  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);
  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);
  const monthBudgets = (state.budgets[monthKey] ?? {}) as Record<string, number>;

  const txs = useMemo(
    () => getMonthTransactions(state.transactions, state.recurring, YEAR, month),
    [state.transactions, state.recurring, month]
  );
  const actuals = useMemo(() => sumByCategory(txs), [txs]);

  const rows = catNames.map(cat => ({
    cat,
    budget: monthBudgets[cat] ?? 0,
    actual: Math.round((actuals[cat] ?? 0) * 100) / 100,
    diff: (monthBudgets[cat] ?? 0) - (actuals[cat] ?? 0),
  }));

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalDiff = totalBudget - totalActual;

  const barData = rows.filter(r => r.budget > 0 || r.actual > 0)
    .map(r => ({ name: r.cat, Budget: r.budget, Actual: r.actual }));
  const pieData = rows.filter(r => r.actual > 0).map(r => ({ name: r.cat, value: r.actual }));

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  function startEdit(cat: string, current: number) { setEditingCat(cat); setEditVal(String(current)); }
  function commitEdit(cat: string) {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) dispatch({ type: 'SET_BUDGET', monthKey, category: cat, amount: val });
    setEditingCat(null);
  }

  const isRecurring = (id: string) => id.startsWith('rec-');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{monthName} 2026</h2>
        <p className="text-gray-500 text-sm mt-1">{txs.length} transactions · ${totalActual.toFixed(2)} spent</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} layout="vertical" barCategoryGap="25%">
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={72} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
              <Bar dataKey="Budget" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Actual" radius={[0, 4, 4, 0]}>
                {barData.map(e => <Cell key={e.name} fill={colorMap[e.name] ?? '#9ca3af'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Spending Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={90} innerRadius={50}>
                  {pieData.map(e => <Cell key={e.name} fill={colorMap[e.name] ?? '#9ca3af'} />)}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center mt-16">No transactions yet</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Budget</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actual</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ cat, budget, actual, diff }) => (
              <tr key={cat} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colorMap[cat] ?? '#9ca3af' }} />
                  {cat}
                </td>
                <td className="px-5 py-3 text-right">
                  {editingCat === cat ? (
                    <input type="number" step="0.01" value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={() => commitEdit(cat)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(cat)}
                      autoFocus className="w-24 text-right border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none" />
                  ) : (
                    <button onClick={() => startEdit(cat, budget)} className="text-gray-700 hover:text-blue-600 font-medium" title="Click to edit">
                      ${budget.toFixed(2)}
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">${actual.toFixed(2)}</td>
                <td className={`px-5 py-3 text-right font-semibold ${diff < 0 ? 'text-red-500' : budget === 0 && actual === 0 ? 'text-gray-300' : 'text-emerald-600'}`}>
                  {budget === 0 && actual === 0 ? '—' : `${diff < 0 ? '-' : '+'}$${Math.abs(diff).toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
              <td className="px-5 py-3 text-gray-800">Total</td>
              <td className="px-5 py-3 text-right text-gray-800">${totalBudget.toFixed(2)}</td>
              <td className="px-5 py-3 text-right text-gray-900">${totalActual.toFixed(2)}</td>
              <td className={`px-5 py-3 text-right ${totalDiff < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {totalDiff < 0 ? '-' : '+'}${Math.abs(totalDiff).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Transactions</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {txs.map(tx => {
              const color = colorMap[tx.category] ?? '#9ca3af';
              return (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 text-gray-500 font-mono text-xs">{tx.date.slice(5)}</td>
                  <td className="px-5 py-2.5 text-right font-medium text-gray-900">${tx.amount.toFixed(2)}</td>
                  <td className="px-5 py-2.5">
                    <span className="inline-block rounded-md px-1.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: color + '22', color }}>{tx.category}</span>
                  </td>
                  <td className="px-5 py-2.5 text-gray-700">
                    {tx.description}
                    {isRecurring(tx.id) && <span className="ml-2 text-xs text-gray-400 italic">recurring</span>}
                  </td>
                </tr>
              );
            })}
            {txs.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No transactions for {monthName}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
