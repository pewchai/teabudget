import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { type Transaction, type RecurringItem, type BudgetsByMonth, type Category, type MonthlyBudgets } from '../types';
import seedTransactions from '../data/transactions.json';
import seedRecurring from '../data/recurring.json';
import seedBudgets from '../data/budgets.json';

const DATA_VERSION = '2';

interface State {
  transactions: Transaction[];
  recurring: RecurringItem[];
  budgets: BudgetsByMonth;
}

type Action =
  | { type: 'ADD_TRANSACTION'; tx: Transaction }
  | { type: 'DELETE_TRANSACTION'; id: string }
  | { type: 'ADD_RECURRING'; item: RecurringItem }
  | { type: 'UPDATE_RECURRING'; item: RecurringItem }
  | { type: 'DELETE_RECURRING'; id: string }
  | { type: 'SET_BUDGET'; monthKey: string; category: Category; amount: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.tx] };
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
      return {
        ...state,
        budgets: {
          ...state.budgets,
          [action.monthKey]: { ...existing, [action.category]: action.amount },
        },
      };
    }
    default:
      return state;
  }
}

function buildSeedState(): State {
  const transactions: Transaction[] = (
    seedTransactions as Array<{ date: string; amount: number; category: string; description: string }>
  ).map((t, i) => ({ ...t, id: `seed-${i}`, category: t.category as Category }));

  const recurring: RecurringItem[] = (
    seedRecurring as Array<{ startDate: string; amount: number; category: string; description: string; periodMonths: number }>
  ).map((r, i) => ({ ...r, id: `rec-${i}`, category: r.category as Category }));

  const budgets: BudgetsByMonth = {};
  const rawBudgets = seedBudgets as Record<string, Partial<MonthlyBudgets>>;
  for (const [monthNum, cats] of Object.entries(rawBudgets)) {
    const key = `2026-${String(monthNum).padStart(2, '0')}`;
    budgets[key] = cats;
  }

  return { transactions, recurring, budgets };
}

function loadInitialState(): State {
  const saved = localStorage.getItem('krindbudget');
  const version = localStorage.getItem('krindbudget_version');
  if (saved && version === DATA_VERSION) {
    try {
      return JSON.parse(saved) as State;
    } catch {
      // fall through
    }
  }
  return buildSeedState();
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const BudgetContext = createContext<ContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState);

  useEffect(() => {
    localStorage.setItem('krindbudget', JSON.stringify(state));
    localStorage.setItem('krindbudget_version', DATA_VERSION);
  }, [state]);

  return <BudgetContext.Provider value={{ state, dispatch }}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used inside BudgetProvider');
  return ctx;
}

// Returns recurring-generated transaction if item is due in given year/month
export function recurringOccurrence(item: RecurringItem, year: number, month: number): Transaction | null {
  const start = new Date(item.startDate + 'T00:00:00');
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;
  const monthsDiff = (year - startYear) * 12 + (month - startMonth);
  if (monthsDiff < 0) return null;
  if (monthsDiff % item.periodMonths !== 0) return null;
  const day = String(start.getDate()).padStart(2, '0');
  return {
    id: `recurring-${item.id}-${year}-${month}`,
    date: `${year}-${String(month).padStart(2, '0')}-${day}`,
    amount: item.amount,
    category: item.category,
    description: item.description,
  };
}

// All transactions for a month: manual + auto-recurring
export function getMonthTransactions(
  transactions: Transaction[],
  recurring: RecurringItem[],
  year: number,
  month: number
): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const manual = transactions.filter(t => t.date.startsWith(prefix));
  const auto = recurring.flatMap(r => {
    const occ = recurringOccurrence(r, year, month);
    return occ ? [occ] : [];
  });
  return [...manual, ...auto].sort((a, b) => a.date.localeCompare(b.date));
}

export function sumByCategory(transactions: Transaction[]): Partial<Record<Category, number>> {
  const totals: Partial<Record<Category, number>> = {};
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  return totals;
}

// Next future occurrence date for display in recurring list
export function nextOccurrenceDate(item: RecurringItem): string {
  const today = new Date();
  const start = new Date(item.startDate + 'T00:00:00');
  if (start >= today) return item.startDate;
  const monthsDiff = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  const periodsElapsed = Math.ceil(monthsDiff / item.periodMonths);
  const next = new Date(start);
  next.setMonth(next.getMonth() + periodsElapsed * item.periodMonths);
  return next.toISOString().slice(0, 10);
}
