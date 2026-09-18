import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { colors, gradients, radius, shadow, space, TOUCH, type } from '../theme';

type Props = {
  label: string;
  /**
   * Fără `onPress`, butonul e doar vizual — pentru cardurile apăsabile în întregime,
   * unde un al doilea element apăsabil în interior ar încurca cititorul de ecran.
   */
  onPress?: () => void;
  icon?: IconName | null;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Butonul de acțiune din carduri: pastilă cu gradientul de brand și săgeată.
 * Toate cardurile îl folosesc pe acesta, ca aceeași acțiune să arate la fel peste tot.
 */
export function PillButton({ label, onPress, icon = 'arrow-right', accessibilityLabel, style }: Props) {
  const body = (
    <LinearGradient
      colors={gradients.water}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pill}
    >
      <Text style={styles.text}>{label}</Text>
      {icon ? <Icon name={icon} size={19} color={colors.white} /> : null}
    </LinearGradient>
  );

  if (!onPress) return <View style={[styles.shadow, style]}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.shadow, pressed && styles.pressed, style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Umbra stă pe înveliș, cu aceeași rotunjire: pe web urmează forma de pastilă.
  shadow: { borderRadius: radius.pill, ...shadow.card },
  pressed: { opacity: 0.85 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: TOUCH + 4,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
  },
  // Semibold, nu bold: regula aplicației pentru ce se apasă.
  text: { ...type.bodyStrong, fontWeight: '600', color: colors.white },
});
