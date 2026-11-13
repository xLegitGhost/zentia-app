import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { formatCurrency } from '@/utils/currency';

interface BalanceCardProps {
  balanceActual: number;
  totalIngresos: number;
  totalGastos: number;
  isFetching?: boolean;
  periodLabel?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balanceActual,
  totalIngresos,
  totalGastos,
  isFetching = false,
  periodLabel,
}) => {
  const isPositive = balanceActual >= 0;

  return (
    <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 mb-5">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-zinc-400 text-xs font-medium tracking-wide uppercase">
          Balance Neto {periodLabel ? `• ${periodLabel}` : ''}
        </Text>
        {isFetching ? <ActivityIndicator size="small" color="#22C55E" /> : null}
      </View>

      <Text
        className={`text-3xl font-extrabold tracking-tight mb-5 ${
          isPositive ? 'text-[#22C55E]' : 'text-red-400'
        }`}
      >
        {formatCurrency(balanceActual)}
      </Text>

      <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/80">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-900/60 items-center justify-center mr-2.5">
            <ArrowDownLeft size={16} color="#22C55E" />
          </View>
          <View>
            <Text className="text-zinc-500 text-xs font-medium mb-0.5">Ingresos Totales</Text>
            <Text className="text-[#22C55E] text-base font-bold">
              {formatCurrency(totalIngresos, true)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="items-end mr-2.5">
            <Text className="text-zinc-500 text-xs font-medium mb-0.5">Gastos Totales</Text>
            <Text className="text-red-400 text-base font-bold">
              -{formatCurrency(Math.abs(totalGastos))}
            </Text>
          </View>
          <View className="w-8 h-8 rounded-full bg-red-950/60 border border-red-900/60 items-center justify-center">
            <ArrowUpRight size={16} color="#F87171" />
          </View>
        </View>
      </View>
    </View>
  );
};

export default BalanceCard;
