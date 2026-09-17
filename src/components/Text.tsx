import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

/**
 * Inter Tight vine ca familii separate per grosime, nu ca o familie variabilă.
 * React Native nu alege singur fișierul după `fontWeight`, așa că îl alegem noi
 * și eliminăm `fontWeight`, altfel Android ar îngroșa sintetic peste fontul deja bold.
 */
const FAMILY_BY_WEIGHT: Record<string, string> = {
  '300': 'InterTight_300Light',
  '400': 'InterTight_400Regular',
  '500': 'InterTight_500Medium',
  '600': 'InterTight_600SemiBold',
  '700': 'InterTight_700Bold',
  '800': 'InterTight_800ExtraBold',
  '900': 'InterTight_900Black',
  normal: 'InterTight_400Regular',
  bold: 'InterTight_700Bold',
};

export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, ...withoutWeight } = flat;
  const family = FAMILY_BY_WEIGHT[String(fontWeight ?? '400')] ?? FAMILY_BY_WEIGHT['400'];

  return <RNText {...rest} style={[withoutWeight, { fontFamily: family }]} />;
}
