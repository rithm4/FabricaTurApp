import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { useReducedMotion } from './Press';
import { motion } from '../theme';

/**
 * Învelișul fiecărui ecran. La schimbarea ecranului conținutul urcă puțin și apare —
 * suficient cât să se simtă legătura dintre apăsare și rezultat, prea puțin cât să încetinească.
 * `key` pe acest element repornește animația la fiecare navigare.
 */
export function Screen({ children }: { children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.enter,
      useNativeDriver: true,
    }).start();
  }, [progress, reduced]);

  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
