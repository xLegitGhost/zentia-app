import React, { useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface SpringPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

/**
 * Botón interactivo con física spring estilo iOS / macOS (Apple HIG).
 */
export const SpringPressable: React.FC<SpringPressableProps> = ({
  children,
  className,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const useNativeDriver = Platform.OS !== 'web';

  const handlePressIn: PressableProps['onPressIn'] = (e) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleTo,
        damping: 18,
        stiffness: 320,
        mass: 0.6,
        useNativeDriver,
      }),
      Animated.timing(opacity, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver,
      }),
    ]).start();
    onPressIn?.(e);
  };

  const handlePressOut: PressableProps['onPressOut'] = (e) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 15,
        stiffness: 280,
        mass: 0.6,
        useNativeDriver,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver,
      }),
    ]).start();
    onPressOut?.(e);
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      <Animated.View
        className={className}
        style={[
          {
            transform: [{ scale }],
            opacity: disabled ? 0.55 : opacity,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default SpringPressable;
