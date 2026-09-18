import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { PillButton } from '../components/PillButton';
import { useApp } from '../AppState';
import { colors, radius, space, type } from '../theme';

/**
 * Pagina unui articol: text mare și aerisit, fără nimic care să distragă. Rândurile de listă
 * au un punct albastru; la final, dacă articolul ține de un hotel, butonul spre el.
 */
export function ArticlePage() {
  const { t, article, resorts, openResort } = useApp();
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

        {resort ? (
          <View style={styles.resortCard}>
            <Text style={styles.resortName}>{resort.name}</Text>
            <Text style={styles.resortMeta}>{`${resort.city} · ${resort.price}`}</Text>
            <PillButton
              label={t.articleResort}
              onPress={() => openResort(resort.id)}
              style={styles.resortButton}
            />
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

  resortCard: {
    marginTop: space.section,
    padding: space.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.chipBlue,
  },
  resortName: { ...type.title, color: colors.ink },
  resortMeta: { ...type.small, color: colors.muted, marginTop: 2 },
  resortButton: { alignSelf: 'flex-start', marginTop: space.lg },

  missing: { flex: 1, padding: space.lg, gap: space.xl },
  missingText: { ...type.body, color: colors.muted, textAlign: 'center' },
});
