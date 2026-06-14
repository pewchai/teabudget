import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react';
import {
  type Transaction, type RecurringItem, type BudgetsByMonth,
  type CategoryConfig, DEFAULT_CATEGORIES,
} from '../types';
import seedTransactions from '../data/transactions.json';
import seedRecurring from '../data/recurring.json';
import seedBudgets from '../data/budgets.json';

const DATA_VERSION = '5';

interface State {
  transactions: Transaction[];
  recurring: RecurringItem[];
  budgets: BudgetsByMonth;
  categories: CategoryConfig[];
  years: number[];
}

type Action =
  | { type: 'ADD_TRANSACTION'; tx: Transaction }
  | { type: 'UPDATE_TRANSACTION'; tx: Transaction }
  | { type: 'DELETE_TRANSACTION'; id: string }
  | { type: 'ADD_RECURRING'; item: RecurringItem }
  | { type: 'UPDATE_RECURRING'; item: RecurringItem }
  | { type: 'DELETE_RECURRING'; id: string }
  | { type: 'SET_BUDGET'; monthKey: string; category: string; amount: number }
  | { type: 'ADD_CATEGORY'; cat: CategoryConfig }
  | { type: 'UPDATE_CATEGORY'; id: string; name: string; color: string; oldName: string }
  | { type: 'DELETE_CATEGORY'; id: string }
  | { type: 'ADD_YEAR'; year: number }
  | { type: 'DELETE_YEAR'; year: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.tx] };
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.tx.id ? action.tx : t) };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.id) };
    case 'ADD_RECURRING':
      return { ...state, recurring: [...state.recurring, action.item] };
    case 'UPDATE_RECURRING':
      return { ...state, recurring: state.recurring.map(r => r.id === action.item.id ? action.item : r) };
    case 'DELETE_RECURRING':
      return { ...state, recurring: state.recurring.filter(r => r.id !== action.id) };
    case 'SET_BUDGET': {
      const existing = state.budgets[action.monthKey] ?? {};
      return { ...state, budgets: { ...state.budgets, [action.monthKey]: { ...existing, [action.category]: action.amount } } };
    }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.cat] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c => c.id === action.id ? { ...c, name: action.name, color: action.color } : c),
        // rename in transactions and recurring if name changed
        transactions: action.oldName === action.name ? state.transactions :
          state.transactions.map(t => t.category === action.oldName ? { ...t, category: action.name } : t),
        recurring: action.oldName === action.name ? state.recurring :
          state.recurring.map(r => r.category === action.oldName ? { ...r, category: action.name } : r),
      };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.id) };
    case 'ADD_YEAR':
      return state.years.includes(action.year)
        ? state
        : { ...state, years: [...state.years, action.year].sort((a, b) => a - b) };
    case 'DELETE_YEAR':
      return state.years.length <= 1
        ? state
        : { ...state, years: state.years.filter(y => y !== action.year) };
    default:
      return state;
  }
}

function buildSeedState(): State {
  const transactions: Transaction[] = (
    seedTransactions as Array<{ date: string; amount: number; category: string; description: string }>
  ).map((t, i) => ({ ...t, id: `seed-${i}` }));

  const recurring: RecurringItem[] = (
    seedRecurring as Array<{ startDate: string; amount: number; category: string; description: string; frequencyType: string; frequencyValue: number }>
  ).map((r, i) => ({
    ...r,
    id: `rec-${i}`,
    frequencyType: r.frequencyType as RecurringItem['frequencyType'],
  }));

  const budgets: BudgetsByMonth = seedBudgets as BudgetsByMonth;

  return { transactions, recurring, budgets, categories: [...DEFAULT_CATEGORIES], years: [2025, 2026] };
}

function loadInitialState(): State {
  const saved = localStorage.getItem('krindbudget');
  const version = localStorage.getItem('krindbudget_version');
  if (saved && version === DATA_VERSION) {
    try { return JSON.parse(saved) as State; } catch { /* fall through */ }
  }
  return buildSeedState();
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  addYear: () => number;
}
const BudgetContext = createContext<ContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState);
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const cy = new Date().getFullYear();
    return state.years.includes(cy) ? cy : (state.years[state.years.length - 1] ?? cy);
  });

  useEffect(() => {
    localStorage.setItem('krindbudget', JSON.stringify(state));
    localStorage.setItem('krindbudget_version', DATA_VERSION);
  }, [state]);

  function addYear(): number {
    const next = Math.max(...state.years) + 1;
    dispatch({ type: 'ADD_YEAR', year: next });
    setSelectedYear(next);
    return next;
  }

  return (
    <BudgetContext.Provider value={{ state, dispatch, selectedYear, setSelectedYear, addYear }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used inside BudgetProvider');
  return ctx;
}

// ── Recurring occurrence logic ─────────────────────────────────────────────

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }

export function recurringOccurrencesForMonth(item: RecurringItem, year: number, month: number): Transaction[] {
  const start = new Date(item.startDate + 'T12:00:00Z');
  const results: Transaction[] = [];

  if (item.frequencyType === 'days') {
    const dim = daysInMonth(year, month);
    for (let d = 1; d <= dim; d++) {
      const check = new Date(Date.UTC(year, month - 1, d, 12));
      const diffDays = Math.round((check.getTime() - start.getTime()) / 86_400_000);
      if (diffDays < 0) continue;
      if (diffDays % item.frequencyValue === 0) {
        const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        results.push({ id: `rec-${item.id}-${dateStr}`, date: dateStr, amount: item.amount, category: item.category, description: item.description });
      }
    }
  } else if (item.frequencyType === 'months') {
    const sy = start.getUTCFullYear(), sm = start.getUTCMonth() + 1;
    const diff = (year - sy) * 12 + (month - sm);
    if (diff < 0 || diff % item.frequencyValue !== 0) return [];
    const day = Math.min(start.getUTCDate(), daysInMonth(year, month));
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    results.push({ id: `rec-${item.id}-${year}-${month}`, date: dateStr, amount: item.amount, category: item.category, description: item.description });
  } else if (item.frequencyType === 'years') {
    const sy = start.getUTCFullYear(), sm = start.getUTCMonth() + 1;
    if (month !== sm) return [];
    const diff = year - sy;
    if (diff < 0 || diff % item.frequencyValue !== 0) return [];
    const day = Math.min(start.getUTCDate(), daysInMonth(year, month));
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    results.push({ id: `rec-${item.id}-${year}-${month}`, date: dateStr, amount: item.amount, category: item.category, description: item.description });
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  return results.filter(t => t.date <= todayStr);
}

export function getMonthTransactions(
  transactions: Transaction[], recurring: RecurringItem[], year: number, month: number
): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const manual = transactions.filter(t => t.date.startsWith(prefix));
  const auto = recurring.flatMap(r => recurringOccurrencesForMonth(r, year, month));
  return [...manual, ...auto].sort((a, b) => a.date.localeCompare(b.date));
}

export function sumByCategory(transactions: Transaction[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const t of transactions) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  return totals;
}

export function nextOccurrenceDate(item: RecurringItem): string {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (item.startDate >= todayStr) return item.startDate;
  const start = new Date(item.startDate + 'T12:00:00Z');

  if (item.frequencyType === 'days') {
    const startMs = start.getTime();
    const todayMs = new Date(todayStr + 'T12:00:00Z').getTime();
    const freqMs = item.frequencyValue * 86_400_000;
    const periods = Math.ceil((todayMs - startMs) / freqMs);
    return new Date(startMs + periods * freqMs).toISOString().slice(0, 10);
  }

  if (item.frequencyType === 'months') {
    const today = new Date(todayStr + 'T12:00:00Z');
    const smIdx = start.getUTCMonth(), sy = start.getUTCFullYear(), sd = start.getUTCDate();
    const tmIdx = today.getUTCMonth(), ty = today.getUTCFullYear();
    const diff = (ty - sy) * 12 + (tmIdx - smIdx);
    const periods = Math.ceil(diff / item.frequencyValue);
    const nextMonthIdx = smIdx + periods * item.frequencyValue;
    const ny = sy + Math.floor(nextMonthIdx / 12);
    const nm = (nextMonthIdx % 12); // 0-indexed
    const day = Math.min(sd, daysInMonth(ny, nm + 1));
    return `${ny}-${String(nm + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  // years
  const today = new Date(todayStr + 'T12:00:00Z');
  const sy = start.getUTCFullYear(), smIdx = start.getUTCMonth(), sd = start.getUTCDate();
  const ty = today.getUTCFullYear();
  const periods = Math.ceil((ty - sy) / item.frequencyValue);
  const ny = sy + periods * item.frequencyValue;
  const day = Math.min(sd, daysInMonth(ny, smIdx + 1));
  return `${ny}-${String(smIdx + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function frequencyLabel(item: RecurringItem): string {
  const v = item.frequencyValue;
  if (item.frequencyType === 'days') return `Every ${v} day${v > 1 ? 's' : ''}`;
  if (item.frequencyType === 'months') {
    if (v === 1) return 'Monthly';
    if (v === 3) return 'Quarterly';
    if (v === 6) return 'Every 6 months';
    if (v === 12) return 'Yearly';
    return `Every ${v} months`;
  }
  return v === 1 ? 'Yearly' : `Every ${v} years`;
}
