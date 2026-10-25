import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogo } from '@/components/ui/GoogleLogo';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // Simulación de credencial para ambiente de desarrollo/stand
      const mockIdToken = 'demo-id-token-' + Date.now();
      const res = await loginWithGoogle(mockIdToken);

      if (res.onboardingCompleted || res.user?.onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)');
      }
    } catch (error: any) {
      console.warn('Error en login con Google:', error);
      Alert.alert(
        'Acceso',
        'No se pudo conectar con el servidor backend en localhost:8080. ¿Deseas continuar en modo demo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Modo Demo',
            onPress: () => router.replace('/(onboarding)'),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black justify-between px-6 py-8">
      {/* Brand Header */}
      <View className="items-center pt-2">
        <Text className="text-white text-xs font-bold tracking-[0.3em] uppercase opacity-70">
          Z E N T I A
        </Text>
      </View>

      {/* Center Prompt */}
      <View className="items-center px-4">
        <Text className="text-zinc-400 text-xs font-bold tracking-[0.25em] uppercase text-center mb-8">
          INICIAR SESIÓN
        </Text>

        {/* Google OAuth Button (Figma Spec) */}
        <Pressable
          onPress={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white active:bg-zinc-200 h-14 rounded-full flex-row items-center justify-center px-6 shadow-md mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#18181B" />
          ) : (
            <>
              <GoogleLogo size={22} />
              <Text className="text-zinc-900 font-medium text-base ml-3">
                Continuar con Google
              </Text>
            </>
          )}
        </Pressable>

        {/* Phone OTP Alternative */}
        <Pressable
          onPress={() => router.push('/(auth)/otp')}
          className="py-3 px-4 active:opacity-70"
        >
          <Text className="text-zinc-400 text-xs font-medium tracking-wide">
            O ingresar con número de teléfono
          </Text>
        </Pressable>
      </View>

      {/* Footer Legal Terms (Figma Spec) */}
      <View className="items-center px-4 pb-2">
        <Text className="text-zinc-500 text-[11px] text-center leading-relaxed">
          Al iniciar sesión aceptas las{' '}
          <Text className="text-yellow-500 underline font-medium">políticas de privacidad</Text>
          {' '}y{' '}
          <Text className="text-yellow-500 underline font-medium">términos y condiciones</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}
