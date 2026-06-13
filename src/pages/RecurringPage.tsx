import { useState } from 'react';
import { useBudget, nextOccurrenceDate } from '../store/BudgetContext';
import { CATEGORIES, type Category, type RecurringItem } from '../types';
import { nanoid } from 'nanoid';

const EMPTY_FORM = {
  startDate: new Date().toISOString().slice(0, 10),
  amount: '',
  category: 'Services' as Category,
  description: '',
  periodMonths: '1',
};

function periodLabel(months: number) {
  if (months === 1) return 'Monthly';
  if (months === 12) return 'Yearly';
  if (months === 6) return 'Every 6 mo';
  if (months === 3) return 'Quarterly';
  return `Every ${months} mo`;
}

export default function RecurringPage() {
  const { state, dispatch } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const totalMonthly = state.recurring.reduce(
    (s, r) => s + r.amount / r.periodMonths,
    0
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const item: RecurringItem = {
      id: nanoid(),
      startDate: form.startDate,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      periodMonths: parseInt(form.periodMonths, 10),
    };
    dispatch({ type: 'ADD_RECURRING', item });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring</h2>
          <p className="text-gray-500 text-sm mt-1">
            ≈ ${totalMonthly.toFixed(2)} / month · automatically added to each month's transactions
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Recurring
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">New Recurring Item</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">First billing date</span>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Amount ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Category</span>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Repeats every (months)</span>
              <input
                type="number"
                min="1"
                required
                placeholder="1"
                value={form.periodMonths}
                onChange={e => setForm(f => ({ ...f, periodMonths: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="col-span-2 block">
              <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
              <input
                type="text"
                required
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Add
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
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
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monthly cost</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Frequency</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Next billing</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.recurring.map(item => {
              const next = nextOccurrenceDate(item);
              const due = next <= today;
              return (
                <tr key={item.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.description}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 rounded-md px-2 py-0.5 text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${item.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    ${(item.amount / item.periodMonths).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">{periodLabel(item.periodMonths)}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${due ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                    {next} {due && '⚠'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => dispatch({ type: 'DELETE_RECURRING', id: item.id })}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {state.recurring.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No recurring items yet</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total monthly</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">${totalMonthly.toFixed(2)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
