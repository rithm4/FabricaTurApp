import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Press } from '../components/Press';
import { Departures } from '../components/Departures';
import { DiscountBadge } from '../components/DiscountBadge';
import { Price } from '../components/Price';
import { PillButton } from '../components/PillButton';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { useApp } from '../AppState';
import { nightsLabel } from '../i18n';
import { LOW_SEATS, type Resort } from '../data';
import { initials } from './Profile';
import { ArticleTile } from './Articles';
import { Icon } from '../components/Icon';
import { colors, gradients, radius, shadow, space, TOUCH, type } from '../theme';

/** Cardul pătrat din rândul „Destinații recomandate”. */
function DestinationTile({ resort }: { resort: Resort }) {
  const { t, openResort } = useApp();
  const { name, price } = resort;

  return (
    <Press
      onPress={() => openResort(resort.id)}
      style={styles.tile}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${t.a11yFrom} ${price}`}
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
  const { t, lang, go, fullName, resorts, nextDeparture, unreadCount, articles } = useApp();
  // Cardul de sus arată întotdeauna prima plecare din listă, ca cele două să nu se contrazică.
  /** Oferta săptămânii e a primei destinații din listă. */
  const featured = resorts[0];
  // Poate lipsi: cu date reale, un hotel poate să nu aibă nicio plecare programată.
  const next = nextDeparture(featured.id);

  return (
    <View style={styles.root}>
      {/* Lumină difuză în capul paginii — apa termală văzută de sus. */}
      <LinearGradient colors={gradients.light} style={styles.light} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Press
            onPress={() => go('profile')}
            style={styles.avatar}
            accessibilityRole="button"
            accessibilityLabel={t.tabProfile}
          >
            <Text style={styles.avatarText}>{initials(fullName) || '·'}</Text>
          </Press>
          <View style={styles.greeting}>
            <Text style={styles.hello}>{t.hello}</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>
          <Press
            onPress={() => go('notif')}
            style={styles.bell}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `${t.tabNotif}, ${unreadCount} ${t.a11yUnread}` : t.tabNotif
            }
          >
            <Icon name="bell" size={22} color={colors.navy} />
            {/* Punctul apare doar când chiar e ceva nou — altfel nu mai înseamnă nimic. */}
            {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
          </Press>
        </View>

        <Text style={styles.sectionLabel}>{t.homeOffer}</Text>

        <Press onPress={() => go('promo')} style={styles.card} scaleTo={0.985} accessible={false}>
          <View style={styles.cardPhoto}>
            <PhotoCarousel
              photos={featured.gallery}
              style={styles.carousel}
              accessibilityLabel={`${t.a11yPhotosOf} ${featured.name}`}
            />
            <LinearGradient
              colors={['rgba(9,20,52,0.35)', 'rgba(9,20,52,0)']}
              locations={[0, 0.45]}
              style={styles.photoTopScrim}
            />
            {featured.discount && (
              <DiscountBadge discount={featured.discount} style={styles.cardBadge} />
            )}
            {featured.rating ? (
              <View style={styles.cardRating}>
                <Icon name="star-filled" size={15} color={colors.amber} />
                <Text style={styles.cardRatingText}>{featured.rating}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{`${featured.name}, ${featured.city}`}</Text>
            <Text style={styles.cardMeta}>{[nightsLabel(next?.nights ?? featured.nights, lang), featured.short].filter(Boolean).join(' · ')}</Text>

            {/* Fără nicio plecare programată, rândurile cu data și locurile nu au ce arăta. */}
            {next ? (
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
            ) : null}

            <View style={styles.cardFooter}>
              <Price
                value={featured.price}
                oldValue={featured.oldPrice}
                label={t.perPersonShort}
                style={styles.priceBlock}
              />
              <PillButton
                label={t.seeOffer}
                onPress={() => go('promo')}
                accessibilityLabel={`${t.seeOffer}, ${featured.name}, ${next?.dates ?? ''}, ${featured.price}`}
              />
            </View>
          </View>
        </Press>

        {/* Plecările întâi: data e primul lucru pe care îl caută cine vrea să plece. */}
        <Departures resortId={featured.id} compact />

        {/*
          Sfaturile, imediat sub plecări: aici le vede oricine deschide aplicația.
          Cardurile se derulează în lateral, ca să nu împingă plecările mult în jos.
        */}
        {articles.length > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t.articlesTitle}</Text>
              <Pressable onPress={() => go('articles')} style={styles.linkButton} accessibilityRole="button">
                <Text style={styles.link}>{t.seeAll}</Text>
                <Icon name="arrow-right" size={17} color={colors.link} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tilesScrollBox}
              contentContainerStyle={styles.articleScroll}
            >
              {articles.slice(0, 6).map((article) => (
                <ArticleTile key={article.id} article={article} />
              ))}
            </ScrollView>
          </>
        ) : null}


        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.homeResorts}</Text>
          <Pressable onPress={() => go('list')} style={styles.linkButton} accessibilityRole="button">
            <Text style={styles.link}>{t.seeAll}</Text>
            <Icon name="arrow-right" size={17} color={colors.link} />
          </Pressable>
        </View>

        {resorts.length <= 2 ? (
          <View style={styles.tiles}>
            {resorts.map((resort) => (
              <View key={resort.id} style={styles.tileCell}>
                <DestinationTile resort={resort} />
              </View>
            ))}
          </View>
        ) : (
          // Cu mai multe destinații, cardurile își păstrează lățimea și se derulează.
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tilesScroll}
            style={styles.tilesScrollBox}
          >
            {resorts.map((resort) => (
              <View key={resort.id} style={styles.tileFixed}>
                <DestinationTile resort={resort} />
              </View>
            ))}
          </ScrollView>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  light: { position: 'absolute', left: 0, right: 0, top: 0, height: 280 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.section },

  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatarText: { ...type.smallStrong, color: colors.navy },
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  priceBlock: { flexShrink: 0 },

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
  // Coloană, nu rând: cardul se întinde pe toată lățimea celulei.
  tileCell: { flex: 1 },
  // Loc și pentru umbra cardurilor, altfel derularea o taie jos.
  articleScroll: { gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md },
  // Derularea ajunge până la marginile ecranului, dar primul card stă aliniat cu textul.
  tilesScrollBox: { marginHorizontal: -space.lg, marginTop: space.md },
  tilesScroll: { gap: space.md, paddingHorizontal: space.lg },
  tileFixed: { width: 160 },
  // Fără flex: în învelișul lui (fără înălțime proprie), flex i-ar anula înălțimea de 170.
  tile: {
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
