import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { motion } from '../theme';

/** Citește o singură dată preferința de sistem „mișcare redusă" și o ține la zi. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Cât de mult se micșorează la apăsare. Cardurile mari au nevoie de mai puțin. */
  scaleTo?: number;
};

/**
 * Pressable care răspunde la atingere printr-o micșorare scurtă.
 * Feedbackul tactil contează mai mult decât orice efect vizual: confirmă că apăsarea
 * a fost înregistrată, ceea ce reduce apăsările repetate.
 */
export function Press({ style, scaleTo = 0.97, children, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  const animate = (to: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration: motion.press,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...rest}
        style={style}
        onPressIn={(e) => {
          if (!reduced) animate(scaleTo);
          rest.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          if (!reduced) animate(1);
          rest.onPressOut?.(e);
        }}
      >
        {children as React.ReactNode}
      </Pressable>
    </Animated.View>
  );
}
