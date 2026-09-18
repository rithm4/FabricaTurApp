import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { useApp } from '../AppState';
import { Icon } from '../components/Icon';
import { colors, photos, radius, space, type } from '../theme';

function Included({ label, first }: { label: string; first?: boolean }) {
  return (
    <View style={[styles.included, !first && styles.includedDivider]}>
      <View style={styles.checkDot}>
        <Icon name="check" size={17} color={colors.white} />
      </View>
      <Text style={styles.includedLabel}>{label}</Text>
    </View>
  );
}

export function Promo() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={{ uri: photos.pool }}
        style={styles.hero}
        accessibilityLabel="Bazin termal interior la Hotel Kumánia"
      >
        <LinearGradient
          colors={['rgba(13,20,48,.5)', 'rgba(13,20,48,0)', 'rgba(13,20,48,.92)']}
          locations={[0, 0.34, 1]}
          style={StyleSheet.absoluteFill}
        />
        <BackButton onDark style={[styles.back, { top: insets.top + space.lg }]} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t.promoBadge}</Text>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.title}>{t.promoTitle}</Text>

        <View style={styles.priceCard}>
          <View style={styles.priceTop}>
            <Text style={styles.priceMeta}>{`Kumánia · 7 ${t.days}`}</Text>
            <Text style={styles.priceDate}>12 OCT</Text>
          </View>
          <Text style={styles.priceLabel}>{t.perPersonShort}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>542 €</Text>
            <Text style={styles.oldPrice}>610 €</Text>
          </View>
        </View>

        <View style={styles.includes}>
          <Included label={t.promoI1} first />
          <Included label={t.promoI2} />
          <Included label={t.promoI3} />
        </View>

        <View style={styles.limit}>
          <Icon name="clock" size={22} color={colors.magentaText} />
          <Text style={styles.limitText}>{t.promoLimit}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 290, backgroundColor: '#000' },
  // Doar poziția; aspectul îl dă BackButton.
  back: { position: 'absolute', left: space.lg },
  badge: {
    position: 'absolute',
    left: space.lg,
    bottom: space.lg,
    backgroundColor: colors.magenta,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  badgeText: { ...type.micro, color: colors.white },

  content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.section },
  title: { ...type.display, color: colors.ink, letterSpacing: -0.6 },

  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.xl,
    marginTop: space.xl,
  },
  priceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.lg,
  },
  priceMeta: { ...type.small, color: colors.muted, flexShrink: 1 },
  priceDate: { ...type.smallStrong, color: colors.navy },
  priceLabel: { ...type.micro, color: colors.muted, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.md, marginTop: space.xs },
  price: { fontSize: 38, lineHeight: 44, fontWeight: '700', color: colors.ink },
  oldPrice: { ...type.body, color: colors.muted, textDecorationLine: 'line-through' },

  includes: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginTop: space.lg,
    overflow: 'hidden',
  },
  included: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    minHeight: 64,
  },
  includedDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  checkDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  includedLabel: { ...type.body, color: colors.body, flex: 1 },

  limit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.pinkSurface,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    marginTop: space.lg,
  },
  limitText: { ...type.smallStrong, color: colors.pinkInk, flex: 1 },
});
