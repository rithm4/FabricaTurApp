import type { ImageSourcePropType } from 'react-native';

import type { IconName } from './components/Icon';
import type { Lang } from './i18n';
import { kumania } from './images';
import { photos } from './theme';

/**
 * Identificatorul unei destinații („kumania", „hungarospa"). Destinațiile noi se adaugă
 * din panou, deci lista nu e fixă în aplicație.
 */
export type ResortId = string;

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
  /** Oferta săptămânii — o singură stațiune, aleasă din panou. */
  featured: boolean;
  /** Ce e inclus, pe scurt: „Transport și mic dejun". */
  short: string;
  /** Eticheta de pe fotografia ofertei („Ofertă limitată"); goală = nu apare. */
  badge: string;
  /** Lista „Ce include" de pe pagina ofertei. */
  includes: string[];
  /** Avantajele de pe pagina hotelului. */
  features: string[];
};

/** Unde duce apăsarea pe o notificare: la promoție, la un hotel anume sau la rezervări. */
export type NotificationTarget = 'promo' | 'bookings' | ResortId;

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
      featured: true,
      short: 'Transport și mic dejun',
      badge: 'Ofertă limitată',
      includes: ['Transport tur-retur din Chișinău', 'Cazare cu mic dejun', 'Acces la băile termale și wellness'],
      features: ['Acces direct din hotel la băi', 'Bazine interioare și exterioare', 'Proceduri și fizioterapie', 'Mic dejun și cină incluse'],
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
      featured: false,
      short: 'Transport și mic dejun',
      badge: '',
      includes: ['Transport tur-retur din Chișinău', 'Cazare cu mic dejun', 'Acces la băile termale și wellness'],
      features: ['Unul dintre cele mai mari complexe termale din Europa', 'Bazine interioare și exterioare', 'Zonă wellness', 'Mic dejun inclus'],
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
      featured: true,
      short: 'Транспорт и завтрак',
      badge: 'Ограниченное предложение',
      includes: ['Транспорт туда-обратно из Кишинёва', 'Проживание с завтраком', 'Доступ к термальным баням и wellness'],
      features: ['Прямой переход из отеля в бани', 'Внутренние и наружные бассейны', 'Процедуры и физиотерапия', 'Завтрак и ужин включены'],
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
      featured: false,
      short: 'Транспорт и завтрак',
      badge: '',
      includes: ['Транспорт туда-обратно из Кишинёва', 'Проживание с завтраком', 'Доступ к термальным баням и wellness'],
      features: ['Один из крупнейших термальных комплексов Европы', 'Внутренние и наружные бассейны', 'Зона wellness', 'Завтрак включён'],
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

/** Sub acest prag, numărul de locuri devine un semnal, nu o informație. */
export const LOW_SEATS = 6;

export const content = { resorts, notificationSettings };
