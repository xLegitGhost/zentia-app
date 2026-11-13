import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardSummaryResponse, TransactionResponse } from '@/types/api';

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

export interface NormalizedDashboardSummary {
  totalIngresos: number;
  totalGastos: number;
  balanceActual: number;
  isDemoData: boolean;
}

function isIncomeType(type?: string): boolean {
  return type === 'INGRESO' || type === 'INCOME';
}

function computeSummaryFromTransactions(
  transactions: TransactionResponse[],
  isDemoData: boolean
): NormalizedDashboardSummary {
  let totalIngresos = 0;
  let totalGastos = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    if (isIncomeType(tx.type)) {
      totalIngresos += amount;
    } else {
      totalGastos += amount;
    }
  }

  return {
    totalIngresos,
    totalGastos,
    balanceActual: totalIngresos - totalGastos,
    isDemoData,
  };
}

export function useDashboardSummary(startDate: string, endDate: string) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['dashboard', startDate, endDate, isAuthenticated],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<NormalizedDashboardSummary> => {
      if (isAuthenticated) {
        const response = await api.get<DashboardSummaryResponse>('/transactions/dashboard', {
          params: { startDate, endDate },
        });
        const data = response.data;
        return {
          totalIngresos: Number(data.totalIngresos ?? data.totalIncome ?? 0),
          totalGastos: Number(data.totalGastos ?? data.totalExpense ?? 0),
          balanceActual: Number(data.balanceActual ?? data.balance ?? 0),
          isDemoData: false,
        };
      }

      const cached = queryClient.getQueryData<TransactionResponse[]>(['transactions']) ?? [];
      const filtered = cached.filter((tx) => {
        const txDate = tx.date ?? tx.transactionDate ?? '';
        return !txDate || (txDate >= startDate && txDate <= endDate);
      });
      return computeSummaryFromTransactions(filtered, true);
    },
  });

  const historyQuery = useQuery({
    queryKey: ['transactions', startDate, endDate, isAuthenticated],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<TransactionResponse[]> => {
      if (isAuthenticated) {
        const response = await api.get<TransactionResponse[]>('/transactions/historial', {
          params: { startDate, endDate },
        });
        return response.data ?? [];
      }

      const cached = queryClient.getQueryData<TransactionResponse[]>(['transactions']) ?? [];
      return cached.filter((tx) => {
        const txDate = tx.date ?? tx.transactionDate ?? '';
        return !txDate || (txDate >= startDate && txDate <= endDate);
      });
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
    error: summaryQuery.error || historyQuery.error,
    refetch: async () => {
      await Promise.all([summaryQuery.refetch(), historyQuery.refetch()]);
    },
  };
}

export default useDashboardSummary;
