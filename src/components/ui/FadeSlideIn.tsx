import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';

interface FadeSlideInProps {
  children: React.ReactNode;
  delay?: number;
  offsetY?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Entrada suave con curva spring estilo iOS/macOS.
 */
export const FadeSlideIn: React.FC<FadeSlideInProps> = ({
  children,
  delay = 0,
  offsetY = 12,
  className,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offsetY)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const anim = Animated.sequence([
      ...(delay > 0 ? [Animated.delay(delay)] : []),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 240,
          mass: 0.7,
          useNativeDriver,
        }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, opacity, translateY, useNativeDriver]);

  return (
    <Animated.View
      className={className}
      style={[
        {
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default FadeSlideIn;
