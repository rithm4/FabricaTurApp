import type { ImageSourcePropType } from 'react-native';

import type { IconName } from './components/Icon';
import type { Lang } from './i18n';
import { kumania } from './images';
import { photos } from './theme';

/** Identificatorii celor două destinații pe care le are agenția în acest moment. */
export type ResortId = 'kumania' | 'hungarospa';

/**
 * Reducerea se ține despărțită în etichetă și cifră, ca eticheta vizuală să le poată
 * pune în ierarhii diferite. Cifra e motivul pentru care omul se oprește.
 */
export type Discount = { label: string; value: string };

export type Resort = {
  id: ResortId;
  name: string;
  city: string;
  price: string;
  /** Prețul tăiat; există doar cât timp reducerea e activă. */
  oldPrice?: string;
  rating: string;
  /** Temperatura apei la sursă, așa cum se afișează pe pagina stațiunii. */
  waterTemp: string;
  nights: number;
  /** Lipsește când stațiunea nu are reducere activă. */
  discount?: Discount;
  /** „30 septembrie” — ultima zi a ofertei; lipsește când nu are termen sau a trecut. */
  offerUntil?: string;
  tags: string[];
  /** Fotografiile stațiunii. Prima e și cea folosită pe cardurile mici. */
  gallery: ImageSourcePropType[];
};

/** Unde duce apăsarea pe o notificare: la promoție, la un hotel anume sau la rezervări. */
export type NotificationTarget = 'promo' | ResortId | 'bookings';

/** Cele patru categorii, în ordinea comutatoarelor din setări (`notifOn[0]` = promo …). */
export const AUDIENCES = ['promo', 'lastSeats', 'newDepartures', 'news'] as const;
export type Audience = (typeof AUDIENCES)[number];

export type NotificationItem = {
  id: string;
  audience: Audience;
  /** Momentul trimiterii, ISO — după el știm ce e necitit. */
  sentAt: string;
  icon: IconName;
  target: NotificationTarget;
  title: string;
  text: string;
  when: string;
  accent?: boolean;
};

/** Cele două destinații reale. Nu adăuga aici nimic care nu e în ofertă. */
const resorts: Record<Lang, Resort[]> = {
  ro: [
    {
      id: 'kumania',
      name: 'Hotel Kumánia',
      city: 'Kisújszállás',
      price: '542 €',
      oldPrice: '610 €',
      rating: '8,9',
      waterTemp: '47–61 °C',
      nights: 7,
      discount: { label: 'Reducere', value: '68 €' },
      tags: ['Acces direct', 'Proceduri'],
      gallery: kumania,
    },
    {
      id: 'hungarospa',
      name: 'Hotel Hungarospa',
      city: 'Hajdúszoboszló',
      price: '575 €',
      rating: '9,1',
      waterTemp: '38–40 °C',
      nights: 7,
      tags: ['Cel mai mare complex', 'Wellness'],
      gallery: [{ uri: photos.walk }],
    },
  ],
  ru: [
    {
      id: 'kumania',
      name: 'Hotel Kumánia',
      city: 'Кишуйсаллаш',
      price: '542 €',
      oldPrice: '610 €',
      rating: '8,9',
      waterTemp: '47–61 °C',
      nights: 7,
      discount: { label: 'Скидка', value: '68 €' },
      tags: ['Прямой переход', 'Процедуры'],
      gallery: kumania,
    },
    {
      id: 'hungarospa',
      name: 'Hotel Hungarospa',
      city: 'Хайдусобосло',
      price: '575 €',
      rating: '9,1',
      waterTemp: '38–40 °C',
      nights: 7,
      tags: ['Крупнейший комплекс', 'Wellness'],
      gallery: [{ uri: photos.walk }],
    },
  ],
};

/** Etichetele celor patru comutatoare din ecranul de profil. */
const notificationSettings: Record<Lang, string[]> = {
  ro: ['Promoții cu preț redus', 'Ultimele locuri la o plecare', 'Plecări noi în calendar', 'Noutăți despre stațiuni'],
  ru: ['Акции со скидкой', 'Последние места на выезд', 'Новые даты выезда', 'Новости курортов'],
};

export type Departure = {
  id: string;
  /**
   * Intervalul complet, nu doar ziua plecării: omul își planifică în intervale
   * („sunt plecat de pe 12 până pe 19"), nu în durate abstracte.
   */
  dates: string;
  /** Doar ziua plecării, pentru locurile unde nu încape intervalul. */
  date: string;
  nights: number;
  seatsLeft: number;
};

/**
 * PROVIZORIU — date și prețuri de lucru, nu cele reale ale agenției.
 * Se înlocuiesc aici, într-un singur loc.
 */
const departures: Record<Lang, Departure[]> = {
  ro: [
    { id: 'oct-12', dates: '12 – 19 octombrie', date: '12 octombrie', nights: 7, seatsLeft: 4 },
    { id: 'oct-26', dates: '26 octombrie – 2 noiembrie', date: '26 octombrie', nights: 7, seatsLeft: 11 },
    { id: 'nov-09', dates: '9 – 16 noiembrie', date: '9 noiembrie', nights: 7, seatsLeft: 16 },
    { id: 'nov-23', dates: '23 noiembrie – 3 decembrie', date: '23 noiembrie', nights: 10, seatsLeft: 20 },
    { id: 'dec-07', dates: '7 – 14 decembrie', date: '7 decembrie', nights: 7, seatsLeft: 22 },
  ],
  ru: [
    { id: 'oct-12', dates: '12 – 19 октября', date: '12 октября', nights: 7, seatsLeft: 4 },
    { id: 'oct-26', dates: '26 октября – 2 ноября', date: '26 октября', nights: 7, seatsLeft: 11 },
    { id: 'nov-09', dates: '9 – 16 ноября', date: '9 ноября', nights: 7, seatsLeft: 16 },
    { id: 'nov-23', dates: '23 ноября – 3 декабря', date: '23 ноября', nights: 10, seatsLeft: 20 },
    { id: 'dec-07', dates: '7 – 14 декабря', date: '7 декабря', nights: 7, seatsLeft: 22 },
  ],
};

/** Sub acest prag, numărul de locuri devine un semnal, nu o informație. */
export const LOW_SEATS = 6;

export const content = { resorts, notificationSettings, departures };

/**
 * Datele agenției.
 *
 * GOL până îl confirmă agenția. Cu numărul gol, cererile se salvează doar pe telefon și
 * NU ajung la agenție; cu el completat, butonul devine Trimite pe WhatsApp.
 */
export const agency = {
  /** Doar cifre, cu prefixul țării. Exemplu: 37369123456 */
  whatsapp: '',
};

export const profile = {
  name: 'Ion Popescu',
  phone: '+373 60 181 999',
} as const;
