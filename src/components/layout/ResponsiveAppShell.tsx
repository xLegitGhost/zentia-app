import React from 'react';
import { Platform, View } from 'react-native';

/**
 * Contenedor responsivo Web-first / Mobile-first (TASK-501).
 * Centra el viewport en max-w-md (448px) en desktop web manteniendo
 * experiencia 100% full-bleed en iOS, Android y navegadores móviles.
 */
export const ResponsiveAppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (Platform.OS !== 'web') {
    return <View className="flex-1 bg-black">{children}</View>;
  }

  return (
    <View className="flex-1 bg-black items-center">
      <View
        testID="zentia-responsive-shell"
        className="flex-1 w-full max-w-md bg-black md:border-x md:border-zinc-900 overflow-hidden"
      >
        {children}
      </View>
    </View>
  );
};

export default ResponsiveAppShell;
