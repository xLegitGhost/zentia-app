import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { buildAuthCacheScope, cacheStorage } from '@/services/cacheStorage';
import {
  computeSummaryFromTransactions,
  DASHBOARD_CACHE_TTL_MS,
  DEMO_MASTER_CACHE_KEY,
  getDashboardSnapshotKey,
  getTransactionDate,
  getTransactionsSnapshotKey,
  isDateInRange,
} from '@/services/transactionCache';
import {
  DashboardSummaryResponse,
  NormalizedDashboardSummary,
  TransactionResponse,
} from '@/types/api';

export type { NormalizedDashboardSummary };
export type PeriodKey = 'current_month' | 'previous_month' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPeriodDateRange(period: PeriodKey, customRange?: DateRange): DateRange {
  const now = new Date();

  if (period === 'previous_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }

  if (period === 'custom' && customRange?.startDate && customRange?.endDate) {
    return customRange;
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export function useDashboardSummary(startDate: string, endDate: string) {
  const { isAuthenticated, user } = useAuth();
  const cacheScope = buildAuthCacheScope(isAuthenticated, user?.id);

  const summarySnapKey = getDashboardSnapshotKey(cacheScope, startDate, endDate);
  const historySnapKey = getTransactionsSnapshotKey(cacheScope, startDate, endDate);

  const cachedSummary = cacheStorage.get<NormalizedDashboardSummary>(
    summarySnapKey,
    DASHBOARD_CACHE_TTL_MS
  );
  const cachedHistory = cacheStorage.get<TransactionResponse[]>(
    historySnapKey,
    DASHBOARD_CACHE_TTL_MS
  );

  const summaryQuery = useQuery({
    queryKey: ['dashboard', startDate, endDate, cacheScope],
    initialData: cachedSummary?.data,
    initialDataUpdatedAt: cachedSummary?.cachedAt,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<NormalizedDashboardSummary> => {
      if (isAuthenticated) {
        const response = await api.get<DashboardSummaryResponse>('/transactions/dashboard', {
          params: { startDate, endDate },
        });
        const data = response.data;
        const normalized: NormalizedDashboardSummary = {
          totalIngresos: Number(data.totalIngresos ?? data.totalIncome ?? 0),
          totalGastos: Number(data.totalGastos ?? data.totalExpense ?? 0),
          balanceActual: Number(data.balanceActual ?? data.balance ?? 0),
          isDemoData: false,
        };
        cacheStorage.set(summarySnapKey, normalized);
        return normalized;
      }

      const demoMaster =
        cacheStorage.get<TransactionResponse[]>(DEMO_MASTER_CACHE_KEY, DASHBOARD_CACHE_TTL_MS)
          ?.data ?? [];
      const filtered = demoMaster.filter((tx) =>
        isDateInRange(getTransactionDate(tx), startDate, endDate)
      );
      const summary = computeSummaryFromTransactions(filtered, true);
      cacheStorage.set(summarySnapKey, summary);
      return summary;
    },
  });

  const historyQuery = useQuery({
    queryKey: ['transactions', startDate, endDate, cacheScope],
    initialData: cachedHistory?.data,
    initialDataUpdatedAt: cachedHistory?.cachedAt,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<TransactionResponse[]> => {
      if (isAuthenticated) {
        const response = await api.get<TransactionResponse[]>('/transactions/historial', {
          params: { startDate, endDate },
        });
        const items = response.data ?? [];
        cacheStorage.set(historySnapKey, items);
        return items;
      }

      const demoMaster =
        cacheStorage.get<TransactionResponse[]>(DEMO_MASTER_CACHE_KEY, DASHBOARD_CACHE_TTL_MS)
          ?.data ?? [];
      const filtered = demoMaster.filter((tx) =>
        isDateInRange(getTransactionDate(tx), startDate, endDate)
      );
      cacheStorage.set(historySnapKey, filtered);
      return filtered;
    },
  });

  const summary: NormalizedDashboardSummary = summaryQuery.data ?? {
    totalIngresos: 0,
    totalGastos: 0,
    balanceActual: 0,
    isDemoData: !isAuthenticated,
  };

  return {
    summary,
    transactions: historyQuery.data ?? [],
    isLoading: summaryQuery.isLoading || historyQuery.isLoading,
    isFetching: summaryQuery.isFetching || historyQuery.isFetching,
    hasSummaryData: summaryQuery.data !== undefined,
    hasHistoryData: historyQuery.data !== undefined,
    error: summaryQuery.error || historyQuery.error,
    refetch: async () => {
      await Promise.all([summaryQuery.refetch(), historyQuery.refetch()]);
    },
  };
}

export default useDashboardSummary;
