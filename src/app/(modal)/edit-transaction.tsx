import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { TransactionType } from '@/types/api';
import { useCategories } from '@/hooks/useCategories';
import { useUpdateTransaction } from '@/hooks/useUpdateTransaction';
import { MoneyInput } from '@/components/finance/MoneyInput';
import { CategoryPicker } from '@/components/finance/CategoryPicker';

export default function EditTransactionModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    amount?: string;
    description?: string;
    categoryId?: string;
    categoryName?: string;
    type?: string;
    date?: string;
  }>();

  const transactionId = Number(params.id || 0);
  const txType: TransactionType =
    params.type === 'INGRESO' || params.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
  const isIncome = txType === 'INCOME';

  const { categories } = useCategories(txType);
  const updateMutation = useUpdateTransaction();

  const initialCategoryId = useMemo(() => {
    const numericId = Number(params.categoryId);
    if (Number.isFinite(numericId) && numericId > 0) return numericId;
    const matched = categories.find(
      (c) => c.name.toLowerCase() === (params.categoryName ?? '').toLowerCase()
    );
    return matched?.id ?? categories[0]?.id ?? null;
  }, [params.categoryId, params.categoryName, categories]);

  const [amount, setAmount] = useState(params.amount ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);
  const [description, setDescription] = useState(params.description ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const effectiveCategoryId = categoryId ?? initialCategoryId;

  const notifyError = (title: string, message: string) => {
    setValidationError(message);
    if (Platform.OS !== 'web') {
      Alert.alert(title, message);
    }
  };

  const handleSave = async () => {
    setValidationError(null);
    if (!transactionId) {
      notifyError('Error', 'Transacción no válida.');
      return;
    }

    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      notifyError('Monto inválido', 'El monto debe ser estrictamente mayor a $0.00');
      return;
    }

    if (!effectiveCategoryId) {
      notifyError('Categoría requerida', 'Selecciona una categoría válida.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        transactionId,
        payload: {
          categoryId: effectiveCategoryId,
          amount: numAmount,
          description: description.trim() || (isIncome ? 'Ingreso' : 'Gasto general'),
        },
      });
      router.back();
    } catch {
      notifyError('Error', 'No se pudo actualizar la transacción. Intenta de nuevo.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black justify-between px-6 py-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-white text-lg font-bold">Editar Movimiento</Text>
          <Text className="text-zinc-500 text-xs mt-0.5">
            {isIncome ? 'Ingreso' : 'Gasto'}
            {params.date ? ` • ${params.date}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:opacity-70"
        >
          <X size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <MoneyInput value={amount} onChangeText={setAmount} />

        <CategoryPicker
          categories={categories}
          selectedId={effectiveCategoryId}
          onSelect={setCategoryId}
        />

        <View className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 mb-6">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Descripción
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Concepto del movimiento..."
            placeholderTextColor="#52525B"
            maxLength={255}
            className="text-white text-base py-1"
          />
        </View>
      </ScrollView>

      <View className="pt-2 pb-4">
        {validationError ? (
          <Text className="text-red-400 text-xs text-center mb-3 font-medium">
            {validationError}
          </Text>
        ) : null}
        <Pressable
          onPress={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-[#EDEDED] active:bg-zinc-300 h-14 rounded-full items-center justify-center shadow-lg"
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#09090B" />
          ) : (
            <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase">
              GUARDAR CAMBIOS
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
