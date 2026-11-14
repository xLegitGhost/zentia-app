import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Camera, Check, Copy, ExternalLink, Sparkles, Tag } from 'lucide-react-native';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { SpringPressable } from '@/components/ui/SpringPressable';

export const KALURI_URL = 'https://kaluri.app';
export const KALURI_PROMO_CODE = 'URIEL15';

const SPLASH_MESSAGES = [
  'Also try Kaluri.app — IA para tus calorías',
  'Powered by the Kaluri.app family',
  'Cuidas tu cartera en Zentia · Cuidas tus macros en Kaluri.app',
  'Also try Kaluri.app — Reconoce comida mexicana con una foto',
];

interface KaluriSplashBannerProps {
  variant?: 'minimal' | 'card';
  seed?: number;
}

/**
 * Guiño estilo Minecraft/Terraria promoviendo la app hermana Kaluri.app.
 */
export const KaluriSplashBanner: React.FC<KaluriSplashBannerProps> = ({
  variant = 'minimal',
  seed = 0,
}) => {
  const message = useMemo(
    () => SPLASH_MESSAGES[Math.abs(seed) % SPLASH_MESSAGES.length],
    [seed]
  );

  if (variant === 'card') {
    return (
      <Pressable
        onPress={() => Linking.openURL(KALURI_URL)}
        className="bg-[#121214] border border-zinc-800/90 rounded-3xl p-4 mb-5 flex-row items-center justify-between active:opacity-80"
      >
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center mr-3">
            <Sparkles size={16} color="#FBBF24" />
          </View>
          <View className="flex-1">
            <Text className="text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              App Hermana • Kaluri.app
            </Text>
            <Text className="text-zinc-300 text-xs mt-0.5 leading-snug">
              {message}
            </Text>
          </View>
        </View>
        <ExternalLink size={15} color="#A1A1AA" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => Linking.openURL(KALURI_URL)}
      className="flex-row items-center justify-center py-1.5 px-3 rounded-full bg-zinc-900/70 border border-zinc-800/70 active:opacity-75"
    >
      <Sparkles size={11} color="#FBBF24" />
      <Text className="text-zinc-400 text-[11px] font-medium ml-1.5">
        {message}
      </Text>
    </Pressable>
  );
};

interface KaluriFoodHintProps {
  categoryName?: string;
  visible?: boolean;
}

const FOOD_OR_HEALTH_KEYWORDS = ['comida', 'restaurantes', 'salud', 'despensa', 'antojos'];

export const KaluriFoodHint: React.FC<KaluriFoodHintProps> = ({
  categoryName,
  visible = true,
}) => {
  if (!visible) return null;

  const lower = (categoryName ?? '').toLowerCase();
  const matches = FOOD_OR_HEALTH_KEYWORDS.some((kw) => lower.includes(kw));
  if (!matches) return null;

  return (
    <FadeSlideIn offsetY={8} className="mb-5">
      <SpringPressable
        onPress={() => Linking.openURL(KALURI_URL)}
        className="bg-emerald-950/35 border border-emerald-500/35 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
            <Camera size={16} color="#34D399" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Also try Kaluri.app
              </Text>
              <View className="bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                <Text className="text-emerald-300 text-[9px] font-bold">IA • MACROS</Text>
              </View>
            </View>
            <Text className="text-zinc-300 text-xs mt-0.5 leading-snug">
              Calcula calorías y macros de tu comida con una foto.
            </Text>
          </View>
        </View>
        <ExternalLink size={14} color="#34D399" />
      </SpringPressable>
    </FadeSlideIn>
  );
};

/**
 * Tarjeta promocional de la app hermana Kaluri.app para la pantalla de Perfil con código URIEL15.
 */
export const KaluriPromoCard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopyCode = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(KALURI_PROMO_CODE);
      } catch {
        // Ignorar si el navegador restringe portapapeles
      }
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 items-center justify-center mr-2">
            <Sparkles size={14} color="#FBBF24" />
          </View>
          <Text className="text-amber-300 text-[11px] font-bold uppercase tracking-wider">
            App Hermana • Kaluri.app
          </Text>
        </View>
        <Pressable
          onPress={() => Linking.openURL(KALURI_URL)}
          className="flex-row items-center px-2.5 py-1 rounded-full bg-[#27272A] active:opacity-80"
        >
          <Text className="text-[#22C55E] text-[11px] font-semibold mr-1">Abrir</Text>
          <ExternalLink size={11} color="#22C55E" />
        </Pressable>
      </View>

      <Text className="text-white text-base font-bold mb-1">
        Also try{' '}
        <Text
          className="text-zinc-500 text-sm font-medium line-through"
          style={{ textDecorationLine: 'line-through' }}
        >
          Terraria
        </Text>{' '}
        <Text className="text-amber-300 font-extrabold tracking-wide">
          KALURI.APP
        </Text>
      </Text>
      <Text className="text-zinc-400 text-xs leading-relaxed mb-4">
        Así como cuidas tus finanzas en Zentia, lleva tus calorías y macros con IA desde una foto de tu comida.
      </Text>

      <Pressable
        onPress={handleCopyCode}
        className="bg-[#18181B] border border-dashed border-amber-500/40 rounded-2xl px-4 py-3 flex-row items-center justify-between active:opacity-80"
      >
        <View className="flex-row items-center">
          <Tag size={15} color="#FBBF24" />
          <View className="ml-2.5">
            <Text className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
              Código de descuento
            </Text>
            <Text
              selectable
              className="text-white text-sm font-extrabold tracking-widest mt-0.5"
            >
              {KALURI_PROMO_CODE}
            </Text>
          </View>
        </View>

        <View
          className={`flex-row items-center px-3 py-1.5 rounded-full ${
            copied ? 'bg-emerald-950/80 border border-emerald-700' : 'bg-[#27272A]'
          }`}
        >
          {copied ? (
            <>
              <Check size={12} color="#22C55E" />
              <Text className="text-[#22C55E] text-[11px] font-bold ml-1">Copiado</Text>
            </>
          ) : (
            <>
              <Copy size={12} color="#E4E4E7" />
              <Text className="text-zinc-200 text-[11px] font-semibold ml-1">Copiar</Text>
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
};
