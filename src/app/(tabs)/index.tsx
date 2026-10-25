import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black px-6 pt-4">
      {/* Top Brand Bar */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-xs font-bold tracking-[0.25em] uppercase opacity-70">
          Z E N T I A
        </Text>
        <View className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
          <Text className="text-zinc-400 text-xs font-medium">Este Mes</Text>
        </View>
      </View>

      {/* Main Balance Card (OLED Spec) */}
      <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 mb-6">
        <Text className="text-zinc-400 text-xs font-medium tracking-wide uppercase mb-1">
          Balance Total
        </Text>
        <Text className="text-white text-3xl font-extrabold tracking-tight mb-4">
          $ 24,549.50
        </Text>

        <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/80">
          <View>
            <Text className="text-zinc-500 text-xs font-medium mb-0.5">Ingresos</Text>
            <Text className="text-[#22C55E] text-base font-bold">+$25,000.00</Text>
          </View>
          <View className="items-end">
            <Text className="text-zinc-500 text-xs font-medium mb-0.5">Gastos</Text>
            <Text className="text-red-400 text-base font-bold">-$450.50</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-bold">
          Movimientos Recientes
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/transactions')}
          className="active:opacity-70"
        >
          <Text className="text-[#22C55E] text-xs font-semibold">Ver todos</Text>
        </Pressable>
      </View>

      {/* Empty / Placeholder State */}
      <View className="bg-[#121214] border border-zinc-900 rounded-2xl p-6 items-center justify-center">
        <Text className="text-zinc-400 text-sm font-medium mb-1">
          Bienvenido a tu panel financiero
        </Text>
        <Text className="text-zinc-600 text-xs text-center leading-relaxed">
          Tus transacciones y gráficas analíticas aparecerán aquí en tiempo real.
        </Text>
      </View>
    </SafeAreaView>
  );
}
