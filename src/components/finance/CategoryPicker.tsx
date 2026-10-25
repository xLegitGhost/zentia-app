import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { CategoryResponse } from '@/types/api';
import { CategoryIcon } from '@/components/CategoryIcon';

interface CategoryPickerProps {
  categories: CategoryResponse[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  return (
    <View className="mb-6">
      <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
        Selecciona Categoría
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
        <View className="flex-row gap-3">
          {categories.map((cat) => {
            const isSelected = selectedId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => onSelect(cat.id)}
                className={`items-center justify-center p-3 rounded-2xl border min-w-[84px] ${
                  isSelected
                    ? 'bg-[#27272A] border-[#22C55E]'
                    : 'bg-[#121214] border-zinc-800/80 active:bg-zinc-900'
                }`}
              >
                <View className="mb-2">
                  <CategoryIcon
                    iconKey={cat.iconKey || cat.icon}
                    size={22}
                    color={isSelected ? '#22C55E' : '#A1A1AA'}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  className={`text-[11px] font-medium text-center ${
                    isSelected ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default CategoryPicker;
