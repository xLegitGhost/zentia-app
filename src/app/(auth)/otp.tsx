import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export default function OtpScreen() {
  const router = useRouter();
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+52');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Teléfono requerido', 'Ingresa un número telefónico válido con lada (ej. +525512345678).');
      return;
    }
    try {
      setLoading(true);
      await requestOtp(phoneNumber);
      setStep('code');
      Alert.alert('Código enviado', 'En desarrollo, revisa la terminal del backend Spring Boot para ver tu código OTP de 6 dígitos.');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'No se pudo generar el código. Revisa que el backend esté activo.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (code.length !== 6) {
      Alert.alert('Código incompleto', 'El código OTP consta de 6 dígitos.');
      return;
    }
    try {
      setLoading(true);
      const res = await verifyOtp(phoneNumber, code);
      router.replace(res.onboardingCompleted ? '/(tabs)' : '/(onboarding)');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Código OTP inválido o expirado.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black justify-between px-6 py-6">
      {/* Top Header */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => (step === 'code' ? setStep('phone') : router.back())}
          className="p-2 -ml-2 active:opacity-70"
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </Pressable>
        <Text className="text-white text-xs font-bold tracking-[0.25em] uppercase opacity-70">
          Z E N T I A
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Center Form */}
      <View className="px-2">
        {step === 'phone' ? (
          <>
            <Text className="text-white text-2xl font-bold mb-2">
              Ingresa tu teléfono
            </Text>
            <Text className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Te enviaremos un código de seguridad de 6 dígitos para iniciar sesión de respaldo.
            </Text>

            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
              <Text className="text-zinc-500 text-xs mb-1 uppercase tracking-wider font-semibold">
                Número con lada internacional
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="+525512345678"
                placeholderTextColor="#71717A"
                className="text-white text-lg font-medium py-1"
                autoFocus
              />
            </View>
          </>
        ) : (
          <>
            <Text className="text-white text-2xl font-bold mb-2">
              Verifica el código
            </Text>
            <Text className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Ingresa el código OTP de 6 dígitos enviado a <Text className="text-white font-semibold">{phoneNumber}</Text>.
            </Text>

            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
              <Text className="text-zinc-500 text-xs mb-1 uppercase tracking-wider font-semibold">
                Código OTP (6 dígitos)
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor="#71717A"
                className="text-white text-2xl tracking-[0.4em] font-bold text-center py-2"
                autoFocus
              />
            </View>
          </>
        )}
      </View>

      {/* Bottom Action Button */}
      <View className="w-full pb-4">
        <Pressable
          onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
          className="w-full bg-[#EDEDED] active:bg-zinc-300 h-14 rounded-full items-center justify-center shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="#09090B" />
          ) : (
            <Text className="text-[#09090B] font-bold text-sm tracking-wider uppercase">
              {step === 'phone' ? 'SOLICITAR CÓDIGO' : 'VERIFICAR Y ENTRAR'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
