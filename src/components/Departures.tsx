import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { Press } from './Press';
import { Icon } from './Icon';
import { useApp } from '../AppState';
import { nightsLabel } from '../i18n';
import { LOW_SEATS, type Departure, type ResortId } from '../data';
import { colors, radius, shadow, space, type } from '../theme';

/**
 * Un rând pe dată de plecare. Apăsarea alege data și duce direct la cerere,
 * ca omul să nu mai fie întrebat ceva ce tocmai a spus.
 */
function Row({
  departure,
  resortId,
  first,
}: {
  departure: Departure;
  resortId: ResortId;
  first?: boolean;
}) {
  const { t, lang, go, setDeparture, selectResort } = useApp();
  const full = departure.seatsLeft <= 0;
  const low = !full && departure.seatsLeft <= LOW_SEATS;

  const choose = () => {
    // Se reține și hotelul: cererea trebuie să știe pentru care stațiune e data aleasă.
    selectResort(resortId);
    setDeparture(departure);
    go('form');
  };

  return (
    <Press
      onPress={choose}
      // O plecare plină rămâne în listă, ca omul să știe că a existat, dar nu se mai poate alege.
      disabled={full}
      scaleTo={0.985}
      style={[styles.row, !first && styles.rowDivider, full && styles.rowFull]}
      accessibilityRole="button"
      accessibilityState={{ disabled: full }}
      accessibilityLabel={
        full
          ? `${departure.dates}, ${t.departuresFull}`
          : `${departure.dates}, ${nightsLabel(departure.nights, lang)}, ${departure.seatsLeft} ${t.departuresSeats}`
      }
    >
      <View style={styles.left}>
        <Text style={styles.dates}>{departure.dates}</Text>
        <Text style={styles.nights}>{nightsLabel(departure.nights, lang)}</Text>

        {full ? (
          <Text style={styles.seats}>{t.departuresFull}</Text>
        ) : low ? (
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

      {full ? null : <Icon name="arrow-right" size={22} color={colors.navy} />}
    </Press>
  );
}

/** `resortId` spune pentru ce stațiune sunt plecările — ca cererea să ducă hotelul corect. */
export function Departures({ resortId }: { resortId: ResortId }) {
  const { t, departuresFor } = useApp();
  const list = departuresFor(resortId);

  return (
    <View>
      <Text style={styles.title}>{t.departuresTitle}</Text>
      {list.length === 0 ? <Text style={styles.none}>{t.departuresNone}</Text> : null}
      <View style={[styles.card, list.length === 0 && styles.hidden]}>
        {list.map((departure, index) => (
          <Row
            key={departure.id}
            departure={departure}
            resortId={resortId}
            first={index === 0}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.heading, color: colors.ink, marginTop: space.section, marginBottom: space.md },
  none: { ...type.body, color: colors.muted },
  hidden: { display: 'none' },
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
  rowFull: { backgroundColor: colors.surface },

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
