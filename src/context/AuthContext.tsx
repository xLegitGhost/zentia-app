import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api, setUnauthorizedHandler } from '@/services/api';
import { storage } from '@/services/storage';
import { financialProfileRepository } from '@/infrastructure/adapters/InMemoryFinancialProfileAdapter';
import { AuthResponse, GoogleAuthRequest, UserResponse } from '@/types/api';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (payload: GoogleAuthRequest) => Promise<AuthResponse>;
  requestOtp: (phoneNumber: string) => Promise<{ message: string }>;
  verifyOtp: (
    phoneNumber: string,
    codigo: string
  ) => Promise<{ token: string; message: string; onboardingCompleted?: boolean }>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isValidStoredUser(value: unknown): value is UserResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.onboardingCompleted === 'boolean' || typeof candidate.email === 'string';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    await storage.clearSession();
    await financialProfileRepository.clearProfile();
    queryClient.clear();
    setToken(null);
    setUser(null);
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await financialProfileRepository.clearProfile();
      queryClient.clear();
      setToken(null);
      setUser(null);
      router.replace('/(auth)/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, router]);

  // Sincroniza onboardingCompleted y valida el JWT contra el backend
  const syncSessionWithBackend = useCallback(async (baseUser: UserResponse | null): Promise<UserResponse | null> => {
    try {
      const response = await api.get<{
        userId?: number;
        onboardingCompleted?: boolean;
      }>('/users/financial-profile', { timeout: 5000 });

      const remoteCompleted = response.data?.onboardingCompleted;
      if (typeof remoteCompleted === 'boolean') {
        const merged: UserResponse = {
          ...(baseUser ?? { id: response.data?.userId ?? 0, email: '', onboardingCompleted: false }),
          id: baseUser?.id || response.data?.userId || 0,
          onboardingCompleted: remoteCompleted,
        };
        setUser(merged);
        await storage.setUserData(merged);
        return merged;
      }
      return baseUser;
    } catch {
      // Si es 401 el interceptor ya limpia la sesión; si es 404/red conservamos el estado local válido
      return baseUser;
    }
  }, []);

  // Inicializar sesión desde el almacenamiento seguro
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await storage.getToken();
        const rawStoredUser = await storage.getUserData<unknown>();
        const storedUser = isValidStoredUser(rawStoredUser) ? rawStoredUser : null;

        if (storedToken) {
          setToken(storedToken);
          setUser(storedUser);

          if (!storedUser || !storedUser.onboardingCompleted) {
            // Si falta el perfil local o figura pendiente, verificar contra backend antes de enrutar
            await syncSessionWithBackend(storedUser);
          } else {
            // Revalidar JWT y estado en segundo plano sin bloquear el arranque
            void syncSessionWithBackend(storedUser);
          }
        } else if (rawStoredUser && !storedUser) {
          // Limpiar basura heredada si existía sin token
          await storage.clearSession();
        }
      } catch (error) {
        console.warn('Error al restaurar sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [syncSessionWithBackend]);

  const loginWithGoogle = async (payload: GoogleAuthRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', payload);
    const authData = response.data;

    // Normalizar usuario según respuesta del backend
    const resolvedUser: UserResponse = authData.user || {
      id: authData.userId || 0,
      email: authData.email || payload.email || '',
      fullName: authData.name || payload.name || '',
      avatarUrl: payload.pictureUrl || '',
      onboardingCompleted: authData.onboardingCompleted ?? false,
    };

    await storage.setToken(authData.token);
    await storage.setUserData(resolvedUser);

    setToken(authData.token);
    setUser(resolvedUser);
    return authData;
  };

  const requestOtp = async (phoneNumber: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `/auth/otp/solicitar?phoneNumber=${encodeURIComponent(phoneNumber)}`
    );
    return response.data;
  };

  const verifyOtp = async (
    phoneNumber: string,
    codigo: string
  ): Promise<{ token: string; message: string; onboardingCompleted?: boolean }> => {
    const response = await api.post<{ token: string; message: string }>(
      `/auth/otp/verificar?phoneNumber=${encodeURIComponent(phoneNumber)}&codigo=${encodeURIComponent(codigo)}`
    );
    const data = response.data;
    let onboardingCompleted = false;
    if (data.token) {
      await storage.setToken(data.token);
      setToken(data.token);
      const initialUser: UserResponse = {
        id: 0,
        email: '',
        phoneNumber,
        onboardingCompleted: false,
      };
      setUser(initialUser);
      await storage.setUserData(initialUser);
      const synced = await syncSessionWithBackend(initialUser);
      onboardingCompleted = Boolean(synced?.onboardingCompleted);
    }
    return { ...data, onboardingCompleted };
  };

  const completeOnboarding = async () => {
    const baseUser: UserResponse = user ?? {
      id: 0,
      email: '',
      onboardingCompleted: true,
    };
    const updated: UserResponse = { ...baseUser, onboardingCompleted: true };
    setUser(updated);
    await storage.setUserData(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        loginWithGoogle,
        requestOtp,
        verifyOtp,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
