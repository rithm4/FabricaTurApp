import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { Departures } from '../components/Departures';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { useApp } from '../AppState';
import { nightsLabel } from '../i18n';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, space, TOUCH, type } from '../theme';

function Stat({
  icon,
  color,
  value,
  label,
}: {
  icon: IconName;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Feature({ icon, label, first }: { icon: IconName; label: string; first?: boolean }) {
  return (
    <View style={[styles.feature, !first && styles.featureDivider]}>
      <Icon name={icon} size={22} color={colors.navy} />
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

export function ResortDetail() {
  const { t, lang, go, resort } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <PhotoCarousel
          photos={resort.gallery}
          style={styles.heroCarousel}
          accessibilityLabel={`${t.a11yPhotosOf} ${resort.name}`}
          showDots={false}
        />
        <LinearGradient
          colors={['rgba(13,20,48,.5)', 'rgba(13,20,48,0)', 'rgba(13,20,48,.92)']}
          locations={[0, 0.34, 1]}
          style={StyleSheet.absoluteFill}
        />
        <BackButton
          onDark
          style={[styles.floating, { left: space.lg, top: insets.top + space.lg }]}
        />
        <View style={styles.heroBody}>
          <View style={styles.cityRow}>
            <Icon name="map-pin" size={17} color={colors.sky} />
            <Text style={styles.city}>{`${resort.city}, ${t.hungary}`}</Text>
          </View>
          <Text style={styles.name}>{resort.name}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.stats}>
          <Stat icon="thermometer" color={colors.navy} value={resort.waterTemp} label={t.water} />
          <Stat
            icon="star-filled"
            color={colors.amber}
            value={`${resort.rating} / 10`}
            label="Booking"
          />
          <Stat
            icon="moon"
            color={colors.navy}
            value={nightsLabel(resort.nights, lang)}
            label={t.stay}
          />
        </View>

        <Departures resortId={resort.id} />

        <View style={styles.features}>
          <Feature icon="door-open" label={t.resortF1} first />
          <Feature icon="waves" label={t.resortF2} />
          <Feature icon="stethoscope" label={t.resortF3} />
          <Feature icon="utensils" label={t.resortF4} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.gallery}</Text>
          <Pressable onPress={() => go('list')} style={styles.linkButton} accessibilityRole="button">
            <Text style={styles.link}>{t.seeAll}</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gallery}
        >
          {resort.gallery.map((source, index) => (
            <Image
              key={index}
              source={source}
              style={styles.galleryItem}
              accessibilityLabel={t.a11yPhotoN
                .replace('{n}', String(index + 1))
                .replace('{all}', String(resort.gallery.length))}
            />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 320, backgroundColor: '#000' },
  heroCarousel: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  // Doar poziția pentru butonul Înapoi; aspectul îl dă BackButton.
  floating: { position: 'absolute' },
  heroBody: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  city: { ...type.small, color: colors.onDarkMuted, fontWeight: '600' },
  name: { ...type.display, color: colors.white, letterSpacing: -0.6, marginTop: space.xs },

  content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.section },

  stats: { flexDirection: 'row', gap: space.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    alignItems: 'center',
  },
  statValue: { ...type.smallStrong, color: colors.ink, marginTop: space.sm, textAlign: 'center' },
  statLabel: { ...type.micro, color: colors.muted, fontWeight: '500', marginTop: 2, textAlign: 'center' },

  features: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginTop: space.xl,
    overflow: 'hidden',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    minHeight: 64,
  },
  featureDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  featureLabel: { ...type.body, color: colors.body, flex: 1 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.section,
  },
  sectionTitle: { ...type.heading, color: colors.ink, flexShrink: 1 },
  linkButton: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: space.md },
  link: { ...type.smallStrong, color: colors.link },

  gallery: { gap: space.md, marginTop: space.md },
  galleryItem: { width: 160, height: 120, borderRadius: radius.lg, backgroundColor: '#000' },
});
