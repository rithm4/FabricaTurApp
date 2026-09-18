/**
 * Modelul de date al panoului. Oglindește tabelele din `supabase/schema.sql`;
 * `api.ts` face traducerea între denumirile de acolo și cele de aici.
 */

export type Lang = 'ro' | 'ru';

/** Un text în ambele limbi ale aplicației. Operatorul le completează pe amândouă. */
export type Localized = Record<Lang, string>;

export type ResortId = 'kumania' | 'hungarospa';

export type Resort = {
  id: ResortId;
  name: string;
  city: Localized;
  /** Prețul de persoană, în euro. */
  price: number;
  /**
   * Prețul dinainte de reducere. Reducerea afișată în aplicație se calculează din diferență,
   * ca operatorul să nu poată scrie o reducere care nu se potrivește cu prețurile.
   */
  oldPrice: number | null;
  rating: string;
  waterTemp: string;
  nights: number;
  /** Ultima zi a ofertei, AAAA-LL-ZZ. După ea, aplicația nu mai afișează termenul. */
  offerUntil: string | null;
  /** Oferta săptămânii: o singură stațiune, arătată prima în aplicație. */
  featured: boolean;
  /** Ce e inclus, pe scurt („Transport și mic dejun"). */
  short: Localized;
  /** Eticheta de pe fotografia ofertei; goală = nu apare. */
  badge: Localized;
  /** Lista „Ce include" de pe pagina ofertei. */
  includes: Record<Lang, string[]>;
  /** Avantajele de pe pagina hotelului. */
  features: Record<Lang, string[]>;
  /** Etichetele scurte din lista de destinații. */
  tags: Record<Lang, string[]>;
  /** Adresele fotografiilor încărcate; prima e coperta. Gol = cele din aplicație. */
  photos: string[];
};

/** Datele agenției, un singur rând. */
export type Settings = {
  /** Doar cifre, cu prefixul țării: 37369123456. Gol = cererile nu pleacă pe WhatsApp. */
  whatsapp: string;
  tagline: Localized;
};

export type Departure = {
  id: string;
  /** Fiecare plecare aparține unui hotel anume, nu e comună tuturor. */
  resortId: ResortId;
  /** Data plecării, AAAA-LL-ZZ. Aplicația formatează intervalul în limba omului. */
  start: string;
  nights: number;
  seatsTotal: number;
  seatsLeft: number;
};

export type RequestStatus = 'new' | 'called' | 'booked' | 'cancelled';

export type OfferRequest = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  resortId: ResortId;
  departureId: string | null;
  party: string;
  status: RequestStatus;
  /** Limba în care folosește omul aplicația — în ea trebuie sunat. */
  lang: Lang;
  /** Notița operatorului — ce s-a vorbit, când trebuie sunat din nou. */
  note: string;
};

/** Cele patru categorii pe care omul le poate porni sau opri din setările aplicației. */
export type Audience = 'promo' | 'lastSeats' | 'newDepartures' | 'news';

/** Unde duce notificarea când omul apasă pe ea. */
export type NotificationTarget = 'promo' | ResortId | 'bookings';

export type SentNotification = {
  id: string;
  sentAt: string;
  audience: Audience;
  target: NotificationTarget;
  title: Localized;
  body: Localized;
};

export type NotificationDraft = Omit<SentNotification, 'id' | 'sentAt'>;
