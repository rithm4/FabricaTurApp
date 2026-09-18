import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Press } from '../components/Press';
import { BackButton } from '../components/BackButton';
import { Icon } from '../components/Icon';
import { useApp } from '../AppState';
import type { Article } from '../data';
import { colors, gradients, radius, shadow, space, type } from '../theme';

/** Un articol în listă: copertă mică, titlu, rezumat și cât durează cititul. */
export function ArticleCard({ article }: { article: Article }) {
  const { t, openArticle } = useApp();
  const minutes = t.articleMinutes.replace('{n}', String(article.minutes));

  return (
    <Press
      onPress={() => openArticle(article.id)}
      scaleTo={0.985}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${article.title}. ${article.summary} ${minutes}`}
    >
      {article.cover ? (
        <Image source={{ uri: article.cover }} style={styles.cover} resizeMode="cover" />
      ) : (
        // Fără copertă: un semn liniștit, nu un loc gol.
        <View style={[styles.cover, styles.coverEmpty]}>
          <Icon name="news" size={26} color={colors.navy} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>
        {article.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {article.summary}
          </Text>
        ) : null}
        <Text style={styles.minutes}>{minutes}</Text>
      </View>
    </Press>
  );
}

/**
 * Cardul mare de pe Acasă: fotografie sus, titlu dedesubt. Se derulează în lateral, ca să
 * încapă mai multe articole fără să împingă restul paginii în jos.
 */
export function ArticleTile({ article }: { article: Article }) {
  const { t, openArticle } = useApp();
  const minutes = t.articleMinutes.replace('{n}', String(article.minutes));

  return (
    <Press
      onPress={() => openArticle(article.id)}
      scaleTo={0.97}
      style={styles.tile}
      accessibilityRole="button"
      accessibilityLabel={`${article.title}. ${minutes}`}
    >
      {article.cover ? (
        <Image source={{ uri: article.cover }} style={styles.tileCover} resizeMode="cover" />
      ) : (
        <LinearGradient colors={gradients.water} style={[styles.tileCover, styles.tileCoverEmpty]}>
          <Icon name="news" size={34} color={colors.white} />
        </LinearGradient>
      )}
      <View style={styles.tileBody}>
        <Text style={styles.tileTitle} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={styles.minutes}>{minutes}</Text>
      </View>
    </Press>
  );
}

/** Toate articolele publicate. */
export function Articles() {
  const { t, articles } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.pageTitle}>{t.articlesTitle}</Text>
      </View>

      <View style={styles.list}>
        {articles.length === 0 ? <Text style={styles.empty}>{t.articlesEmpty}</Text> : null}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pageTitle: { ...type.title, color: colors.ink, flex: 1 },
  list: { gap: space.md, marginTop: space.xl },
  empty: { ...type.body, color: colors.muted, textAlign: 'center', paddingVertical: space.section },

  card: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  // Lățimea și înălțimea explicite: pe web, o imagine fără ele iese la mărimea fișierului.
  cover: { width: 92, height: 92, borderRadius: radius.lg, backgroundColor: colors.chipBlue },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { ...type.bodyStrong, color: colors.ink },
  summary: { ...type.small, color: colors.muted, marginTop: 2 },
  minutes: { ...type.micro, color: colors.link, marginTop: space.sm },

  tile: {
    width: 250,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadow.card,
  },
  tileCover: { width: '100%', height: 140, backgroundColor: colors.chipBlue },
  tileCoverEmpty: { alignItems: 'center', justifyContent: 'center' },
  tileBody: { padding: space.lg, paddingTop: space.md },
  tileTitle: { ...type.bodyStrong, color: colors.ink, minHeight: 48 },
});
