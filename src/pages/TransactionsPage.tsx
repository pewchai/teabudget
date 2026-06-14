import { useState, useMemo, useCallback } from 'react';
import { useBudget } from '../store/BudgetContext';
import { type Transaction } from '../types';
import { nanoid } from 'nanoid';

const TODAY = new Date().toISOString().slice(0, 10);

function fmtDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y.slice(2)}`;
}

const FIELD = 'mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const EDIT_CELL = 'w-full bg-blue-50 border-b border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:bg-blue-100';

export default function TransactionsPage() {
  const { state, dispatch, selectedYear, setSelectedYear } = useBudget();
  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);
  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);

  // Add form (always visible above table)
  const [newForm, setNewForm] = useState({
    date: TODAY, amount: '', category: catNames[0] ?? '', description: '',
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(newForm.amount);
    if (isNaN(amount) || !newForm.category) return;
    dispatch({ type: 'ADD_TRANSACTION', tx: { id: nanoid(), date: newForm.date, amount, category: newForm.category, description: newForm.description } });
    setNewForm(f => ({ ...f, amount: '', description: '' }));
  }

  // Filters
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  // Inline editing for existing rows
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: '', amount: '', category: '', description: '' });

  const filtered = useMemo(() => {
    let txs = state.transactions
      .filter(t => t.date.startsWith(String(selectedYear)))
      .sort((a, b) => b.date.localeCompare(a.date));
    if (catFilter) txs = txs.filter(t => t.category === catFilter);
    if (filter) txs = txs.filter(t =>
      t.description.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase())
    );
    return txs;
  }, [state.transactions, filter, catFilter, selectedYear]);

  const editIdx = useMemo(() => editingId ? filtered.findIndex(t => t.id === editingId) : -1, [editingId, filtered]);

  function startEdit(tx: Transaction) {
    setEditingId(tx.id);
    setEditForm({ date: tx.date, amount: String(tx.amount), category: tx.category, description: tx.description });
  }

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const amount = parseFloat(editForm.amount);
    if (!isNaN(amount) && editForm.date && editForm.category) {
      dispatch({ type: 'UPDATE_TRANSACTION', tx: { id: editingId, date: editForm.date, amount, category: editForm.category, description: editForm.description } });
    }
    setEditingId(null);
  }, [editingId, editForm, dispatch]);

  function navigateRow(dir: 1 | -1) {
    saveEdit();
    const next = editIdx + dir;
    if (next >= 0 && next < filtered.length) {
      const tx = filtered[next];
      setEditingId(tx.id);
      setEditForm({ date: tx.date, amount: String(tx.amount), category: tx.category, description: tx.description });
    }
  }

  function handleEditKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setEditingId(null);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); navigateRow(1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); navigateRow(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); navigateRow(-1); }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} entries in {selectedYear}</p>
      </div>

      {/* Add form — always visible */}
      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase">Date</span>
            <input type="date" required value={newForm.date}
              onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))}
              className={FIELD} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase">Amount ($)</span>
            <input type="number" step="0.01" min="0" required placeholder="0.00" value={newForm.amount}
              onChange={e => setNewForm(f => ({ ...f, amount: e.target.value }))}
              className={FIELD} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase">Category</span>
            <select required value={newForm.category}
              onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}
              className={FIELD}>
              {catNames.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
            <input type="text" required placeholder="Description" value={newForm.description}
              onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
              className={FIELD} />
          </label>
        </div>
        <div className="mt-4">
          <button type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Add Transaction
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <input type="text" placeholder="Search…" value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All categories</option>
          {catNames.map(c => <option key={c}>{c}</option>)}
        </select>
        {/* Inconspicuous year selector */}
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
          className="text-sm text-gray-400 bg-transparent px-1 py-2 focus:outline-none cursor-pointer hover:text-gray-600"
          title="Year">
          {state.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Table with inline editing */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="w-24 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(tx => {
              const isEditing = editingId === tx.id;
              const color = colorMap[tx.category] ?? '#9ca3af';
              if (isEditing) {
                return (
                  <tr key={tx.id} className="bg-blue-50" onKeyDown={handleEditKey}>
                    <td className="px-2 py-1"><input type="date" className={EDIT_CELL} value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></td>
                    <td className="px-2 py-1"><input type="number" step="0.01" className={`${EDIT_CELL} text-right`} value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} /></td>
                    <td className="px-2 py-1">
                      <select className={`${EDIT_CELL} cursor-pointer`} value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                        {catNames.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1"><input type="text" className={EDIT_CELL} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></td>
                    <td className="px-2 py-1 text-right whitespace-nowrap">
                      <button onClick={saveEdit} className="text-blue-600 text-sm font-semibold px-2.5 py-1 rounded hover:bg-blue-100 transition-colors">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm px-2.5 py-1 rounded hover:text-red-500 hover:bg-red-50 transition-colors ml-1">✕</button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={tx.id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => startEdit(tx)}>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{fmtDate(tx.date)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">${tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block rounded-md px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: color + '22', color }}>{tx.category}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{tx.description}</td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_TRANSACTION', id: tx.id }); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">✕</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No transactions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {editingId && <p className="text-xs text-gray-400 text-center">↑ ↓ or Enter to move between rows · Esc to cancel</p>}
    </div>
  );
}
