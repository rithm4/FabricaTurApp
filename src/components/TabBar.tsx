import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';
import { useApp, type ScreenName } from '../AppState';
import { colors, radius, space, TOUCH, type } from '../theme';
import { Icon, type IconName } from './Icon';

/**
 * Tabul activ se distinge prin trei semnale, nu doar prin culoare: pastilă de fundal,
 * bleumarin în loc de gri și etichetă îngroșată. Culoarea singură nu e suficientă
 * pentru cineva care o percepe slab.
 */
function Tab({ target, icon, label }: { target: ScreenName; icon: IconName; label: string }) {
  const { screen, go } = useApp();
  const active = screen === target;

  return (
    <Pressable
      onPress={() => go(target)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Icon name={icon} size={24} color={active ? colors.navy : colors.muted} />
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TabBar() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <Tab target="home" icon="home" label={t.tabHome} />
      <Tab target="list" icon="waves" label={t.tabResorts} />
      <Tab target="notif" icon="bell" label={t.tabNotif} />
      <Tab target="profile" icon="user" label={t.tabProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: space.xs,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: TOUCH + 8,
    paddingHorizontal: space.xs,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.chipBlue },
  label: { ...type.micro, color: colors.muted, fontWeight: '500' },
  labelActive: { color: colors.navy, fontWeight: '700' },
});
