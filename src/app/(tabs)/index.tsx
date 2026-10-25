import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { Target, TrendingUp, ArrowUpRight, Plus } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useFinancialProfile();

  const monthlyIncome = profile?.monthlyIncome || 25000;
  const savingsGoal = profile?.monthlySavingsGoal || 5000;
  const currentExpense = 450.5;
  const currentBalance = monthlyIncome - currentExpense;
  const savingsProgressPercent = Math.min(
    100,
    Math.round((currentBalance / savingsGoal) * 100)
  );

  return (
    <SafeAreaView className="flex-1 bg-black px-6 pt-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Brand Bar */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-xs font-bold tracking-[0.25em] uppercase opacity-70">
            Z E N T I A
          </Text>
          <View className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
            <Text className="text-zinc-400 text-xs font-medium">Este Mes</Text>
          </View>
        </View>

        {/* Main Balance Card (Figma OLED Spec) */}
        <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 mb-5">
          <Text className="text-zinc-400 text-xs font-medium tracking-wide uppercase mb-1">
            Balance Disponible
          </Text>
          <Text className="text-white text-3xl font-extrabold tracking-tight mb-4">
            $ {currentBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>

          <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/80">
            <View>
              <Text className="text-zinc-500 text-xs font-medium mb-0.5">Ingreso Estimado</Text>
              <Text className="text-[#22C55E] text-base font-bold">
                +${monthlyIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-zinc-500 text-xs font-medium mb-0.5">Gastos Reales</Text>
              <Text className="text-red-400 text-base font-bold">
                -${currentExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Savings Goal Card (Hexagonal In-Memory Feature) */}
        <View className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Target size={18} color="#22C55E" />
              <Text className="text-white text-sm font-semibold ml-2">
                Meta de Ahorro Mensual
              </Text>
            </View>
            <Text className="text-[#22C55E] text-xs font-bold">
              {savingsProgressPercent}%
            </Text>
          </View>

          {/* Goal Progress Bar */}
          <View className="h-2 bg-[#27272A] rounded-full overflow-hidden my-2">
            <View
              style={{ width: `${savingsProgressPercent}%` }}
              className="h-full bg-[#22C55E] rounded-full"
            />
          </View>

          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-zinc-400 text-xs">
              Objetivo: ${savingsGoal.toLocaleString('es-MX')}
            </Text>
            <Text className="text-zinc-500 text-[11px]">
              Actual: ${currentBalance.toLocaleString('es-MX')}
            </Text>
          </View>
        </View>

        {/* Quick Actions Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-bold">
            Movimientos Recientes
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/transactions')}
            className="active:opacity-70 flex-row items-center"
          >
            <Text className="text-[#22C55E] text-xs font-semibold mr-1">Ver todos</Text>
            <ArrowUpRight size={14} color="#22C55E" />
          </Pressable>
        </View>

        {/* Empty / Placeholder State */}
        <View className="bg-[#121214] border border-zinc-900 rounded-2xl p-6 items-center justify-center mb-8">
          <TrendingUp size={28} color="#71717A" className="mb-2" />
          <Text className="text-zinc-300 text-sm font-medium mb-1 mt-2">
            Historial listo para registrar
          </Text>
          <Text className="text-zinc-500 text-xs text-center leading-relaxed max-w-[240px]">
            Agrega tu primera transacción para ver el impacto en tu meta de ahorro.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Add Action Button */}
      <Pressable
        onPress={() => router.push('/(modal)/new-transaction')}
        className="absolute bottom-6 right-6 bg-[#22C55E] w-14 h-14 rounded-full items-center justify-center shadow-2xl active:opacity-80"
      >
        <Plus size={26} color="#000000" strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  );
}
