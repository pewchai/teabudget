import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBudget, getMonthTransactions, sumByCategory } from '../store/BudgetContext';
import { MONTH_NAMES } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts';

const YEAR = 2026;

type ChartView = 'monthly-budget' | 'spending-trend' | 'category-totals' | 'category-stacked';

const CHART_OPTIONS: { value: ChartView; label: string }[] = [
  { value: 'monthly-budget', label: 'Budget vs Actual' },
  { value: 'spending-trend', label: 'Spending Trend' },
  { value: 'category-totals', label: 'Category Totals (Year)' },
  { value: 'category-stacked', label: 'Category Stack by Month' },
];

export default function OverviewPage() {
  const { state } = useBudget();
  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);
  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);

  const [chartView, setChartView] = useState<ChartView>('monthly-budget');

  const monthlyTotals = useMemo(() =>
    MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      const txs = getMonthTransactions(state.transactions, state.recurring, YEAR, month);
      const monthKey = `${YEAR}-${String(month).padStart(2, '0')}`;
      const budgets = state.budgets[monthKey] ?? {};
      const actual = txs.reduce((s, t) => s + t.amount, 0);
      const budget = Object.values(budgets).reduce((s: number, v) => s + (v ?? 0), 0);
      return { name: name.slice(0, 3), actual: Math.round(actual), budget: Math.round(budget) };
    }),
    [state]
  );

  const yearCategoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      const txs = getMonthTransactions(state.transactions, state.recurring, YEAR, m);
      for (const t of txs) {
        totals[t.category] = (totals[t.category] ?? 0) + t.amount;
      }
    }
    return catNames
      .map(cat => ({ name: cat, value: Math.round((totals[cat] ?? 0) * 100) / 100 }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [state, catNames]);

  const stackedData = useMemo(() =>
    MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      const txs = getMonthTransactions(state.transactions, state.recurring, YEAR, month);
      const actuals = sumByCategory(txs);
      const entry: Record<string, number | string> = { name: name.slice(0, 3) };
      for (const cat of catNames) {
        entry[cat] = Math.round((actuals[cat] ?? 0) * 100) / 100;
      }
      return entry;
    }),
    [state, catNames]
  );

  const currentMonth = new Date().getMonth() + 1;
  const currentTxs = getMonthTransactions(state.transactions, state.recurring, YEAR, currentMonth);
  const currentKey = `${YEAR}-${String(currentMonth).padStart(2, '0')}`;
  const currentBudgets = state.budgets[currentKey] ?? {};
  const categoryActuals = sumByCategory(currentTxs);

  const categoryRows = catNames.map(cat => ({
    cat,
    budget: (currentBudgets as Record<string, number>)[cat] ?? 0,
    actual: Math.round((categoryActuals[cat] ?? 0) * 100) / 100,
  })).filter(r => r.budget > 0 || r.actual > 0);

  const totalBudget = categoryRows.reduce((s, r) => s + r.budget, 0);
  const totalActual = categoryRows.reduce((s, r) => s + r.actual, 0);

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview — 2026</h2>
        <p className="text-gray-500 text-sm mt-1">Budget vs Actual across all months</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">
            {CHART_OPTIONS.find(o => o.value === chartView)?.label}
          </h3>
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
            {chartView === 'monthly-budget' ? (
              <BarChart data={monthlyTotals} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="budget" name="Budget" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartView === 'spending-trend' ? (
              <LineChart data={monthlyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="budget" name="Budget" stroke="#d1d5db" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : chartView === 'category-totals' ? (
              <BarChart data={yearCategoryTotals} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]}>
                  {yearCategoryTotals.map(e => <Cell key={e.name} fill={colorMap[e.name] ?? '#9ca3af'} />)}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={stackedData} barCategoryGap="20%">
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {catNames.map(cat => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={colorMap[cat] ?? '#9ca3af'} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">{MONTH_NAMES[currentMonth - 1]} — Category Breakdown</h3>
          <Link to={`/month/${currentMonth}`} className="text-blue-600 text-sm hover:underline">View details →</Link>
        </div>
        <div className="space-y-3">
          {categoryRows.map(({ cat, budget, actual }) => {
            const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
            const over = actual > budget && budget > 0;
            const color = colorMap[cat] ?? '#9ca3af';
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{cat}</span>
                  <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                    ${actual.toFixed(2)} / ${budget.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className={totalActual > totalBudget ? 'text-red-500' : 'text-gray-900'}>
            ${totalActual.toFixed(2)} / ${totalBudget.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Transactions this month', value: currentTxs.length },
          { label: 'Total spent this month', value: `$${totalActual.toFixed(2)}` },
          { label: 'Remaining budget', value: `$${(totalBudget - totalActual).toFixed(2)}`, red: totalActual > totalBudget },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.red ? 'text-red-500' : 'text-gray-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
