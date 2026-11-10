import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { categories, transactions } from '@/db/schema';
import { BalanceService } from '@/services/balance-service';
import { appEvents, EVENT_TRANSACTIONS_CHANGED } from '@/services/event-bus';
import type {
  CategoryBreakdown,
  ExpenseSummary,
  GroupedTransactions,
  NewTransaction,
  SortOption,
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
  searchQuery?: string;
  sortBy?: SortOption;
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
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const pattern = `%${filters.searchQuery.trim().toLowerCase()}%`;
      conditions.push(
        sql`(LOWER(${transactions.title}) LIKE ${pattern} OR LOWER(COALESCE(${transactions.description}, '')) LIKE ${pattern} OR LOWER(COALESCE(${categories.name}, '')) LIKE ${pattern})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        categoryId: transactions.categoryId,
        title: transactions.title,
        description: transactions.description,
        note: transactions.note,
        date: transactions.date,
        time: transactions.time,
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

    // Apply sorting
    const sortBy = filters.sortBy ?? 'newest';
    switch (sortBy) {
      case 'oldest':
        query = query.orderBy(asc(transactions.date), asc(transactions.id));
        break;
      case 'highest_amount':
        query = query.orderBy(desc(transactions.amount), desc(transactions.date));
        break;
      case 'lowest_amount':
        query = query.orderBy(asc(transactions.amount), desc(transactions.date));
        break;
      case 'newest':
      default:
        query = query.orderBy(desc(transactions.date), desc(transactions.id));
        break;
    }

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
      title: r.title || r.note || 'Transaction',
      description: r.description || r.note || null,
      note: r.note,
      date: r.date,
      time: r.time,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
    }));
  },

  async getGroupedByDate(
    filters: TransactionFilterOptions = {}
  ): Promise<GroupedTransactions[]> {
    const items = await this.getAll(filters);
    const groupsMap = new Map<string, TransactionWithCategory[]>();

    for (const item of items) {
      const dateKey = item.date;
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      groupsMap.get(dateKey)!.push(item);
    }

    const result: GroupedTransactions[] = [];
    for (const [date, dayItems] of groupsMap.entries()) {
      let totalExpense = 0;
      let totalIncome = 0;

      for (const t of dayItems) {
        if (t.type === 'expense') {
          totalExpense += t.amount;
        } else {
          totalIncome += t.amount;
        }
      }

      result.push({
        date,
        dateLabel: BalanceService.formatGroupDateHeader(date),
        items: dayItems,
        totalExpensePaise: totalExpense,
        totalIncomePaise: totalIncome,
      });
    }

    return result;
  },

  async getById(id: number): Promise<TransactionWithCategory | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        categoryId: transactions.categoryId,
        title: transactions.title,
        description: transactions.description,
        note: transactions.note,
        date: transactions.date,
        time: transactions.time,
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
      title: r.title || r.note || 'Transaction',
      description: r.description || r.note || null,
      note: r.note,
      date: r.date,
      time: r.time,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
    };
  },

  async create(data: NewTransaction): Promise<Transaction> {
    const db = getDb();
    const amountInPaise = Math.round(data.amount);

    const [inserted] = await db
      .insert(transactions)
      .values({
        amount: amountInPaise,
        type: data.type,
        categoryId: data.categoryId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        note: data.description?.trim() || null,
        date: data.date,
        time: data.time || null,
      })
      .returning();

    appEvents.emit(EVENT_TRANSACTIONS_CHANGED);

    return {
      id: inserted.id,
      amount: inserted.amount,
      type: inserted.type as TransactionType,
      categoryId: inserted.categoryId,
      title: inserted.title,
      description: inserted.description,
      note: inserted.note,
      date: inserted.date,
      time: inserted.time,
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
    if (data.title !== undefined) {
      updatePayload.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updatePayload.description = data.description?.trim() || null;
      updatePayload.note = data.description?.trim() || null;
    }
    if (data.date !== undefined) {
      updatePayload.date = data.date;
    }
    if (data.time !== undefined) {
      updatePayload.time = data.time || null;
    }

    const result = await db
      .update(transactions)
      .set(updatePayload)
      .where(eq(transactions.id, id));

    const changed = (result.changes ?? 0) > 0;
    if (changed) {
      appEvents.emit(EVENT_TRANSACTIONS_CHANGED);
    }
    return changed;
  },

  async delete(id: number): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, id));
    const changed = (result.changes ?? 0) > 0;
    if (changed) {
      appEvents.emit(EVENT_TRANSACTIONS_CHANGED);
    }
    return changed;
  },

  async getSummary(
    startDate?: string,
    endDate?: string,
    categoryId?: number,
    type?: TransactionType
  ): Promise<ExpenseSummary> {
    const db = getDb();
    const conditions = [];

    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }
    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }
    if (type) {
      conditions.push(eq(transactions.type, type));
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
