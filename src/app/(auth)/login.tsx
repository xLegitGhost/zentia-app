import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/services/api';
import { logSafeWarning } from '@/services/security';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { SpringPressable } from '@/components/ui/SpringPressable';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuthSuccess = (res: any) => {
    setErrorMessage(null);
    if (res.onboardingCompleted || res.user?.onboardingCompleted) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)');
    }
  };

  // Hook oficial de Google OAuth para Web
  const triggerGoogleWebLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setErrorMessage(null);
        // Obtener datos del perfil directamente desde Google con el access token
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((res) => res.json());

        // Enviar payload exacto requerido por POST /api/v1/auth/google
        const res = await loginWithGoogle({
          googleId: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          pictureUrl: userInfo.picture,
          idToken: tokenResponse.access_token,
        });

        handleAuthSuccess(res);
      } catch (error: any) {
        logSafeWarning('Error procesando login con backend', error);
        const detail =
          error?.response?.data?.error ||
          error?.message ||
          `No se pudo conectar con ${API_BASE_URL}`;
        setErrorMessage(detail);
        if (Platform.OS !== 'web') {
          Alert.alert('Error de Conexión', `${detail}. ¿Deseas entrar en modo demo?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Modo Demo', onPress: () => router.replace('/(onboarding)') },
          ]);
        }
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      logSafeWarning('Error en Google OAuth', errorResponse);
      const msg =
        errorResponse?.error_description ||
        errorResponse?.error ||
        'No se pudo completar la autenticación con Google. Verifica el origen autorizado en Google Cloud Console.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Google OAuth', msg, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Modo Demo', onPress: () => router.replace('/(onboarding)') },
        ]);
      }
    },
  });

  const handlePressGoogle = () => {
    setErrorMessage(null);
    if (Platform.OS === 'web') {
      try {
        triggerGoogleWebLogin();
      } catch (e: any) {
        logSafeWarning('Error al invocar Google Login', e);
        setErrorMessage(
          e?.message || 'Error al invocar Google Login. Verifica EXPO_PUBLIC_GOOGLE_CLIENT_ID en .env.'
        );
      }
    } else {
      Alert.alert(
        'Móvil',
        'Para móvil físico se usará el login OTP o el build nativo. Iniciando en modo demo...',
        [{ text: 'Continuar', onPress: () => router.replace('/(onboarding)') }]
      );
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
      <FadeSlideIn className="items-center px-4">
        <Text className="text-zinc-400 text-xs font-bold tracking-[0.25em] uppercase text-center mb-8">
          INICIAR SESIÓN
        </Text>

        {/* Google OAuth Button (Figma Spec + Apple spring press) */}
        <SpringPressable
          onPress={handlePressGoogle}
          disabled={loading}
          className="w-full bg-white h-14 rounded-full flex-row items-center justify-center px-6 shadow-md mb-4"
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
        </SpringPressable>

        {/* Phone OTP Alternative */}
        <Pressable
          onPress={() => router.push('/(auth)/otp')}
          className="py-3 px-4 active:opacity-70"
        >
          <Text className="text-zinc-400 text-xs font-medium tracking-wide">
            O ingresar con número de teléfono
          </Text>
        </Pressable>

        {errorMessage ? (
          <View className="w-full mt-4 bg-red-950/50 border border-red-900 rounded-2xl p-3">
            <Text className="text-red-300 text-xs text-center mb-2">{errorMessage}</Text>
            <Pressable
              onPress={() => router.replace('/(onboarding)')}
              className="py-2 rounded-full bg-zinc-900 border border-zinc-700 items-center active:opacity-80"
            >
              <Text className="text-zinc-200 text-xs font-semibold">
                Continuar en Modo Demo
              </Text>
            </Pressable>
          </View>
        ) : null}
      </FadeSlideIn>

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
