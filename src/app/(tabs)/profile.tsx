import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Fingerprint, LogOut, ShieldCheck, SlidersHorizontal, User } from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { storage } from '@/services/storage';
import { biometrics, BiometricsCapability } from '@/services/biometrics';
import { KaluriPromoCard } from '@/components/ui/KaluriEasterEgg';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { SpringPressable } from '@/components/ui/SpringPressable';
import { SkeletonBox } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/currency';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { profile, isLoading: isProfileLoading } = useFinancialProfile();

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [capability, setCapability] = useState<BiometricsCapability>({
    supported: false,
    enrolled: false,
    label: 'Consultando sensor...',
  });
  const [bioMessage, setBioMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [enabled, cap] = await Promise.all([
        storage.getBiometricsEnabled(),
        biometrics.getCapability(),
      ]);
      if (active) {
        setBiometricsEnabled(enabled);
        setCapability(cap);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggleBiometrics = async (nextValue: boolean) => {
    setBioMessage(null);
    if (Platform.OS === 'web') {
      setBioMessage('El bloqueo biométrico nativo (Face ID / Huella) funciona en iOS y Android.');
      return;
    }

    if (nextValue) {
      if (!capability.supported || !capability.enrolled) {
        setBioMessage(capability.label);
        return;
      }
      const verified = await biometrics.authenticate('Confirma tu identidad para activar el bloqueo');
      if (!verified) {
        setBioMessage('Autenticación cancelada o fallida.');
        return;
      }
    }

    await storage.setBiometricsEnabled(nextValue);
    setBiometricsEnabled(nextValue);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const avatarUrl = user?.avatarUrl || user?.pictureUrl;
  const displayName = user?.fullName || user?.name || 'Usuario Zentia';

  return (
    <SafeAreaView className="flex-1 bg-black px-6 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-white text-2xl font-bold mb-6">Mi Perfil</Text>

        {/* User Card */}
        <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 mb-5 flex-row items-center">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-14 h-14 rounded-full bg-zinc-800 mr-4"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-[#27272A] items-center justify-center mr-4">
              <User size={24} color="#22C55E" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-white text-lg font-bold" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
              {user?.email || 'Sesión en Modo Demo'}
            </Text>
            {user?.phoneNumber ? (
              <Text className="text-zinc-500 text-xs mt-1">Tel: {user.phoneNumber}</Text>
            ) : null}
            <View className="flex-row items-center mt-2">
              <View
                className={`px-2.5 py-0.5 rounded-full border ${
                  isAuthenticated
                    ? 'bg-emerald-950/60 border-emerald-800'
                    : 'bg-zinc-900 border-zinc-700'
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    isAuthenticated ? 'text-[#22C55E]' : 'text-zinc-400'
                  }`}
                >
                  {isAuthenticated ? 'En línea' : 'Modo Demo Local'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Profile Summary */}
        <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <SlidersHorizontal size={16} color="#22C55E" />
              <Text className="text-white text-sm font-bold ml-2">Perfil Financiero</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(onboarding)')}
              className="px-3 py-1 rounded-full bg-[#27272A] active:opacity-80"
            >
              <Text className="text-[#22C55E] text-xs font-semibold">Ajustar</Text>
            </Pressable>
          </View>

          <View className="flex-row justify-between items-center py-2 border-b border-zinc-800/70">
            <Text className="text-zinc-400 text-xs">Ingreso Mensual Base</Text>
            {isProfileLoading && !profile ? (
              <SkeletonBox className="w-20 h-3.5 rounded-full" />
            ) : (
              <Text
                className="text-white text-xs font-bold"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatCurrency(profile?.monthlyIncome ?? 25000)}
              </Text>
            )}
          </View>
          <View className="flex-row justify-between items-center pt-3">
            <Text className="text-zinc-400 text-xs">Meta de Ahorro Mensual</Text>
            {isProfileLoading && !profile ? (
              <SkeletonBox className="w-20 h-3.5 rounded-full" />
            ) : (
              <Text
                className="text-[#22C55E] text-xs font-bold"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatCurrency(profile?.monthlySavingsGoal ?? 5000)}
              </Text>
            )}
          </View>
        </View>

        {/* Biometrics Security Toggle (TASK-404 / TASK-405) */}
        <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-2xl bg-[#27272A] items-center justify-center mr-3">
                <Fingerprint size={20} color="#22C55E" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-bold">Desbloqueo Biométrico</Text>
                <Text className="text-zinc-400 text-xs mt-0.5">{capability.label}</Text>
              </View>
            </View>

            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#27272A', true: '#166534' }}
              thumbColor={biometricsEnabled ? '#22C55E' : '#A1A1AA'}
            />
          </View>

          {bioMessage ? (
            <View className="flex-row items-center mt-3 pt-3 border-t border-zinc-800/70">
              <ShieldCheck size={14} color="#A1A1AA" />
              <Text className="text-zinc-400 text-xs ml-2 flex-1">{bioMessage}</Text>
            </View>
          ) : null}
        </View>

        {/* Promo App Hermana Kaluri.app con código URIEL15 */}
        <FadeSlideIn delay={60}>
          <KaluriPromoCard />
        </FadeSlideIn>

        {/* Logout */}
        <SpringPressable
          onPress={handleLogout}
          className="w-full bg-red-950/40 border border-red-900/50 h-14 rounded-full flex-row items-center justify-center"
        >
          <LogOut size={18} color="#EF4444" />
          <Text className="text-red-400 font-bold text-sm tracking-wider uppercase ml-2">
            CERRAR SESIÓN
          </Text>
        </SpringPressable>
      </ScrollView>
    </SafeAreaView>
  );
}
