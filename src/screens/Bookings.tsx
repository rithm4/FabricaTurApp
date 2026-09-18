import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Icon, type IconName } from '../components/Icon';
import { BackButton } from '../components/BackButton';
import { PillButton } from '../components/PillButton';
import { useApp, type OfferRequest } from '../AppState';
import { personsLabel } from '../i18n';
import { formatRange } from '../remote';
import { colors, radius, space, type } from '../theme';

function RequestCard({ request }: { request: OfferRequest }) {
  const { t, lang } = useApp();

  // Starea spune exact ce s-a întâmplat: ce a făcut agenția, sau pe unde a plecat cererea.
  type Look = { label: string; icon: IconName; tone: 'navy' | 'green' | 'grey' | 'light' };
  const look: Look =
    request.status === 'booked'
      ? { label: t.bookStatusBooked, icon: 'check', tone: 'green' }
      : request.status === 'cancelled'
        ? { label: t.bookStatusCancelled, icon: 'x', tone: 'grey' }
        : request.status === 'called'
          ? { label: t.bookStatusCalled, icon: 'phone', tone: 'navy' }
          : request.channel === 'sent'
            ? { label: t.bookStatusSentAgency, icon: 'send', tone: 'navy' }
            : request.channel === 'whatsapp'
              ? { label: t.bookStatusSent, icon: 'whatsapp', tone: 'navy' }
              : { label: t.bookStatusSaved, icon: 'check', tone: 'light' };
  const ink = {
    navy: colors.white,
    green: colors.greenInk,
    grey: colors.muted,
    light: colors.navy,
  }[look.tone];
  const created = new Date(request.createdAt).toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <View style={[styles.status, tone[look.tone]]}>
          <Icon name={look.icon} size={15} color={ink} />
          <Text style={[styles.statusText, { color: ink }]}>{look.label}</Text>
        </View>
        <Text style={styles.created}>{created}</Text>
      </View>

      <Text style={styles.name}>{request.resortName}</Text>

      <View style={styles.facts}>
        <View style={styles.fact}>
          <Icon name="calendar" size={18} color={colors.navy} />
          <Text style={styles.factText}>{request.start && request.nights
              ? formatRange(request.start, request.nights, lang)
              : (request.dates ?? t.waNoDate)}</Text>
        </View>
        <View style={styles.fact}>
          <Icon name="users" size={18} color={colors.navy} />
          <Text style={styles.factText}>{personsLabel(request.party, lang)}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Starea goală. Înainte, ecranul arăta două rezervări inventate oricui — un om abia
 * înregistrat vedea „Consultantul te sună azi" pentru o cerere pe care n-o trimisese.
 */
function Empty() {
  const { t, go } = useApp();

  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="calendar" size={30} color={colors.navy} />
      </View>
      <Text style={styles.emptyTitle}>{t.bookEmptyTitle}</Text>
      <Text style={styles.emptyText}>{t.bookEmptyText}</Text>
      <PillButton label={t.bookEmptyCta} onPress={() => go('home')} style={styles.emptyCta} />
    </View>
  );
}

/** Cât de des întrebăm agenția de starea cererilor, cât timp ecranul e deschis. */
const POLL_MS = 30_000;

export function Bookings() {
  const { t, requests, refreshStatuses } = useApp();

  // Starea se schimbă în panoul agenției; o aflăm la deschidere și apoi din când în când.
  useEffect(() => {
    refreshStatuses();
    const timer = setInterval(refreshStatuses, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.pageTitle}>{t.bookTitle}</Text>
      </View>

      {requests.length === 0 ? (
        <Empty />
      ) : (
        <View style={styles.list}>
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const tone = StyleSheet.create({
  navy: { backgroundColor: colors.navy },
  green: { backgroundColor: colors.greenSurface },
  grey: { backgroundColor: colors.chip },
  light: { backgroundColor: colors.chipBlue },
});

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pageTitle: { ...type.title, color: colors.ink, flex: 1 },

  list: { gap: space.lg, marginTop: space.xl },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: space.xl },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusText: { ...type.micro },
  created: { ...type.small, color: colors.muted },

  name: { ...type.title, color: colors.ink, marginTop: space.lg },
  facts: { gap: space.sm, marginTop: space.md },
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  factText: { ...type.body, color: colors.body },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.section,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.chipBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...type.title, color: colors.ink, textAlign: 'center', marginTop: space.xl },
  emptyText: { ...type.body, color: colors.muted, textAlign: 'center', marginTop: space.sm },
  emptyCta: { marginTop: space.xl },
});
