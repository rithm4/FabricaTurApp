import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { useApp } from '../AppState';
import { content } from '../data';
import { colors, radius, space, type } from '../theme';

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

/**
 * Setările fine ale notificărilor, un nivel sub Profil.
 *
 * Nu sunt ascunse: cine vrea să oprească o singură categorie o găsește aici și o oprește
 * doar pe aceea. Dacă n-ar găsi-o, ar opri toate notificările din setările telefonului,
 * iar aplicația și-ar pierde rostul.
 */
export function NotificationSettings() {
  const { t, lang, notifOn, toggleNotif } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>{t.profNotif}</Text>
      </View>

      <Text style={styles.intro}>{t.notifSettingsIntro}</Text>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },

  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { ...type.title, fontWeight: '600', color: colors.ink, flex: 1 },

  intro: { ...type.body, color: colors.muted, marginTop: space.xl, marginBottom: space.lg },

  card: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden' },
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
});
