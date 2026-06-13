import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBudget, getMonthTransactions, sumByCategory } from '../store/BudgetContext';
import { CATEGORIES, MONTH_NAMES, CATEGORY_COLORS, type Category } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const YEAR = 2026;

export default function OverviewPage() {
  const { state } = useBudget();

  const monthlyTotals = useMemo(() =>
    MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      const txs = getMonthTransactions(state.transactions, YEAR, month);
      const monthKey = `${YEAR}-${String(month).padStart(2, '0')}`;
      const budgets = state.budgets[monthKey] ?? {};
      const actual = txs.reduce((s, t) => s + t.amount, 0);
      const budget = Object.values(budgets).reduce((s: number, v) => s + (v ?? 0), 0);
      return { name: name.slice(0, 3), actual: Math.round(actual), budget: Math.round(budget) };
    }),
    [state]
  );

  const currentMonth = new Date().getMonth() + 1;
  const currentTxs = getMonthTransactions(state.transactions, YEAR, currentMonth);
  const currentKey = `${YEAR}-${String(currentMonth).padStart(2, '0')}`;
  const currentBudgets = state.budgets[currentKey] ?? {};
  const categoryActuals = sumByCategory(currentTxs);

  const categoryRows = CATEGORIES.map(cat => ({
    cat,
    budget: (currentBudgets as Record<Category, number>)[cat] ?? 0,
    actual: Math.round((categoryActuals[cat] ?? 0) * 100) / 100,
  })).filter(r => r.budget > 0 || r.actual > 0);

  const totalBudget = categoryRows.reduce((s, r) => s + r.budget, 0);
  const totalActual = categoryRows.reduce((s, r) => s + r.actual, 0);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview — 2026</h2>
        <p className="text-gray-500 text-sm mt-1">Budget vs Actual across all months</p>
      </div>

      {/* Year chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Monthly Spending</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyTotals} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="budget" name="Budget" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Current month summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">{MONTH_NAMES[currentMonth - 1]} — Category Breakdown</h3>
          <Link to={`/month/${currentMonth}`} className="text-blue-600 text-sm hover:underline">
            View details →
          </Link>
        </div>

        <div className="space-y-3">
          {categoryRows.map(({ cat, budget, actual }) => {
            const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
            const over = actual > budget && budget > 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{cat}</span>
                  <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                    ${actual.toFixed(2)} / ${budget.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat as Category] }}
                  />
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

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
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
