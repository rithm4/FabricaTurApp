import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { BackButton } from '../components/BackButton';
import { PillButton } from '../components/PillButton';
import { useApp, type OfferRequest } from '../AppState';
import { colors, radius, space, type } from '../theme';

function RequestCard({ request }: { request: OfferRequest }) {
  const { t, lang } = useApp();
  // Ajunsă la agenție — prin server sau pe WhatsApp — sau doar salvată pe telefon.
  const sent = request.channel !== 'saved';
  const label =
    request.channel === 'sent'
      ? t.bookStatusSentAgency
      : request.channel === 'whatsapp'
        ? t.bookStatusSent
        : t.bookStatusSaved;
  const icon = request.channel === 'whatsapp' ? 'whatsapp' : request.channel === 'sent' ? 'send' : 'check';
  const created = new Date(request.createdAt).toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        {/* Starea spune exact ce s-a întâmplat: trimisă agenției, sau doar salvată pe telefon. */}
        <View style={[styles.status, sent ? styles.statusSent : styles.statusSaved]}>
          <Icon
            name={icon}
            size={15}
            color={sent ? colors.white : colors.navy}
          />
          <Text style={[styles.statusText, sent && styles.statusTextSent]}>
            {label}
          </Text>
        </View>
        <Text style={styles.created}>{created}</Text>
      </View>

      <Text style={styles.name}>{request.resortName}</Text>

      <View style={styles.facts}>
        <View style={styles.fact}>
          <Icon name="calendar" size={18} color={colors.navy} />
          <Text style={styles.factText}>{request.dates ?? t.waNoDate}</Text>
        </View>
        <View style={styles.fact}>
          <Icon name="users" size={18} color={colors.navy} />
          <Text style={styles.factText}>{`${request.party} ${t.persons}`}</Text>
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

export function Bookings() {
  const { t, requests } = useApp();

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
  statusSent: { backgroundColor: colors.navy },
  statusSaved: { backgroundColor: colors.chipBlue },
  statusText: { ...type.micro, color: colors.navy },
  statusTextSent: { color: colors.white },
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
