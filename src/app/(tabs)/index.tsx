import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HelpCircle, Plus, Target } from 'lucide-react-native';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { useCategories } from '@/hooks/useCategories';
import {
  DateRange,
  getPeriodDateRange,
  PeriodKey,
  useDashboardSummary,
} from '@/hooks/useDashboard';
import { storage } from '@/services/storage';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { ExchangeRateCard } from '@/components/dashboard/ExchangeRateCard';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { GuidedTutorialCard } from '@/components/dashboard/GuidedTutorialCard';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { SpringPressable } from '@/components/ui/SpringPressable';
import {
  BalanceCardSkeleton,
  SavingsGoalSkeleton,
} from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/currency';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  current_month: 'Este Mes',
  previous_month: 'Mes Anterior',
  custom: 'Rango Personalizado',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, isLoading: isProfileLoading } = useFinancialProfile();
  const { allCategories } = useCategories();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('current_month');
  const [customRange, setCustomRange] = useState<DateRange>(() =>
    getPeriodDateRange('current_month')
  );
  const [tutorialDismissed, setTutorialDismissed] = useState(true);
  const [forceTutorial, setForceTutorial] = useState(false);

  useEffect(() => {
    storage.getTutorialDismissed().then((dismissed) => {
      setTutorialDismissed(dismissed);
    });
  }, []);

  const activeRange = useMemo(
    () => getPeriodDateRange(selectedPeriod, customRange),
    [selectedPeriod, customRange]
  );

  const {
    summary,
    transactions,
    isLoading,
    isFetching,
    hasSummaryData,
    hasHistoryData,
    refetch,
  } = useDashboardSummary(activeRange.startDate, activeRange.endDate);

  const savingsGoal = profile?.monthlySavingsGoal || 5000;
  const effectiveSavingsBase =
    summary.balanceActual > 0
      ? summary.balanceActual
      : Math.max(0, (profile?.monthlyIncome ?? 0) - summary.totalGastos);

  const savingsProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((effectiveSavingsBase / savingsGoal) * 100))
  );

  const periodSubtitle =
    selectedPeriod === 'custom'
      ? `${activeRange.startDate} → ${activeRange.endDate}`
      : PERIOD_LABELS[selectedPeriod];

  const showTutorial =
    forceTutorial || (!isLoading && transactions.length === 0 && !tutorialDismissed);

  const handleDismissTutorial = async () => {
    setForceTutorial(false);
    setTutorialDismissed(true);
    await storage.setTutorialDismissed(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-6 pt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#22C55E"
            colors={['#22C55E']}
          />
        }
      >
        {/* Top Brand Bar */}
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-white text-xs font-bold tracking-[0.25em] uppercase opacity-70">
            Z E N T I A
          </Text>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setForceTutorial((prev) => !prev)}
              className={`w-7 h-7 rounded-full border items-center justify-center active:opacity-75 ${
                showTutorial
                  ? 'bg-emerald-950/70 border-emerald-700'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <HelpCircle size={14} color={showTutorial ? '#22C55E' : '#A1A1AA'} />
            </Pressable>

            <View className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 flex-row items-center">
              <View
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  summary.isDemoData ? 'bg-amber-400' : 'bg-[#22C55E]'
                }`}
              />
              <Text className="text-zinc-400 text-xs font-medium">
                {summary.isDemoData ? 'Modo Demo' : 'En línea'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tutorial guiado (automático si no hay movimientos, o activado con ?) */}
        {showTutorial ? (
          <GuidedTutorialCard
            hasTransactions={transactions.length > 0}
            totalIngresos={summary.totalIngresos}
            totalGastos={summary.totalGastos}
            balanceActual={summary.balanceActual}
            savingsGoal={savingsGoal}
            onDismiss={handleDismissTutorial}
            onQuickAdd={() => router.push('/(modal)/new-transaction')}
          />
        ) : null}

        {/* Period Selector (TASK-303) */}
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          customRange={customRange}
          onSelectPeriod={setSelectedPeriod}
          onApplyCustomRange={(range) => {
            setCustomRange(range);
            setSelectedPeriod('custom');
          }}
        />

        {/* Balance Card (TASK-302) */}
        {!hasSummaryData && isLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <FadeSlideIn delay={40}>
            <BalanceCard
              balanceActual={summary.balanceActual}
              totalIngresos={summary.totalIngresos}
              totalGastos={summary.totalGastos}
              isFetching={isFetching}
              periodLabel={periodSubtitle}
            />
          </FadeSlideIn>
        )}

        {/* Public FX Reference & Conversion Card */}
        <FadeSlideIn delay={70}>
          <ExchangeRateCard balanceActual={summary.balanceActual} />
        </FadeSlideIn>

        {/* Savings Goal Card (Hexagonal In-Memory Feature) */}
        {!profile && isProfileLoading ? (
          <SavingsGoalSkeleton />
        ) : (
          <FadeSlideIn delay={90}>
            <View className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Target size={18} color="#22C55E" />
                  <Text className="text-white text-sm font-semibold ml-2">
                    Meta de Ahorro Mensual
                  </Text>
                </View>
                <Text
                  className="text-[#22C55E] text-xs font-bold"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {savingsProgressPercent}%
                </Text>
              </View>

              <View className="h-2 bg-[#27272A] rounded-full overflow-hidden my-2">
                <View
                  style={{ width: `${savingsProgressPercent}%` }}
                  className="h-full bg-[#22C55E] rounded-full"
                />
              </View>

              <View className="flex-row justify-between items-center mt-1">
                <Text
                  className="text-zinc-400 text-xs"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  Objetivo: {formatCurrency(savingsGoal)}
                </Text>
                <Text
                  className="text-zinc-500 text-[11px]"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  Base actual: {formatCurrency(effectiveSavingsBase)}
                </Text>
              </View>
            </View>
          </FadeSlideIn>
        )}

        {/* Recent Transactions Preview (TASK-304) */}
        <FadeSlideIn delay={140}>
          <RecentTransactions
            transactions={transactions}
            categories={allCategories}
            isLoading={!hasHistoryData && isLoading}
            onViewAll={() => router.push('/(tabs)/transactions')}
            onAddFirst={() => router.push('/(modal)/new-transaction')}
          />
        </FadeSlideIn>
      </ScrollView>

      {/* Floating Add Action Button */}
      <SpringPressable
        onPress={() => router.push('/(modal)/new-transaction')}
        scaleTo={0.93}
        className="w-14 h-14 bg-[#22C55E] rounded-full items-center justify-center shadow-2xl"
        style={{ position: 'absolute', bottom: 24, right: 24 }}
      >
        <Plus size={26} color="#000000" strokeWidth={2.5} />
      </SpringPressable>
    </SafeAreaView>
  );
}
