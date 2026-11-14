import axios from 'axios';
import { Linking, Platform } from 'react-native';

const PROD_DEFAULT_API_URL = 'https://zentia-backend-5l77.onrender.com/api/v1';
const DEV_DEFAULT_API_URL = 'http://localhost:8080/api/v1';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);

/**
 * Normaliza la URL base de la API garantizando HTTPS para cualquier host remoto.
 * Solo permite HTTP plano en hosts locales de desarrollo.
 */
export function sanitizeApiBaseUrl(rawUrl: string | undefined, isDev: boolean): string {
  const candidate = (rawUrl || '').trim();
  const fallback = isDev ? DEV_DEFAULT_API_URL : PROD_DEFAULT_API_URL;
  if (!candidate) return fallback;

  try {
    const parsed = new URL(candidate);
    const isLoopback = LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase());
    if (parsed.protocol === 'http:' && !isLoopback) {
      parsed.protocol = 'https:';
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return fallback;
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

function decodeBase64Url(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);

    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded);
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let out = '';
    for (let i = 0; i < padded.length; i += 4) {
      const a = chars.indexOf(padded[i]);
      const b = chars.indexOf(padded[i + 1]);
      const c = padded[i + 2] === '=' ? -1 : chars.indexOf(padded[i + 2]);
      const d = padded[i + 3] === '=' ? -1 : chars.indexOf(padded[i + 3]);
      if (a < 0 || b < 0) return null;
      const n = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
      out += String.fromCharCode((n >> 16) & 255);
      if (c >= 0) out += String.fromCharCode((n >> 8) & 255);
      if (d >= 0) out += String.fromCharCode(n & 255);
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Higiene local únicamente: verifica el claim `exp` del payload JWT para purgar sesiones
 * expiradas sin esperar un 401 del servidor. Nunca valida firma ni otorga autorización.
 */
export function isJwtExpiredClientSide(token: string, nowMs = Date.now()): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return false;

  try {
    const payload = JSON.parse(decoded) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return false;
    }
    return payload.exp * 1000 <= nowMs;
  } catch {
    return false;
  }
}

/**
 * Valida esquema permitido (solo HTTPS, o HTTP en loopback) antes de abrir URLs externas.
 */
export function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:' && LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase())) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function openSafeExternalUrl(rawUrl: string): Promise<boolean> {
  if (!isSafeExternalUrl(rawUrl)) return false;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(rawUrl, '_blank', 'noopener,noreferrer');
    return true;
  }
  await Linking.openURL(rawUrl);
  return true;
}

/**
 * Evita volcar en consola objetos Axios completos (pueden incluir headers Authorization).
 */
export function logSafeWarning(context: string, error?: unknown): void {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (!isDev) return;

  if (axios.isAxiosError(error)) {
    console.warn(`${context} [HTTP ${error.response?.status ?? 'NETWORK'}]: ${error.message}`);
    return;
  }
  if (error instanceof Error) {
    console.warn(`${context}: ${error.message}`);
    return;
  }
  console.warn(context);
}
