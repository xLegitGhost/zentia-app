import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { TransactionType } from '@/types/api';

interface SegmentedTypeControlProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export const SegmentedTypeControl: React.FC<SegmentedTypeControlProps> = ({ value, onChange }) => {
  const isExpense = value === 'EXPENSE' || value === 'GASTO';

  return (
    <View className="flex-row bg-[#18181B] p-1.5 rounded-full border border-zinc-800 mb-6">
      <Pressable
        onPress={() => onChange('EXPENSE')}
        className={`flex-1 py-3 rounded-full items-center justify-center transition-colors ${
          isExpense ? 'bg-[#27272A] shadow-sm' : ''
        }`}
      >
        <Text
          className={`text-xs font-bold tracking-wider uppercase ${
            isExpense ? 'text-red-400' : 'text-zinc-500'
          }`}
        >
          Gasto
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('INCOME')}
        className={`flex-1 py-3 rounded-full items-center justify-center transition-colors ${
          !isExpense ? 'bg-[#27272A] shadow-sm' : ''
        }`}
      >
        <Text
          className={`text-xs font-bold tracking-wider uppercase ${
            !isExpense ? 'text-[#22C55E]' : 'text-zinc-500'
          }`}
        >
          Ingreso
        </Text>
      </Pressable>
    </View>
  );
};

export default SegmentedTypeControl;
