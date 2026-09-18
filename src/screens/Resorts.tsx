import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { DiscountBadge } from '../components/DiscountBadge';
import { Price } from '../components/Price';
import { PillButton } from '../components/PillButton';
import { useApp } from '../AppState';
import type { Resort } from '../data';
import { Icon } from '../components/Icon';
import { colors, radius, shadow, space, type } from '../theme';

function ResortCard({ resort }: { resort: Resort }) {
  const { t, openResort } = useApp();

  return (
    <Pressable
      onPress={() => openResort(resort.id)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${resort.name}, ${resort.city}, ${t.a11yFrom} ${resort.price}, ${t.a11yRating} ${resort.rating}`}
    >
      <ImageBackground source={resort.gallery[0]} style={styles.photo} resizeMode="cover">
        <LinearGradient
          colors={['rgba(13,20,48,.4)', 'rgba(13,20,48,0)']}
          locations={[0, 0.5]}
          style={StyleSheet.absoluteFill}
        />
        {resort.discount && <DiscountBadge discount={resort.discount} style={styles.badge} />}
        <View style={styles.rating}>
          <Icon name="star-filled" size={15} color={colors.amber} />
          <Text style={styles.ratingText}>{resort.rating}</Text>
        </View>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.cityRow}>
          <Icon name="map-pin" size={17} color={colors.navy} />
          <Text style={styles.city}>{resort.city}</Text>
        </View>
        <Text style={styles.name}>{resort.name}</Text>

        <View style={styles.tags}>
          {resort.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Price
            value={resort.price}
            oldValue={resort.oldPrice}
            label={t.fromPrice}
            size={30}
            style={styles.priceBlock}
          />
          {/* Doar vizual: tot cardul e deja apăsabil. */}
          <PillButton label={t.tabDetails} />
        </View>
      </View>
    </Pressable>
  );
}

export function Resorts() {
  const { t, resorts } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t.listTitle}</Text>
      <View style={styles.list}>
        {resorts.map((resort) => (
          <ResortCard key={resort.name} resort={resort} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  title: { ...type.display, color: colors.ink, letterSpacing: -0.6 },

  list: { gap: space.lg, marginTop: space.xl },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadow.card,
  },
  // Lățimea e obligatorie: vezi nota din Promo.tsx.
  photo: { width: '100%', height: 180, backgroundColor: '#000' },
  badge: { position: 'absolute', left: space.md, top: space.md },
  rating: {
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
  ratingText: { ...type.micro, color: colors.ink },

  body: { padding: space.lg },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  city: { ...type.small, color: colors.muted },
  name: { ...type.title, color: colors.ink, marginTop: space.xs },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  tag: {
    backgroundColor: colors.chip,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  tagText: { ...type.micro, color: colors.body, fontWeight: '500' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  priceBlock: { flexShrink: 1 },
});
