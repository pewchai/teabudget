import { useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { CATEGORIES, type Category, type RecurringItem, type Transaction } from '../types';
import { nanoid } from 'nanoid';

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function fmt(date: string) {
  const [y, m, d] = date.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function monthlyEquiv(amount: number, period: number) {
  return (amount / period).toFixed(2);
}

const EMPTY_FORM = {
  nextDate: new Date().toISOString().slice(0, 10),
  amount: '',
  category: 'Services' as Category,
  description: '',
  periodMonths: '1',
};

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
      nextDate: form.nextDate,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      periodMonths: parseInt(form.periodMonths, 10),
    };
    dispatch({ type: 'ADD_RECURRING', item });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function handlePost(item: RecurringItem) {
    const tx: Transaction = {
      id: nanoid(),
      date: item.nextDate,
      amount: item.amount,
      category: item.category,
      description: item.description,
    };
    dispatch({ type: 'ADD_TRANSACTION', tx });
    // Advance next date
    const updated: RecurringItem = { ...item, nextDate: addMonths(item.nextDate, item.periodMonths) };
    dispatch({ type: 'UPDATE_RECURRING', item: updated });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring</h2>
          <p className="text-gray-500 text-sm mt-1">≈ ${totalMonthly.toFixed(2)} / month</p>
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
              <span className="text-xs font-medium text-gray-500 uppercase">Next Date</span>
              <input
                type="date"
                required
                value={form.nextDate}
                onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))}
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
              <span className="text-xs font-medium text-gray-500 uppercase">Period (months)</span>
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Next Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monthly</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.recurring.map(item => {
              const due = item.nextDate <= today;
              return (
                <tr key={item.id} className={`hover:bg-gray-50 group ${due ? 'bg-amber-50' : ''}`}>
                  <td className={`px-4 py-3 font-mono text-xs ${due ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                    {fmt(item.nextDate)} {due && '⚠'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${item.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">${monthlyEquiv(item.amount, item.periodMonths)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 rounded-md px-2 py-0.5 text-xs font-medium">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.description}</td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {item.periodMonths === 1 ? 'Monthly' : item.periodMonths === 12 ? 'Yearly' : `${item.periodMonths}mo`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handlePost(item)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                        title="Post to transactions & advance date"
                      >
                        Post
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'DELETE_RECURRING', id: item.id })}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total monthly</td>
              <td />
              <td className="px-4 py-3 text-right font-bold text-gray-900">${totalMonthly.toFixed(2)}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
