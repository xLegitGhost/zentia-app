import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, AppState, Platform } from 'react-native';
import { Fingerprint, Lock } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/services/storage';
import { biometrics } from '@/services/biometrics';

export const BiometricLockGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const appState = useRef(AppState.currentState);
  const promptInFlight = useRef(false);

  const attemptUnlock = useCallback(async () => {
    if (Platform.OS === 'web' || promptInFlight.current) return;
    promptInFlight.current = true;
    setChecking(true);
    try {
      const success = await biometrics.authenticate('Desbloquea Zentia para ver tus finanzas');
      if (success) {
        setLocked(false);
      }
    } finally {
      promptInFlight.current = false;
      setChecking(false);
    }
  }, []);

  // Evaluar bloqueo al iniciar sesión / montar autenticado
  useEffect(() => {
    if (Platform.OS === 'web' || isLoading || !isAuthenticated) {
      setLocked(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const enabled = await storage.getBiometricsEnabled();
      if (!cancelled && enabled) {
        setLocked(true);
        await attemptUnlock();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, attemptUnlock]);

  // Solicitar biometría al volver de segundo plano
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = AppState.addEventListener('change', async (nextState) => {
      const prevState = appState.current;
      appState.current = nextState;

      if (
        (prevState === 'background' || prevState === 'inactive') &&
        nextState === 'active' &&
        isAuthenticated
      ) {
        const enabled = await storage.getBiometricsEnabled();
        if (enabled) {
          setLocked(true);
          await attemptUnlock();
        }
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, attemptUnlock]);

  return (
    <View className="flex-1 bg-black">
      {children}

      {locked ? (
        <View className="absolute inset-0 bg-black/95 items-center justify-center px-8 z-50">
          <View className="w-16 h-16 rounded-full bg-[#121214] border border-zinc-800 items-center justify-center mb-6">
            <Lock size={28} color="#22C55E" />
          </View>

          <Text className="text-white text-xs font-bold tracking-[0.25em] uppercase opacity-70 mb-2">
            Z E N T I A
          </Text>
          <Text className="text-white text-xl font-bold text-center mb-2">
            Sesión Protegida
          </Text>
          <Text className="text-zinc-400 text-xs text-center mb-8 leading-relaxed max-w-[260px]">
            Usa Face ID o tu huella dactilar para acceder a tu información financiera.
          </Text>

          <Pressable
            onPress={attemptUnlock}
            disabled={checking}
            className="w-full max-w-xs bg-[#EDEDED] active:bg-zinc-300 h-14 rounded-full flex-row items-center justify-center mb-4"
          >
            <Fingerprint size={20} color="#09090B" />
            <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase ml-2">
              {checking ? 'VERIFICANDO...' : 'DESBLOQUEAR'}
            </Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await logout();
              setLocked(false);
            }}
            className="py-2 px-4 active:opacity-70"
          >
            <Text className="text-zinc-500 text-xs font-medium">Cerrar sesión</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

export default BiometricLockGate;
