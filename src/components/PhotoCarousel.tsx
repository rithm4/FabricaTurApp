import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, type ImageSourcePropType, type ViewStyle } from 'react-native';

import { useReducedMotion } from './Press';
import { colors, space } from '../theme';

/** Cât stă o fotografie pe ecran înainte să înceapă trecerea. */
const HOLD = 4200;
/** Durata estompării dintre două fotografii. */
const FADE = 1100;

type Props = {
  photos: ImageSourcePropType[];
  style?: ViewStyle;
  accessibilityLabel: string;
  /** Punctele de jos. Se ascund când carusekul e doar fundal, ca în antetul hotelului. */
  showDots?: boolean;
};

/**
 * Fotografii care se succed prin estompare.
 *
 * Fără apropiere sau alte transformări: fotografia rămâne exact în încadrarea ei,
 * altfel pare tăiată. Fără glisare orizontală: ar sugera că se poate trage cu degetul
 * și ar intra în conflict cu apăsarea pe cardul din spate.
 */
export function PhotoCarousel({ photos, style, accessibilityLabel, showDots = true }: Props) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  const opacity = useRef(photos.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  useEffect(() => {
    if (reduced || photos.length < 2) return;

    const timer = setTimeout(() => {
      const next = (index + 1) % photos.length;

      Animated.parallel([
        Animated.timing(opacity[next], { toValue: 1, duration: FADE, useNativeDriver: true }),
        Animated.timing(opacity[index], { toValue: 0, duration: FADE, useNativeDriver: true }),
      ]).start();

      setIndex(next);
    }, HOLD);

    return () => clearTimeout(timer);
  }, [index, opacity, photos.length, reduced]);

  return (
    <View style={[styles.root, style]} accessible accessibilityLabel={accessibilityLabel}>
      {photos.map((source, i) => (
        <Animated.Image
          key={i}
          source={source}
          resizeMode="cover"
          style={[styles.photo, { opacity: opacity[i] }]}
        />
      ))}

      {showDots && photos.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: '#0C1636' },
  // Lățimea și înălțimea sunt obligatorii: pentru un element de tip imagine, `auto`
  // se rezolvă la mărimea fișierului, nu la cea a containerului, iar `cover` rămâne fără efect.
  photo: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: { width: 20, backgroundColor: colors.white },
});
