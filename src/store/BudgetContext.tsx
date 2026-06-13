import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { type Transaction, type RecurringItem, type BudgetsByMonth, type Category, type MonthlyBudgets } from '../types';
import seedTransactions from '../data/transactions.json';
import seedRecurring from '../data/recurring.json';
import seedBudgets from '../data/budgets.json';

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
  | { type: 'SET_BUDGET'; monthKey: string; category: Category; amount: number }
  | { type: 'LOAD'; state: State };

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
    case 'LOAD':
      return action.state;
    default:
      return state;
  }
}

function loadInitialState(): State {
  const saved = localStorage.getItem('teabudget');
  if (saved) {
    try {
      return JSON.parse(saved) as State;
    } catch {
      // fall through to seed data
    }
  }

  // First run: seed from Numbers file data
  const transactions: Transaction[] = (seedTransactions as Array<{ date: string; amount: number; category: string; description: string }>).map(
    (t, i) => ({ ...t, id: `seed-${i}`, category: t.category as Category })
  );

  const recurring: RecurringItem[] = (seedRecurring as Array<{ nextDate: string; amount: number; category: string; description: string; periodMonths: number }>).map(
    (r, i) => ({ ...r, id: `rec-${i}`, category: r.category as Category })
  );

  // Convert numeric month keys to "YYYY-MM" keys
  const budgets: BudgetsByMonth = {};
  const rawBudgets = seedBudgets as Record<string, Partial<MonthlyBudgets>>;
  for (const [monthNum, cats] of Object.entries(rawBudgets)) {
    const key = `2026-${String(monthNum).padStart(2, '0')}`;
    budgets[key] = cats;
  }

  return { transactions, recurring, budgets };
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const BudgetContext = createContext<ContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState);

  useEffect(() => {
    localStorage.setItem('teabudget', JSON.stringify(state));
  }, [state]);

  return <BudgetContext.Provider value={{ state, dispatch }}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used inside BudgetProvider');
  return ctx;
}

// Derived helpers
export function getMonthTransactions(transactions: Transaction[], year: number, month: number): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return transactions.filter(t => t.date.startsWith(prefix));
}

export function sumByCategory(transactions: Transaction[]): Partial<Record<Category, number>> {
  const totals: Partial<Record<Category, number>> = {};
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  return totals;
}
