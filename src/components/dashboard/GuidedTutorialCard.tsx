import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Calendar,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Target,
  Wallet,
  X,
} from 'lucide-react-native';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { formatCurrency } from '@/utils/currency';

interface GuidedTutorialCardProps {
  hasTransactions: boolean;
  totalIngresos: number;
  totalGastos: number;
  balanceActual: number;
  savingsGoal: number;
  onDismiss: () => void;
  onQuickAdd: () => void;
}

export const GuidedTutorialCard: React.FC<GuidedTutorialCardProps> = ({
  hasTransactions,
  totalIngresos,
  totalGastos,
  balanceActual,
  savingsGoal,
  onDismiss,
  onQuickAdd,
}) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '1. Filtra tu periodo',
      icon: Calendar,
      hint: 'Usa la barra superior ("Este Mes", "Mes Anterior" o "Personalizado") para actualizar métricas e historial al instante sin recargar.',
    },
    {
      title: '2. Tu Balance Neto en vivo',
      icon: Wallet,
      hint: hasTransactions
        ? `Actualmente llevas ${formatCurrency(totalIngresos, true)} de ingresos y -${formatCurrency(Math.abs(totalGastos))} de gastos (${formatCurrency(balanceActual)} netos).`
        : 'En cuanto agregues tu primer ingreso o gasto verás aquí el cálculo automático de Ingresos − Gastos.',
    },
    {
      title: '3. Meta de Ahorro Mensual',
      icon: Target,
      hint: `Tu objetivo configurado es ${formatCurrency(savingsGoal)}. Cada movimiento impacta directamente este porcentaje para ayudarte a mantener el rumbo.`,
    },
    {
      title: '4. Registra, edita o corrige rápido',
      icon: PlusCircle,
      hint: 'Toca el botón verde "+" para registrar un movimiento nuevo, o entra a Movimientos para editar categoría/monto o eliminar cualquier registro.',
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <FadeSlideIn className="mb-5">
      <View className="bg-[#18181B] border border-emerald-500/35 rounded-3xl p-4">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-800/70 items-center justify-center mr-2.5">
              <Sparkles size={14} color="#22C55E" />
            </View>
            <Text className="text-[#22C55E] text-[11px] font-bold uppercase tracking-wider">
              Guía Rápida • {step + 1}/{steps.length}
            </Text>
          </View>

          <Pressable onPress={onDismiss} className="p-1 active:opacity-70">
            <X size={16} color="#71717A" />
          </Pressable>
        </View>

        <View className="flex-row items-start mb-3">
          <View className="w-8 h-8 rounded-xl bg-[#27272A] items-center justify-center mr-3 mt-0.5">
            <Icon size={16} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-bold mb-1">{current.title}</Text>
            <Text className="text-zinc-400 text-xs leading-relaxed">{current.hint}</Text>
          </View>
        </View>

        {/* Progress Dots + Actions */}
        <View className="flex-row items-center justify-between pt-2 border-t border-zinc-800/80">
          <View className="flex-row items-center gap-1.5">
            {steps.map((_, idx) => (
              <Pressable key={idx} onPress={() => setStep(idx)}>
                <View
                  className={`h-1.5 rounded-full ${
                    idx === step ? 'w-5 bg-[#22C55E]' : 'w-1.5 bg-zinc-700'
                  }`}
                />
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center gap-2">
            {!hasTransactions && isLast ? (
              <Pressable
                onPress={() => {
                  onDismiss();
                  onQuickAdd();
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#22C55E] active:opacity-80"
              >
                <Text className="text-black text-xs font-bold">Registrar ahora</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => (isLast ? onDismiss() : setStep(step + 1))}
                className="px-3.5 py-1.5 rounded-full bg-[#27272A] flex-row items-center active:opacity-80"
              >
                <Text className="text-white text-xs font-semibold mr-1">
                  {isLast ? 'Entendido' : 'Siguiente'}
                </Text>
                {!isLast ? <ChevronRight size={13} color="#22C55E" /> : null}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </FadeSlideIn>
  );
};

export default GuidedTutorialCard;
