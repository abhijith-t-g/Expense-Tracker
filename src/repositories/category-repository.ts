import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { categories } from '@/db/schema';
import type { Category, NewCategory, TransactionType } from '@/types/database';

export const CategoryRepository = {
  async getAll(type?: TransactionType): Promise<Category[]> {
    const db = getDb();
    const query = db.select().from(categories);

    let rows;
    if (type) {
      rows = await query.where(eq(categories.type, type));
    } else {
      rows = await query;
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type as TransactionType,
      isDefault: Boolean(row.isDefault),
      createdAt: row.createdAt,
    }));
  },

  async getById(id: number): Promise<Category | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type as TransactionType,
      isDefault: Boolean(row.isDefault),
      createdAt: row.createdAt,
    };
  },

  async create(data: NewCategory): Promise<Category> {
    const db = getDb();
    const [inserted] = await db
      .insert(categories)
      .values({
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type ?? 'expense',
        isDefault: data.isDefault ?? false,
      })
      .returning();

    return {
      id: inserted.id,
      name: inserted.name,
      icon: inserted.icon,
      color: inserted.color,
      type: inserted.type as TransactionType,
      isDefault: Boolean(inserted.isDefault),
      createdAt: inserted.createdAt,
    };
  },

  async delete(id: number): Promise<boolean> {
    const db = getDb();
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.changes ?? 0) > 0;
  },
};

