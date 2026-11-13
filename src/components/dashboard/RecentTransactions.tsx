import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowUpRight, TrendingUp } from 'lucide-react-native';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CategoryResponse, TransactionResponse } from '@/types/api';
import { formatCurrency } from '@/utils/currency';

interface RecentTransactionsProps {
  transactions: TransactionResponse[];
  categories: CategoryResponse[];
  onViewAll: () => void;
  onAddFirst: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  categories,
  onViewAll,
  onAddFirst,
}) => {
  const recent = [...transactions]
    .sort((a, b) => {
      const dateA = a.date ?? a.transactionDate ?? a.createdAt ?? '';
      const dateB = b.date ?? b.transactionDate ?? b.createdAt ?? '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.id ?? 0) - (a.id ?? 0);
    })
    .slice(0, 5);

  const resolveIconKey = (tx: TransactionResponse): string | undefined => {
    if (tx.category?.iconKey || tx.category?.icon) {
      return tx.category.iconKey || tx.category.icon;
    }
    const matched = categories.find(
      (cat) => cat.name.toLowerCase() === (tx.categoryName ?? '').toLowerCase()
    );
    return matched?.iconKey || matched?.icon;
  };

  return (
    <View className="mb-24">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-bold">Movimientos Recientes</Text>
        <Pressable onPress={onViewAll} className="active:opacity-70 flex-row items-center">
          <Text className="text-[#22C55E] text-xs font-semibold mr-1">Ver todos</Text>
          <ArrowUpRight size={14} color="#22C55E" />
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <Pressable
          onPress={onAddFirst}
          className="bg-[#121214] border border-zinc-900 rounded-2xl p-6 items-center justify-center active:opacity-80"
        >
          <TrendingUp size={28} color="#71717A" />
          <Text className="text-zinc-300 text-sm font-medium mb-1 mt-3">
            Sin movimientos en este periodo
          </Text>
          <Text className="text-zinc-500 text-xs text-center leading-relaxed max-w-[240px]">
            Toca aquí o usa el botón + para registrar tu primer ingreso o gasto.
          </Text>
        </Pressable>
      ) : (
        <View className="bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden">
          {recent.map((tx, idx) => {
            const isIncome = tx.type === 'INGRESO' || tx.type === 'INCOME';
            const categoryLabel = tx.categoryName || tx.category?.name || 'Movimiento';
            const txDate = tx.date ?? tx.transactionDate ?? '';
            const iconKey = resolveIconKey(tx);

            return (
              <View
                key={tx.id ?? `${idx}-${txDate}`}
                className={`flex-row items-center justify-between px-4 py-3.5 ${
                  idx < recent.length - 1 ? 'border-b border-zinc-800/70' : ''
                }`}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-10 h-10 rounded-xl bg-[#27272A] items-center justify-center mr-3">
                    <CategoryIcon
                      iconKey={iconKey}
                      size={18}
                      color={isIncome ? '#22C55E' : '#A1A1AA'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-white text-sm font-semibold">
                      {tx.description || categoryLabel}
                    </Text>
                    <Text numberOfLines={1} className="text-zinc-500 text-xs mt-0.5">
                      {categoryLabel}
                      {txDate ? ` • ${txDate}` : ''}
                    </Text>
                  </View>
                </View>

                <Text
                  className={`text-sm font-bold ${
                    isIncome ? 'text-[#22C55E]' : 'text-red-400'
                  }`}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {isIncome
                    ? formatCurrency(tx.amount, true)
                    : `-${formatCurrency(Math.abs(tx.amount))}`}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default RecentTransactions;
