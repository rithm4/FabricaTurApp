import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { colors, space, type } from '../theme';

type Props = {
  /** Prețul curent, în forma „542 €". */
  value: string;
  /** Prețul dinainte de reducere; se taie cu o linie. */
  oldValue?: string;
  /** Eticheta de deasupra, scrisă cu majuscule mici. */
  label?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Prețul, tratat ca o cifră, nu ca un șir de text.
 *
 * Semnul monedei coboară la aproximativ două treimi din corpul cifrelor și primește culoarea
 * secundară: ochiul citește întâi numărul, care e informația. Eticheta stă deasupra, nu dedesubt,
 * ca să nu rămână agățată sub cifră.
 */
export function Price({ value, oldValue, label, size = 38, style }: Props) {
  const [amount, currency] = value.split(' ');

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Text
          style={[styles.amount, { fontSize: size, lineHeight: size * 1.06 }]}
          allowFontScaling={false}
        >
          {amount}
          <Text style={[styles.currency, { fontSize: size * 0.62 }]}> {currency}</Text>
        </Text>
        {oldValue ? <Text style={styles.old}>{oldValue}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...type.micro,
    color: colors.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  amount: { fontWeight: '700', color: colors.ink, letterSpacing: -1.2 },
  currency: { fontWeight: '700', color: colors.muted, letterSpacing: 0 },
  old: { ...type.body, color: colors.muted, textDecorationLine: 'line-through' },
});
