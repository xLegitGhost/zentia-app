import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Pencil, Plus, Search, Trash2, TrendingUp, X } from 'lucide-react-native';

import { useCategories } from '@/hooks/useCategories';
import {
  DateRange,
  getPeriodDateRange,
  PeriodKey,
  useDashboardSummary,
} from '@/hooks/useDashboard';
import { useDeleteTransaction } from '@/hooks/useDeleteTransaction';
import { classifyMutationError } from '@/services/idempotency';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SpringPressable } from '@/components/ui/SpringPressable';
import { TransactionListSkeleton } from '@/components/ui/Skeleton';
import { TransactionResponse } from '@/types/api';
import { formatCurrency } from '@/utils/currency';

type TypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';

interface TransactionSection {
  title: string;
  dailyNet: number;
  data: TransactionResponse[];
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { allCategories } = useCategories();
  const deleteMutation = useDeleteTransaction();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('current_month');
  const [customRange, setCustomRange] = useState<DateRange>(() =>
    getPeriodDateRange('current_month')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletingIdRef = useRef<number | null>(null);

  const activeRange = useMemo(
    () => getPeriodDateRange(selectedPeriod, customRange),
    [selectedPeriod, customRange]
  );

  const { transactions, isLoading, isFetching, hasHistoryData, refetch } = useDashboardSummary(
    activeRange.startDate,
    activeRange.endDate
  );

  const resolveIconKey = (tx: TransactionResponse): string | undefined => {
    if (tx.category?.iconKey || tx.category?.icon) {
      return tx.category.iconKey || tx.category.icon;
    }
    const matched = allCategories.find(
      (cat) => cat.name.toLowerCase() === (tx.categoryName ?? '').toLowerCase()
    );
    return matched?.iconKey || matched?.icon;
  };

  const sections = useMemo<TransactionSection[]>(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = transactions.filter((tx) => {
      const isIncome = tx.type === 'INGRESO' || tx.type === 'INCOME';
      if (typeFilter === 'INCOME' && !isIncome) return false;
      if (typeFilter === 'EXPENSE' && isIncome) return false;

      if (!normalizedSearch) return true;
      const desc = (tx.description ?? '').toLowerCase();
      const cat = (tx.categoryName ?? tx.category?.name ?? '').toLowerCase();
      return desc.includes(normalizedSearch) || cat.includes(normalizedSearch);
    });

    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.date ?? a.transactionDate ?? '';
      const dateB = b.date ?? b.transactionDate ?? '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.id ?? 0) - (a.id ?? 0);
    });

    const grouped = new Map<string, TransactionResponse[]>();
    for (const tx of sorted) {
      const key = tx.date ?? tx.transactionDate ?? 'Sin fecha';
      const list = grouped.get(key) ?? [];
      list.push(tx);
      grouped.set(key, list);
    }

    return Array.from(grouped.entries()).map(([dateKey, items]) => {
      const dailyNet = items.reduce((acc, item) => {
        const isIncome = item.type === 'INGRESO' || item.type === 'INCOME';
        return acc + (isIncome ? Number(item.amount) : -Number(item.amount));
      }, 0);
      return {
        title: dateKey,
        dailyNet,
        data: items,
      };
    });
  }, [transactions, searchQuery, typeFilter]);

  const handleEdit = (tx: TransactionResponse) => {
    router.push({
      pathname: '/(modal)/edit-transaction',
      params: {
        id: String(tx.id),
        amount: String(tx.amount),
        description: tx.description ?? '',
        categoryId: tx.category?.id ? String(tx.category.id) : '',
        categoryName: tx.categoryName ?? tx.category?.name ?? '',
        type: tx.type,
        date: tx.date ?? tx.transactionDate ?? '',
      },
    });
  };

  const handleConfirmDelete = async (id: number) => {
    if (deletingIdRef.current === id) return;
    deletingIdRef.current = id;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch (error) {
      const classified = classifyMutationError(
        error,
        'No se pudo eliminar el movimiento. Intenta de nuevo.'
      );
      setDeleteError(classified.message);
    } finally {
      deletingIdRef.current = null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-6 pt-4">
      <View className="mb-4">
        <Text className="text-white text-2xl font-bold mb-1">Historial de Movimientos</Text>
        <Text className="text-zinc-400 text-xs">
          Filtra, edita o elimina cada ingreso y gasto registrado.
        </Text>
      </View>

      {deleteError ? (
        <View className="bg-red-950/60 border border-red-900/80 rounded-2xl px-3.5 py-2.5 mb-3 flex-row items-center justify-between">
          <Text className="text-red-300 text-xs flex-1 mr-2">{deleteError}</Text>
          <Pressable onPress={() => setDeleteError(null)} className="p-1">
            <X size={14} color="#FCA5A5" />
          </Pressable>
        </View>
      ) : null}

      <PeriodSelector
        selectedPeriod={selectedPeriod}
        customRange={customRange}
        onSelectPeriod={setSelectedPeriod}
        onApplyCustomRange={(range) => {
          setCustomRange(range);
          setSelectedPeriod('custom');
        }}
      />

      {/* Search & Type Filter */}
      <View className="flex-row items-center bg-[#121214] border border-zinc-800 rounded-2xl px-3.5 py-2.5 mb-3">
        <Search size={16} color="#71717A" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar descripción o categoría..."
          placeholderTextColor="#52525B"
          className="flex-1 text-white text-sm ml-2.5 py-0.5"
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} className="p-1">
            <X size={14} color="#71717A" />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row gap-2 mb-4">
        {(
          [
            { key: 'ALL', label: 'Todos' },
            { key: 'INCOME', label: 'Ingresos' },
            { key: 'EXPENSE', label: 'Gastos' },
          ] as const
        ).map((chip) => {
          const active = typeFilter === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => setTypeFilter(chip.key)}
              className={`px-3.5 py-1.5 rounded-full border ${
                active
                  ? 'bg-[#27272A] border-[#22C55E]'
                  : 'bg-[#121214] border-zinc-800'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? 'text-[#22C55E]' : 'text-zinc-400'
                }`}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.id ?? index}`}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#22C55E"
            colors={['#22C55E']}
          />
        }
        ListEmptyComponent={
          isLoading && !hasHistoryData ? (
            <TransactionListSkeleton count={5} variant="cards" />
          ) : (
            <View className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 items-center justify-center mt-2">
              <TrendingUp size={28} color="#71717A" />
              <Text className="text-zinc-300 text-sm font-medium mt-3 mb-1">
                Sin movimientos para mostrar
              </Text>
              <Text className="text-zinc-500 text-xs text-center max-w-[240px]">
                Ajusta los filtros o registra un nuevo ingreso o gasto con el botón +.
              </Text>
            </View>
          )
        }
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center justify-between pt-3 pb-2">
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {section.title}
            </Text>
            <Text
              className={`text-xs font-semibold ${
                section.dailyNet >= 0 ? 'text-[#22C55E]' : 'text-red-400'
              }`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatCurrency(section.dailyNet, true)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isIncome = item.type === 'INGRESO' || item.type === 'INCOME';
          const categoryLabel = item.categoryName || item.category?.name || 'Movimiento';
          const isConfirming = confirmDeleteId === item.id;
          const isDeletingThis =
            deleteMutation.isPending && deleteMutation.variables === item.id;

          return (
            <View className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-3.5 mb-2.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-10 h-10 rounded-xl bg-[#27272A] items-center justify-center mr-3">
                    <CategoryIcon
                      iconKey={resolveIconKey(item)}
                      size={18}
                      color={isIncome ? '#22C55E' : '#A1A1AA'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-white text-sm font-semibold">
                      {item.description || categoryLabel}
                    </Text>
                    <Text numberOfLines={1} className="text-zinc-500 text-xs mt-0.5">
                      {categoryLabel}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    className={`text-sm font-bold mb-1.5 ${
                      isIncome ? 'text-[#22C55E]' : 'text-red-400'
                    }`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {isIncome
                      ? formatCurrency(item.amount, true)
                      : `-${formatCurrency(Math.abs(item.amount))}`}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => handleEdit(item)}
                      className="p-1.5 rounded-lg bg-[#27272A] active:opacity-70"
                    >
                      <Pencil size={13} color="#E4E4E7" />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setConfirmDeleteId(isConfirming ? null : item.id)
                      }
                      className="p-1.5 rounded-lg bg-red-950/60 border border-red-900/50 active:opacity-70"
                    >
                      <Trash2 size={13} color="#F87171" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {isConfirming ? (
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                  <Text className="text-zinc-400 text-xs">¿Eliminar movimiento?</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-full bg-zinc-800 active:opacity-70"
                    >
                      <Text className="text-zinc-300 text-xs font-medium">Cancelar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleConfirmDelete(item.id)}
                      disabled={isDeletingThis}
                      className="px-3 py-1.5 rounded-full bg-red-500 active:opacity-80 flex-row items-center"
                    >
                      {isDeletingThis ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-white text-xs font-bold">Eliminar</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        }}
      />

      <SpringPressable
        onPress={() => router.push('/(modal)/new-transaction')}
        scaleTo={0.93}
        className="w-14 h-14 bg-[#22C55E] rounded-full items-center justify-center shadow-2xl"
        style={{ position: 'absolute', bottom: 24, right: 24 }}
      >
        <Plus size={26} color="#000000" strokeWidth={2.5} />
      </SpringPressable>
    </SafeAreaView>
  );
}
