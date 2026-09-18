import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { Icon } from './Icon';
import type { Discount } from '../data';
import { colors, gradients, radius, space, type } from '../theme';

/**
 * Eticheta de reducere.
 *
 * Cele două părți au greutăți diferite intenționat: „Reducere" e context, cifra e motivul
 * pentru care omul se oprește din derulat. Un singur șir plat le-ar face egale.
 */
export function DiscountBadge({
  discount,
  style,
}: {
  discount: Discount;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient
        colors={gradients.discount}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}
        accessible
        accessibilityLabel={`${discount.label} ${discount.value}`}
      >
        <View style={styles.iconWell}>
          <Icon name="tag" size={14} color={colors.white} />
        </View>
        <Text style={styles.label}>{discount.label}</Text>
        <Text style={styles.value}>{discount.value}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Umbra stă pe un înveliș separat: pe gradient direct s-ar tăia la colțuri.
  shadow: {
    borderRadius: radius.pill,
    shadowColor: '#6E0046',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 42,
    paddingLeft: 6,
    paddingRight: space.lg,
    borderRadius: radius.pill,
  },
  iconWell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...type.micro, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  value: { fontSize: 18, lineHeight: 22, fontWeight: '600', color: colors.white, marginLeft: -2 },
});
