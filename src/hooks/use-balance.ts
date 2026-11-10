import { useCallback, useEffect, useState } from 'react';
import { BalanceService } from '@/services/balance-service';
import {
  appEvents,
  EVENT_BALANCE_CHANGED,
  EVENT_TRANSACTIONS_CHANGED,
} from '@/services/event-bus';
import type { MonthlyFinancialSummary } from '@/types/database';

export function useBalance(initialYear?: number, initialMonth?: number) {
  const currentDate = new Date();
  const [year, setYear] = useState<number>(initialYear ?? currentDate.getFullYear());
  const [month, setMonth] = useState<number>(initialMonth ?? currentDate.getMonth() + 1);

  const [summary, setSummary] = useState<MonthlyFinancialSummary>({
    month: `${year}-${month < 10 ? `0${month}` : month}`,
    monthLabel: currentDate.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    }),
    openingBalancePaise: 0,
    monthlyIncomePaise: 0,
    monthlyExpensePaise: 0,
    availableBalancePaise: 0,
    transactionCount: 0,
  });

  const [initialOpeningBalance, setInitialOpeningBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalanceData = useCallback(async (targetYear: number, targetMonth: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const [sum, initBal] = await Promise.all([
        BalanceService.getMonthlyFinancialSummary(targetYear, targetMonth),
        BalanceService.getInitialOpeningBalance(),
      ]);
      setSummary(sum);
      setInitialOpeningBalance(initBal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance summary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeMonth = useCallback(
    (newYear: number, newMonth: number) => {
      setYear(newYear);
      setMonth(newMonth);
      loadBalanceData(newYear, newMonth);
    },
    [loadBalanceData, setYear, setMonth]
  );

  const setInitialBalance = useCallback(
    async (paise: number) => {
      await BalanceService.setInitialOpeningBalance(paise);
      await loadBalanceData(year, month);
    },
    [year, month, loadBalanceData]
  );

  const setAvailableBalance = useCallback(
    async (targetAvailablePaise: number) => {
      const diff = targetAvailablePaise - summary.availableBalancePaise;
      const newInitial = initialOpeningBalance + diff;
      await BalanceService.setInitialOpeningBalance(newInitial);
      await loadBalanceData(year, month);
    },
    [summary.availableBalancePaise, initialOpeningBalance, year, month, loadBalanceData]
  );

  useEffect(() => {
    let ignore = false;
    Promise.all([
      BalanceService.getMonthlyFinancialSummary(year, month),
      BalanceService.getInitialOpeningBalance(),
    ])
      .then(([sum, initBal]) => {
        if (!ignore) {
          setSummary(sum);
          setInitialOpeningBalance(initBal);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load balance summary');
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [year, month]);

  // Reactive subscription: auto-reload when transactions or balance change
  useEffect(() => {
    const unsub1 = appEvents.subscribe(EVENT_TRANSACTIONS_CHANGED, () => {
      loadBalanceData(year, month);
    });
    const unsub2 = appEvents.subscribe(EVENT_BALANCE_CHANGED, () => {
      loadBalanceData(year, month);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [year, month, loadBalanceData]);

  const refresh = useCallback(() => {
    return loadBalanceData(year, month);
  }, [loadBalanceData, year, month]);

  return {
    summary,
    initialOpeningBalance,
    year,
    month,
    isLoading,
    error,
    changeMonth,
    setInitialBalance,
    setAvailableBalance,
    refresh,
  };
}
