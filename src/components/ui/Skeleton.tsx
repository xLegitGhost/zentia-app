import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, View, ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(Animated.View, { className: 'style' });

interface SkeletonBoxProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Primitiva base de skeleton con pulso suave a 60 FPS para superficies OLED.
 */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ className = '', style }) => {
  const pulse = useRef(new Animated.Value(0.85)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 780,
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 780,
          useNativeDriver,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, useNativeDriver]);

  return (
    <Animated.View
      className={`bg-[#27272A] rounded-lg ${className}`}
      style={[{ opacity: pulse }, style]}
    />
  );
};

export const BalanceCardSkeleton: React.FC = () => (
  <View
    testID="balance-card-skeleton"
    className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 mb-5"
  >
    <SkeletonBox className="w-36 h-3 rounded-full mb-3" />
    <SkeletonBox className="w-44 h-9 rounded-xl mb-5" />
    <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/80">
      <View className="flex-row items-center">
        <SkeletonBox className="w-8 h-8 rounded-full mr-2.5" />
        <View>
          <SkeletonBox className="w-20 h-2.5 rounded-full mb-1.5" />
          <SkeletonBox className="w-24 h-4 rounded-md" />
        </View>
      </View>
      <View className="flex-row items-center">
        <View className="items-end mr-2.5">
          <SkeletonBox className="w-20 h-2.5 rounded-full mb-1.5" />
          <SkeletonBox className="w-24 h-4 rounded-md" />
        </View>
        <SkeletonBox className="w-8 h-8 rounded-full" />
      </View>
    </View>
  </View>
);

export const SavingsGoalSkeleton: React.FC = () => (
  <View
    testID="savings-goal-skeleton"
    className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 mb-6"
  >
    <View className="flex-row items-center justify-between mb-3">
      <SkeletonBox className="w-40 h-4 rounded-full" />
      <SkeletonBox className="w-10 h-4 rounded-full" />
    </View>
    <SkeletonBox className="w-full h-2 rounded-full my-2" />
    <View className="flex-row justify-between items-center mt-2">
      <SkeletonBox className="w-28 h-3 rounded-full" />
      <SkeletonBox className="w-28 h-3 rounded-full" />
    </View>
  </View>
);

interface TransactionListSkeletonProps {
  count?: number;
  variant?: 'grouped' | 'cards';
}

export const TransactionListSkeleton: React.FC<TransactionListSkeletonProps> = ({
  count = 4,
  variant = 'grouped',
}) => {
  const rows = Array.from({ length: count }, (_, idx) => idx);

  if (variant === 'cards') {
    return (
      <View testID="transactions-cards-skeleton" className="pt-2">
        <View className="flex-row items-center justify-between mb-3">
          <SkeletonBox className="w-24 h-3 rounded-full" />
          <SkeletonBox className="w-16 h-3 rounded-full" />
        </View>
        {rows.map((idx) => (
          <View
            key={idx}
            className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <SkeletonBox className="w-10 h-10 rounded-xl mr-3" />
              <View className="flex-1">
                <SkeletonBox className="w-32 h-3.5 rounded-md mb-1.5" />
                <SkeletonBox className="w-24 h-2.5 rounded-full" />
              </View>
            </View>
            <View className="items-end">
              <SkeletonBox className="w-16 h-4 rounded-md mb-2" />
              <View className="flex-row gap-2">
                <SkeletonBox className="w-6 h-6 rounded-lg" />
                <SkeletonBox className="w-6 h-6 rounded-lg" />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      testID="recent-transactions-skeleton"
      className="bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden"
    >
      {rows.map((idx) => (
        <View
          key={idx}
          className={`flex-row items-center justify-between px-4 py-3.5 ${
            idx < rows.length - 1 ? 'border-b border-zinc-800/70' : ''
          }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <SkeletonBox className="w-10 h-10 rounded-xl mr-3" />
            <View className="flex-1">
              <SkeletonBox className="w-36 h-3.5 rounded-md mb-1.5" />
              <SkeletonBox className="w-24 h-2.5 rounded-full" />
            </View>
          </View>
          <SkeletonBox className="w-16 h-4 rounded-md" />
        </View>
      ))}
    </View>
  );
};

export default SkeletonBox;
