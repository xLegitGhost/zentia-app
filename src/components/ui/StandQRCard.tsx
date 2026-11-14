import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import QRCode from 'qrcode';
import { QrCode, ExternalLink } from 'lucide-react-native';
import { openSafeExternalUrl } from '@/services/security';

const DEFAULT_DEMO_URL =
  process.env.EXPO_PUBLIC_DEMO_URL || 'https://zentia.vercel.app';

interface StandQRCardProps {
  url?: string;
}

export const StandQRCard: React.FC<StandQRCardProps> = ({ url = DEFAULT_DEMO_URL }) => {
  const { size, modules } = useMemo(() => {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    return {
      size: qr.modules.size,
      modules: qr.modules.data,
    };
  }, [url]);

  const cellSize = 4;
  const padding = 8;
  const svgSize = size * cellSize + padding * 2;

  return (
    <View className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <QrCode size={16} color="#22C55E" />
          <Text className="text-white text-sm font-bold ml-2">QR Demo Stand</Text>
        </View>
        <Pressable
          onPress={() => {
            void openSafeExternalUrl(url);
          }}
          className="flex-row items-center px-2.5 py-1 rounded-full bg-[#27272A] active:opacity-80"
        >
          <Text className="text-[#22C55E] text-[11px] font-semibold mr-1">Abrir</Text>
          <ExternalLink size={11} color="#22C55E" />
        </Pressable>
      </View>

      <View className="items-center">
        <View className="bg-white p-3 rounded-2xl mb-3">
          <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <Rect x={0} y={0} width={svgSize} height={svgSize} fill="#FFFFFF" />
            {Array.from({ length: size }).map((_, row) =>
              Array.from({ length: size }).map((__, col) => {
                const isDark = modules[row * size + col] === 1;
                if (!isDark) return null;
                return (
                  <Rect
                    key={`${row}-${col}`}
                    x={padding + col * cellSize}
                    y={padding + row * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="#09090B"
                  />
                );
              })
            )}
          </Svg>
        </View>
        <Text className="text-zinc-400 text-xs text-center" numberOfLines={1}>
          {url}
        </Text>
      </View>
    </View>
  );
};

export default StandQRCard;
