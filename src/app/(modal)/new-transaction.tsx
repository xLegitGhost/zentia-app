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
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { TransactionType } from '@/types/api';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useCreateTransaction';
import { SegmentedTypeControl } from '@/components/finance/SegmentedTypeControl';
import { MoneyInput } from '@/components/finance/MoneyInput';
import { CategoryPicker } from '@/components/finance/CategoryPicker';
import { SpringPressable } from '@/components/ui/SpringPressable';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { KaluriFoodHint } from '@/components/ui/KaluriEasterEgg';

export default function NewTransactionModal() {
  const router = useRouter();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // RN-FIN-03: Solo categorías compatibles con el tipo de transacción
  const { categories, allCategories } = useCategories(type);
  const createMutation = useCreateTransaction();

  const effectiveCategoryId = useMemo(() => {
    if (
      selectedCategoryId !== null &&
      categories.some((cat) => cat.id === selectedCategoryId)
    ) {
      return selectedCategoryId;
    }
    return categories[0]?.id ?? null;
  }, [selectedCategoryId, categories]);

  const selectedCategoryName = useMemo(
    () => categories.find((cat) => cat.id === effectiveCategoryId)?.name,
    [categories, effectiveCategoryId]
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setValidationError(null);
    const isTargetIncome = newType === 'INCOME' || newType === 'INGRESO';
    const available = allCategories.find((c) => {
      const isCatIncome = c.type === 'INCOME' || c.type === 'INGRESO';
      return isTargetIncome ? isCatIncome : !isCatIncome;
    });
    setSelectedCategoryId(available?.id ?? null);
  };

  const notifyError = (title: string, message: string) => {
    setValidationError(message);
    if (Platform.OS !== 'web') {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    setValidationError(null);
    const numAmount = parseFloat(amount.replace(/,/g, ''));

    // RN-FIN-01: El monto debe ser estrictamente mayor a cero
    if (isNaN(numAmount) || numAmount <= 0) {
      notifyError('Monto inválido', 'El monto debe ser estrictamente mayor a $0.00');
      return;
    }

    if (!effectiveCategoryId || !categories.some((c) => c.id === effectiveCategoryId)) {
      notifyError('Categoría requerida', 'Por favor selecciona una categoría compatible.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        amount: numAmount,
        type,
        categoryId: effectiveCategoryId,
        description: description.trim() || (type === 'EXPENSE' ? 'Gasto general' : 'Ingreso'),
        transactionDate: new Date().toISOString().split('T')[0],
      });

      router.back();
    } catch {
      notifyError('Error', 'No se pudo registrar la transacción. Intenta de nuevo.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black justify-between px-6 py-4">
      <View>
        {/* iOS Sheet Grab Handle */}
        <View className="w-10 h-1 rounded-full bg-zinc-700/80 self-center mt-0.5 mb-3" />

        {/* Top Modal Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-bold">Nuevo Movimiento</Text>
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800/80 items-center justify-center active:opacity-70"
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <FadeSlideIn delay={20}>
          <SegmentedTypeControl value={type} onChange={handleTypeChange} />
        </FadeSlideIn>

        <FadeSlideIn delay={60}>
          <MoneyInput value={amount} onChangeText={setAmount} />
        </FadeSlideIn>

        <FadeSlideIn delay={100}>
          <CategoryPicker
            categories={categories}
            selectedId={effectiveCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </FadeSlideIn>

        <KaluriFoodHint categoryName={selectedCategoryName} />

        <FadeSlideIn delay={140}>
          <View className="bg-[#121214] border border-zinc-800/90 rounded-2xl p-4 mb-6">
            <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Descripción (Opcional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ej. Cena con amigos, Supermercado..."
              placeholderTextColor="#52525B"
              maxLength={255}
              className="text-white text-base py-1"
            />
          </View>
        </FadeSlideIn>
      </ScrollView>

      <View className="pt-2 pb-4">
        {validationError ? (
          <Text className="text-red-400 text-xs text-center mb-3 font-medium">
            {validationError}
          </Text>
        ) : null}
        <SpringPressable
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          className="w-full bg-[#EDEDED] h-14 rounded-full items-center justify-center shadow-lg"
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#09090B" />
          ) : (
            <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase">
              REGISTRAR MOVIMIENTO
            </Text>
          )}
        </SpringPressable>
      </View>
    </SafeAreaView>
  );
}
