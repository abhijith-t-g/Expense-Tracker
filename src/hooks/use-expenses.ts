import { useCallback, useEffect, useState } from 'react';
import {
  TransactionRepository,
  type TransactionFilterOptions,
} from '@/repositories/transaction-repository';
import type {
  CategoryBreakdown,
  ExpenseSummary,
  NewTransaction,
  Transaction,
  TransactionWithCategory,
} from '@/types/database';

export function useExpenses(filters?: TransactionFilterOptions) {
  const [expenses, setExpenses] = useState<TransactionWithCategory[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpensePaise: 0,
    totalIncomePaise: 0,
    netPaise: 0,
    transactionCount: 0,
  });
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filters ?? {});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const parsedFilters: TransactionFilterOptions = filterKey
        ? JSON.parse(filterKey)
        : {};

      const [items, sum, catBreakdown] = await Promise.all([
        TransactionRepository.getAll(parsedFilters),
        TransactionRepository.getSummary(
          parsedFilters.startDate,
          parsedFilters.endDate
        ),
        TransactionRepository.getCategoryBreakdown({
          startDate: parsedFilters.startDate,
          endDate: parsedFilters.endDate,
          type: parsedFilters.type,
        }),
      ]);

      setExpenses(items);
      setSummary(sum);
      setBreakdown(catBreakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [filterKey]);

  const addTransaction = useCallback(
    async (data: NewTransaction): Promise<Transaction> => {
      const created = await TransactionRepository.create(data);
      await loadData();
      return created;
    },
    [loadData]
  );

  const updateTransaction = useCallback(
    async (id: number, data: Partial<NewTransaction>): Promise<boolean> => {
      const updated = await TransactionRepository.update(id, data);
      if (updated) {
        await loadData();
      }
      return updated;
    },
    [loadData]
  );

  const deleteTransaction = useCallback(
    async (id: number): Promise<boolean> => {
      const deleted = await TransactionRepository.delete(id);
      if (deleted) {
        await loadData();
      }
      return deleted;
    },
    [loadData]
  );

  useEffect(() => {
    let ignore = false;
    const parsedFilters: TransactionFilterOptions = filterKey
      ? JSON.parse(filterKey)
      : {};

    Promise.all([
      TransactionRepository.getAll(parsedFilters),
      TransactionRepository.getSummary(
        parsedFilters.startDate,
        parsedFilters.endDate
      ),
      TransactionRepository.getCategoryBreakdown({
        startDate: parsedFilters.startDate,
        endDate: parsedFilters.endDate,
        type: parsedFilters.type,
      }),
    ])
      .then(([items, sum, catBreakdown]) => {
        if (!ignore) {
          setExpenses(items);
          setSummary(sum);
          setBreakdown(catBreakdown);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Failed to load expenses'
          );
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [filterKey]);

  return {
    expenses,
    summary,
    breakdown,
    isLoading,
    error,
    refresh: loadData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
