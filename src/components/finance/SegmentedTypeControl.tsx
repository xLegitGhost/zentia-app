import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, Pressable, Text, View } from 'react-native';
import { TransactionType } from '@/types/api';

interface SegmentedTypeControlProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

/**
 * Control segmentado estilo iOS UISegmentedControl con indicador deslizante spring.
 */
export const SegmentedTypeControl: React.FC<SegmentedTypeControlProps> = ({ value, onChange }) => {
  const isExpense = value === 'EXPENSE' || value === 'GASTO';
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (segmentWidth <= 0) return;
    Animated.spring(translateX, {
      toValue: isExpense ? 0 : segmentWidth,
      damping: 22,
      stiffness: 260,
      mass: 0.7,
      useNativeDriver,
    }).start();
  }, [isExpense, segmentWidth, translateX, useNativeDriver]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const innerWidth = e.nativeEvent.layout.width - 12; // p-1.5 -> 6px * 2
    if (innerWidth > 0) {
      const nextWidth = innerWidth / 2;
      setSegmentWidth(nextWidth);
      translateX.setValue(isExpense ? 0 : nextWidth);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      className="flex-row bg-[#18181B] p-1.5 rounded-full border border-zinc-800/90 mb-6 relative"
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 6,
            bottom: 6,
            left: 6,
            width: segmentWidth,
            borderRadius: 999,
            backgroundColor: '#27272A',
            transform: [{ translateX }],
          }}
        />
      ) : null}

      <Pressable
        onPress={() => onChange('EXPENSE')}
        className="flex-1 py-3 rounded-full items-center justify-center"
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
        className="flex-1 py-3 rounded-full items-center justify-center"
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
