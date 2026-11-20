import { cacheStorage } from './cacheStorage';

export const FX_API_URL = 'https://open.er-api.com/v6/latest/MXN';
export const FX_CACHE_KEY = 'fx_rates_mxn';
export const FX_CACHE_TTL_MS = 1000 * 60 * 60; // 60 minutes
export const FX_STALE_FALLBACK_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days offline fallback
export const FX_TIMEOUT_MS = 8000;

export const SUPPORTED_TARGET_CURRENCIES = ['USD', 'EUR', 'CAD'] as const;
export type SupportedTargetCurrency = (typeof SUPPORTED_TARGET_CURRENCIES)[number];

export interface ExchangeRatesData {
  baseCode: 'MXN';
  updatedAtUtc: string | null;
  nextUpdateUtc: string | null;
  rates: Record<string, number>;
  fetchedAt: number;
  isCachedFallback?: boolean;
}

export class ExchangeRateError extends Error {
  readonly retryable: boolean;
  readonly status?: number;

  constructor(message: string, options: { retryable: boolean; status?: number }) {
    super(message);
    this.name = 'ExchangeRateError';
    this.retryable = options.retryable;
    this.status = options.status;
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Validates and normalizes the JSON response from open.er-api.com/v6/latest/MXN.
 */
export function parseExchangeRatesResponse(payload: unknown): ExchangeRatesData {
  if (!isPlainRecord(payload)) {
    throw new ExchangeRateError('Invalid exchange rates payload.', { retryable: false });
  }

  if (payload.result !== 'success') {
    throw new ExchangeRateError('Exchange rates provider returned an error result.', {
      retryable: false,
    });
  }

  if (payload.base_code !== 'MXN') {
    throw new ExchangeRateError('Unexpected base currency in exchange rates payload.', {
      retryable: false,
    });
  }

  if (!isPlainRecord(payload.rates)) {
    throw new ExchangeRateError('Missing rates map in exchange rates payload.', {
      retryable: false,
    });
  }

  const normalizedRates: Record<string, number> = {};
  for (const [rawCode, rawValue] of Object.entries(payload.rates)) {
    const code = rawCode.trim().toUpperCase();
    if (
      code.length > 0 &&
      typeof rawValue === 'number' &&
      Number.isFinite(rawValue) &&
      rawValue > 0
    ) {
      normalizedRates[code] = rawValue;
    }
  }

  const hasCoreCurrency = SUPPORTED_TARGET_CURRENCIES.some(
    (code) => typeof normalizedRates[code] === 'number'
  );
  if (!hasCoreCurrency) {
    throw new ExchangeRateError('Missing core MXN conversion rates (USD/EUR/CAD).', {
      retryable: false,
    });
  }

  const updatedAtUtc =
    typeof payload.time_last_update_utc === 'string' && payload.time_last_update_utc.trim()
      ? payload.time_last_update_utc.trim()
      : null;

  const nextUpdateUtc =
    typeof payload.time_next_update_utc === 'string' && payload.time_next_update_utc.trim()
      ? payload.time_next_update_utc.trim()
      : null;

  return {
    baseCode: 'MXN',
    updatedAtUtc,
    nextUpdateUtc,
    rates: normalizedRates,
    fetchedAt: Date.now(),
  };
}

/**
 * Converts an MXN amount into a target currency using the MXN -> target rate.
 */
export function convertFromMxn(
  amountMxn: number,
  targetRate: number | undefined | null
): number | null {
  if (
    typeof amountMxn !== 'number' ||
    !Number.isFinite(amountMxn) ||
    typeof targetRate !== 'number' ||
    !Number.isFinite(targetRate) ||
    targetRate <= 0
  ) {
    return null;
  }

  const converted = amountMxn * targetRate;
  if (!Number.isFinite(converted)) {
    return null;
  }
  return converted === 0 ? 0 : converted;
}

/**
 * Computes how many MXN equal 1 unit of the foreign currency (1 / rateFromMxn).
 */
export function getInverseMxnRate(rateFromMxn: number | undefined | null): number | null {
  if (
    typeof rateFromMxn !== 'number' ||
    !Number.isFinite(rateFromMxn) ||
    rateFromMxn <= 0
  ) {
    return null;
  }
  const inverse = 1 / rateFromMxn;
  return Number.isFinite(inverse) ? inverse : null;
}

/**
 * Formats the inverse reference rate as "1 USD = $XX.XX MXN".
 */
export function formatInverseMxnRate(
  currencyCode: string,
  rateFromMxn: number | undefined | null
): string {
  const code = currencyCode.trim().toUpperCase();
  const inverse = getInverseMxnRate(rateFromMxn);
  if (inverse === null) {
    return `1 ${code} = -- MXN`;
  }
  const formatted = inverse.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `1 ${code} = $${formatted} MXN`;
}

const CURRENCY_PREFIXES: Record<string, string> = {
  USD: '$',
  EUR: '€',
  CAD: 'CA$',
  GBP: '£',
};

/**
 * Formats a converted foreign currency amount with consistent symbol and ISO code.
 */
export function formatForeignCurrency(amount: number, currencyCode: string): string {
  const code = currencyCode.trim().toUpperCase();
  const safeValue = Number.isFinite(amount) ? amount : 0;
  const absFormatted = Math.abs(safeValue).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = CURRENCY_PREFIXES[code] ?? `${code} `;
  const sign = safeValue < 0 ? '-' : '';
  return `${sign}${prefix}${absFormatted} ${code}`;
}

export function getCachedMxnExchangeRates(
  maxAgeMs = FX_CACHE_TTL_MS
): { data: ExchangeRatesData; cachedAt: number } | undefined {
  return cacheStorage.get<ExchangeRatesData>(FX_CACHE_KEY, maxAgeMs);
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function isTransientFxError(error: unknown): boolean {
  if (isBrowserOffline()) {
    return false;
  }
  if (error instanceof ExchangeRateError) {
    return error.retryable;
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError') return true;
    if (error instanceof TypeError) return true;
  }
  return false;
}

export interface FetchMxnExchangeRatesOptions {
  allowStaleFallback?: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Fetches live MXN exchange rates from ExchangeRate-API Open Access via unauthenticated global fetch.
 * Never uses the Zentia Axios instance so Authorization JWT headers are never sent to third-party origins.
 */
export async function fetchMxnExchangeRates(
  options: FetchMxnExchangeRatesOptions = {}
): Promise<ExchangeRatesData> {
  const allowStaleFallback = options.allowStaleFallback ?? true;
  const timeoutMs = options.timeoutMs ?? FX_TIMEOUT_MS;
  const fetchFn = options.fetchImpl ?? globalThis.fetch;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timerId =
    controller && typeof setTimeout !== 'undefined'
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

  try {
    if (typeof fetchFn !== 'function') {
      throw new ExchangeRateError('Global fetch API is unavailable.', { retryable: false });
    }

    const response = await fetchFn(FX_API_URL, {
      method: 'GET',
      signal: controller?.signal,
    });

    if (!response.ok) {
      const retryable =
        response.status === 408 || response.status === 429 || response.status >= 500;
      throw new ExchangeRateError(`Exchange rates HTTP ${response.status}`, {
        retryable,
        status: response.status,
      });
    }

    const json: unknown = await response.json();
    const parsed = parseExchangeRatesResponse(json);
    cacheStorage.set(FX_CACHE_KEY, parsed);
    return {
      ...parsed,
      isCachedFallback: false,
    };
  } catch (error) {
    if (allowStaleFallback) {
      const stale = getCachedMxnExchangeRates(FX_STALE_FALLBACK_MAX_AGE_MS);
      if (stale) {
        return {
          ...stale.data,
          isCachedFallback: true,
        };
      }
    }

    if (error instanceof ExchangeRateError) {
      throw error;
    }

    const isTimeoutOrNetwork =
      error instanceof Error && (error.name === 'AbortError' || error instanceof TypeError);
    throw new ExchangeRateError(
      error instanceof Error ? error.message : 'Unable to fetch exchange rates.',
      { retryable: isTimeoutOrNetwork && !isBrowserOffline() }
    );
  } finally {
    if (timerId !== undefined && typeof clearTimeout !== 'undefined') {
      clearTimeout(timerId);
    }
  }
}
