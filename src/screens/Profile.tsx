import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';

import { useApp } from '../AppState';
import { content, profile } from '../data';
import { Icon } from '../components/Icon';
import { colors, radius, space, type } from '../theme';
import type { Lang } from '../i18n';

/**
 * Rând de comutator. Apăsabil pe toată lățimea, nu doar pe comutator — pentru cineva
 * cu mâna mai puțin sigură, o țintă de 68px e diferența dintre a reuși și a rata.
 */
function ToggleRow({
  label,
  on,
  onPress,
  first,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  first?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={[styles.row, !first && styles.rowDivider]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.track, on && styles.trackOn]}>
        <View style={[styles.knob, on && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

function LangButton({ lang, label }: { lang: Lang; label: string }) {
  const { lang: current, setLang } = useApp();
  const active = current === lang;

  return (
    <Pressable
      onPress={() => setLang(lang)}
      style={[styles.langButton, active && styles.langButtonActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {active && <Icon name="check" size={19} color={colors.white} />}
      <Text style={[styles.langText, active && styles.langTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Profile() {
  const { t, lang, notifOn, toggleNotif, account, fullName } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t.profTitle}</Text>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Icon name="user" size={30} color={colors.muted} />
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{fullName || profile.name}</Text>
          <Text style={styles.phone}>{account.phone || profile.phone}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t.profNotif}</Text>
      <View style={styles.card}>
        {content.notificationSettings[lang].map((label, index) => (
          <ToggleRow
            key={label}
            label={label}
            on={notifOn[index]}
            onPress={() => toggleNotif(index)}
            first={index === 0}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>{t.profLang}</Text>
      <View style={styles.langRow}>
        <LangButton lang="ro" label="Română" />
        <LangButton lang="ru" label="Русский" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  pageTitle: { ...type.display, color: colors.ink, letterSpacing: -0.6 },

  identity: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xl },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.chipBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, minWidth: 0 },
  name: { ...type.heading, color: colors.ink },
  phone: { ...type.body, color: colors.muted, marginTop: 2 },

  sectionLabel: {
    ...type.micro,
    color: colors.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: space.section,
    marginBottom: space.md,
  },

  card: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 68,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  rowLabel: { ...type.body, color: colors.body, flex: 1 },

  track: {
    width: 60,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: colors.navy },
  knob: {
    position: 'absolute',
    left: 3,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  knobOn: { left: 27 },

  langRow: { flexDirection: 'row', gap: space.md },
  langButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 56,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
  },
  langButtonActive: { backgroundColor: colors.navy },
  langText: { ...type.bodyStrong, color: colors.body },
  langTextActive: { color: colors.white },
});
