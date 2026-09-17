import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';
import { colors, radius, shadow, space, type } from '../theme';
import { Icon, type IconName } from './Icon';

/** Bara fixă de jos care ține butonul principal al ecranelor de detaliu. */
export function CtaBar({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, space.md) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type Props = {
  icon: IconName;
  /** Rândul mic de deasupra titlului; lipsește pe butonul de trimitere a cererii. */
  kicker?: string;
  label: string;
  onPress: () => void;
};

export function CtaPill({ icon, kicker, label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={kicker ? `${label}, ${kicker}` : label}
    >
      <LinearGradient
        colors={[colors.navy, colors.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pill}
      >
        <View style={styles.leadIcon}>
          <Icon name={icon} size={24} color={colors.white} />
        </View>
        <View style={styles.body}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.trailIcon}>
          <Icon name="chevrons-right" size={22} color={colors.white} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    minHeight: 68,
    borderRadius: radius.pill,
    ...shadow.bar,
  },
  leadIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  kicker: { ...type.micro, color: colors.white, opacity: 0.92 },
  label: { ...type.bodyStrong, color: colors.white, marginTop: 1 },
  trailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
