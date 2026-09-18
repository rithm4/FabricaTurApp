import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Icon, type IconName } from '../components/Icon';
import { useApp } from '../AppState';
import type { Lang } from '../i18n';
import { colors, gradients, radius, shadow, space, TOUCH, type } from '../theme';

/** Inițialele din nume, pentru avatar: „Ion Popescu" → „IP". */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Un rând din meniul profilului: iconiță, titlu, rezumat opțional și săgeată. */
function MenuRow({
  icon,
  label,
  detail,
  onPress,
  first,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress: () => void;
  first?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      style={({ pressed }) => [styles.row, !first && styles.rowDivider, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} size={20} color={colors.navy} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Icon name="chevron-right" size={22} color={colors.muted} />
    </Pressable>
  );
}

/** Comutatorul de limbă, compact, pus direct în rând: nu merită un ecran separat. */
function LangSwitch() {
  const { lang, setLang } = useApp();
  const options: { value: Lang; label: string }[] = [
    { value: 'ro', label: 'RO' },
    { value: 'ru', label: 'RU' },
  ];

  return (
    <View style={styles.lang}>
      {options.map((option) => {
        const active = option.value === lang;
        return (
          <Pressable
            key={option.value}
            onPress={() => setLang(option.value)}
            style={[styles.langOption, active && styles.langOptionActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.value === 'ro' ? 'Română' : 'Русский'}
          >
            <Text style={[styles.langText, active && styles.langTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Profile() {
  const { t, go, notifOn, account, fullName, signOut } = useApp();

  const name = fullName;
  const on = notifOn.filter(Boolean).length;
  // Rezumatul spune ce primești, nu îndeamnă la oprit.
  const notifDetail =
    on === 0
      ? t.notifAllOff
      : t.notifSummary.replace('{on}', String(on)).replace('{all}', String(notifOn.length));

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t.profTitle}</Text>

      <View style={styles.identity}>
        <LinearGradient
          colors={gradients.water}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </LinearGradient>
        <View style={styles.identityText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{account.phone}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <MenuRow icon="calendar" label={t.bookTitle} onPress={() => go('bookings')} first />
        <MenuRow
          icon="bell"
          label={t.profNotif}
          detail={notifDetail}
          onPress={() => go('notifSettings')}
        />
        <View style={[styles.row, styles.rowDivider]}>
          <View style={styles.rowIcon}>
            <Icon name="globe" size={20} color={colors.navy} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t.profLang}</Text>
          </View>
          <LangSwitch />
        </View>
      </View>

      {/* Discret, ca orice acțiune care șterge ceva: nu trebuie să arate la fel de invitant. */}
      <Pressable
        onPress={signOut}
        style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Icon name="log-out" size={18} color={colors.magentaText} />
        <Text style={styles.signOutText}>{t.profSignOut}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  pageTitle: { ...type.display, fontWeight: '600', color: colors.ink, letterSpacing: -0.4 },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    marginTop: space.xl,
    marginBottom: space.xxl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, lineHeight: 28, fontWeight: '600', color: colors.white },
  identityText: { flex: 1, minWidth: 0 },
  name: { ...type.heading, fontWeight: '600', color: colors.ink },
  phone: { ...type.body, color: colors.muted, marginTop: 2 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.low,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 68,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  pressed: { opacity: 0.6 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chipBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowLabel: { ...type.body, color: colors.ink },
  rowDetail: { ...type.small, color: colors.muted, marginTop: 1 },

  lang: {
    flexDirection: 'row',
    backgroundColor: colors.chip,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  langOption: {
    minWidth: TOUCH,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
  },
  langOptionActive: { backgroundColor: colors.navy },
  langText: { ...type.smallStrong, fontWeight: '600', color: colors.body },
  langTextActive: { color: colors.white },

  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: TOUCH,
    marginTop: space.xl,
  },
  signOutText: { ...type.body, color: colors.magentaText },
});
