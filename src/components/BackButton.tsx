import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { useApp } from '../AppState';
import { colors, TOUCH } from '../theme';

type Props = {
  /** Peste fotografie: cerc întunecat translucid cu săgeată albă. Altfel, cerc alb. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Butonul Înapoi. Duce la ecranul de unde a venit omul, din istoric — nu într-un loc fix.
 * Aceeași componentă pe toate ecranele, ca butonul să arate și să se comporte la fel peste tot.
 */
export function BackButton({ onDark, style }: Props) {
  const { t, back } = useApp();

  return (
    <Pressable
      onPress={back}
      accessibilityRole="button"
      accessibilityLabel={t.back}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        onDark ? styles.onDark : styles.onLight,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name="arrow-left" size={24} color={onDark ? colors.white : colors.navy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onLight: { backgroundColor: colors.white },
  onDark: {
    backgroundColor: 'rgba(13,20,48,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  pressed: { opacity: 0.6 },
});
