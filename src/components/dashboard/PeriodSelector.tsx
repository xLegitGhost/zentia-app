import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { DateRange, PeriodKey } from '@/hooks/useDashboard';

interface PeriodSelectorProps {
  selectedPeriod: PeriodKey;
  customRange: DateRange;
  onSelectPeriod: (period: PeriodKey) => void;
  onApplyCustomRange: (range: DateRange) => void;
}

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'current_month', label: 'Este Mes' },
  { key: 'previous_month', label: 'Mes Anterior' },
  { key: 'custom', label: 'Personalizado' },
];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  customRange,
  onSelectPeriod,
  onApplyCustomRange,
}) => {
  const [draftStart, setDraftStart] = useState(customRange.startDate);
  const [draftEnd, setDraftEnd] = useState(customRange.endDate);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const handleApply = () => {
    if (!ISO_DATE_REGEX.test(draftStart) || !ISO_DATE_REGEX.test(draftEnd)) {
      setRangeError('Usa formato YYYY-MM-DD');
      return;
    }
    if (draftStart > draftEnd) {
      setRangeError('La fecha inicial debe ser menor o igual a la final');
      return;
    }
    setRangeError(null);
    onApplyCustomRange({ startDate: draftStart, endDate: draftEnd });
  };

  return (
    <View className="mb-5">
      <View className="flex-row bg-[#121214] border border-zinc-800 rounded-full p-1 gap-1">
        {PERIOD_OPTIONS.map((opt) => {
          const isActive = selectedPeriod === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelectPeriod(opt.key)}
              className={`flex-1 py-2 px-3 rounded-full items-center justify-center flex-row ${
                isActive ? 'bg-[#27272A]' : 'bg-transparent'
              }`}
            >
              {opt.key === 'custom' ? (
                <Calendar
                  size={12}
                  color={isActive ? '#22C55E' : '#71717A'}
                  style={{ marginRight: 5 }}
                />
              ) : null}
              <Text
                numberOfLines={1}
                className={`text-xs font-semibold ${
                  isActive ? 'text-[#22C55E]' : 'text-zinc-400'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedPeriod === 'custom' ? (
        <View className="mt-3 bg-[#121214] border border-zinc-800 rounded-2xl p-3">
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Text className="text-zinc-500 text-[10px] uppercase mb-1">Inicio</Text>
              <TextInput
                value={draftStart}
                onChangeText={setDraftStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#52525B"
                className="bg-[#27272A] text-white text-xs rounded-xl px-3 py-2 font-medium"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-500 text-[10px] uppercase mb-1">Fin</Text>
              <TextInput
                value={draftEnd}
                onChangeText={setDraftEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#52525B"
                className="bg-[#27272A] text-white text-xs rounded-xl px-3 py-2 font-medium"
              />
            </View>
            <Pressable
              onPress={handleApply}
              className="mt-4 bg-[#22C55E] rounded-xl px-3 py-2 active:opacity-80"
            >
              <Text className="text-black text-xs font-bold">Aplicar</Text>
            </Pressable>
          </View>
          {rangeError ? (
            <Text className="text-red-400 text-[11px] mt-2">{rangeError}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default PeriodSelector;
