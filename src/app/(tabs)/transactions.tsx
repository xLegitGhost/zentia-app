import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black px-6 pt-4">
      <Text className="text-white text-2xl font-bold mb-2">
        Historial de Movimientos
      </Text>
      <Text className="text-zinc-400 text-xs mb-6">
        Filtra y revisa cada ingreso o gasto registrado.
      </Text>

      <View className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 items-center justify-center">
        <Text className="text-zinc-500 text-sm">
          Cargando catálogo e historial...
        </Text>
      </View>
    </SafeAreaView>
  );
}
