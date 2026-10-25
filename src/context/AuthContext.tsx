import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { storage } from '@/services/storage';
import { AuthResponse, UserResponse } from '@/types/api';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (idToken: string) => Promise<AuthResponse>;
  requestOtp: (phoneNumber: string) => Promise<{ message: string }>;
  verifyOtp: (phoneNumber: string, codigo: string) => Promise<{ token: string; message: string }>;
  completeOnboarding: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar sesión desde el almacenamiento seguro
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUserData<UserResponse>();
        if (storedToken) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (error) {
        console.warn('Error al restaurar sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    const authData = response.data;

    // Normalizar usuario según respuesta del backend
    const resolvedUser: UserResponse = authData.user || {
      id: authData.userId || 0,
      email: authData.email || '',
      fullName: authData.name || '',
      avatarUrl: '',
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

  const verifyOtp = async (phoneNumber: string, codigo: string): Promise<{ token: string; message: string }> => {
    const response = await api.post<{ token: string; message: string }>(
      `/auth/otp/verificar?phoneNumber=${encodeURIComponent(phoneNumber)}&codigo=${encodeURIComponent(codigo)}`
    );
    const data = response.data;
    if (data.token) {
      await storage.setToken(data.token);
      setToken(data.token);
    }
    return data;
  };

  const completeOnboarding = async () => {
    if (user) {
      const updated = { ...user, onboardingCompleted: true };
      setUser(updated);
      await storage.setUserData(updated);
    }
  };

  const logout = async () => {
    await storage.clearSession();
    setToken(null);
    setUser(null);
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
