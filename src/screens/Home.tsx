import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Press } from '../components/Press';
import { Departures } from '../components/Departures';
import { DiscountBadge } from '../components/DiscountBadge';
import { Price } from '../components/Price';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { useApp } from '../AppState';
import { content, LOW_SEATS, profile, type Resort } from '../data';
import { Icon } from '../components/Icon';
import { colors, gradients, radius, shadow, space, TOUCH, type } from '../theme';

/** Cardul pătrat din rândul „Destinații recomandate”. */
function DestinationTile({ resort }: { resort: Resort }) {
  const { openResort } = useApp();
  const { name, price } = resort;

  return (
    <Press
      onPress={() => openResort(resort.id)}
      style={styles.tile}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={`${name}, de la ${price}`}
    >
      <ImageBackground source={resort.gallery[0]} style={styles.tileImage} resizeMode="cover">
        <LinearGradient
          colors={gradients.scrim}
          locations={[0.25, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>
      <View style={styles.tileBody}>
        <Text style={styles.tileName}>{name}</Text>
        <Text style={styles.tilePrice}>{price}</Text>
      </View>
    </Press>
  );
}

export function Home() {
  const { t, go, fullName, lang } = useApp();
  // Cardul de sus arată întotdeauna prima plecare din listă, ca cele două să nu se contrazică.
  const next = content.departures[lang][0];
  /** Oferta săptămânii e a primei destinații din listă. */
  const featured = content.resorts[lang][0];

  return (
    <View style={styles.root}>
      {/* Lumină difuză în capul paginii — apa termală văzută de sus. */}
      <LinearGradient colors={gradients.light} style={styles.light} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Icon name="user" size={24} color={colors.navy} />
          </View>
          <View style={styles.greeting}>
            <Text style={styles.hello}>{t.hello}</Text>
            <Text style={styles.name}>{fullName || profile.name}</Text>
          </View>
          <Press
            onPress={() => go('notif')}
            style={styles.bell}
            accessibilityRole="button"
            accessibilityLabel={t.tabNotif}
          >
            <Icon name="bell" size={22} color={colors.navy} />
            <View style={styles.bellDot} />
          </Press>
        </View>

        <Text style={styles.sectionLabel}>{t.homeOffer}</Text>

        <Press onPress={() => go('promo')} style={styles.card} scaleTo={0.985} accessible={false}>
          <View style={styles.cardPhoto}>
            <PhotoCarousel
              photos={featured.gallery}
              style={styles.carousel}
              accessibilityLabel={`Fotografii de la ${featured.name}`}
            />
            <LinearGradient
              colors={['rgba(9,20,52,0.35)', 'rgba(9,20,52,0)']}
              locations={[0, 0.45]}
              style={styles.photoTopScrim}
            />
            {featured.discount && (
              <DiscountBadge discount={featured.discount} style={styles.cardBadge} />
            )}
            <View style={styles.cardRating}>
              <Icon name="star-filled" size={15} color={colors.amber} />
              <Text style={styles.cardRatingText}>{featured.rating}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{`${featured.name}, ${featured.city}`}</Text>
            <Text style={styles.cardMeta}>{t.heroMeta}</Text>

            <View style={styles.facts}>
              <View style={styles.fact}>
                <Icon name="calendar" size={18} color={colors.navy} />
                <Text style={styles.factText}>{next.dates}</Text>
              </View>
              <View style={styles.fact}>
                <Icon name="clock" size={18} color={colors.magentaText} />
                <Text style={styles.factSeats}>
                  {next.seatsLeft <= LOW_SEATS
                    ? `${t.departuresLast} · ${next.seatsLeft}`
                    : `${next.seatsLeft} ${t.departuresSeats}`}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Price
                value={featured.price}
                oldValue={featured.oldPrice}
                label={t.perPersonShort}
                style={styles.priceBlock}
              />
              <Pressable
                onPress={() => go('promo')}
                accessibilityRole="button"
                accessibilityLabel={`${t.seeOffer}, ${featured.name}, ${next.dates}, ${featured.price}`}
              >
                <LinearGradient
                  colors={gradients.water}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>{t.seeOffer}</Text>
                  <Icon name="arrow-right" size={19} color={colors.white} />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Press>

        <Departures />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.homeResorts}</Text>
          <Pressable onPress={() => go('list')} style={styles.linkButton} accessibilityRole="button">
            <Text style={styles.link}>{t.seeAll}</Text>
            <Icon name="arrow-right" size={17} color={colors.link} />
          </Pressable>
        </View>

        <View style={styles.tiles}>
          {content.resorts[lang].map((resort) => (
            <DestinationTile key={resort.id} resort={resort} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  light: { position: 'absolute', left: 0, right: 0, top: 0, height: 280 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.section },

  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.low,
  },
  greeting: { flex: 1, minWidth: 0 },
  hello: { ...type.small, color: colors.muted },
  name: { ...type.bodyStrong, color: colors.ink },
  bell: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.low,
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.magenta,
    borderWidth: 2,
    borderColor: colors.white,
  },

  /** Eticheta secțiunii: spune ce urmează, nu vinde categoria. */
  sectionLabel: {
    ...type.heading,
    color: colors.ink,
    marginTop: space.xl,
    marginBottom: space.md,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...shadow.hero,
  },
  cardPhoto: { height: 250, backgroundColor: '#000' },
  carousel: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  // `ImageBackground` transmite lățimea și înălțimea de aici imaginii din interior,
  // iar fără ele decuparea `cover` nu se aplică.
  tileImage: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  photoTopScrim: { position: 'absolute', left: 0, right: 0, top: 0, height: 110 },
  cardBadge: { position: 'absolute', left: space.md, top: space.md },
  cardRating: {
    position: 'absolute',
    right: space.md,
    top: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  cardRatingText: { ...type.micro, color: colors.ink },

  cardBody: { padding: space.xl },
  cardTitle: { ...type.title, color: colors.ink },
  cardMeta: { ...type.small, color: colors.muted, marginTop: space.xs },

  facts: { gap: space.md, marginTop: space.lg },
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  factText: { ...type.small, color: colors.body },
  factSeats: { ...type.smallStrong, color: colors.magentaText },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  priceBlock: { flexShrink: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: TOUCH + 4,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  ctaText: { ...type.bodyStrong, color: colors.white },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.section,
  },
  sectionTitle: { ...type.heading, color: colors.ink, flexShrink: 1 },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH,
    paddingLeft: space.md,
  },
  link: { ...type.smallStrong, color: colors.link },

  tiles: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  tile: {
    flex: 1,
    height: 170,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...shadow.card,
  },
  tileBody: { position: 'absolute', left: space.md, right: space.md, bottom: space.md },
  tileName: { ...type.smallStrong, color: colors.white },
  tilePrice: { ...type.small, color: colors.white, marginTop: 2 },
});
