import axios from 'axios';
import { storage } from './storage';

/**
 * Cliente HTTP para Zentia API REST
 * Sigue las directrices de DocBackend.pdf (UAQ)
 * Inyecta automáticamente el token JWT en las cabeceras protegidas.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback opcional para sincronizar el cierre de sesión en AuthContext ante un 401
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

// Interceptor para inyectar automáticamente el Bearer JWT Token
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
