import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { useApp } from '../AppState';
import { nightsLabel } from '../i18n';
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
  const { t, lang, resorts, nextDeparture } = useApp();
  const insets = useSafeAreaInsets();
  // Aceeași ofertă ca pe Acasă, din aceleași date: cele două ecrane nu se pot contrazice.
  const featured = resorts[0];
  const next = nextDeparture(featured.id);

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
        {featured.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{featured.badge}</Text>
          </View>
        ) : null}
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.title}>
          {t.promoTitle
            .replace('{name}', featured.name.replace(/^Hotel /, ''))
            .replace('{nights}', nightsLabel(featured.nights, lang))}
        </Text>
        {featured.short ? <Text style={styles.short}>{featured.short}</Text> : null}

        <View style={styles.priceCard}>
          <View style={styles.priceTop}>
            <Text style={styles.priceMeta}>{`${featured.name} · ${nightsLabel(featured.nights, lang)}`}</Text>
            {next ? <Text style={styles.priceDate}>{next.dates}</Text> : null}
          </View>
          <Price
            value={featured.price}
            oldValue={featured.oldPrice}
            label={t.perPersonShort}
            size={38}
          />
        </View>

        {/* „Ce include" se scrie în panou; o listă goală nu lasă un card gol. */}
        {featured.includes.length > 0 ? (
          <View style={styles.includes}>
            {featured.includes.map((line, index) => (
              <Included key={line + index} label={line} first={index === 0} />
            ))}
          </View>
        ) : null}

        {/* Termenul vine din panou; fără el, sau după el, rândul nu apare — nu promitem o dată falsă. */}
        {featured.offerUntil ? (
          <View style={styles.limit}>
            <Icon name="clock" size={22} color={colors.magentaText} />
            <Text style={styles.limitText}>{t.promoLimit.replace('{date}', featured.offerUntil)}</Text>
          </View>
        ) : null}
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
  short: { ...type.body, color: colors.muted, marginTop: space.xs },

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
