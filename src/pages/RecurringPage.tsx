import { useState, useMemo, useCallback } from 'react';
import { useBudget, nextOccurrenceDate, frequencyLabel } from '../store/BudgetContext';
import { type RecurringItem, type FrequencyType } from '../types';
import { nanoid } from 'nanoid';

const FIELD = 'mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const EDIT_CELL = 'w-full bg-blue-50 border-b border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:bg-blue-100';

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function dayFromDate(dateStr: string): number {
  return parseInt(dateStr.split('-')[2] ?? '1', 10);
}

const SAME_DATE_PERIODS = [
  { label: 'Monthly', months: 1 },
  { label: 'Every 2 months', months: 2 },
  { label: 'Quarterly (every 3 months)', months: 3 },
  { label: 'Every 6 months', months: 6 },
  { label: 'Yearly', months: 12 },
  { label: 'Every 2 years', months: 24 },
];

const makeEmpty = (startDate: string) => ({
  startDate,
  amount: '',
  category: '',
  description: '',
  sameDate: false,
  sameDateMonths: 1,
  frequencyValue: '30',
  frequencyType: 'days' as FrequencyType,
});

type EditForm = {
  startDate: string;
  amount: string;
  category: string;
  description: string;
  frequencyType: FrequencyType;
  frequencyValue: string;
};

export default function RecurringPage() {
  const { state, dispatch, selectedYear } = useBudget();
  const [showForm, setShowForm] = useState(false);

  const defaultStartDate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today.startsWith(String(selectedYear)) ? today : `${selectedYear}-01-01`;
  }, [selectedYear]);
  const [form, setForm] = useState(() => makeEmpty(defaultStartDate));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    startDate: '', amount: '', category: '', description: '',
    frequencyType: 'months', frequencyValue: '1',
  });

  const catNames = useMemo(() => state.categories.map(c => c.name), [state.categories]);
  const colorMap = useMemo(() => Object.fromEntries(state.categories.map(c => [c.name, c.color])), [state.categories]);

  // Items active in the selected year (started in or before that year)
  const yearRecurring = useMemo(
    () => state.recurring.filter(r => r.startDate.slice(0, 4) <= String(selectedYear)),
    [state.recurring, selectedYear]
  );

  const totalMonthly = useMemo(() => yearRecurring.reduce((s, r) => {
    const monthsPerOccurrence = r.frequencyType === 'days'
      ? r.frequencyValue / 30.44
      : r.frequencyType === 'months' ? r.frequencyValue
      : r.frequencyValue * 12;
    return s + r.amount / monthsPerOccurrence;
  }, 0), [yearRecurring]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const item: RecurringItem = {
      id: nanoid(),
      startDate: form.startDate,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      frequencyType: form.sameDate ? 'months' : form.frequencyType,
      frequencyValue: form.sameDate ? form.sameDateMonths : parseInt(form.frequencyValue, 10),
    };
    dispatch({ type: 'ADD_RECURRING', item });
    setForm(makeEmpty(defaultStartDate));
    setShowForm(false);
  }

  function startEdit(item: RecurringItem) {
    setEditingId(item.id);
    setEditForm({
      startDate: item.startDate,
      amount: String(item.amount),
      category: item.category,
      description: item.description,
      frequencyType: item.frequencyType,
      frequencyValue: String(item.frequencyValue),
    });
  }

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const amount = parseFloat(editForm.amount);
    const freqVal = parseInt(editForm.frequencyValue, 10);
    if (!isNaN(amount) && editForm.category && editForm.description && !isNaN(freqVal) && freqVal > 0) {
      dispatch({
        type: 'UPDATE_RECURRING',
        item: {
          id: editingId,
          startDate: editForm.startDate,
          amount,
          category: editForm.category,
          description: editForm.description,
          frequencyType: editForm.frequencyType,
          frequencyValue: freqVal,
        },
      });
    }
    setEditingId(null);
  }, [editingId, editForm, dispatch]);

  const editIdx = useMemo(
    () => editingId ? yearRecurring.findIndex(r => r.id === editingId) : -1,
    [editingId, yearRecurring]
  );

  function navigateRow(dir: 1 | -1) {
    saveEdit();
    const next = editIdx + dir;
    if (next >= 0 && next < yearRecurring.length) {
      startEdit(yearRecurring[next]);
    }
  }

  function handleEditKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setEditingId(null);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); navigateRow(1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); navigateRow(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); navigateRow(-1); }
  }

  const today = new Date().toISOString().slice(0, 10);
  const day = dayFromDate(form.startDate);
  const dayLabel = ordinal(day);
  const shortMonthNote = day >= 29 ? ' (last day for shorter months)' : '';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring</h2>
          <p className="text-gray-500 text-sm mt-1">{selectedYear} · ≈ ${totalMonthly.toFixed(2)} / month · auto-added to transactions</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Cancel' : 'Add Recurring'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">First billing date</span>
              <input type="date" required value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={FIELD} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Amount ($)</span>
              <input type="number" step="0.01" min="0" required placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className={FIELD} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Category</span>
              <select required value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={FIELD}>
                <option value="">Pick category…</option>
                {catNames.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
              <input type="text" required value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={FIELD} />
            </label>
          </div>

          {/* Frequency */}
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase block">Billing Frequency</span>

            <div className="flex items-center gap-3">
              <div className="flex gap-2 flex-1">
                <input
                  type="number" min="1" required={!form.sameDate}
                  placeholder="30"
                  value={form.frequencyValue}
                  onChange={e => setForm(f => ({ ...f, frequencyValue: e.target.value }))}
                  disabled={form.sameDate}
                  className={`w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.sameDate ? 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-200'
                  }`}
                />
                <select
                  value={form.frequencyType}
                  onChange={e => setForm(f => ({ ...f, frequencyType: e.target.value as FrequencyType }))}
                  disabled={form.sameDate}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.sameDate ? 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-200'
                  }`}
                >
                  <option value="days">day(s) — exact interval</option>
                  <option value="months">month(s) — same calendar date</option>
                  <option value="years">year(s) — same calendar date</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.sameDate}
                onChange={e => setForm(f => ({ ...f, sameDate: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Bill on the same date each period
                <span className="text-gray-400 text-xs block mt-0.5">
                  {form.sameDate
                    ? `Bills on the ${dayLabel} of each period${shortMonthNote}`
                    : 'If months/years are shorter (Feb, etc.), use the last day of the month'}
                </span>
              </span>
            </label>

            {form.sameDate && (
              <div className="ml-6">
                <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Repeat every</span>
                <select
                  value={form.sameDateMonths}
                  onChange={e => setForm(f => ({ ...f, sameDateMonths: parseInt(e.target.value, 10) }))}
                  className={FIELD}
                >
                  {SAME_DATE_PERIODS.map(p => (
                    <option key={p.months} value={p.months}>{p.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1.5">
                  Bills on the {dayLabel} of each period{shortMonthNote}.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">≈ /month</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Frequency</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Start / Next</th>
              <th className="w-24 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {yearRecurring.map(item => {
              const isEditing = editingId === item.id;
              const next = nextOccurrenceDate(item);
              const due = next <= today;
              const color = colorMap[item.category] ?? '#9ca3af';
              const monthlyEq = item.frequencyType === 'days'
                ? item.amount / (item.frequencyValue / 30.44)
                : item.frequencyType === 'months'
                  ? item.amount / item.frequencyValue
                  : item.amount / (item.frequencyValue * 12);

              if (isEditing) {
                const editMonthly = (() => {
                  const fv = parseFloat(editForm.frequencyValue) || 1;
                  const amt = parseFloat(editForm.amount) || 0;
                  if (editForm.frequencyType === 'days') return amt / (fv / 30.44);
                  if (editForm.frequencyType === 'months') return amt / fv;
                  return amt / (fv * 12);
                })();
                return (
                  <tr key={item.id} className="bg-blue-50" onKeyDown={handleEditKey}>
                    <td className="px-2 py-1">
                      <input type="text" className={EDIT_CELL} value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1">
                      <select className={`${EDIT_CELL} cursor-pointer`} value={editForm.category}
                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                        {catNames.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" step="0.01" className={`${EDIT_CELL} text-right`} value={editForm.amount}
                        onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1 text-right text-xs text-gray-400">
                      ${editMonthly.toFixed(2)}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1 items-center">
                        <input type="number" min="1" className="w-12 bg-blue-50 border-b border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:bg-blue-100"
                          value={editForm.frequencyValue}
                          onChange={e => setEditForm(f => ({ ...f, frequencyValue: e.target.value }))} />
                        <select className="bg-blue-50 border-b border-blue-300 text-sm focus:outline-none focus:bg-blue-100 cursor-pointer"
                          value={editForm.frequencyType}
                          onChange={e => setEditForm(f => ({ ...f, frequencyType: e.target.value as FrequencyType }))}>
                          <option value="days">days</option>
                          <option value="months">months</option>
                          <option value="years">years</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <input type="date" className="bg-blue-50 border-b border-blue-300 px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-100"
                        value={editForm.startDate}
                        onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1 text-right whitespace-nowrap">
                      <button onClick={saveEdit} className="text-blue-600 text-sm font-semibold px-2.5 py-1 rounded hover:bg-blue-100 transition-colors">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm px-2.5 py-1 rounded hover:text-red-500 hover:bg-red-50 transition-colors ml-1">✕</button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => startEdit(item)}>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.description}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: color + '22', color }}>{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${item.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">${monthlyEq.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-gray-600 text-xs">{frequencyLabel(item)}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${due ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                    {next}{due && ' ⚠'}
                  </td>
                  <td className="px-2 py-3">
                    <button onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_RECURRING', id: item.id }); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">✕</button>
                  </td>
                </tr>
              );
            })}
            {yearRecurring.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No recurring items for {selectedYear}</td></tr>
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
      {editingId && <p className="text-xs text-gray-400 text-center">↑ ↓ or Enter to move between rows · Esc to cancel</p>}
    </div>
  );
}
