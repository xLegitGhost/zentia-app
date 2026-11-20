import { useQuery } from '@tanstack/react-query';
import {
  ExchangeRatesData,
  FX_CACHE_TTL_MS,
  FX_STALE_FALLBACK_MAX_AGE_MS,
  fetchMxnExchangeRates,
  getCachedMxnExchangeRates,
  isTransientFxError,
} from '@/services/exchangeRates';

export const EXCHANGE_RATES_QUERY_KEY = ['exchangeRates', 'MXN'] as const;

export function useExchangeRates() {
  const freshCache = getCachedMxnExchangeRates(FX_CACHE_TTL_MS);
  const staleCache = freshCache ?? getCachedMxnExchangeRates(FX_STALE_FALLBACK_MAX_AGE_MS);

  const query = useQuery<ExchangeRatesData>({
    queryKey: EXCHANGE_RATES_QUERY_KEY,
    initialData: freshCache?.data,
    initialDataUpdatedAt: freshCache?.cachedAt,
    staleTime: FX_CACHE_TTL_MS,
    gcTime: 1000 * 60 * 60 * 24,
    retry: (failureCount, error) => failureCount < 2 && isTransientFxError(error),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
    queryFn: () => fetchMxnExchangeRates({ allowStaleFallback: false }),
  });

  const resolvedData = query.data ?? (query.isError ? staleCache?.data : undefined);
  const isUsingCacheFallback = Boolean(
    resolvedData && (resolvedData.isCachedFallback || query.isError)
  );

  return {
    data: resolvedData,
    rates: resolvedData?.rates,
    updatedAtUtc: resolvedData?.updatedAtUtc ?? null,
    isLoading: query.isLoading && !resolvedData,
    isFetching: query.isFetching,
    isError: query.isError && !resolvedData,
    hasNetworkError: query.isError,
    isUsingCacheFallback,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useExchangeRates;
