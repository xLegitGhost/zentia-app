import { QueryClient, QueryKey } from '@tanstack/react-query';
import { cacheStorage } from '@/services/cacheStorage';
import { NormalizedDashboardSummary, TransactionResponse } from '@/types/api';

export const DASHBOARD_CACHE_TTL_MS = 1000 * 60 * 10; // 10 min snapshot
export const DEMO_MASTER_CACHE_KEY = 'demo_master_transactions';

export function isIncomeType(type?: string): boolean {
  return type === 'INGRESO' || type === 'INCOME';
}

export function getTransactionDate(tx: Partial<TransactionResponse>): string {
  return tx.date ?? tx.transactionDate ?? '';
}

export function isDateInRange(dateStr: string, startDate: string, endDate: string): boolean {
  if (!dateStr) return true;
  return dateStr >= startDate && dateStr <= endDate;
}

export function computeSummaryFromTransactions(
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

export function getDashboardSnapshotKey(scope: string, startDate: string, endDate: string): string {
  return `dashboard:${scope}:${startDate}:${endDate}`;
}

export function getTransactionsSnapshotKey(scope: string, startDate: string, endDate: string): string {
  return `transactions:${scope}:${startDate}:${endDate}`;
}

export interface TransactionCacheSnapshot {
  transactionsQueries: [QueryKey, TransactionResponse[] | undefined][];
  dashboardQueries: [QueryKey, NormalizedDashboardSummary | undefined][];
  demoMaster?: TransactionResponse[];
}

export function captureTransactionSnapshot(
  queryClient: QueryClient,
  scope: string
): TransactionCacheSnapshot {
  const demoEntry =
    scope === 'demo'
      ? cacheStorage.get<TransactionResponse[]>(DEMO_MASTER_CACHE_KEY, DASHBOARD_CACHE_TTL_MS)
      : undefined;

  return {
    transactionsQueries: queryClient.getQueriesData<TransactionResponse[]>({
      queryKey: ['transactions'],
    }),
    dashboardQueries: queryClient.getQueriesData<NormalizedDashboardSummary>({
      queryKey: ['dashboard'],
    }),
    demoMaster: demoEntry?.data,
  };
}

export function restoreTransactionSnapshot(
  queryClient: QueryClient,
  scope: string,
  snapshot?: TransactionCacheSnapshot
): void {
  if (!snapshot) return;

  for (const [key, data] of snapshot.transactionsQueries) {
    queryClient.setQueryData(key, data);
    if (Array.isArray(key) && key.length === 4 && data) {
      const [, startDate, endDate, keyScope] = key as [string, string, string, string];
      cacheStorage.set(getTransactionsSnapshotKey(keyScope, startDate, endDate), data);
    }
  }

  for (const [key, data] of snapshot.dashboardQueries) {
    queryClient.setQueryData(key, data);
    if (Array.isArray(key) && key.length === 4 && data) {
      const [, startDate, endDate, keyScope] = key as [string, string, string, string];
      cacheStorage.set(getDashboardSnapshotKey(keyScope, startDate, endDate), data);
    }
  }

  if (scope === 'demo' && snapshot.demoMaster) {
    cacheStorage.set(DEMO_MASTER_CACHE_KEY, snapshot.demoMaster);
  }
}

/**
 * Sincroniza atómicamente las cachés de historial y resumen del dashboard ante altas,
 * ediciones o eliminaciones para evitar incongruencia visual mientras el servidor revalida.
 */
export function syncMutationAcrossPeriodCaches(
  queryClient: QueryClient,
  scope: string,
  updater: (list: TransactionResponse[], startDate: string, endDate: string) => TransactionResponse[]
): void {
  const isDemoData = scope === 'demo';
  const queries = queryClient.getQueriesData<TransactionResponse[]>({
    queryKey: ['transactions'],
  });

  for (const [key, oldList] of queries) {
    if (!Array.isArray(key) || key.length !== 4) continue;
    const [, startDate, endDate, keyScope] = key as [string, string, string, string];
    if (keyScope !== scope) continue;

    const nextList = updater(oldList ?? [], startDate, endDate);
    queryClient.setQueryData<TransactionResponse[]>(key, nextList);
    cacheStorage.set(getTransactionsSnapshotKey(scope, startDate, endDate), nextList);

    const nextSummary = computeSummaryFromTransactions(nextList, isDemoData);
    queryClient.setQueryData<NormalizedDashboardSummary>(
      ['dashboard', startDate, endDate, scope],
      nextSummary
    );
    cacheStorage.set(getDashboardSnapshotKey(scope, startDate, endDate), nextSummary);
  }

  if (isDemoData) {
    const existingDemo =
      cacheStorage.get<TransactionResponse[]>(DEMO_MASTER_CACHE_KEY, DASHBOARD_CACHE_TTL_MS)?.data ??
      [];
    const nextDemo = updater(existingDemo, '0000-01-01', '9999-12-31');
    cacheStorage.set(DEMO_MASTER_CACHE_KEY, nextDemo);
  }
}
