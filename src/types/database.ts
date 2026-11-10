export type TransactionType = 'expense' | 'income';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
  createdAt: string;
}

export interface NewCategory {
  name: string;
  icon: string;
  color: string;
  type?: TransactionType;
  isDefault?: boolean;
}

export interface Transaction {
  id: number;
  amount: number; // Stored in integer paise (₹1 = 100 paise)
  type: TransactionType;
  categoryId: number | null;
  title: string;
  description: string | null;
  note?: string | null;
  date: string; // ISO 8601 Date 'YYYY-MM-DD'
  time: string | null; // 'HH:MM'
  createdAt: string;
  updatedAt: string;
}

export interface TransactionWithCategory extends Transaction {
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface NewTransaction {
  amount: number; // In paise
  type: TransactionType;
  categoryId: number;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  time?: string | null;
}

export interface GroupedTransactions {
  date: string; // 'YYYY-MM-DD'
  dateLabel: string; // 'Today – November 10' or 'Yesterday – November 9'
  items: TransactionWithCategory[];
  totalExpensePaise: number;
  totalIncomePaise: number;
}

export interface ExpenseSummary {
  totalExpensePaise: number;
  totalIncomePaise: number;
  netPaise: number;
  transactionCount: number;
}

export interface MonthlyFinancialSummary {
  month: string; // 'YYYY-MM'
  monthLabel: string; // 'November 2026'
  openingBalancePaise: number;
  monthlyIncomePaise: number;
  monthlyExpensePaise: number;
  availableBalancePaise: number; // opening + income - expense
  transactionCount: number;
}

export interface CategoryBreakdown {
  categoryId: number | null;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalPaise: number;
  count: number;
  percentage: number;
}

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'highest_amount'
  | 'lowest_amount';

export type DateQuickFilter =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom'
  | 'all';
