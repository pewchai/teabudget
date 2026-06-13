import { useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { type CategoryConfig } from '../types';
import { nanoid } from 'nanoid';

export default function SettingsPage() {
  const { state, dispatch } = useBudget();
  const [editing, setEditing] = useState<Record<string, { name: string; color: string }>>({});
  const [newCat, setNewCat] = useState({ name: '', color: '#6b7280' });
  const [showAdd, setShowAdd] = useState(false);

  function startEdit(cat: CategoryConfig) {
    setEditing(e => ({ ...e, [cat.id]: { name: cat.name, color: cat.color } }));
  }

  function cancelEdit(id: string) {
    setEditing(e => { const n = { ...e }; delete n[id]; return n; });
  }

  function saveEdit(cat: CategoryConfig) {
    const ed = editing[cat.id];
    if (!ed || !ed.name.trim()) return;
    dispatch({ type: 'UPDATE_CATEGORY', id: cat.id, name: ed.name.trim(), color: ed.color, oldName: cat.name });
    cancelEdit(cat.id);
  }

  function addCategory() {
    if (!newCat.name.trim()) return;
    dispatch({ type: 'ADD_CATEGORY', cat: { id: nanoid(), name: newCat.name.trim(), color: newCat.color } });
    setNewCat({ name: '', color: '#6b7280' });
    setShowAdd(false);
  }

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage categories, names, and colors</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Categories</h3>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            + Add category
          </button>
        </div>

        {showAdd && (
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex gap-3 items-center">
            <input
              type="color"
              value={newCat.color}
              onChange={e => setNewCat(n => ({ ...n, color: e.target.value }))}
              className="w-10 h-9 rounded cursor-pointer border border-gray-200 p-0.5"
              title="Pick color"
            />
            <input
              type="text"
              placeholder="Category name…"
              value={newCat.name}
              onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={addCategory} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-sm px-2">✕</button>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {state.categories.map(cat => {
            const ed = editing[cat.id];
            return (
              <div key={cat.id} className="px-5 py-3 flex items-center gap-4 group">
                {ed ? (
                  <>
                    <input
                      type="color"
                      value={ed.color}
                      onChange={e => setEditing(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], color: e.target.value } }))}
                      className="w-10 h-9 rounded cursor-pointer border border-gray-200 p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={ed.name}
                      onChange={e => setEditing(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], name: e.target.value } }))}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat); if (e.key === 'Escape') cancelEdit(cat.id); }}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(cat)} className="text-blue-600 text-xs font-medium hover:underline">Save</button>
                    <button onClick={() => cancelEdit(cat.id)} className="text-gray-400 text-xs hover:text-gray-600">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="w-6 h-6 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                    <button
                      onClick={() => startEdit(cat)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-blue-600 transition-all"
                    >Edit</button>
                    <button
                      onClick={() => dispatch({ type: 'DELETE_CATEGORY', id: cat.id })}
                      className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition-all"
                    >✕</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">Renaming a category updates all existing transactions automatically.</p>
    </div>
  );
}
