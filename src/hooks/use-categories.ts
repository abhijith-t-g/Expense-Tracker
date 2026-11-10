import { useCallback, useEffect, useState } from 'react';
import { CategoryRepository } from '@/repositories/category-repository';
import type { Category, NewCategory, TransactionType } from '@/types/database';

export function useCategories(type?: TransactionType) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CategoryRepository.getAll(type);
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  const addCategory = useCallback(
    async (newCat: NewCategory) => {
      const created = await CategoryRepository.create(newCat);
      await fetchCategories();
      return created;
    },
    [fetchCategories]
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      const success = await CategoryRepository.delete(id);
      if (success) {
        await fetchCategories();
      }
      return success;
    },
    [fetchCategories]
  );

  useEffect(() => {
    let ignore = false;
    CategoryRepository.getAll(type)
      .then((data) => {
        if (!ignore) {
          setCategories(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch categories'
          );
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [type]);

  return {
    categories,
    isLoading,
    error,
    refresh: fetchCategories,
    addCategory,
    deleteCategory,
  };
}
