import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from './seeds';

export interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial database schema with categories, transactions, and app_metadata',
    up: async (db: SQLiteDatabase) => {
      // 1. Categories table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'expense',
          is_default INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Transactions table (amount in integer paise)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount INTEGER NOT NULL,
          type TEXT NOT NULL DEFAULT 'expense',
          category_id INTEGER,
          note TEXT,
          date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
        );
      `);

      // Indexes for performance (fast date range queries, category filter, type filter)
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
        CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id);
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);
      `);

      // 3. App metadata table (settings, key-value store)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Seed default categories if table is empty
      const countResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories;'
      );

      if (!countResult || countResult.count === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await db.runAsync(
            `INSERT INTO categories (name, icon, color, type, is_default) VALUES (?, ?, ?, ?, ?);`,
            [cat.name, cat.icon, cat.color, cat.type, cat.isDefault ? 1 : 0]
          );
        }
      }

      // Record metadata
      await db.runAsync(
        `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('currency', 'INR');`
      );
      await db.runAsync(
        `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('created_at', CURRENT_TIMESTAMP);`
      );
    },
  },
  // Future migrations can simply be appended here:
  // {
  //   version: 2,
  //   description: 'Add tags and recurring transaction tables',
  //   up: async (db) => { ... }
  // }
];

/**
 * Runs pending migrations sequentially up to CURRENT_SCHEMA_VERSION.
 * Ready for future migrations without schema re-creations.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Get current user version
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version};`);
      });
    }
  }
}
