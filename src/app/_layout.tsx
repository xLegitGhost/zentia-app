import '../global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
            retry: 2,
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
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
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(modal)" options={{ presentation: 'modal' }} />
              </Stack>
            </BiometricLockGate>
          </ResponsiveAppShell>
        </AuthProvider>
      </GoogleAuthProviderWrapper>
    </QueryClientProvider>
  );
}
