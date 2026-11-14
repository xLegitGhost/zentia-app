import { Platform } from 'react-native';

const CACHE_PREFIX = 'zentia_cache_v1:';
const PUBLIC_CACHE_KEYS = new Set(['categories']);

interface CacheEnvelope<T> {
  data: T;
  cachedAt: number;
}

const memoryFallback = new Map<string, CacheEnvelope<unknown>>();

function canUseLocalStorage(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  );
}

/**
 * Almacenamiento de caché síncrono con TTL para hidratación instantánea (SWR)
 * en Web (localStorage) y respaldo en memoria para nativo, evitando límites de 2KB de SecureStore.
 */
export const cacheStorage = {
  get<T>(key: string, maxAgeMs: number): { data: T; cachedAt: number } | undefined {
    const fullKey = `${CACHE_PREFIX}${key}`;
    let envelope: CacheEnvelope<T> | undefined;

    const inMem = memoryFallback.get(fullKey) as CacheEnvelope<T> | undefined;
    if (inMem) {
      envelope = inMem;
    } else if (canUseLocalStorage()) {
      try {
        const raw = window.localStorage.getItem(fullKey);
        if (raw) {
          envelope = JSON.parse(raw) as CacheEnvelope<T>;
          memoryFallback.set(fullKey, envelope);
        }
      } catch {
        return undefined;
      }
    }

    if (!envelope || typeof envelope.cachedAt !== 'number') {
      return undefined;
    }

    if (Date.now() - envelope.cachedAt > maxAgeMs) {
      return undefined;
    }

    return envelope;
  },

  set<T>(key: string, data: T): number {
    const fullKey = `${CACHE_PREFIX}${key}`;
    const envelope: CacheEnvelope<T> = {
      data,
      cachedAt: Date.now(),
    };
    memoryFallback.set(fullKey, envelope);

    if (canUseLocalStorage()) {
      try {
        window.localStorage.setItem(fullKey, JSON.stringify(envelope));
      } catch {
        // Ignorar cuota llena en modo privado
      }
    }

    return envelope.cachedAt;
  },

  remove(key: string): void {
    const fullKey = `${CACHE_PREFIX}${key}`;
    memoryFallback.delete(fullKey);
    if (canUseLocalStorage()) {
      try {
        window.localStorage.removeItem(fullKey);
      } catch {}
    }
  },

  /**
   * Limpia todas las cachés asociadas a datos privados de usuario al cerrar sesión o ante 401.
   */
  clearUserCaches(): void {
    for (const fullKey of Array.from(memoryFallback.keys())) {
      const shortKey = fullKey.slice(CACHE_PREFIX.length);
      if (!PUBLIC_CACHE_KEYS.has(shortKey)) {
        memoryFallback.delete(fullKey);
      }
    }

    if (canUseLocalStorage()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX)) {
            const shortKey = key.slice(CACHE_PREFIX.length);
            if (!PUBLIC_CACHE_KEYS.has(shortKey)) {
              keysToRemove.push(key);
            }
          }
        }
        for (const key of keysToRemove) {
          window.localStorage.removeItem(key);
        }
      } catch {}
    }
  },
};

export function buildAuthCacheScope(isAuthenticated: boolean, userId?: number | null): string {
  if (!isAuthenticated) return 'demo';
  return userId && userId > 0 ? `user_${userId}` : 'user_auth';
}

export default cacheStorage;
