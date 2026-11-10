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
  note: string | null;
  date: string; // ISO 8601 date string YYYY-MM-DD (or full ISO timestamp)
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
  type?: TransactionType;
  categoryId?: number | null;
  note?: string | null;
  date: string; // YYYY-MM-DD
}

export interface ExpenseSummary {
  totalExpensePaise: number;
  totalIncomePaise: number;
  netPaise: number;
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
