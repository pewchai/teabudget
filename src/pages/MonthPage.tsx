import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useBudget, getMonthTransactions, sumByCategory } from '../store/BudgetContext';
import { MONTH_NAMES, type Transaction } from '../types';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid, ComposedChart, Bar,
} from 'recharts';

const EDIT_CELL = 'w-full bg-blue-50 border-b border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:bg-blue-100';

type ChartView = 'daily-pace' | 'breakdown' | 'category-trend';

const CHART_OPTIONS: { value: ChartView; label: string }[] = [
  { value: 'daily-pace', label: 'Daily Spending & Pace' },
  { value: 'breakdown', label: 'Breakdown Wheel' },
  { value: 'category-trend', label: 'Category Trend' },
];

export default function MonthPage() {
  const { month: monthStr } = useParams<{ month: string }>();
  const month = parseInt(monthStr ?? '1', 10);
  const { state, dispatch, selectedYear } = useBudget();
  const YEAR = selectedYear;
  const monthKey = `${YEAR}-${String(month).padStart(2, '0')}`;
  const monthName = MONTH_NAMES[month - 1];

  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);
  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);
  const monthBudgets = (state.budgets[monthKey] ?? {}) as Record<string, number>;

  const txs = useMemo(
    () => getMonthTransactions(state.transactions, state.recurring, YEAR, month),
    [state.transactions, state.recurring, YEAR, month]
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

  const pieData = rows.filter(r => r.actual > 0).map(r => ({ name: r.cat, value: r.actual }));
  const activeCats = useMemo(() => catNames.filter(c => (actuals[c] ?? 0) > 0), [catNames, actuals]);

  // Daily spending + running cumulative + even budget pace
  const dailyData = useMemo(() => {
    const dim = new Date(YEAR, month, 0).getDate();
    let cum = 0;
    return Array.from({ length: dim }, (_, i) => {
      const d = i + 1;
      const dateStr = `${YEAR}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const amount = Math.round(txs.filter(t => t.date === dateStr).reduce((s, t) => s + t.amount, 0) * 100) / 100;
      cum = Math.round((cum + amount) * 100) / 100;
      const pace = Math.round((totalBudget * d / dim) * 100) / 100;
      return { day: d, amount, cumulative: cum, pace };
    });
  }, [txs, YEAR, month, totalBudget]);

  // Category cumulative spend across days of the month
  const categoryTrend = useMemo(() => {
    const dim = new Date(YEAR, month, 0).getDate();
    const running: Record<string, number> = {};
    return Array.from({ length: dim }, (_, i) => {
      const d = i + 1;
      const dateStr = `${YEAR}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (const t of txs.filter(t => t.date === dateStr)) {
        running[t.category] = (running[t.category] ?? 0) + t.amount;
      }
      const entry: Record<string, number> = { day: d };
      for (const c of activeCats) entry[c] = Math.round((running[c] ?? 0) * 100) / 100;
      return entry;
    });
  }, [txs, YEAR, month, activeCats]);

  const [chartView, setChartView] = useState<ChartView>('daily-pace');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  function startBudgetEdit(cat: string, current: number) { setEditingCat(cat); setEditVal(String(current)); }
  function commitBudgetEdit(cat: string) {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) dispatch({ type: 'SET_BUDGET', monthKey, category: cat, amount: val });
    setEditingCat(null);
  }

  // Transaction inline editing
  const [txEditingId, setTxEditingId] = useState<string | null>(null);
  const [txEditForm, setTxEditForm] = useState({ date: '', amount: '', category: '', description: '' });

  const isRecurring = (id: string) => id.startsWith('rec-');
  const editableTxs = useMemo(() => txs.filter(t => !isRecurring(t.id)), [txs]);
  const txEditIdx = useMemo(
    () => txEditingId ? editableTxs.findIndex(t => t.id === txEditingId) : -1,
    [txEditingId, editableTxs]
  );

  function startTxEdit(tx: Transaction) {
    if (isRecurring(tx.id)) return;
    setTxEditingId(tx.id);
    setTxEditForm({ date: tx.date, amount: String(tx.amount), category: tx.category, description: tx.description });
  }

  const saveTxEdit = useCallback(() => {
    if (!txEditingId) return;
    const amount = parseFloat(txEditForm.amount);
    if (!isNaN(amount) && txEditForm.date && txEditForm.category) {
      dispatch({ type: 'UPDATE_TRANSACTION', tx: { id: txEditingId, date: txEditForm.date, amount, category: txEditForm.category, description: txEditForm.description } });
    }
    setTxEditingId(null);
  }, [txEditingId, txEditForm, dispatch]);

  function navigateTxRow(dir: 1 | -1) {
    saveTxEdit();
    const next = txEditIdx + dir;
    if (next >= 0 && next < editableTxs.length) {
      const tx = editableTxs[next];
      setTxEditingId(tx.id);
      setTxEditForm({ date: tx.date, amount: String(tx.amount), category: tx.category, description: tx.description });
    }
  }

  function handleTxEditKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setTxEditingId(null);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); navigateTxRow(1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); navigateTxRow(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); navigateTxRow(-1); }
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{monthName} {YEAR}</h2>
        <p className="text-gray-500 text-sm mt-1">{txs.length} transactions · ${totalActual.toFixed(2)} spent</p>
      </div>

      {/* Chart panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">{CHART_OPTIONS.find(o => o.value === chartView)?.label}</h3>
          <select
            value={chartView}
            onChange={e => setChartView(e.target.value as ChartView)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CHART_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="h-56 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'daily-pace' ? (
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} labelFormatter={d => `Day ${d}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="amount" name="Daily" fill="#dbeafe" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="pace" name="Budget pace" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            ) : chartView === 'breakdown' ? (
              pieData.length > 0 ? (
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={90} innerRadius={50}>
                    {pieData.map(e => <Cell key={e.name} fill={colorMap[e.name] ?? '#9ca3af'} />)}
                  </Pie>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              ) : (
                <LineChart data={[]}><XAxis /><YAxis /></LineChart>
              )
            ) : (
              <LineChart data={categoryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} labelFormatter={d => `Day ${d}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {activeCats.map(cat => (
                  <Line key={cat} type="monotone" dataKey={cat} stroke={colorMap[cat] ?? '#9ca3af'} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
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
                      onBlur={() => commitBudgetEdit(cat)}
                      onKeyDown={e => e.key === 'Enter' && commitBudgetEdit(cat)}
                      autoFocus className="w-24 text-right border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none" />
                  ) : (
                    <button onClick={() => startBudgetEdit(cat, budget)} className="text-gray-700 hover:text-blue-600 font-medium" title="Click to edit">
                      ${budget.toFixed(2)}
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">${actual.toFixed(2)}</td>
                <td className={`px-5 py-3 text-right font-semibold ${diff < 0 ? 'text-red-500' : budget === 0 && actual === 0 ? 'text-gray-300' : 'text-emerald-600'}`}>
                  {budget === 0 && actual === 0 ? '—' : `${diff < 0 ? '-' : ''}$${Math.abs(diff).toFixed(2)}`}
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
                {totalDiff < 0 ? '-' : ''}${Math.abs(totalDiff).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Transactions with inline editing */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Transactions</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase w-24">Date</th>
              <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500 uppercase w-28">Amount</th>
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase w-32">Category</th>
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="w-24 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {txs.map(tx => {
              const color = colorMap[tx.category] ?? '#9ca3af';
              const editable = !isRecurring(tx.id);
              const isEditing = txEditingId === tx.id;

              if (isEditing) {
                return (
                  <tr key={tx.id} className="bg-blue-50" onKeyDown={handleTxEditKey}>
                    <td className="px-2 py-1"><input type="date" className={EDIT_CELL} value={txEditForm.date} onChange={e => setTxEditForm(f => ({ ...f, date: e.target.value }))} /></td>
                    <td className="px-2 py-1"><input type="number" step="0.01" className={`${EDIT_CELL} text-right`} value={txEditForm.amount} onChange={e => setTxEditForm(f => ({ ...f, amount: e.target.value }))} /></td>
                    <td className="px-2 py-1">
                      <select className={`${EDIT_CELL} cursor-pointer`} value={txEditForm.category} onChange={e => setTxEditForm(f => ({ ...f, category: e.target.value }))}>
                        {catNames.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1"><input type="text" className={EDIT_CELL} value={txEditForm.description} onChange={e => setTxEditForm(f => ({ ...f, description: e.target.value }))} /></td>
                    <td className="px-2 py-1 text-right whitespace-nowrap">
                      <button onClick={saveTxEdit} className="text-blue-600 text-sm font-semibold px-2.5 py-1 rounded hover:bg-blue-100 transition-colors">✓</button>
                      <button onClick={() => setTxEditingId(null)} className="text-gray-400 text-sm px-2.5 py-1 rounded hover:text-red-500 hover:bg-red-50 transition-colors ml-1">✕</button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={tx.id}
                  className={`hover:bg-gray-50 group ${editable ? 'cursor-pointer' : ''}`}
                  onClick={() => editable && startTxEdit(tx)}>
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
                  <td className="px-2 py-2.5 text-right">
                    {editable && (
                      <button onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_TRANSACTION', id: tx.id }); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">✕</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {txs.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No transactions for {monthName}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {txEditingId && <p className="text-xs text-gray-400 text-center">↑ ↓ or Enter to move between rows · Esc to cancel</p>}
    </div>
  );
}
