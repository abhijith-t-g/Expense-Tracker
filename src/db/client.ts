import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';
import { runMigrations } from './migrations';

export const DB_NAME = 'rupeetracker.db';

export type AppDb = ExpoSQLiteDatabase<typeof schema>;

let sqliteDbInstance: SQLite.SQLiteDatabase | null = null;
let drizzleDbInstance: AppDb | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initializes SQLite database connection and runs pending migrations.
 * Safe to call multiple times (memoized init).
 */
export async function initializeDatabase(): Promise<{
  rawDb: SQLite.SQLiteDatabase;
  db: AppDb;
}> {
  if (isInitialized && sqliteDbInstance && drizzleDbInstance) {
    return { rawDb: sqliteDbInstance, db: drizzleDbInstance };
  }

  if (initPromise) {
    await initPromise;
    return { rawDb: sqliteDbInstance!, db: drizzleDbInstance! };
  }

  initPromise = (async () => {
    sqliteDbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(sqliteDbInstance);
    drizzleDbInstance = drizzle(sqliteDbInstance, { schema });
    isInitialized = true;
  })();

  await initPromise;
  initPromise = null;

  return {
    rawDb: sqliteDbInstance!,
    db: drizzleDbInstance!,
  };
}

/**
 * Returns the Drizzle ORM client.
 * Throws if initializeDatabase has not finished yet.
 */
export function getDb(): AppDb {
  if (!drizzleDbInstance) {
    // Attempt sync fallback if possible
    if (!sqliteDbInstance) {
      sqliteDbInstance = SQLite.openDatabaseSync(DB_NAME);
    }
    drizzleDbInstance = drizzle(sqliteDbInstance, { schema });
  }
  return drizzleDbInstance;
}

/**
 * Returns raw SQLite database instance.
 */
export function getRawDb(): SQLite.SQLiteDatabase {
  if (!sqliteDbInstance) {
    sqliteDbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return sqliteDbInstance;
}
