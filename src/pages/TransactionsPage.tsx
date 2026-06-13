import { useState, useMemo } from 'react';
import { useBudget } from '../store/BudgetContext';
import { CATEGORIES, type Category, type Transaction } from '../types';
import { nanoid } from 'nanoid';

function fmt(date: string) {
  const [y, m, d] = date.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

export default function TransactionsPage() {
  const { state, dispatch } = useBudget();
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState<Category | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: CATEGORIES[0] as Category,
    description: '',
  });

  const filtered = useMemo(() => {
    let txs = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (catFilter) txs = txs.filter(t => t.category === catFilter);
    if (filter) txs = txs.filter(t =>
      t.description.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase())
    );
    return txs;
  }, [state.transactions, filter, catFilter]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tx: Transaction = {
      id: nanoid(),
      date: form.date,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
    };
    dispatch({ type: 'ADD_TRANSACTION', tx });
    setForm({ date: new Date().toISOString().slice(0, 10), amount: '', category: CATEGORIES[0], description: '' });
    setShowForm(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-500 text-sm mt-1">{state.transactions.length} total entries</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">New Transaction</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Date</span>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
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
              <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
              <input
                type="text"
                required
                placeholder="e.g. Chipotle"
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

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search transactions…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value as Category | '')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{fmt(tx.date)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">${tx.amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-gray-100 text-gray-700 rounded-md px-2 py-0.5 text-xs font-medium">
                    {tx.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{tx.description}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => dispatch({ type: 'DELETE_TRANSACTION', id: tx.id })}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No transactions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
