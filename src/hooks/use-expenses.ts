import { useCallback, useEffect, useState } from 'react';
import {
  TransactionRepository,
  type TransactionFilterOptions,
} from '@/repositories/transaction-repository';
import { appEvents, EVENT_TRANSACTIONS_CHANGED } from '@/services/event-bus';
import type {
  CategoryBreakdown,
  ExpenseSummary,
  GroupedTransactions,
  NewTransaction,
  Transaction,
  TransactionWithCategory,
} from '@/types/database';

export function useExpenses(filters?: TransactionFilterOptions) {
  const [expenses, setExpenses] = useState<TransactionWithCategory[]>([]);
  const [groupedExpenses, setGroupedExpenses] = useState<GroupedTransactions[]>([]);
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

  const loadData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        }
        setError(null);
        const parsedFilters: TransactionFilterOptions = filterKey
          ? JSON.parse(filterKey)
          : {};

        const [items, grouped, sum, catBreakdown] = await Promise.all([
          TransactionRepository.getAll(parsedFilters),
          TransactionRepository.getGroupedByDate(parsedFilters),
          TransactionRepository.getSummary(
            parsedFilters.startDate,
            parsedFilters.endDate,
            parsedFilters.categoryId,
            parsedFilters.type
          ),
          TransactionRepository.getCategoryBreakdown({
            startDate: parsedFilters.startDate,
            endDate: parsedFilters.endDate,
            type: parsedFilters.type,
          }),
        ]);

        setExpenses(items);
        setGroupedExpenses(grouped);
        setSummary(sum);
        setBreakdown(catBreakdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    },
    [filterKey]
  );

  const addTransaction = useCallback(
    async (data: NewTransaction): Promise<Transaction> => {
      const created = await TransactionRepository.create(data);
      await loadData(false);
      return created;
    },
    [loadData]
  );

  const updateTransaction = useCallback(
    async (id: number, data: Partial<NewTransaction>): Promise<boolean> => {
      const updated = await TransactionRepository.update(id, data);
      if (updated) {
        await loadData(false);
      }
      return updated;
    },
    [loadData]
  );

  const deleteTransaction = useCallback(
    async (id: number): Promise<boolean> => {
      const deleted = await TransactionRepository.delete(id);
      if (deleted) {
        await loadData(false);
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
      TransactionRepository.getGroupedByDate(parsedFilters),
      TransactionRepository.getSummary(
        parsedFilters.startDate,
        parsedFilters.endDate,
        parsedFilters.categoryId,
        parsedFilters.type
      ),
      TransactionRepository.getCategoryBreakdown({
        startDate: parsedFilters.startDate,
        endDate: parsedFilters.endDate,
        type: parsedFilters.type,
      }),
    ])
      .then(([items, grouped, sum, catBreakdown]) => {
        if (!ignore) {
          setExpenses(items);
          setGroupedExpenses(grouped);
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

  // Reactive subscription: auto-reload when any transaction is created, edited or deleted
  useEffect(() => {
    const unsubscribe = appEvents.subscribe(EVENT_TRANSACTIONS_CHANGED, () => {
      loadData(false);
    });
    return unsubscribe;
  }, [loadData]);

  return {
    expenses,
    groupedExpenses,
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
