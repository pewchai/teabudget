export const CATEGORIES = [
  'Dining',
  'Groceries',
  'Services',
  'Travel',
  'Operations',
  'Equipment',
  'Fuel',
  'Projects',
  'Household',
  'Clothing',
  'Health',
  'Education',
] as const;

export type Category = typeof CATEGORIES[number];

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: Category;
  description: string;
}

export interface RecurringItem {
  id: string;
  startDate: string; // YYYY-MM-DD — first occurrence (anchors the schedule)
  amount: number;
  category: Category;
  description: string;
  periodMonths: number; // recurrence interval in months
}

export type MonthlyBudgets = Record<Category, number>;

// Keyed by "YYYY-MM"
export type BudgetsByMonth = Record<string, Partial<MonthlyBudgets>>;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Dining: '#f59e0b',
  Groceries: '#10b981',
  Services: '#3b82f6',
  Travel: '#8b5cf6',
  Operations: '#6b7280',
  Equipment: '#ef4444',
  Fuel: '#f97316',
  Projects: '#06b6d4',
  Household: '#84cc16',
  Clothing: '#ec4899',
  Health: '#14b8a6',
  Education: '#a855f7',
};
