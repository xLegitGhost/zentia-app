import axios from 'axios';
import { storage } from './storage';
import {
  DEFAULT_HTTP_TIMEOUT_MS,
  IDEMPOTENCY_HEADER,
  shouldAttachIdempotencyHeader,
} from './idempotency';

declare module 'axios' {
  export interface AxiosRequestConfig {
    idempotencyKey?: string;
  }

  export interface InternalAxiosRequestConfig {
    idempotencyKey?: string;
  }
}

/**
 * Cliente HTTP para Zentia API REST
 * Sigue las directrices de DocBackend.pdf (UAQ)
 * Inyecta automáticamente el token JWT, timeout configurado y cabecera opcional Idempotency-Key.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const configuredTimeout = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);
export const API_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_HTTP_TIMEOUT_MS;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback opcional para sincronizar el cierre de sesión en AuthContext ante un 401
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

// Interceptor para inyectar Bearer JWT Token y, cuando CORS lo permita, Idempotency-Key
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.idempotencyKey && shouldAttachIdempotencyHeader()) {
    config.headers[IDEMPOTENCY_HEADER] = config.idempotencyKey;
  }
  return config;
});

// Interceptor para atrapar 401 Unauthorized y limpiar sesión si expira
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await storage.clearSession();
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
