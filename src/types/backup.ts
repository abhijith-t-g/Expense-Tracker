import type { Category, Transaction } from './database';

export interface BackupData {
  version: number;
  appName: string;
  exportedAt: string;
  currency: 'INR';
  initialOpeningBalancePaise?: number;
  categories: Category[];
  transactions: Transaction[];
}

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  success: boolean;
  importedCategories: number;
  importedTransactions: number;
  message?: string;
}

