import { getDb, getRawDb } from '@/db/client';
import { CURRENT_SCHEMA_VERSION } from '@/db/migrations';
import { categories, transactions } from '@/db/schema';
import type { BackupData, ImportMode, ImportResult } from '@/types/backup';
import type { Category, Transaction } from '@/types/database';

export const BackupRepository = {
  /**
   * Exports all categories and transactions to a structured BackupData JSON object.
   */
  async exportAllData(): Promise<BackupData> {
    const db = getDb();
    const rawDb = getRawDb();

    const categoryRows = await db.select().from(categories);
    const transactionRows = await db.select().from(transactions);
    const openingBalRow = await rawDb.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_metadata WHERE key = 'initial_opening_balance';`
    );

    const formattedCategories: Category[] = categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type as 'expense' | 'income',
      isDefault: Boolean(c.isDefault),
      createdAt: c.createdAt,
    }));

    const formattedTransactions: Transaction[] = transactionRows.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type as 'expense' | 'income',
      categoryId: t.categoryId,
      title: t.title || t.note || 'Transaction',
      description: t.description || t.note || null,
      note: t.note,
      date: t.date,
      time: t.time,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return {
      version: CURRENT_SCHEMA_VERSION,
      appName: 'Rupee Tracker',
      exportedAt: new Date().toISOString(),
      currency: 'INR',
      initialOpeningBalancePaise: openingBalRow ? parseInt(openingBalRow.value, 10) || 0 : 0,
      categories: formattedCategories,
      transactions: formattedTransactions,
    };
  },

  /**
   * Imports backup data into SQLite database.
   */
  async importAllData(
    data: BackupData,
    mode: ImportMode = 'merge'
  ): Promise<ImportResult> {
    if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
      throw new Error('Invalid backup file structure: missing categories or transactions.');
    }

    const rawDb = getRawDb();
    let importedCategoriesCount = 0;
    let importedTransactionsCount = 0;

    await rawDb.withTransactionAsync(async () => {
      if (mode === 'replace') {
        await rawDb.execAsync('DELETE FROM transactions;');
        if (data.initialOpeningBalancePaise !== undefined) {
          await rawDb.runAsync(
            `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('initial_opening_balance', ?);`,
            [data.initialOpeningBalancePaise.toString()]
          );
        }
      }

      // Map category IDs
      const categoryIdMap = new Map<number, number>();

      for (const cat of data.categories) {
        const existing = await rawDb.getFirstAsync<{ id: number }>(
          'SELECT id FROM categories WHERE name = ? AND type = ? LIMIT 1;',
          [cat.name, cat.type]
        );

        if (existing) {
          categoryIdMap.set(cat.id, existing.id);
        } else {
          const insertResult = await rawDb.runAsync(
            `INSERT INTO categories (name, icon, color, type, is_default) VALUES (?, ?, ?, ?, ?);`,
            [cat.name, cat.icon, cat.color, cat.type, cat.isDefault ? 1 : 0]
          );
          categoryIdMap.set(cat.id, insertResult.lastInsertRowId);
          importedCategoriesCount++;
        }
      }

      // Insert transactions
      for (const t of data.transactions) {
        const mappedCatId = t.categoryId ? categoryIdMap.get(t.categoryId) ?? null : null;
        const title = t.title || t.note || 'Transaction';
        const description = t.description || t.note || null;

        await rawDb.runAsync(
          `INSERT INTO transactions (amount, type, category_id, title, description, note, date, time, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            t.amount,
            t.type,
            mappedCatId,
            title,
            description,
            description,
            t.date,
            t.time ?? null,
            t.createdAt ?? new Date().toISOString(),
            t.updatedAt ?? new Date().toISOString(),
          ]
        );
        importedTransactionsCount++;
      }
    });

    return {
      success: true,
      importedCategories: importedCategoriesCount,
      importedTransactions: importedTransactionsCount,
      message: `Successfully imported ${importedTransactionsCount} transactions and ${importedCategoriesCount} new categories.`,
    };
  },
};
