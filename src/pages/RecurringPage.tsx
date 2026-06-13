import { useState, useMemo } from 'react';
import { useBudget, nextOccurrenceDate, frequencyLabel } from '../store/BudgetContext';
import { type RecurringItem, type FrequencyType } from '../types';
import { nanoid } from 'nanoid';

const EMPTY = {
  startDate: new Date().toISOString().slice(0, 10),
  amount: '',
  category: '',
  description: '',
  frequencyType: 'months' as FrequencyType,
  frequencyValue: '1',
};

export default function RecurringPage() {
  const { state, dispatch } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);
  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);

  const totalMonthly = useMemo(() => state.recurring.reduce((s, r) => {
    const monthsPerOccurrence = r.frequencyType === 'days'
      ? r.frequencyValue / 30.44
      : r.frequencyType === 'months'
        ? r.frequencyValue
        : r.frequencyValue * 12;
    return s + r.amount / monthsPerOccurrence;
  }, 0), [state.recurring]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const item: RecurringItem = {
      id: nanoid(),
      startDate: form.startDate,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      frequencyType: form.frequencyType,
      frequencyValue: parseInt(form.frequencyValue, 10),
    };
    dispatch({ type: 'ADD_RECURRING', item });
    setForm(EMPTY);
    setShowForm(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring</h2>
          <p className="text-gray-500 text-sm mt-1">
            ≈ ${totalMonthly.toFixed(2)} / month · auto-added to each month's transactions
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Recurring
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-gray-800">New Recurring Item</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">First billing date</span>
              <input type="date" required value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Amount ($)</span>
              <input type="number" step="0.01" min="0" required placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Category</span>
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Pick category…</option>
                {catNames.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
              <input type="text" required value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
          </div>

          {/* Frequency picker */}
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase block mb-2">Repeats every</span>
            <div className="flex gap-2 items-center">
              <input
                type="number" min="1" required value={form.frequencyValue}
                onChange={e => setForm(f => ({ ...f, frequencyValue: e.target.value }))}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.frequencyType}
                onChange={e => setForm(f => ({ ...f, frequencyType: e.target.value as FrequencyType }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="days">days — exact day interval (e.g. every 30 days)</option>
                <option value="months">months — same date each month (shorter month → last day)</option>
                <option value="years">years — same date each year</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {form.frequencyType === 'months'
                ? `Bills on day ${form.startDate.split('-')[2] || '?'} of every ${form.frequencyValue} month(s). If that month has fewer days, posts on the last day.`
                : form.frequencyType === 'days'
                  ? `Bills exactly every ${form.frequencyValue || '?'} days from the start date.`
                  : `Bills on the same date every ${form.frequencyValue || '?'} year(s).`}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">≈ /month</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Frequency</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Next billing</th>
              <th className="w-8 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.recurring.map(item => {
              const next = nextOccurrenceDate(item);
              const due = next <= today;
              const color = colorMap[item.category] ?? '#9ca3af';
              const monthlyEq = item.frequencyType === 'days'
                ? item.amount / (item.frequencyValue / 30.44)
                : item.frequencyType === 'months'
                  ? item.amount / item.frequencyValue
                  : item.amount / (item.frequencyValue * 12);
              return (
                <tr key={item.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.description}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: color + '22', color }}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${item.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">${monthlyEq.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-gray-600 text-xs">{frequencyLabel(item)}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${due ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                    {next}{due && ' ⚠'}
                  </td>
                  <td className="px-2 py-3">
                    <button onClick={() => dispatch({ type: 'DELETE_RECURRING', id: item.id })}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">✕</button>
                  </td>
                </tr>
              );
            })}
            {state.recurring.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No recurring items yet</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monthly total</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">${totalMonthly.toFixed(2)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
