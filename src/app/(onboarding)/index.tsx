import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { useCategories } from '@/hooks/useCategories';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SpringPressable } from '@/components/ui/SpringPressable';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ArrowLeft, Check } from 'lucide-react-native';

const GOALS = [
  'Ahorrar más cada mes',
  'Controlar y recortar gastos hormiga',
  'Crear fondo de emergencia',
  'Monitorear balance de ingresos vs gastos',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { saveProfile } = useFinancialProfile();
  const { categories: expenseCategories } = useCategories('EXPENSE');

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [income, setIncome] = useState('25000');
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedGoal, setSelectedGoal] = useState(GOALS[0]);

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as any);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = async () => {
    try {
      await saveProfile({
        monthlyIncome: Number(income) || 25000,
        monthlySavingsGoal: (Number(income) || 25000) * 0.2, // Meta sugerida del 20%
        priorityCategoryId: selectedCategory,
      });
    } catch (e) {
      console.warn('Error guardando perfil financiero:', e);
    }
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-6 py-4">
      <KeyboardAvoidingView
        className="flex-1 justify-between"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      {/* Brand Header */}
      <View className="flex-row items-center justify-between mb-4">
        {step > 1 && step < 4 ? (
          <Pressable
            onPress={() => setStep((step - 1) as any)}
            className="p-2 -ml-2 active:opacity-70"
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
        <Text className="text-white text-xs font-bold tracking-[0.25em] uppercase opacity-70">
          Z E N T I A
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Main Content Area */}
      {step < 4 ? (
        <View className="flex-1 bg-[#121214] rounded-3xl p-6 justify-between border border-zinc-800/60 shadow-2xl">
          {/* Progress Indicator (Figma 3-segments) */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-sm font-semibold tracking-wide">
                Queremos conocerte
              </Text>
              <Text className="text-zinc-500 text-xs font-medium">
                Paso {step}/3
              </Text>
            </View>

            <View className="flex-row items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${
                    s <= step ? 'bg-[#22C55E]' : 'bg-[#27272A]'
                  }`}
                />
              ))}
            </View>

            {/* Step 1: Ingreso Mensual */}
            {step === 1 && (
              <FadeSlideIn key="step-1">
                <Text className="text-white text-xl font-bold mb-2">
                  ¿Cuál es tu ingreso neto mensual aproximado?
                </Text>
                <Text className="text-zinc-400 text-xs mb-8 leading-relaxed">
                  Esto nos ayuda a calcular tus presupuestos y balance mensual recomendado.
                </Text>

                <View className="bg-[#27272A] rounded-2xl p-5 border border-zinc-700/60 items-center justify-center">
                  <Text className="text-zinc-400 text-xs mb-1 font-medium">
                    Ingreso mensual estimado
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-white text-3xl font-extrabold mr-1">$</Text>
                    <TextInput
                      value={income}
                      onChangeText={setIncome}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={handleNext}
                      placeholder="0.00"
                      placeholderTextColor="#71717A"
                      className="text-white text-3xl font-extrabold text-center min-w-[140px]"
                      style={{ fontVariant: ['tabular-nums'] }}
                      autoFocus
                    />
                  </View>
                </View>
              </FadeSlideIn>
            )}

            {/* Step 2: Categorías de Gasto Prioritarias (Catálogo real del backend) */}
            {step === 2 && (
              <FadeSlideIn key="step-2">
                <Text className="text-white text-xl font-bold mb-2">
                  ¿En qué sueles gastar más cada mes?
                </Text>
                <Text className="text-zinc-400 text-xs mb-6 leading-relaxed">
                  Selecciona la categoría principal para configurar tus alertas.
                </Text>

                <ScrollView className="max-h-[260px]" showsVerticalScrollIndicator={false}>
                  {expenseCategories.map((cat) => {
                    const active = selectedCategory === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.id)}
                        className={`p-4 rounded-2xl mb-2.5 flex-row items-center justify-between border ${
                          active
                            ? 'bg-[#27272A] border-[#22C55E]'
                            : 'bg-[#18181B] border-zinc-800/80'
                        }`}
                      >
                        <View className="flex-row items-center flex-1 mr-2">
                          <CategoryIcon
                            iconKey={cat.iconKey || cat.icon}
                            size={16}
                            color={active ? '#22C55E' : '#71717A'}
                          />
                          <Text
                            className={`text-sm font-medium ml-3 ${
                              active ? 'text-white' : 'text-zinc-400'
                            }`}
                          >
                            {cat.name}
                          </Text>
                        </View>
                        {active && <Check size={18} color="#22C55E" />}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </FadeSlideIn>
            )}

            {/* Step 3: Meta Principal */}
            {step === 3 && (
              <FadeSlideIn key="step-3">
                <Text className="text-white text-xl font-bold mb-2">
                  ¿Cuál es tu meta principal con Zentia?
                </Text>
                <Text className="text-zinc-400 text-xs mb-6 leading-relaxed">
                  Personalizaremos tu dashboard en base a este objetivo.
                </Text>

                <ScrollView className="max-h-[260px]" showsVerticalScrollIndicator={false}>
                  {GOALS.map((goal) => (
                    <Pressable
                      key={goal}
                      onPress={() => setSelectedGoal(goal)}
                      className={`p-4 rounded-2xl mb-2.5 flex-row items-center justify-between border ${
                        selectedGoal === goal
                          ? 'bg-[#27272A] border-[#22C55E]'
                          : 'bg-[#18181B] border-zinc-800/80'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium flex-1 pr-2 ${
                          selectedGoal === goal ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {goal}
                      </Text>
                      {selectedGoal === goal && <Check size={18} color="#22C55E" />}
                    </Pressable>
                  ))}
                </ScrollView>
              </FadeSlideIn>
            )}
          </View>

          {/* Step Button */}
          <SpringPressable
            onPress={handleNext}
            className="w-full bg-[#EDEDED] h-14 rounded-full items-center justify-center mt-4"
          >
            <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase">
              CONTINUAR
            </Text>
          </SpringPressable>
        </View>
      ) : (
        /* Screen 6: Success Screen ("¡Todo listo!") */
        <FadeSlideIn className="flex-1 justify-between items-center py-6">
          <View className="items-center w-full pt-8">
            <View className="w-20 h-20 rounded-full bg-[#27272A] items-center justify-center mb-6 border border-zinc-800">
              <Check size={40} color="#22C55E" strokeWidth={3} />
            </View>

            <Text className="text-white text-3xl font-extrabold mb-8 text-center">
              ¡Todo listo!
            </Text>

            <View className="w-full bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-6 h-6 rounded-full bg-emerald-950/80 items-center justify-center mr-3">
                  <Check size={14} color="#22C55E" strokeWidth={2.5} />
                </View>
                <Text className="text-zinc-200 text-sm font-medium">
                  Ingreso mensual registrado (${Number(income).toLocaleString()})
                </Text>
              </View>

              <View className="flex-row items-center mb-4">
                <View className="w-6 h-6 rounded-full bg-emerald-950/80 items-center justify-center mr-3">
                  <Check size={14} color="#22C55E" strokeWidth={2.5} />
                </View>
                <Text className="text-zinc-200 text-sm font-medium">
                  Categorías prioritarias asignadas
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-emerald-950/80 items-center justify-center mr-3">
                  <Check size={14} color="#22C55E" strokeWidth={2.5} />
                </View>
                <Text className="text-zinc-200 text-sm font-medium">
                  Meta de ahorro activada
                </Text>
              </View>
            </View>
          </View>

          <SpringPressable
            onPress={handleFinish}
            className="w-full bg-[#EDEDED] h-14 rounded-full items-center justify-center mb-4 shadow-lg"
          >
            <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase">
              ENTRAR A ZENTIA
            </Text>
          </SpringPressable>
        </FadeSlideIn>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
