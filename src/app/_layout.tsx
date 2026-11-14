import '../global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isTransientError } from '@/services/idempotency';
import { AuthProvider } from '@/context/AuthContext';
import { GoogleAuthProviderWrapper } from '@/components/auth/GoogleAuthProviderWrapper';
import { BiometricLockGate } from '@/components/auth/BiometricLockGate';
import { ResponsiveAppShell } from '@/components/layout/ResponsiveAppShell';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => failureCount < 2 && isTransientError(error),
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
            staleTime: 1000 * 60 * 2,
            gcTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Permite ejecutar mutationFn offline para fallar rápido y mostrar mensaje RN-25 / CU-10 en lugar de pausar el botón
            networkMode: 'always',
            // Los reintentos seguros e idempotencia los coordina runIdempotentOperation (RN-20 / CU-10)
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleAuthProviderWrapper>
        <AuthProvider>
          <ResponsiveAppShell>
            <BiometricLockGate>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#000000' },
                  animation: 'ios_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ animation: 'fade' }} />
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                <Stack.Screen
                  name="(modal)"
                  options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
              </Stack>
            </BiometricLockGate>
          </ResponsiveAppShell>
        </AuthProvider>
      </GoogleAuthProviderWrapper>
    </QueryClientProvider>
  );
}
