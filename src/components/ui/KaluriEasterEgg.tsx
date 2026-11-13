import React, { useMemo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { ExternalLink, Sparkles } from 'lucide-react-native';

export const KALURI_URL = 'https://kaluri.app';

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
}

const FOOD_OR_HEALTH_KEYWORDS = ['comida', 'restaurantes', 'salud', 'despensa', 'antojos'];

export const KaluriFoodHint: React.FC<KaluriFoodHintProps> = ({ categoryName }) => {
  const lower = (categoryName ?? '').toLowerCase();
  const matches = FOOD_OR_HEALTH_KEYWORDS.some((kw) => lower.includes(kw));
  if (!matches) return null;

  return (
    <Pressable
      onPress={() => Linking.openURL(KALURI_URL)}
      className="bg-amber-950/25 border border-amber-800/40 rounded-2xl px-4 py-3 mb-5 flex-row items-center justify-between active:opacity-80"
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Sparkles size={14} color="#FBBF24" />
        <Text className="text-amber-200/90 text-xs ml-2.5 leading-snug flex-1">
          Also try <Text className="font-bold text-amber-300">Kaluri.app</Text> — calcula
          calorías y macros de tu comida mexicana con una foto.
        </Text>
      </View>
      <ExternalLink size={13} color="#FBBF24" />
    </Pressable>
  );
};
