export const DEFAULT_CATEGORIES = [
  { id: 'dining', name: 'Dining', color: '#f59e0b' },
  { id: 'groceries', name: 'Groceries', color: '#10b981' },
  { id: 'services', name: 'Services', color: '#3b82f6' },
  { id: 'travel', name: 'Travel', color: '#8b5cf6' },
  { id: 'operations', name: 'Operations', color: '#6b7280' },
  { id: 'equipment', name: 'Equipment', color: '#ef4444' },
  { id: 'fuel', name: 'Fuel', color: '#f97316' },
  { id: 'projects', name: 'Projects', color: '#06b6d4' },
  { id: 'household', name: 'Household', color: '#84cc16' },
  { id: 'clothing', name: 'Clothing', color: '#ec4899' },
  { id: 'health', name: 'Health', color: '#14b8a6' },
  { id: 'education', name: 'Education', color: '#a855f7' },
] as const;

export interface CategoryConfig {
  id: string;
  name: string;
  color: string;
}

export type FrequencyType = 'days' | 'months' | 'years';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  description: string;
}

export interface RecurringItem {
  id: string;
  startDate: string; // YYYY-MM-DD — first occurrence
  amount: number;
  category: string;
  description: string;
  frequencyType: FrequencyType;
  frequencyValue: number;
}

export type MonthlyBudgets = Record<string, number>;
export type BudgetsByMonth = Record<string, Partial<MonthlyBudgets>>;
export type IncomeByMonth = Record<string, number>;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Negative amounts in parentheses, e.g. -160 -> "($160)"
export function fmtSigned(n: number, decimals = 0): string {
  const abs = Math.abs(n).toFixed(decimals);
  return n < 0 ? `($${abs})` : `$${abs}`;
}
