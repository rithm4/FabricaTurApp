import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { Press } from './Press';
import { Icon } from './Icon';
import { useApp } from '../AppState';
import { content, LOW_SEATS, type Departure } from '../data';
import { colors, radius, shadow, space, type } from '../theme';

/**
 * Un rând pe dată de plecare. Apăsarea alege data și duce direct la cerere,
 * ca omul să nu mai fie întrebat ceva ce tocmai a spus.
 */
function Row({ departure, first }: { departure: Departure; first?: boolean }) {
  const { t, go, setDeparture } = useApp();
  const low = departure.seatsLeft <= LOW_SEATS;

  const choose = () => {
    setDeparture(departure);
    go('form');
  };

  return (
    <Press
      onPress={choose}
      scaleTo={0.985}
      style={[styles.row, !first && styles.rowDivider]}
      accessibilityRole="button"
      accessibilityLabel={`${departure.dates}, ${departure.nights} ${t.nights}, ${departure.seatsLeft} ${t.departuresSeats}`}
    >
      <View style={styles.left}>
        <Text style={styles.dates}>{departure.dates}</Text>
        <Text style={styles.nights}>{`${departure.nights} ${t.nights}`}</Text>

        {low ? (
          <View style={styles.lowChip}>
            <Icon name="clock" size={14} color={colors.magentaText} />
            <Text style={styles.lowText}>
              {`${t.departuresLast} · ${departure.seatsLeft}`}
            </Text>
          </View>
        ) : (
          <Text style={styles.seats}>{`${departure.seatsLeft} ${t.departuresSeats}`}</Text>
        )}
      </View>

      <Icon name="arrow-right" size={22} color={colors.navy} />
    </Press>
  );
}

export function Departures() {
  const { t, lang } = useApp();
  const list = content.departures[lang];

  return (
    <View>
      <Text style={styles.title}>{t.departuresTitle}</Text>
      <View style={styles.card}>
        {list.map((departure, index) => (
          <Row key={departure.id} departure={departure} first={index === 0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.heading, color: colors.ink, marginTop: space.section, marginBottom: space.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    minHeight: 92,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },

  left: { flex: 1, minWidth: 0, gap: 2 },
  dates: { ...type.bodyStrong, color: colors.ink },
  nights: { ...type.small, color: colors.muted },
  seats: { ...type.small, color: colors.muted, marginTop: space.xs },
  lowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.pinkSurface,
    paddingHorizontal: space.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    marginTop: space.sm,
  },
  lowText: { ...type.micro, color: colors.magentaText },

});
