import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { categories, transactions } from '@/db/schema';
import type {
  CategoryBreakdown,
  ExpenseSummary,
  NewTransaction,
  Transaction,
  TransactionType,
  TransactionWithCategory,
} from '@/types/database';

export interface TransactionFilterOptions {
  limit?: number;
  offset?: number;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  categoryId?: number;
  type?: TransactionType;
}

export const TransactionRepository = {
  async getAll(
    filters: TransactionFilterOptions = {}
  ): Promise<TransactionWithCategory[]> {
    const db = getDb();
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }
    if (filters.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        categoryId: transactions.categoryId,
        note: transactions.note,
        date: transactions.date,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .$dynamic();

    if (whereClause) {
      query = query.where(whereClause);
    }

    query = query.orderBy(desc(transactions.date), desc(transactions.id));

    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: r.type as TransactionType,
      categoryId: r.categoryId,
      note: r.note,
      date: r.date,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
    }));
  },

  async getById(id: number): Promise<TransactionWithCategory | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        categoryId: transactions.categoryId,
        note: transactions.note,
        date: transactions.date,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      amount: r.amount,
      type: r.type as TransactionType,
      categoryId: r.categoryId,
      note: r.note,
      date: r.date,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
    };
  },

  async create(data: NewTransaction): Promise<Transaction> {
    const db = getDb();
    // Safety: ensure integer paise
    const amountInPaise = Math.round(data.amount);

    const [inserted] = await db
      .insert(transactions)
      .values({
        amount: amountInPaise,
        type: data.type ?? 'expense',
        categoryId: data.categoryId ?? null,
        note: data.note?.trim() || null,
        date: data.date,
      })
      .returning();

    return {
      id: inserted.id,
      amount: inserted.amount,
      type: inserted.type as TransactionType,
      categoryId: inserted.categoryId,
      note: inserted.note,
      date: inserted.date,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
    };
  },

  async update(id: number, data: Partial<NewTransaction>): Promise<boolean> {
    const db = getDb();
    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    if (data.amount !== undefined) {
      updatePayload.amount = Math.round(data.amount);
    }
    if (data.type !== undefined) {
      updatePayload.type = data.type;
    }
    if (data.categoryId !== undefined) {
      updatePayload.categoryId = data.categoryId;
    }
    if (data.note !== undefined) {
      updatePayload.note = data.note ? data.note.trim() : null;
    }
    if (data.date !== undefined) {
      updatePayload.date = data.date;
    }

    const result = await db
      .update(transactions)
      .set(updatePayload)
      .where(eq(transactions.id, id));

    return (result.changes ?? 0) > 0;
  },

  async delete(id: number): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, id));
    return (result.changes ?? 0) > 0;
  },

  async getSummary(
    startDate?: string,
    endDate?: string
  ): Promise<ExpenseSummary> {
    const db = getDb();
    const conditions = [];

    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({
        type: transactions.type,
        totalPaise: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .$dynamic();

    if (whereClause) {
      query = query.where(whereClause);
    }

    query = query.groupBy(transactions.type);

    const rows = await query;
    let totalExpensePaise = 0;
    let totalIncomePaise = 0;
    let transactionCount = 0;

    for (const r of rows) {
      const paise = Number(r.totalPaise);
      const count = Number(r.count);
      transactionCount += count;
      if (r.type === 'expense') {
        totalExpensePaise += paise;
      } else if (r.type === 'income') {
        totalIncomePaise += paise;
      }
    }

    return {
      totalExpensePaise,
      totalIncomePaise,
      netPaise: totalIncomePaise - totalExpensePaise,
      transactionCount,
    };
  },

  async getCategoryBreakdown(options: {
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
  } = {}): Promise<CategoryBreakdown[]> {
    const db = getDb();
    const targetType = options.type ?? 'expense';
    const conditions = [eq(transactions.type, targetType)];

    if (options.startDate) {
      conditions.push(gte(transactions.date, options.startDate));
    }
    if (options.endDate) {
      conditions.push(lte(transactions.date, options.endDate));
    }

    const rows = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        categoryIcon: sql<string>`COALESCE(${categories.icon}, 'ellipsis-horizontal')`,
        categoryColor: sql<string>`COALESCE(${categories.color}, '#9E9E9E')`,
        totalPaise: sql<number>`SUM(${transactions.amount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(transactions.categoryId)
      .orderBy(desc(sql`SUM(${transactions.amount})`));

    const totalOverallPaise = rows.reduce(
      (sum, r) => sum + Number(r.totalPaise),
      0
    );

    return rows.map((r) => {
      const total = Number(r.totalPaise);
      return {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        categoryIcon: r.categoryIcon,
        categoryColor: r.categoryColor,
        totalPaise: total,
        count: Number(r.count),
        percentage:
          totalOverallPaise > 0 ? (total / totalOverallPaise) * 100 : 0,
      };
    });
  },
};
