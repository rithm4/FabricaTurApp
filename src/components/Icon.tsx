import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Prototipul folosește setul Lucide, care nu există în React Native. Numele de mai jos
 * sunt echivalentele cele mai apropiate din Feather / MaterialCommunityIcons.
 */
const feather = {
  tag: 'tag',
  calendar: 'calendar',
  users: 'users',
  bell: 'bell',
  'chevrons-right': 'chevrons-right',
  user: 'user',
  'arrow-right': 'arrow-right',
  'arrow-left': 'arrow-left',
  clock: 'clock',
  home: 'home',
  'map-pin': 'map-pin',
  thermometer: 'thermometer',
  moon: 'moon',
  heart: 'heart',
  plus: 'plus',
  check: 'check',
  send: 'send',
  phone: 'phone',
  news: 'file-text',
  'chevron-right': 'chevron-right',
  globe: 'globe',
  'log-out': 'log-out',
  x: 'x',
} as const;

const community = {
  waves: 'waves',
  'door-open': 'door-open',
  stethoscope: 'stethoscope',
  utensils: 'silverware-fork-knife',
  'star-filled': 'star',
  whatsapp: 'whatsapp',
} as const;

export type IconName = keyof typeof feather | keyof typeof community;

type Props = {
  name: IconName;
  size?: number;
  color: string;
};

export function Icon({ name, size = 20, color }: Props) {
  if (name in community) {
    const glyph = community[name as keyof typeof community];
    return <MaterialCommunityIcons name={glyph} size={size} color={color} />;
  }
  const glyph = feather[name as keyof typeof feather];
  return <Feather name={glyph} size={size} color={color} />;
}
