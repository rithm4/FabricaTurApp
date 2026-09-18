import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { PillButton } from '../components/PillButton';
import { Icon } from '../components/Icon';
import { useApp } from '../AppState';
import { colors, radius, space, TOUCH, type } from '../theme';

/**
 * Pagina unui articol: text mare și aerisit, fără nimic care să distragă. Rândurile de listă
 * au un punct albastru; la final, dacă articolul ține de un hotel, butonul spre el.
 */
export function ArticlePage() {
  const { t, article, resorts, openResort, selectResort, setDeparture, go } = useApp();
  const insets = useSafeAreaInsets();

  if (!article) {
    return (
      <View style={styles.missing}>
        <BackButton />
        <Text style={styles.missingText}>{t.articlesEmpty}</Text>
      </View>
    );
  }

  const resort = resorts.find((r) => r.id === article.resortId);
  // Cererea: pentru hotelul articolului, sau pentru oferta săptămânii dacă articolul e general.
  const target = resort ?? resorts[0];
  const book = () => {
    if (!target) return;
    selectResort(target.id);
    setDeparture(null);
    go('form');
  };
  const minutes = t.articleMinutes.replace('{n}', String(article.minutes));

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {article.cover ? (
        <ImageBackground source={{ uri: article.cover }} style={styles.hero} resizeMode="cover">
          <LinearGradient
            colors={['rgba(13,20,48,.45)', 'rgba(13,20,48,0)']}
            locations={[0, 0.4]}
            style={StyleSheet.absoluteFill}
          />
          <BackButton onDark style={[styles.back, { top: insets.top + space.lg }]} />
        </ImageBackground>
      ) : (
        <View style={styles.plainHeader}>
          <BackButton />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.minutes}>{minutes}</Text>
        <Text style={styles.title}>{article.title}</Text>
        {article.summary ? <Text style={styles.summary}>{article.summary}</Text> : null}

        <View style={styles.body}>
          {article.blocks.map((block, index) =>
            block.kind === 'li' ? (
              <View key={index} style={styles.li}>
                <View style={styles.dot} />
                <Text style={styles.liText}>{block.text}</Text>
              </View>
            ) : (
              <Text key={index} style={styles.p}>
                {block.text}
              </Text>
            ),
          )}
        </View>

        {/* La final, pasul următor: o cerere de ofertă, fără să cauți unde se face. */}
        {target ? (
          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>{t.articleCtaTitle}</Text>
            <Text style={styles.ctaText}>
              {resort ? `${resort.name} · ${resort.city} · ${resort.price}` : t.articleCtaText}
            </Text>
            <PillButton label={t.articleCtaButton} onPress={book} style={styles.ctaButton} />
            {resort ? (
              <Pressable onPress={() => openResort(resort.id)} style={styles.ctaLink} accessibilityRole="button">
                <Text style={styles.ctaLinkText}>{t.articleResort}</Text>
                <Icon name="arrow-right" size={16} color={colors.link} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Lățimea e obligatorie: pe web, fără ea imaginea iese la mărimea fișierului, tăiată.
  hero: { width: '100%', height: 260, backgroundColor: '#000' },
  back: { position: 'absolute', left: space.lg },
  plainHeader: { paddingHorizontal: space.lg, paddingTop: space.md },

  content: { paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.section },
  minutes: { ...type.micro, color: colors.link, textTransform: 'uppercase', letterSpacing: 1 },
  title: { ...type.display, color: colors.ink, letterSpacing: -0.6, marginTop: space.sm },
  summary: { ...type.body, color: colors.muted, marginTop: space.md },

  // Text mare și rânduri aerisite: se citește ușor, fără ochelari de aproape.
  body: { gap: space.lg, marginTop: space.xl },
  p: { fontSize: 18, lineHeight: 29, color: colors.body },
  li: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.navy,
    marginTop: 11,
  },
  liText: { flex: 1, fontSize: 18, lineHeight: 29, color: colors.body },

  cta: {
    marginTop: space.section,
    padding: space.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.chipBlue,
  },
  ctaTitle: { ...type.title, color: colors.ink },
  ctaText: { ...type.body, color: colors.body, marginTop: space.xs },
  ctaButton: { alignSelf: 'flex-start', marginTop: space.lg },
  ctaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: TOUCH,
    marginTop: space.sm,
  },
  ctaLinkText: { ...type.smallStrong, color: colors.link },

  missing: { flex: 1, padding: space.lg, gap: space.xl },
  missingText: { ...type.body, color: colors.muted, textAlign: 'center' },
});
