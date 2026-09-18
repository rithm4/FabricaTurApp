import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Press } from '../components/Press';
import { useApp } from '../AppState';
import type { NotificationItem } from '../data';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, shadow, space, TOUCH, type } from '../theme';

/** Culoarea și iconița fiecărei categorii: se recunoaște dintr-o privire, fără să citești. */
function lookOf(item: NotificationItem): { icon: IconName; bg: string; ink: string } {
  if (item.target.startsWith('article:')) return { icon: 'news', bg: colors.chipBlue, ink: colors.link };
  switch (item.audience) {
    case 'promo':
      return { icon: 'tag', bg: colors.pinkChip, ink: colors.magentaText };
    case 'lastSeats':
      return { icon: 'clock', bg: colors.pinkSurface, ink: colors.magentaText };
    case 'newDepartures':
      return { icon: 'calendar', bg: colors.chipBlue, ink: colors.navy };
    default:
      return { icon: 'news', bg: colors.chipBlue, ink: colors.navy };
  }
}

function NotificationRow({ item, fresh }: { item: NotificationItem; fresh: boolean }) {
  const { t, go, openResort, openArticle } = useApp();
  const look = lookOf(item);

  // Fiecare notificare duce unde spune că duce — și spune asta pe card.
  const isArticle = item.target.startsWith('article:');
  const action =
    item.target === 'promo'
      ? t.notifGoOffer
      : item.target === 'bookings'
        ? t.notifGoBookings
        : isArticle
          ? t.notifGoArticle
          : t.notifGoResort;

  const open = () => {
    if (item.target === 'promo' || item.target === 'bookings') go(item.target);
    else if (isArticle) openArticle(item.target.slice('article:'.length));
    else openResort(item.target);
  };

  return (
    <Press
      onPress={open}
      scaleTo={0.985}
      style={[styles.card, fresh ? styles.cardFresh : styles.cardRead]}
      accessibilityRole="button"
      accessibilityLabel={`${fresh ? `${t.notifNew}. ` : ''}${item.title}. ${item.text} ${item.when}. ${action}`}
    >
      <View style={[styles.icon, { backgroundColor: look.bg }]}>
        <Icon name={look.icon} size={22} color={look.ink} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.whenBox}>
            {/* Necitită: un punct magenta lângă oră, nu o etichetă în plus. */}
            {fresh ? <View style={styles.dot} /> : null}
            <Text style={[styles.when, fresh && styles.whenFresh]}>{item.when}</Text>
          </View>
        </View>
        <Text style={styles.text}>{item.text}</Text>
        <View style={styles.actionRow}>
          <Text style={styles.action}>{action}</Text>
          <Icon name="chevron-right" size={16} color={colors.link} />
        </View>
      </View>
    </Press>
  );
}

/** „Azi", „Ieri" sau „Mai devreme", după ziua trimiterii. */
function dayGroup(iso: string): 'today' | 'yesterday' | 'earlier' {
  const sent = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (sent >= today) return 'today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return sent >= yesterday ? 'yesterday' : 'earlier';
}

export function Notifications() {
  const { t, go, notifications, notifSeenAt, markNotifsSeen } = useApp();
  // Ce era necitit în clipa deschiderii rămâne marcat cât stai pe ecran,
  // deși în memorie e deja văzut — altfel semnul ar dispărea înainte să-l observi.
  const [seenBefore] = useState(notifSeenAt);

  // Deschiderea ecranului înseamnă „am văzut"; la fel pentru ce sosește cât e deschis.
  useEffect(() => {
    markNotifsSeen();
  }, [notifications.length]);

  const groups = (['today', 'yesterday', 'earlier'] as const)
    .map((key) => ({
      key,
      label: key === 'today' ? t.notifToday : key === 'yesterday' ? t.notifYesterday : t.notifEarlier,
      items: notifications.filter((n) => dayGroup(n.sentAt) === key),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t.tabNotif}</Text>
        <Pressable
          onPress={() => go('notifSettings')}
          style={styles.settingsButton}
          accessibilityRole="button"
          accessibilityLabel={t.settings}
        >
          <Icon name="bell" size={18} color={colors.link} />
          <Text style={styles.link}>{t.settings}</Text>
        </Pressable>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="bell" size={30} color={colors.navy} />
          </View>
          <Text style={styles.emptyText}>{t.notifEmpty}</Text>
        </View>
      ) : null}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <View style={styles.list}>
            {group.items.map((item) => (
              <NotificationRow key={item.id} item={item} fresh={item.sentAt > seenBefore} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  pageTitle: { ...type.display, color: colors.ink, letterSpacing: -0.6, flexShrink: 1 },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH,
    paddingLeft: space.md,
  },
  link: { ...type.smallStrong, color: colors.link },

  group: { marginTop: space.xl },
  groupLabel: {
    ...type.micro,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  list: { gap: space.md },

  card: { flexDirection: 'row', gap: space.md, borderRadius: radius.xl, padding: space.lg },
  // Necitite: albe, ridicate de pe fundal. Citite: pe fundal, liniștite.
  cardFresh: { backgroundColor: colors.white, ...shadow.card },
  cardRead: { backgroundColor: colors.surface },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  title: { ...type.bodyStrong, color: colors.ink, flex: 1 },
  whenBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.magenta },
  when: { ...type.micro, fontWeight: '500', color: colors.muted },
  whenFresh: { color: colors.magentaText, fontWeight: '600' },
  text: { ...type.small, color: colors.body, marginTop: space.xs },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: space.md },
  action: { ...type.smallStrong, color: colors.link },

  empty: { alignItems: 'center', gap: space.lg, paddingVertical: space.section },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.chipBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { ...type.body, color: colors.muted, textAlign: 'center' },
});
