import { getRawDb } from '@/db/client';
import { appEvents, EVENT_BALANCE_CHANGED } from '@/services/event-bus';
import type { DateQuickFilter, MonthlyFinancialSummary } from '@/types/database';

export const BalanceService = {
  /**
   * Reads the configured initial opening balance from app_metadata.
   * Default is 0 paise.
   */
  async getInitialOpeningBalance(): Promise<number> {
    const rawDb = getRawDb();
    const row = await rawDb.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_metadata WHERE key = 'initial_opening_balance';`
    );
    if (!row || !row.value) return 0;
    const parsed = parseInt(row.value, 10);
    return isNaN(parsed) ? 0 : parsed;
  },

  /**
   * Sets the initial opening balance in app_metadata.
   * @param amountPaise integer paise
   */
  async setInitialOpeningBalance(amountPaise: number): Promise<void> {
    const rawDb = getRawDb();
    await rawDb.runAsync(
      `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('initial_opening_balance', ?);`,
      [Math.round(amountPaise).toString()]
    );
    appEvents.emit(EVENT_BALANCE_CHANGED);
  },

  /**
   * Calculates the financial breakdown for a specific month (YYYY-MM).
   *
   * Logic:
   * 1. Prior Net Balance = Initial Opening Balance + (All Income before month - All Expense before month)
   * 2. Opening Balance for Month = Prior Net Balance
   * 3. Monthly Income = All Income within Month
   * 4. Monthly Expenses = All Expense within Month
   * 5. Available Balance = Opening Balance + Monthly Income - Monthly Expenses
   *
   * Closing balance of month M-1 automatically becomes the opening balance of month M.
   */
  async getMonthlyFinancialSummary(year: number, month: number): Promise<MonthlyFinancialSummary> {
    const rawDb = getRawDb();
    const initialOpeningPaise = await this.getInitialOpeningBalance();

    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const startOfMonth = `${year}-${monthStr}-01`;

    // Last day of month
    const lastDayNumber = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${monthStr}-${lastDayNumber < 10 ? `0${lastDayNumber}` : lastDayNumber}`;

    // 1. Calculate prior net balance (all transactions before startOfMonth)
    const priorTotals = await rawDb.getFirstAsync<{
      priorIncome: number | null;
      priorExpense: number | null;
    }>(
      `SELECT
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as priorIncome,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as priorExpense
       FROM transactions
       WHERE date < ?;`,
      [startOfMonth]
    );

    const priorIncome = priorTotals?.priorIncome ?? 0;
    const priorExpense = priorTotals?.priorExpense ?? 0;
    const openingBalancePaise = initialOpeningPaise + (priorIncome - priorExpense);

    // 2. Calculate current month totals
    const currentMonthTotals = await rawDb.getFirstAsync<{
      monthlyIncome: number | null;
      monthlyExpense: number | null;
      txnCount: number | null;
    }>(
      `SELECT
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthlyIncome,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthlyExpense,
         COUNT(*) as txnCount
       FROM transactions
       WHERE date >= ? AND date <= ?;`,
      [startOfMonth, endOfMonth]
    );

    const monthlyIncomePaise = currentMonthTotals?.monthlyIncome ?? 0;
    const monthlyExpensePaise = currentMonthTotals?.monthlyExpense ?? 0;
    const transactionCount = currentMonthTotals?.txnCount ?? 0;

    const availableBalancePaise =
      openingBalancePaise + monthlyIncomePaise - monthlyExpensePaise;

    const dateObj = new Date(year, month - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });

    return {
      month: `${year}-${monthStr}`,
      monthLabel,
      openingBalancePaise,
      monthlyIncomePaise,
      monthlyExpensePaise,
      availableBalancePaise,
      transactionCount,
    };
  },

  /**
   * Helper to compute start and end dates for quick filters.
   */
  getDateRangeForFilter(
    filter: DateQuickFilter,
    customStart?: string,
    customEnd?: string
  ): { startDate?: string; endDate?: string; label: string } {
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];

    switch (filter) {
      case 'today': {
        const d = formatYMD(today);
        return { startDate: d, endDate: d, label: 'Today' };
      }
      case 'yesterday': {
        const y = new Date();
        y.setDate(today.getDate() - 1);
        const d = formatYMD(y);
        return { startDate: d, endDate: d, label: 'Yesterday' };
      }
      case 'this_week': {
        const current = new Date();
        const firstDayOfWeek = new Date(current);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
        firstDayOfWeek.setDate(diff);
        return {
          startDate: formatYMD(firstDayOfWeek),
          endDate: formatYMD(current),
          label: 'This Week',
        };
      }
      case 'this_month': {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          startDate: formatYMD(first),
          endDate: formatYMD(last),
          label: 'This Month',
        };
      }
      case 'last_month': {
        const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const last = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          startDate: formatYMD(first),
          endDate: formatYMD(last),
          label: 'Last Month',
        };
      }
      case 'custom': {
        return {
          startDate: customStart,
          endDate: customEnd,
          label:
            customStart && customEnd
              ? `${customStart} to ${customEnd}`
              : 'Custom Range',
        };
      }
      case 'all':
      default:
        return { label: 'All Transactions' };
    }
  },

  /**
   * Formats a date string (YYYY-MM-DD) into grouped section headers:
   * e.g. "Today – November 10", "Yesterday – November 9", "Sunday – November 8"
   */
  formatGroupDateHeader(dateStr: string): string {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const targetDate = new Date(dateStr);
    const dayMonth = targetDate.toLocaleDateString('en-IN', {
      month: 'long',
      day: 'numeric',
    });

    if (dateStr === today) {
      return `Today – ${dayMonth}`;
    }
    if (dateStr === yesterday) {
      return `Yesterday – ${dayMonth}`;
    }

    const weekday = targetDate.toLocaleDateString('en-IN', { weekday: 'long' });
    return `${weekday} – ${dayMonth}`;
  },
};

