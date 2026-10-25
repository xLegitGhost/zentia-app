import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface MoneyInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChangeText,
  label = 'Monto del Movimiento',
}) => {
  return (
    <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 mb-6 items-center">
      <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
        {label}
      </Text>
      <View className="flex-row items-center">
        <Text className="text-white text-4xl font-extrabold mr-1.5">$</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#52525B"
          className="text-white text-4xl font-extrabold text-center min-w-[120px]"
          autoFocus
        />
      </View>
    </View>
  );
};

export default MoneyInput;
