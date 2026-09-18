import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { Press } from './Press';
import { Icon } from './Icon';
import { useApp } from '../AppState';
import { lastSeatsLabel, nightsLabel, type Lang } from '../i18n';
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
            <Text style={styles.lowText}>{`${t.departuresLast} · ${departure.seatsLeft}`}</Text>
          </View>
        ) : (
          <Text style={styles.seats}>{`${departure.seatsLeft} ${t.departuresSeats}`}</Text>
        )}
      </View>

      {full ? null : <Icon name="arrow-right" size={22} color={colors.navy} />}
    </Press>
  );
}

const locale = (lang: Lang) => (lang === 'ro' ? 'ro-RO' : 'ru-RU');

/** Ziua plecării desfăcută pentru fila de calendar: „OCT", „12", „sâmbătă", „19 octombrie". */
function calendar(start: string, nights: number, lang: Lang) {
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(from);
  to.setDate(from.getDate() + nights);
  const month = from
    .toLocaleDateString(locale(lang), { month: 'short' })
    .replace('.', '')
    .toUpperCase();
  const weekday = from.toLocaleDateString(locale(lang), { weekday: 'long' });
  return {
    month,
    day: String(from.getDate()),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    until: to.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long' }),
  };
}

/**
 * O plecare ca o filă de calendar, pentru Acasă: luna și ziua mare, ziua săptămânii,
 * nopțile, data întoarcerii, locurile. Apăsat, duce la cerere cu data deja aleasă —
 * exact ca rândul din lista mare.
 */
function Chip({ departure, resortId }: { departure: Departure; resortId: ResortId }) {
  const { t, lang, go, setDeparture, selectResort } = useApp();
  const full = departure.seatsLeft <= 0;
  const low = !full && departure.seatsLeft <= LOW_SEATS;
  const cal = departure.start ? calendar(departure.start, departure.nights, lang) : null;

  const choose = () => {
    selectResort(resortId);
    setDeparture(departure);
    go('form');
  };

  return (
    <Press
      onPress={choose}
      disabled={full}
      scaleTo={0.96}
      style={[styles.chip, full && styles.chipFull]}
      accessibilityRole="button"
      accessibilityState={{ disabled: full }}
      accessibilityLabel={
        full
          ? `${departure.dates}, ${t.departuresFull}`
          : `${departure.dates}, ${nightsLabel(departure.nights, lang)}, ${departure.seatsLeft} ${t.departuresSeats}`
      }
    >
      {cal ? (
        <View style={styles.chipTop}>
          {/* Fila de calendar: se recunoaște înainte de a citi. */}
          <View style={[styles.leaf, full && styles.leafFull]}>
            <View style={[styles.leafBand, full && styles.leafBandFull]}>
              <Text style={styles.leafMonth}>{cal.month}</Text>
            </View>
            <Text style={[styles.leafDay, full && styles.muted]}>{cal.day}</Text>
          </View>
          <View style={styles.chipHead}>
            <Text style={styles.weekday} numberOfLines={1}>
              {cal.weekday}
            </Text>
            <Text style={[styles.chipNights, full && styles.muted]}>
              {nightsLabel(departure.nights, lang)}
            </Text>
          </View>
          {full ? null : (
            <View style={styles.go}>
              <Icon name="arrow-right" size={16} color={colors.navy} />
            </View>
          )}
        </View>
      ) : (
        <Text style={[styles.chipNights, full && styles.muted]} numberOfLines={2}>
          {departure.dates}
        </Text>
      )}

      {cal ? (
        <Text style={styles.until} numberOfLines={1}>
          {t.departuresUntil.replace('{date}', cal.until)}
        </Text>
      ) : null}

      <View style={styles.chipBottom}>
        {full ? (
          <Text style={styles.chipSeats}>{t.departuresFull}</Text>
        ) : low ? (
          <View style={styles.chipLowRow}>
            <Icon name="clock" size={15} color={colors.magentaText} />
            <Text style={styles.chipLowText} numberOfLines={1}>
              {lastSeatsLabel(departure.seatsLeft, lang)}
            </Text>
          </View>
        ) : (
          <Text style={styles.chipSeats} numberOfLines={1}>
            {`${departure.seatsLeft} ${t.departuresSeats}`}
          </Text>
        )}
      </View>
    </Press>
  );
}

/**
 * `resortId` spune pentru ce stațiune sunt plecările — ca cererea să ducă hotelul corect.
 * `compact`: pe Acasă, file de calendar care se derulează în lateral — toate datele la
 * vedere, într-un singur rând, fără să împingă restul paginii în jos.
 */
export function Departures({ resortId, compact }: { resortId: ResortId; compact?: boolean }) {
  const { t, departuresFor } = useApp();
  const list = departuresFor(resortId);

  if (compact) {
    return (
      <View>
        <Text style={styles.title}>{t.departuresTitle}</Text>
        {list.length === 0 ? (
          <Text style={styles.none}>{t.departuresNone}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScrollBox}
            contentContainerStyle={styles.chipScroll}
          >
            {list.map((departure) => (
              <Chip key={departure.id} departure={departure} resortId={resortId} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>{t.departuresTitle}</Text>
      {list.length === 0 ? <Text style={styles.none}>{t.departuresNone}</Text> : null}
      <View style={[styles.card, list.length === 0 && styles.hidden]}>
        {list.map((departure, index) => (
          <Row key={departure.id} departure={departure} resortId={resortId} first={index === 0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.heading, color: colors.ink, marginTop: space.section, marginBottom: space.md },
  none: { ...type.body, color: colors.muted },
  hidden: { display: 'none' },
  muted: { color: colors.muted },

  // Derularea ajunge la marginile ecranului; primul card stă aliniat cu textul.
  chipScrollBox: { marginHorizontal: -space.lg },
  chipScroll: { gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md },

  // Mărime fixă: cardurile stau aliniate, oricât de lungă e o dată.
  chip: {
    width: 196,
    height: 164,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  chipFull: { backgroundColor: colors.surface },
  chipTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },

  // Fila de calendar: banda bleumarin cu luna, ziua mare dedesubt.
  leaf: {
    width: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    alignItems: 'center',
  },
  leafFull: { backgroundColor: colors.surface },
  leafBand: { alignSelf: 'stretch', backgroundColor: colors.navy, paddingVertical: 3 },
  leafBandFull: { backgroundColor: colors.muted },
  leafMonth: {
    ...type.micro,
    fontSize: 12,
    lineHeight: 15,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  leafDay: { fontSize: 24, lineHeight: 32, fontWeight: '600', color: colors.ink },

  chipHead: { flex: 1, minWidth: 0 },
  weekday: { ...type.small, color: colors.muted },
  chipNights: { ...type.bodyStrong, color: colors.ink },
  until: { ...type.small, color: colors.body, marginTop: space.md },

  // Împins jos: locurile pe aceeași linie la toate cardurile, cu tot rândul pentru ele.
  chipBottom: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  chipSeats: { ...type.small, color: colors.muted, flexShrink: 1 },
  chipLowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  chipLowText: { ...type.smallStrong, color: colors.magentaText, flexShrink: 1 },
  go: {
    alignSelf: 'flex-start',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.chipBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
