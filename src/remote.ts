import { supabase } from './supabase';
import { content, type Audience, type Departure, type NotificationItem, type NotificationTarget, type Resort } from './data';
import type { IconName } from './components/Icon';
import type { Lang, Strings } from './i18n';

/**
 * Datele care vin de pe server: prețurile, plecările și notificările editate din panoul
 * operatorului. Fotografiile și etichetele hotelurilor rămân în aplicație.
 *
 * Fiecare listă e `null` când serverul n-a răspuns — fără internet, sau tabelele încă
 * necreate. Atunci aplicația folosește datele din `data.ts`, deci nu rămâne niciodată goală.
 */

type ResortRow = {
  id: string;
  city_ro: string;
  city_ru: string;
  price: number;
  old_price: number | null;
  rating: string;
  water_temp: string;
  nights: number;
};

type DepartureRow = {
  id: string;
  resort_id: string;
  start_date: string;
  nights: number;
  seats_left: number;
};

type NotificationRow = {
  id: string;
  sent_at: string;
  audience: Audience;
  target: string;
  title_ro: string;
  title_ru: string;
  body_ro: string;
  body_ru: string;
};

export type Remote = {
  resorts: ResortRow[] | null;
  departures: DepartureRow[] | null;
  notifications: NotificationRow[] | null;
};

export const EMPTY_REMOTE: Remote = { resorts: null, departures: null, notifications: null };

async function list<T>(table: string, order: string, ascending: boolean): Promise<T[] | null> {
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending });
  return error ? null : ((data ?? []) as T[]);
}

export async function fetchRemote(): Promise<Remote> {
  const [resorts, departures, notifications] = await Promise.all([
    list<ResortRow>('resorts', 'id', true),
    list<DepartureRow>('departures', 'start_date', true),
    list<NotificationRow>('notifications', 'sent_at', false),
  ]);
  return { resorts, departures, notifications };
}

/**
 * Anunță orice schimbare făcută din panou — o notificare trimisă, un preț schimbat, un loc
 * vândut. Întoarce funcția care oprește ascultarea.
 */
export function onRemoteChange(callback: () => void) {
  const channel = supabase.channel('aplicatie');
  for (const table of ['resorts', 'departures', 'notifications']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, callback);
  }
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Transformarea în forma folosită de ecrane ───────────────────────────────

const locale = (lang: Lang) => (lang === 'ro' ? 'ro-RO' : 'ru-RU');

/** „12 – 19 octombrie" sau „26 octombrie – 2 noiembrie"; în rusă, „12 – 19 октября". */
function formatRange(start: string, nights: number, lang: Lang) {
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(from);
  to.setDate(from.getDate() + nights);
  const dayMonth = (d: Date) =>
    d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long' });
  return from.getMonth() === to.getMonth()
    ? `${from.getDate()} – ${dayMonth(to)}`
    : `${dayMonth(from)} – ${dayMonth(to)}`;
}

function relative(iso: string, t: Strings) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  const fill = (s: string, n: number) => s.replace('{n}', String(n));
  if (minutes < 1) return t.relNow;
  if (minutes < 60) return fill(t.relMin, minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return fill(t.relHours, hours);
  if (hours < 48) return t.relYesterday;
  return fill(t.relDays, Math.round(hours / 24));
}

export function buildResorts(remote: Remote, lang: Lang, t: Strings): Resort[] {
  const local = content.resorts[lang];
  if (!remote.resorts) return local;

  return local.map((resort) => {
    const row = remote.resorts?.find((r) => r.id === resort.id);
    if (!row) return resort;
    // Reducerea se calculează din prețuri, exact ca în panou — nu poate contrazice prețul.
    const discount = row.old_price && row.old_price > row.price ? row.old_price - row.price : 0;
    return {
      ...resort,
      city: lang === 'ro' ? row.city_ro : row.city_ru,
      price: `${row.price} €`,
      oldPrice: discount ? `${row.old_price} €` : undefined,
      rating: row.rating || resort.rating,
      waterTemp: row.water_temp || resort.waterTemp,
      nights: row.nights,
      discount: discount ? { label: t.discountLabel, value: `${discount} €` } : undefined,
    };
  });
}

export function buildDepartures(remote: Remote, lang: Lang, resortId: string): Departure[] {
  if (!remote.departures) return content.departures[lang];

  // Plecările trecute nu mai au ce căuta în listă.
  const today = new Date().toISOString().slice(0, 10);
  return remote.departures
    .filter((d) => d.resort_id === resortId && d.start_date >= today)
    .map((d) => ({
      id: d.id,
      dates: formatRange(d.start_date, d.nights, lang),
      date: new Date(`${d.start_date}T12:00:00`).toLocaleDateString(locale(lang), {
        day: 'numeric',
        month: 'long',
      }),
      nights: d.nights,
      seatsLeft: d.seats_left,
    }));
}

const ICON: Record<NotificationRow['audience'], IconName> = {
  promo: 'tag',
  lastSeats: 'clock',
  newDepartures: 'calendar',
  news: 'news',
};

const TARGETS: NotificationTarget[] = ['promo', 'kumania', 'hungarospa', 'bookings'];

export function buildNotifications(remote: Remote, lang: Lang, t: Strings): NotificationItem[] {
  // Fără server nu arătăm nimic inventat: lista goală spune adevărul.
  if (!remote.notifications) return [];

  return remote.notifications.map((n) => ({
    id: n.id,
    audience: n.audience,
    sentAt: n.sent_at,
    icon: ICON[n.audience] ?? 'news',
    target: TARGETS.includes(n.target as NotificationTarget)
      ? (n.target as NotificationTarget)
      : 'promo',
    title: lang === 'ro' ? n.title_ro : n.title_ru,
    text: lang === 'ro' ? n.body_ro : n.body_ru,
    when: relative(n.sent_at, t),
    accent: n.audience === 'promo',
  }));
}

/** Plecările de pe server au id-uri UUID; cele locale, de rezervă, nu — pe acelea nu le trimitem. */
export const isServerId = (id: string | undefined) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// ── Cererile de ofertă ──────────────────────────────────────────────────────

export type RequestStatus = 'new' | 'called' | 'booked' | 'cancelled';

/**
 * Trimite cererea și întoarce numărul ei de pe server — cu el, și doar cu el, aplicația
 * își poate afla mai târziu starea. `''` când a primit-o fără număr (funcția lipsește pe
 * server), `null` când n-a primit-o deloc.
 */
export async function submitRequest(input: {
  name: string;
  phone: string;
  resortId: string;
  departureId: string | null;
  party: string;
  lang: Lang;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('submit_request', {
    p_name: input.name,
    p_phone: input.phone,
    p_resort_id: input.resortId,
    p_departure_id: input.departureId,
    p_party: input.party,
    p_lang: input.lang,
  });
  if (!error && typeof data === 'string') return data;

  // Rezervă: dacă funcția nu există încă pe server, cererea tot ajunge la agenție,
  // doar că fără număr, deci fără stare urmărită.
  const fallback = await supabase.from('requests').insert({
    name: input.name,
    phone: input.phone,
    resort_id: input.resortId,
    departure_id: input.departureId,
    party: input.party,
    lang: input.lang,
  });
  return fallback.error ? null : '';
}

/** Starea cererilor proprii, după numerele lor. Serverul nu întoarce nimic altceva. */
export async function fetchRequestStatuses(ids: string[]): Promise<Record<string, RequestStatus>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.rpc('request_statuses', { p_ids: ids });
  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries(
    (data as { id: string; status: RequestStatus }[]).map((row) => [row.id, row.status]),
  );
}
