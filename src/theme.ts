import { Platform, type TextStyle } from 'react-native';

/**
 * Sistemul vizual al aplicației.
 *
 * Publicul principal are 50+ ani, deci pragurile sunt mai stricte decât minimul legal:
 * textul țintește 7:1 (WCAG AAA), nu 4.5:1, iar dimensiunea minimă de citit este 15px.
 * Valorile de culoare de mai jos nu sunt alese din ochi — sunt rezultatul căutării celei
 * mai apropiate variante mai închise care atinge raportul cerut, păstrând nuanța.
 */

/** Cele trei culori de brand, prelevate din pixelii logo-ului. Nu se modifică. */
const brand = {
  cyan: '#0597F2',
  navy: '#29458A',
  magenta: '#C4007D',
} as const;

export const colors = {
  ...brand,

  // — Text. Raportul notat este pe fundal alb. —
  ink: '#141A33', //        17.1:1  titluri și cifre importante
  body: '#2B3557', //       12.0:1  text de citit
  muted: '#454E71', //       7.6:1  text secundar (podeaua AAA)
  link: '#125488', //        7.9:1 pe alb, 7.1:1 pe pânză — AAA pe ambele
  magentaText: '#AC006D', // 7.1:1  magenta suficient de închis pentru text

  // — Suprafețe —
  white: '#FFFFFF',
  canvas: '#EDF2FA', //     fundalul paginii; cardurile albe se ridică de pe el
  surface: '#F3F6FC', //    carduri secundare
  chip: '#EAF0FA', //       pastile neutre
  chipBlue: '#E4EFFC', //   pastile accentuate, tab activ

  // — Linii. Deliberat discrete: separarea o face spațiul, nu linia. —
  line: '#DDE3F0',
  dash: '#CBD3E8',

  // — Stări —
  pinkSurface: '#FDE7F2',
  pinkChip: '#F9CCE4',
  pinkInk: '#8A0E52', //     7.9:1 pe pinkSurface
  track: '#C2CBE0', //       comutator în poziția oprit
  amber: '#F5A300', //       steaua de rating; sensul e purtat de cifra alăturată
  whatsapp: '#25D366',
  whatsappInk: '#0A2E17',

  // — Numai peste fotografii întunecate sau peste gradientul butonului principal —
  sky: '#4FC3F7',
  navyDeep: '#13204F',
  onDark: '#FFFFFF',
  onDarkMuted: '#D3DCF2',
} as const;

/**
 * Scara tipografică. Nimic destinat citirii nu coboară sub `small` (15px).
 * `micro` este rezervat badge-urilor și etichetelor scurte scrise cu majuscule.
 */
/*
 * Greutăți: 500 pentru ce se citește, 600 pentru titluri, accente și ce se apasă.
 * Nimic la 700 — când totul e bold, nimic nu mai iese în evidență și pagina arată apăsată.
 */
export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '600' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 25, fontWeight: '500' },
  bodyStrong: { fontSize: 17, lineHeight: 25, fontWeight: '600' },
  small: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  smallStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  micro: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
} as const;

/** Scara de spațiere. Pentru 50+, aerul dintre grupuri înlocuiește liniile de separare. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 26,
  pill: 100,
} as const;

/** Înălțimea minimă a oricărei zone apăsabile. WCAG cere 44; mergem la 48. */
export const TOUCH = 48;

/**
 * Scară de elevație. Umbra este colorată în bleumarin, nu în negru — o umbră neagră
 * peste un fundal albastru deschis murdărește culoarea și arată ieftin.
 */
export const shadow = {
  /** Suprafețe de sprijin: chip-uri, câmpuri. Abia vizibilă. */
  low: {
    shadowColor: '#1B2C5E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  /** Cardurile obișnuite. */
  card: {
    shadowColor: '#1B2C5E',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  /** Obiectul principal al ecranului. Un singur element pe ecran îl poartă. */
  hero: {
    shadowColor: '#1B2C5E',
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 22 },
    elevation: 12,
  },
  bar: {
    shadowColor: '#1B2C5E',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
} as const;

/** Gradientul de brand: apa termală, de la adânc la limpede. */
export const gradients = {
  water: ['#29458A', '#0597F2'] as const,
  /** Lumina difuză din capul ecranului principal. */
  light: ['rgba(5,151,242,0.14)', 'rgba(5,151,242,0)'] as const,
  /** Voal peste fotografii, ca textul alb să rămână lizibil. */
  scrim: ['rgba(9,20,52,0)', 'rgba(9,20,52,0.55)', 'rgba(9,20,52,0.92)'] as const,
  /**
   * Eticheta de reducere. Pornește din magenta de brand și se închide spre dreapta,
   * unde stă cifra: albul urcă acolo de la 5,8:1 la 8,0:1.
   */
  discount: ['#C4007D', '#9E0064'] as const,
} as const;

/** Durate de animație. Scurte și calme — nimic care să distragă. */
export const motion = {
  press: 90,
  enter: 260,
} as const;

/** Fotografiile din prototip, găzduite pe CDN-ul Tilda al site-ului Fabrica Tur. */
export const photos = {
  pool: 'https://static.tildacdn.com/tild6234-3034-4162-a665-353738336131/8b1715ab-4e4d-422d-8.png',
  walk: 'https://static.tildacdn.com/tild6661-6137-4938-b333-623261306665/8a19c449-f9d1-4a18-9.png',
  logo: 'https://static.tildacdn.com/tild6133-6363-4666-b536-336331643036/logo1.png',
} as const;

/**
 * Scoate conturul de focus pe care browserul îl pune peste câmpurile de text.
 *
 * Doar pe web, unde sub `TextInput` stă un `<input>` obișnuit. Nu rămânem fără indicator
 * de focus: câmpurile noastre își schimbă chenarul în bleumarin când sunt active, ceea ce
 * acoperă cerința WCAG 2.4.7. Fără asta, cele două contururi ar apărea unul peste altul.
 */
export const webInputReset = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;
