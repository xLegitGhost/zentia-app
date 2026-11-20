import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Globe, RefreshCw, WifiOff } from 'lucide-react-native';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import {
  SUPPORTED_TARGET_CURRENCIES,
  SupportedTargetCurrency,
  convertFromMxn,
  formatForeignCurrency,
  formatInverseMxnRate,
} from '@/services/exchangeRates';
import { SkeletonBox } from '@/components/ui/Skeleton';

interface ExchangeRateCardProps {
  balanceActual: number;
}

function formatUtcTimestampShort(updatedAtUtc: string | null): string | null {
  if (!updatedAtUtc) return null;
  const parsed = new Date(updatedAtUtc);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

export const ExchangeRateCard: React.FC<ExchangeRateCardProps> = ({ balanceActual }) => {
  const [hasMounted, setHasMounted] = useState(Platform.OS !== 'web');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedTargetCurrency>('USD');
  const { data, rates, updatedAtUtc, isLoading, isFetching, isError, isUsingCacheFallback, refetch } =
    useExchangeRates();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || isLoading) {
    return (
      <View
        testID="exchange-rate-skeleton"
        className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 mb-5"
      >
        <View className="flex-row items-center justify-between mb-3">
          <SkeletonBox className="w-36 h-4 rounded-full" />
          <SkeletonBox className="w-28 h-6 rounded-full" />
        </View>
        <SkeletonBox className="w-44 h-7 rounded-lg mb-3" />
        <View className="flex-row justify-between pt-3 border-t border-zinc-800/70">
          <SkeletonBox className="w-24 h-3 rounded-full" />
          <SkeletonBox className="w-24 h-3 rounded-full" />
          <SkeletonBox className="w-24 h-3 rounded-full" />
        </View>
      </View>
    );
  }

  if (!data || !rates) {
    return (
      <View
        testID="exchange-rate-offline"
        className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 mb-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-9 h-9 rounded-xl bg-[#121214] border border-zinc-800/80 items-center justify-center mr-3">
              <WifiOff size={16} color="#A1A1AA" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">Tipo de Cambio • MXN</Text>
              <Text className="text-zinc-400 text-xs mt-0.5">
                {isError
                  ? 'Sin conexión al servicio de divisas (open.er-api.com) y sin caché local.'
                  : 'Tasas de cambio no disponibles en este momento.'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              void refetch();
            }}
            disabled={isFetching}
            className="bg-[#27272A] px-3 py-1.5 rounded-full active:opacity-80 flex-row items-center"
          >
            {isFetching ? (
              <ActivityIndicator size="small" color="#22C55E" />
            ) : (
              <Text className="text-[#22C55E] text-xs font-semibold">Reintentar</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  const safeBalance = Number.isFinite(balanceActual) ? balanceActual : 0;
  const selectedRate = rates[selectedCurrency];
  const convertedBalance = convertFromMxn(safeBalance, selectedRate);
  const shortDate = formatUtcTimestampShort(updatedAtUtc);

  return (
    <View
      testID="exchange-rate-card"
      className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 mb-5"
    >
      {/* Header + Segmented Currency Selector */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Globe size={16} color="#22C55E" />
          <Text className="text-white text-sm font-semibold ml-2">Tipo de Cambio</Text>
        </View>

        <View className="flex-row bg-[#121214] border border-zinc-800/80 rounded-full p-0.5">
          {SUPPORTED_TARGET_CURRENCIES.map((currency) => {
            const isActive = selectedCurrency === currency;
            return (
              <Pressable
                key={currency}
                testID={`fx-currency-${currency}`}
                accessibilityRole="button"
                onPress={() => setSelectedCurrency(currency)}
                className={`px-2.5 py-1 rounded-full ${
                  isActive ? 'bg-[#27272A]' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isActive ? 'text-[#22C55E]' : 'text-zinc-400'
                  }`}
                >
                  {currency}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Balance Equivalency + Active Inverse Reference Rate */}
      <View className="flex-row items-end justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-zinc-400 text-xs mb-0.5">
            Balance equivalente en {selectedCurrency}
          </Text>
          <Text
            testID="exchange-rate-converted-balance"
            className="text-white text-xl font-extrabold tracking-tight"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {convertedBalance !== null
              ? formatForeignCurrency(convertedBalance, selectedCurrency)
              : '--'}
          </Text>
        </View>

        <View className="bg-[#121214] border border-zinc-800/80 rounded-xl px-2.5 py-1.5 items-end">
          <Text
            testID="exchange-rate-reference"
            className="text-[#22C55E] text-xs font-bold"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatInverseMxnRate(selectedCurrency, selectedRate)}
          </Text>
        </View>
      </View>

      {/* USD / EUR / CAD Reference Strip */}
      <View className="flex-row items-center justify-between bg-[#121214] border border-zinc-800/70 rounded-xl px-3 py-2 mb-2.5">
        {SUPPORTED_TARGET_CURRENCIES.map((currency) => {
          const isSelected = currency === selectedCurrency;
          const rate = rates[currency];
          return (
            <Pressable
              key={currency}
              onPress={() => setSelectedCurrency(currency)}
              className="flex-1 items-center active:opacity-75"
            >
              <Text
                className={`text-[10px] font-semibold uppercase ${
                  isSelected ? 'text-[#22C55E]' : 'text-zinc-500'
                }`}
              >
                {currency}
              </Text>
              <Text
                className={`text-[11px] font-bold mt-0.5 ${
                  isSelected ? 'text-white' : 'text-zinc-300'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatInverseMxnRate(currency, rate).replace(`1 ${currency} = `, '').replace(' MXN', '')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Footer Note & Manual Refresh */}
      <View className="flex-row items-center justify-between">
        <Text className="text-zinc-500 text-[11px] flex-1 mr-2">
          {isUsingCacheFallback
            ? `Modo offline • Caché local${shortDate ? ` (${shortDate})` : ''}`
            : `ExchangeRate-API${shortDate ? ` • Act. ${shortDate}` : ''}`}
        </Text>

        <Pressable
          testID="exchange-rate-refresh"
          accessibilityRole="button"
          onPress={() => {
            void refetch();
          }}
          disabled={isFetching}
          className="flex-row items-center py-0.5 px-1.5 rounded-md active:opacity-70"
        >
          {isFetching ? (
            <ActivityIndicator size="small" color="#22C55E" />
          ) : (
            <>
              <RefreshCw size={11} color="#71717A" />
              <Text className="text-zinc-400 text-[11px] font-medium ml-1">Actualizar</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default ExchangeRateCard;
