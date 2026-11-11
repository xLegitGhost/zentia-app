import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAuthSuccess = (res: any) => {
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
        // Obtener datos del perfil directamente desde Google con el access token
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((res) => res.json());

        // Enviar payload exacto requerido por UserService.java en Spring Boot
        const res = await loginWithGoogle({
          googleId: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          pictureUrl: userInfo.picture,
          idToken: tokenResponse.access_token,
        });

        handleAuthSuccess(res);
      } catch (error: any) {
        console.warn('Error procesando login con backend:', error);
        Alert.alert(
          'Error de Conexión',
          'El backend no respondió en http://localhost:8080. ¿Deseas entrar en modo demo?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Modo Demo', onPress: () => router.replace('/(onboarding)') },
          ]
        );
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.warn('Error en Google OAuth:', errorResponse);
      Alert.alert(
        'Google OAuth',
        'No se pudo completar la autenticación con Google. Revisa tu Client ID o continúa en modo demo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Modo Demo', onPress: () => router.replace('/(onboarding)') },
        ]
      );
    },
  });

  const handlePressGoogle = () => {
    if (Platform.OS === 'web') {
      try {
        triggerGoogleWebLogin();
      } catch (e) {
        // Fallback si no hay client ID configurado
        console.warn('Error al invocar Google Login:', e);
        Alert.alert('Google Client ID', 'Verifica configurar EXPO_PUBLIC_GOOGLE_CLIENT_ID en tu archivo .env.');
      }
    } else {
      // Modo demo para móvil en lo que se compila dev build nativo
      Alert.alert('Móvil', 'Para móvil físico se usará el login OTP o el build nativo. Iniciando en modo demo...', [
        { text: 'Continuar', onPress: () => router.replace('/(onboarding)') },
      ]);
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
          onPress={handlePressGoogle}
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
