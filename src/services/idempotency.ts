import axios from 'axios';
import { Platform } from 'react-native';
import { cacheStorage } from './cacheStorage';

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
export const DEFAULT_HTTP_TIMEOUT_MS = 15000;
export const COMPLETED_IDEMPOTENCY_TTL_MS = 1000 * 60 * 10; // 10 min

/**
 * Habilita reintentos automáticos en métodos no naturalmente idempotentes (POST)
 * solo cuando el backend valida activamente el header Idempotency-Key (RN-20).
 */
export const IS_BACKEND_IDEMPOTENCY_ENFORCED =
  process.env.EXPO_PUBLIC_BACKEND_IDEMPOTENT === 'true';

/**
 * Envío del header HTTP Idempotency-Key. En Web queda desactivado por defecto
 * mientras el CORS del backend solo permita "authorization, content-type"
 * (evita fallas de preflight OPTIONS); en nativo o con opt-in env se envía directo.
 */
export const IS_IDEMPOTENCY_HEADER_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_IDEMPOTENCY_HEADER === 'true';

export function shouldAttachIdempotencyHeader(): boolean {
  return Platform.OS !== 'web' || IS_IDEMPOTENCY_HEADER_ENABLED;
}

export type HttpMethodKind = 'GET' | 'PUT' | 'DELETE' | 'POST';

export type NetworkErrorKind =
  | 'offline'
  | 'timeout'
  | 'network'
  | 'conflict'
  | 'server'
  | 'validation'
  | 'auth'
  | 'unknown';

export interface ClassifiedApiError {
  kind: NetworkErrorKind;
  title: string;
  message: string;
  status?: number;
  retryable: boolean;
}

export class IdempotentNetworkError extends Error {
  readonly code: 'OFFLINE' | 'TIMEOUT';
  readonly retryable = true;

  constructor(code: 'OFFLINE' | 'TIMEOUT', message: string) {
    super(message);
    this.name = 'IdempotentNetworkError';
    this.code = code;
  }
}

const inFlightOperations = new Map<string, Promise<unknown>>();

/**
 * Genera una clave de idempotencia UUID v4 sin dependencias nativas obligatorias.
 */
export function generateIdempotencyKey(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Bits de versión (4) y variante RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableNormalize);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      const prop = record[key];
      if (prop !== undefined) {
        sorted[key] = stableNormalize(prop);
      }
    }
    return sorted;
  }
  return value;
}

/**
 * Serializa de forma determinística el intento del usuario para detectar cambios de datos
 * y regenerar la clave de idempotencia solo cuando la operación realmente cambia.
 */
export function buildIntentFingerprint(parts: unknown[]): string {
  return JSON.stringify(stableNormalize(parts));
}

export function isDeviceOffline(): boolean {
  if (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.onLine === 'boolean'
  ) {
    return !navigator.onLine;
  }
  return false;
}

function getHttpStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    return response?.status;
  }
  return undefined;
}

function getBackendErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as
    | { error?: string; message?: string }
    | string
    | undefined;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data === 'object') {
    return data.error || data.message || undefined;
  }
  return undefined;
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof IdempotentNetworkError && error.code === 'TIMEOUT') {
    return true;
  }
  if (!axios.isAxiosError(error)) return false;
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message.toLowerCase().includes('timeout')
  );
}

/**
 * Determina si un error es transitorio y seguro para reintentar automáticamente.
 * Nunca reintenta errores de negocio/cliente (400, 401, 403, 404, 409, 422).
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof IdempotentNetworkError) {
    return error.retryable && error.code !== 'OFFLINE';
  }
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (!status) {
    // Error de red puro o timeout (siempre que siga habiendo conectividad local)
    return !isDeviceOffline();
  }
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * Clasifica fallas de red, timeouts (RN-25 / CU-10), conflictos de idempotencia (RN-20)
 * y errores de validación del backend en mensajes claros para UI.
 */
export function classifyMutationError(
  error: unknown,
  fallbackMessage = 'No se pudo completar la operación. Intenta de nuevo.'
): ClassifiedApiError {
  if (
    (error instanceof IdempotentNetworkError && error.code === 'OFFLINE') ||
    (axios.isAxiosError(error) && !error.response && isDeviceOffline())
  ) {
    return {
      kind: 'offline',
      title: 'Sin conexión',
      message:
        'No hay conexión a internet. Tu formulario se mantiene intacto; verifica tu red y reintenta sin duplicar el registro.',
      retryable: true,
    };
  }

  if (isTimeoutError(error)) {
    return {
      kind: 'timeout',
      title: 'Servicio lento',
      message:
        'El servidor tardó demasiado en responder (Render puede estar iniciando). Reintenta con seguridad manteniendo la misma clave de operación.',
      retryable: true,
    };
  }

  const status = getHttpStatus(error);
  const backendMsg = getBackendErrorMessage(error);

  if (!status && axios.isAxiosError(error)) {
    return {
      kind: 'network',
      title: 'Error de conexión',
      message:
        'No se pudo contactar al servidor. Verifica tu conexión y vuelve a intentar.',
      retryable: true,
    };
  }

  if (status === 409) {
    return {
      kind: 'conflict',
      title: 'Operación ya procesada',
      message: backendMsg || 'Esta operación ya fue registrada anteriormente.',
      status,
      retryable: false,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: 'auth',
      title: 'Sesión requerida',
      message: backendMsg || 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
      status,
      retryable: false,
    };
  }

  if (status && status >= 400 && status < 500) {
    return {
      kind: 'validation',
      title: 'Datos inválidos',
      message: backendMsg || fallbackMessage,
      status,
      retryable: false,
    };
  }

  if (status && status >= 500) {
    return {
      kind: 'server',
      title: 'Servidor no disponible',
      message:
        backendMsg ||
        'El servidor tuvo un problema temporal. Reintenta en unos segundos.',
      status,
      retryable: true,
    };
  }

  return {
    kind: 'unknown',
    title: 'Error',
    message: backendMsg || fallbackMessage,
    status,
    retryable: false,
  };
}

function waitWithJitter(attempt: number, baseDelayMs: number): Promise<void> {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 180);
  return new Promise((resolve) => setTimeout(resolve, exponential + jitter));
}

export interface RunIdempotentOptions<T> {
  scope: string;
  operation: string;
  method: HttpMethodKind;
  idempotencyKey?: string;
  requireOnline?: boolean;
  cacheCompleted?: boolean;
  completedTtlMs?: number;
  maxAutoRetries?: number;
  baseDelayMs?: number;
  execute: (idempotencyKey: string, attempt: number) => Promise<T>;
}

/**
 * Ejecuta una operación con garantías frontend de idempotencia (RN-20 / CU-04 / CU-10):
 * 1. Reusa el resultado cacheado si la misma clave ya completó exitosamente en sesión.
 * 2. Coalesce peticiones concurrentes con la misma clave (bloqueo single-flight contra doble tap).
 * 3. Previene envíos sin conectividad real cuando requireOnline está activo (RN-25).
 * 4. Aplica reintentos automáticos con backoff solo cuando es seguro (PUT/DELETE/GET por defecto,
 *    y POST únicamente si el backend valida Idempotency-Key o se habilita explícitamente).
 */
export async function runIdempotentOperation<T>(
  options: RunIdempotentOptions<T>
): Promise<T> {
  const key = options.idempotencyKey || generateIdempotencyKey();
  const scopedFlightKey = `${options.scope}:${options.operation}:${key}`;
  const completedCacheKey = `idem:${scopedFlightKey}`;
  const shouldCacheCompleted = options.cacheCompleted ?? true;
  const ttlMs = options.completedTtlMs ?? COMPLETED_IDEMPOTENCY_TTL_MS;

  if (shouldCacheCompleted) {
    const completed = cacheStorage.get<T>(completedCacheKey, ttlMs);
    if (completed !== undefined) {
      return completed.data;
    }
  }

  const existingFlight = inFlightOperations.get(scopedFlightKey);
  if (existingFlight) {
    return existingFlight as Promise<T>;
  }

  if (options.requireOnline && isDeviceOffline()) {
    throw new IdempotentNetworkError(
      'OFFLINE',
      'Sin conexión a internet. Verifica tu red antes de reintentar.'
    );
  }

  const defaultMaxRetries =
    options.method === 'POST' ? (IS_BACKEND_IDEMPOTENCY_ENFORCED ? 1 : 0) : 2;
  const maxAutoRetries = options.maxAutoRetries ?? defaultMaxRetries;
  const baseDelayMs = options.baseDelayMs ?? 700;

  const flightPromise = (async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxAutoRetries; attempt++) {
      if (attempt > 0) {
        if (options.requireOnline && isDeviceOffline()) {
          throw new IdempotentNetworkError(
            'OFFLINE',
            'Se perdió la conexión durante el reintento.'
          );
        }
        await waitWithJitter(attempt - 1, baseDelayMs);
      }

      try {
        const result = await options.execute(key, attempt);
        if (shouldCacheCompleted) {
          cacheStorage.set(completedCacheKey, result);
        }
        return result;
      } catch (error) {
        lastError = error;
        const canRetry = attempt < maxAutoRetries && isTransientError(error);
        if (!canRetry) {
          throw error;
        }
      }
    }

    throw lastError;
  })();

  inFlightOperations.set(scopedFlightKey, flightPromise);

  try {
    return await flightPromise;
  } finally {
    inFlightOperations.delete(scopedFlightKey);
  }
}
