import { useState, useMemo, useCallback } from 'react';
import { useBudget } from '../store/BudgetContext';
import { type Transaction } from '../types';
import { nanoid } from 'nanoid';

const EMPTY_NEW = { date: new Date().toISOString().slice(0, 10), amount: '', category: '', description: '' };

function fmtDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y.slice(2)}`;
}

export default function TransactionsPage() {
  const { state, dispatch } = useBudget();
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: '', amount: '', category: '', description: '' });

  // New row (always visible at bottom)
  const [newRow, setNewRow] = useState(EMPTY_NEW);
  const [newActive, setNewActive] = useState(false);

  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);
  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);

  const filtered = useMemo(() => {
    let txs = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (catFilter) txs = txs.filter(t => t.category === catFilter);
    if (filter) txs = txs.filter(t =>
      t.description.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase())
    );
    return txs;
  }, [state.transactions, filter, catFilter]);

  const editIdx = useMemo(() => editingId ? filtered.findIndex(t => t.id === editingId) : -1, [editingId, filtered]);

  function startEdit(tx: Transaction) {
    setNewActive(false);
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
    } else if (dir === 1 && next >= filtered.length) {
      setEditingId(null);
      setNewActive(true);
    }
  }

  function handleEditKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setEditingId(null); }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); navigateRow(1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); navigateRow(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); navigateRow(-1); }
  }

  function addNew() {
    const amount = parseFloat(newRow.amount);
    if (!newRow.date || isNaN(amount) || !newRow.category || !newRow.description) return;
    dispatch({ type: 'ADD_TRANSACTION', tx: { id: nanoid(), date: newRow.date, amount, category: newRow.category, description: newRow.description } });
    setNewRow(r => ({ ...r, amount: '', description: '' })); // keep date & category
  }

  function handleNewKey(e: React.KeyboardEvent, isLast: boolean) {
    if (e.key === 'Enter' && isLast) { e.preventDefault(); addNew(); }
    if (e.key === 'Escape') { setNewActive(false); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setNewActive(false); if (filtered.length > 0) startEdit(filtered[0]); }
  }

  const INPUT = 'w-full bg-blue-50 border-b border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:bg-blue-100';
  const SELECT = `${INPUT} cursor-pointer`;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-500 text-sm mt-1">{state.transactions.length} entries · click any row to edit</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {catNames.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="w-8 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((tx) => {
              const isEditing = editingId === tx.id;
              const color = colorMap[tx.category] ?? '#9ca3af';
              if (isEditing) {
                return (
                  <tr key={tx.id} className="bg-blue-50" onKeyDown={handleEditKey}>
                    <td className="px-2 py-1">
                      <input type="date" className={INPUT} value={editForm.date}
                        onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} autoFocus />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" step="0.01" min="0" className={`${INPUT} text-right`} value={editForm.amount}
                        onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1">
                      <select className={SELECT} value={editForm.category}
                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                        {catNames.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input type="text" className={INPUT} value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <button onClick={saveEdit} className="text-blue-600 text-xs font-medium hover:underline mr-1">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs hover:text-red-500">✕</button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={tx.id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => startEdit(tx)}>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{fmtDate(tx.date)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">${tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block rounded-md px-1.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: color + '22', color }}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{tx.description}</td>
                  <td className="px-2 py-2.5 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_TRANSACTION', id: tx.id }); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >✕</button>
                  </td>
                </tr>
              );
            })}

            {/* New row */}
            {newActive ? (
              <tr className="bg-green-50" onKeyDown={e => handleNewKey(e, false)}>
                <td className="px-2 py-1">
                  <input type="date" className={`${INPUT} bg-green-50 border-green-300 focus:bg-green-100`}
                    value={newRow.date} onChange={e => setNewRow(r => ({ ...r, date: e.target.value }))} autoFocus />
                </td>
                <td className="px-2 py-1">
                  <input type="number" step="0.01" min="0" placeholder="0.00"
                    className={`${INPUT} text-right bg-green-50 border-green-300 focus:bg-green-100`}
                    value={newRow.amount} onChange={e => setNewRow(r => ({ ...r, amount: e.target.value }))} />
                </td>
                <td className="px-2 py-1">
                  <select className={`${SELECT} bg-green-50 border-green-300 focus:bg-green-100`}
                    value={newRow.category} onChange={e => setNewRow(r => ({ ...r, category: e.target.value }))}>
                    <option value="">Pick…</option>
                    {catNames.map(c => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1" onKeyDown={e => handleNewKey(e, true)}>
                  <input type="text" placeholder="Description…"
                    className={`${INPUT} bg-green-50 border-green-300 focus:bg-green-100`}
                    value={newRow.description} onChange={e => setNewRow(r => ({ ...r, description: e.target.value }))} />
                </td>
                <td className="px-2 py-1 text-right">
                  <button onClick={addNew} className="text-green-600 text-xs font-medium hover:underline mr-1">✓</button>
                  <button onClick={() => setNewActive(false)} className="text-gray-400 text-xs hover:text-red-500">✕</button>
                </td>
              </tr>
            ) : (
              <tr
                className="hover:bg-gray-50 cursor-pointer border-t border-dashed border-gray-200"
                onClick={() => { setEditingId(null); setNewRow(EMPTY_NEW); setNewActive(true); }}
              >
                <td colSpan={5} className="px-4 py-3 text-gray-400 text-sm">+ New transaction</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <p className="text-xs text-gray-400 text-center">↑ ↓ arrow keys or Enter to navigate rows · Esc to cancel</p>
      )}
    </div>
  );
}
