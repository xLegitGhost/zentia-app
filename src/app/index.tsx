import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  const handleStart = () => {
    if (isAuthenticated) {
      if (user?.onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)');
      }
    } else {
      router.push('/(auth)/login');
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

      {/* Hero Center Content */}
      <View className="items-center px-4">
        <Text className="text-white text-4xl font-extrabold tracking-[0.25em] uppercase text-center mb-4">
          Z E N T I A
        </Text>
        <Text className="text-zinc-400 text-sm text-center leading-relaxed max-w-[280px]">
          Tu claridad financiera en cada movimiento. Controla tus gastos, balances e ingresos sin fricción.
        </Text>
      </View>

      {/* Bottom Pinned CTA */}
      <View className="w-full pb-4">
        <Pressable
          onPress={handleStart}
          className="w-full bg-[#EDEDED] active:bg-zinc-300 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase">
            COMENZAR
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
