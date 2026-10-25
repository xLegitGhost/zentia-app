import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { TransactionType } from '@/types/api';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useCreateTransaction';
import { SegmentedTypeControl } from '@/components/finance/SegmentedTypeControl';
import { MoneyInput } from '@/components/finance/MoneyInput';
import { CategoryPicker } from '@/components/finance/CategoryPicker';

export default function NewTransactionModal() {
  const router = useRouter();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(1);
  const [description, setDescription] = useState('');

  // RN-FIN-03: Solo categorías compatibles con el tipo de transacción
  const { categories } = useCategories(type);
  const createMutation = useCreateTransaction();

  // Si cambia el tipo y la categoría actual no pertenece, preseleccionar la primera disponible
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories.find((c) =>
      newType === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'
    );
    if (available) {
      setCategoryId(available.id);
    }
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));

    // RN-FIN-01: El monto debe ser estrictamente mayor a cero
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Monto inválido', 'El monto debe ser estrictamente mayor a $0.00');
      return;
    }

    if (!categoryId) {
      Alert.alert('Categoría requerida', 'Por favor selecciona una categoría.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        amount: numAmount,
        type,
        categoryId,
        description: description.trim() || (type === 'EXPENSE' ? 'Gasto general' : 'Ingreso'),
        transactionDate: new Date().toISOString().split('T')[0],
      });

      router.back();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo registrar la transacción. Intenta de nuevo.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black justify-between px-6 py-4">
      {/* Top Modal Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-bold">
          Nuevo Movimiento
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:opacity-70"
        >
          <X size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Type Selector (Gasto / Ingreso) */}
        <SegmentedTypeControl value={type} onChange={handleTypeChange} />

        {/* Money Input */}
        <MoneyInput value={amount} onChangeText={setAmount} />

        {/* Category Picker */}
        <CategoryPicker
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        {/* Description Input */}
        <View className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 mb-6">
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
      </ScrollView>

      {/* Submit Button */}
      <View className="pt-2 pb-4">
        <Pressable
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          className="w-full bg-[#EDEDED] active:bg-zinc-300 h-14 rounded-full items-center justify-center shadow-lg"
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#09090B" />
          ) : (
            <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase">
              REGISTRAR MOVIMIENTO
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
