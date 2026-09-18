import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { useApp } from '../AppState';
import { Price } from '../components/Price';
import { Icon } from '../components/Icon';
import { colors, radius, space, type } from '../theme';

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
  const { t, resorts, departuresFor } = useApp();
  const insets = useSafeAreaInsets();
  // Aceeași ofertă ca pe Acasă, din aceleași date: cele două ecrane nu se pot contrazice.
  const featured = resorts[0];
  const next = departuresFor(featured.id)[0];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={featured.gallery[0]}
        style={styles.hero}
        resizeMode="cover"
        accessibilityLabel={`${t.a11yPoolPhoto}, ${featured.name}`}
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
            <Text style={styles.priceMeta}>{`${featured.name} · ${featured.nights} ${t.nights}`}</Text>
            {next ? <Text style={styles.priceDate}>{next.dates}</Text> : null}
          </View>
          <Price
            value={featured.price}
            oldValue={featured.oldPrice}
            label={t.perPersonShort}
            size={38}
          />
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
  // Lățimea e obligatorie: ImageBackground o transmite imaginii, iar fără ea, pe web,
  // o imagine locală se afișează la mărimea fișierului, tăiată.
  hero: { width: '100%', height: 290, backgroundColor: '#000' },
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
  priceDate: { ...type.smallStrong, color: colors.navy, textAlign: 'right' },

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
