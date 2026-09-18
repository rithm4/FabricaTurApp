import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { useApp } from '../AppState';
import { Icon } from '../components/Icon';
import { BackButton } from '../components/BackButton';
import { colors, radius, space, type } from '../theme';

export function Bookings() {
  const { t } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.pageTitle}>{t.bookTitle}</Text>
      </View>

      <View style={styles.list}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusNew}>
              <Text style={styles.statusNewText}>{t.bookStatusNew}</Text>
            </View>
            <Text style={styles.date}>12 OCT</Text>
          </View>
          <Text style={styles.name}>{`Hotel Kumánia · 7 ${t.days}`}</Text>
          <Text style={styles.meta}>{`${t.bookSent} · 2 ${t.persons}`}</Text>
          <View style={styles.callRow}>
            <Icon name="phone" size={20} color={colors.navy} />
            <Text style={styles.callText}>{t.bookCall}</Text>
          </View>
        </View>

        <View style={[styles.card, styles.past]}>
          <View style={styles.statusDone}>
            <Text style={styles.statusDoneText}>{t.bookStatusDone}</Text>
          </View>
          <Text style={styles.name}>{`Hajdúszoboszló · 10 ${t.days}`}</Text>
          <Text style={styles.meta}>{t.bookPast}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pageTitle: { ...type.title, fontWeight: '600', color: colors.ink, flex: 1 },

  list: { gap: space.lg, marginTop: space.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl },
  past: { backgroundColor: colors.chip },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  statusNew: {
    backgroundColor: colors.navy,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  statusNewText: { ...type.micro, color: colors.white },
  statusDone: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  statusDoneText: { ...type.micro, color: colors.muted },
  date: { ...type.smallStrong, color: colors.muted },

  name: { ...type.title, color: colors.ink, marginTop: space.lg },
  meta: { ...type.small, color: colors.muted, marginTop: space.xs },

  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dash,
  },
  callText: { ...type.smallStrong, color: colors.body, flex: 1 },
});
