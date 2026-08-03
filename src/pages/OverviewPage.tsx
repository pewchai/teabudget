import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBudget, getMonthTransactions, sumByCategory } from '../store/BudgetContext';
import { MONTH_NAMES, fmtSigned } from '../types';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid, ComposedChart, Bar,
  PieChart, Pie, Cell,
} from 'recharts';

type ChartView = 'spending-trend' | 'breakdown' | 'category-trend';

const CHART_OPTIONS: { value: ChartView; label: string }[] = [
  { value: 'spending-trend', label: 'Spending Trend & Pace' },
  { value: 'breakdown', label: 'Breakdown Wheel' },
  { value: 'category-trend', label: 'Category Trend' },
];

export default function OverviewPage() {
  const navigate = useNavigate();
  const { state, dispatch, selectedYear, setSelectedYear, addYear } = useBudget();
  const YEAR = selectedYear;
  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);
  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);

  const [chartView, setChartView] = useState<ChartView>('breakdown');

  // Monthly actual + budget + income, with running cumulative lines
  const monthlyData = useMemo(() => {
    let cumActual = 0, cumBudget = 0;
    return MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      const txs = getMonthTransactions(state.transactions, state.recurring, YEAR, month);
      const monthKey = `${YEAR}-${String(month).padStart(2, '0')}`;
      const budgets = state.budgets[monthKey] ?? {};
      const actual = Math.round(txs.reduce((s, t) => s + t.amount, 0));
      const budget = Math.round(Object.values(budgets).reduce((s: number, v) => s + (v ?? 0), 0));
      const income = state.income[monthKey] ?? 0;
      cumActual += actual;
      cumBudget += budget;
      return { name: name.slice(0, 3), actual, budget, income, cumActual, cumBudget };
    });
  }, [state, YEAR]);

  // Year category totals (for breakdown wheel)
  const yearByCat = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      const txs = getMonthTransactions(state.transactions, state.recurring, YEAR, m);
      for (const t of txs) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return totals;
  }, [state, YEAR]);

  const pieData = catNames
    .map(cat => ({ name: cat, value: Math.round((yearByCat[cat] ?? 0) * 100) / 100 }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const activeCats = useMemo(() => catNames.filter(c => (yearByCat[c] ?? 0) > 0), [catNames, yearByCat]);

  // Category trend across the 12 months
  const catTrend = useMemo(() =>
    MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      const txs = getMonthTransactions(state.transactions, state.recurring, YEAR, month);
      const actuals = sumByCategory(txs);
      const entry: Record<string, number | string> = { name: name.slice(0, 3) };
      for (const c of activeCats) entry[c] = Math.round((actuals[c] ?? 0) * 100) / 100;
      return entry;
    }),
    [state, YEAR, activeCats]
  );

  const totalActual = monthlyData.reduce((s, m) => s + m.actual, 0);
  const totalBudget = monthlyData.reduce((s, m) => s + m.budget, 0);
  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const annualHeadroom = totalIncome - totalBudget;

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{YEAR} Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Spending across the year</p>
      </div>

      {/* Chart panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
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
            {chartView === 'spending-trend' ? (
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="actual" name="Monthly spent" fill="#dbeafe" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumActual" name="Cumulative" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cumBudget" name="Budget pace" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
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
              <LineChart data={catTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {activeCats.map(cat => (
                  <Line key={cat} type="monotone" dataKey={cat} stroke={colorMap[cat] ?? '#9ca3af'} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: `Spent`, value: `$${totalActual.toLocaleString()}` },
          { label: `Budgeted`, value: `$${totalBudget.toLocaleString()}` },
          { label: `Income`, value: totalIncome > 0 ? `$${totalIncome.toLocaleString()}` : '—', dim: totalIncome === 0 },
          {
            label: 'Headroom',
            value: totalIncome === 0 ? '—' : fmtSigned(annualHeadroom),
            red: annualHeadroom < 0 && totalIncome > 0,
            green: annualHeadroom >= 0 && totalIncome > 0,
            dim: totalIncome === 0,
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.red ? 'text-red-500' : s.green ? 'text-emerald-600' : s.dim ? 'text-gray-300' : 'text-gray-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Year management — inconspicuous */}
      <div className="pt-4 flex justify-center gap-6">
        <button
          onClick={addYear}
          className="text-sm text-gray-400 hover:text-blue-600 transition-colors"
        >
          Add {Math.max(...state.years) + 1}
        </button>
        {state.years.length > 1 && (
          <button
            onClick={() => {
              if (!window.confirm(`Delete ${YEAR}? All transactions and budget data for this year will be permanently removed.`)) return;
              dispatch({ type: 'DELETE_YEAR', year: YEAR });
              const remaining = state.years.filter(y => y !== YEAR);
              const fallback = remaining[remaining.length - 1] ?? remaining[0];
              if (fallback !== undefined) setSelectedYear(fallback);
              navigate('/year');
            }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Delete {YEAR}
          </button>
        )}
      </div>
    </div>
  );
}
