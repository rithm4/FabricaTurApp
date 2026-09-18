import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';

import { useApp } from '../AppState';
import type { NotificationItem } from '../data';
import { Icon } from '../components/Icon';
import { colors, radius, space, TOUCH, type } from '../theme';

function NotificationRow({ item, fresh }: { item: NotificationItem; fresh: boolean }) {
  const { t, go, openResort } = useApp();

  // Fiecare notificare duce unde spune că duce, nu toate la aceeași promoție.
  const open = () => {
    if (item.target === 'promo' || item.target === 'bookings') go(item.target);
    else openResort(item.target);
  };

  return (
    <Pressable
      onPress={open}
      style={[styles.card, item.accent && styles.cardAccent]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.text} ${item.when}`}
    >
      <View style={[styles.icon, item.accent && styles.iconAccent]}>
        <Icon name={item.icon} size={24} color={item.accent ? colors.magentaText : colors.navy} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, styles.titleText]}>{item.title}</Text>
          {fresh ? (
            <View style={styles.newPill}>
              <Text style={styles.newText}>{t.notifNew}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.text}>{item.text}</Text>
        <Text style={styles.when}>{item.when}</Text>
      </View>
    </Pressable>
  );
}

export function Notifications() {
  const { t, go, notifications, notifSeenAt, markNotifsSeen } = useApp();
  // Ce era necitit în clipa deschiderii rămâne marcat „Nou" cât stai pe ecran,
  // deși în memorie e deja văzut — altfel eticheta ar dispărea înainte s-o citești.
  const [seenBefore] = useState(notifSeenAt);

  // Deschiderea ecranului înseamnă „am văzut"; la fel pentru ce sosește cât e deschis.
  useEffect(() => {
    markNotifsSeen();
  }, [notifications.length]);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t.notifTitle}</Text>
        <Pressable
          onPress={() => go('notifSettings')}
          style={styles.settingsButton}
          accessibilityRole="button"
        >
          <Text style={styles.link}>{t.settings}</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {notifications.length === 0 ? <Text style={styles.empty}>{t.notifEmpty}</Text> : null}
        {notifications.map((item) => (
          <NotificationRow key={item.id} item={item} fresh={item.sentAt > seenBefore} />
        ))}
      </View>
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
  settingsButton: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: space.md },
  link: { ...type.smallStrong, color: colors.link },

  list: { gap: space.md, marginTop: space.xl },
  empty: { ...type.body, color: colors.muted, textAlign: 'center', paddingVertical: space.section },
  card: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  cardAccent: { backgroundColor: colors.pinkSurface },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.chipBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAccent: { backgroundColor: colors.pinkChip },
  body: { flex: 1, minWidth: 0 },
  title: { ...type.bodyStrong, color: colors.ink },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  titleText: { flex: 1 },
  // Magenta închis: textul alb mic trece de 7:1.
  newPill: {
    backgroundColor: colors.magentaText,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  newText: { ...type.micro, color: colors.white },
  text: { ...type.small, color: colors.muted, marginTop: space.xs },
  when: { ...type.micro, color: colors.muted, fontWeight: '500', marginTop: space.sm },
});
