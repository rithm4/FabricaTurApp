import { supabase } from './supabase';
import { content, type Article, type ArticleBlock, type Audience, type Departure, type NotificationItem, type NotificationTarget, type Resort } from './data';
import type { IconName } from './components/Icon';
import { photos } from './theme';
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
  name?: string;
  /** 010: o destinație ascunsă din panou nu apare în aplicație. */
  active?: boolean;
  /** 010: ordinea în lista de destinații. */
  position?: number;
  city_ro: string;
  city_ru: string;
  price: number;
  old_price: number | null;
  rating: string;
  water_temp: string;
  nights: number;
  offer_until?: string | null;
  // Conținutul scris din panou (009). Opționale: înainte de script lipsesc.
  featured?: boolean;
  short_ro?: string;
  short_ru?: string;
  badge_ro?: string;
  badge_ru?: string;
  includes_ro?: string[];
  includes_ru?: string[];
  features_ro?: string[];
  features_ru?: string[];
  tags_ro?: string[];
  tags_ru?: string[];
  photos?: string[];
};

type ArticleRow = {
  id: string;
  published: boolean;
  position: number;
  resort_id: string | null;
  cover: string;
  title_ro: string;
  title_ru: string;
  summary_ro: string;
  summary_ru: string;
  body_ro: string;
  body_ru: string;
};

type SettingsRow = {
  whatsapp: string;
  tagline_ro: string;
  tagline_ru: string;
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
  settings: SettingsRow | null;
  articles: ArticleRow[] | null;
};

export const EMPTY_REMOTE: Remote = {
  articles: null,
  resorts: null,
  departures: null,
  notifications: null,
  settings: null,
};

async function list<T>(table: string, order: string, ascending: boolean): Promise<T[] | null> {
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending });
  return error ? null : ((data ?? []) as T[]);
}

export async function fetchRemote(): Promise<Remote> {
  const [resorts, departures, notifications, settings, articles] = await Promise.all([
    list<ResortRow>('resorts', 'id', true),
    list<DepartureRow>('departures', 'start_date', true),
    list<NotificationRow>('notifications', 'sent_at', false),
    list<SettingsRow>('settings', 'id', true),
    list<ArticleRow>('articles', 'position', true),
  ]);
  return { resorts, departures, notifications, settings: settings?.[0] ?? null, articles };
}

/**
 * Anunță orice schimbare făcută din panou — o notificare trimisă, un preț schimbat, un loc
 * vândut. Întoarce funcția care oprește ascultarea.
 */
export function onRemoteChange(callback: () => void) {
  const channel = supabase.channel('aplicatie');
  for (const table of ['resorts', 'departures', 'notifications', 'settings', 'articles']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, callback);
  }
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Transformarea în forma folosită de ecrane ───────────────────────────────

const locale = (lang: Lang) => (lang === 'ro' ? 'ro-RO' : 'ru-RU');

/** Ziua de azi, AAAA-LL-ZZ, după ceasul telefonului — nu după UTC. */
function localToday() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** „12 – 19 octombrie" sau „26 octombrie – 2 noiembrie"; în rusă, „12 – 19 октября". */
export function formatRange(start: string, nights: number, lang: Lang) {
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

/**
 * Fișa de pornire a unei destinații adăugate din panou. Până se încarcă fotografii,
 * aplicația arată o fotografie generică de bazin termal, nu un spațiu gol.
 */
const blankResort = (id: string): Resort => ({
  id,
  name: '',
  city: '',
  price: '',
  rating: '',
  waterTemp: '',
  nights: 7,
  tags: [],
  gallery: [{ uri: photos.pool }],
  featured: false,
  short: '',
  badge: '',
  includes: [],
  features: [],
});

/** Oferta săptămânii prima: ecranele o iau de pe primul loc. */
const featuredFirst = (list: Resort[]) =>
  [...list].sort((a, b) => Number(b.featured) - Number(a.featured));

export function buildResorts(
  remote: Remote,
  lang: Lang,
  t: Strings,
  /** Previzualizarea din panou: destinația arătată, chiar ascunsă, ca ofertă a săptămânii. */
  previewId?: string,
): Resort[] {
  const local = content.resorts[lang];
  if (!remote.resorts) return featuredFirst(local);

  // Un text gol din panou înseamnă „nu afișa"; o coloană lipsă (script nerulat) înseamnă
  // „păstrează ce e în aplicație".
  const pick = <T,>(ro: T | undefined, ru: T | undefined, fallback: T) =>
    (lang === 'ro' ? ro : ru) ?? fallback;

  // Destinațiile vin de pe server, în ordinea din panou, fără cele ascunse. O destinație
  // nouă n-are nimic în aplicație: pornește de la o fișă goală, completată din panou.
  const rows = remote.resorts
    .filter((r) => r.active !== false || r.id === previewId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return featuredFirst(rows.map((row) => {
    const resort = local.find((r) => r.id === row.id) ?? blankResort(row.id);
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
      name: row.name || resort.name,
      featured: previewId ? row.id === previewId : (row.featured ?? resort.featured),
      short: pick(row.short_ro, row.short_ru, resort.short),
      badge: pick(row.badge_ro, row.badge_ru, resort.badge),
      includes: pick(row.includes_ro, row.includes_ru, resort.includes),
      features: pick(row.features_ro, row.features_ru, resort.features),
      tags: pick(row.tags_ro, row.tags_ru, resort.tags),
      // Fotografiile încărcate din panou; până atunci, cele din aplicație.
      gallery: row.photos?.length ? row.photos.map((uri) => ({ uri })) : resort.gallery,
      // Termenul se arată doar cât e încă în viitor; după el, rândul dispare singur.
      offerUntil:
        row.offer_until && row.offer_until >= localToday()
          ? new Date(`${row.offer_until}T12:00:00`).toLocaleDateString(locale(lang), {
              day: 'numeric',
              month: 'long',
            })
          : undefined,
    };
  }));
}

export function buildDepartures(remote: Remote, lang: Lang, resortId: string): Departure[] {
  // Fără server nu inventăm date de plecare: lista goală spune adevărul.
  if (!remote.departures) return [];

  // Plecările trecute nu mai au ce căuta în listă.
  const today = localToday();
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
      start: d.start_date,
    }));
}

const ICON: Record<NotificationRow['audience'], IconName> = {
  promo: 'tag',
  lastSeats: 'clock',
  newDepartures: 'calendar',
  news: 'news',
};


/**
 * Textul unui articol în blocuri: rândurile care încep cu „- " devin listă, restul
 * paragrafe. Un rând gol desparte paragrafele.
 */
function toBlocks(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const chunk of body.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    let paragraph: string[] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ kind: 'p', text: paragraph.join(' ') });
      paragraph = [];
    };
    for (const line of lines) {
      if (/^[-•–]\s+/.test(line)) {
        flush();
        blocks.push({ kind: 'li', text: line.replace(/^[-•–]\s+/, '') });
      } else paragraph.push(line);
    }
    flush();
  }
  return blocks;
}

export function buildArticle(row: ArticleRow, lang: Lang): Article {
  // Fără traducere în rusă, articolul apare în română, nu gol.
  const pick = (ro: string, ru: string) => (lang === 'ru' && ru.trim() ? ru : ro);
  const body = pick(row.body_ro, row.body_ru);
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    id: row.id,
    title: pick(row.title_ro, row.title_ru),
    summary: pick(row.summary_ro, row.summary_ru),
    blocks: toBlocks(body),
    cover: row.cover || undefined,
    resortId: row.resort_id ?? undefined,
    minutes: Math.max(1, Math.round(words / 180)),
  };
}

/** Articolele publicate, în ordinea din panou. Fără server: nimic, nu texte inventate. */
export function buildArticles(remote: Remote, lang: Lang): Article[] {
  return (remote.articles ?? [])
    .filter((a) => a.published && (a.title_ro.trim() || a.title_ru.trim()))
    .sort((a, b) => a.position - b.position)
    .map((a) => buildArticle(a, lang));
}

/** Previzualizarea din panou: articolul după număr, chiar dacă e încă ciornă. */
export async function fetchArticlePreview(id: string): Promise<ArticleRow | null> {
  const { data, error } = await supabase.rpc('article_preview', { p_id: id });
  if (error || !Array.isArray(data) || !data[0]) return null;
  return data[0] as ArticleRow;
}

/** Datele agenției din panou (Setări): numărul de WhatsApp și sloganul. */
export function buildSettings(remote: Remote, lang: Lang, t: Strings) {
  const s = remote.settings;
  return {
    whatsapp: s?.whatsapp ?? '',
    tagline: (lang === 'ro' ? s?.tagline_ro : s?.tagline_ru) || t.signInTagline,
  };
}

export function buildNotifications(remote: Remote, lang: Lang, t: Strings): NotificationItem[] {
  // Fără server nu arătăm nimic inventat: lista goală spune adevărul.
  if (!remote.notifications) return [];
  const articleIds = new Set(
    (remote.articles ?? []).filter((a) => a.published).map((a) => `article:${a.id}`),
  );
  const visible = new Set(
    (remote.resorts ?? content.resorts[lang]).filter((r) => (r as { active?: boolean }).active !== false).map((r) => r.id),
  );

  return remote.notifications.map((n) => ({
    id: n.id,
    audience: n.audience,
    sentAt: n.sent_at,
    icon: ICON[n.audience] ?? 'news',
    // Doar spre o destinație care chiar se vede în aplicație; altfel, spre ofertă.
    target:
      n.target === 'bookings' || visible.has(n.target) || articleIds.has(n.target)
        ? n.target
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
 * își poate afla mai târziu starea. `null` când serverul n-a primit-o.
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
  // Cererile intră doar prin această funcție (vezi 005-doar-prin-functie.sql).
  return !error && typeof data === 'string' ? data : null;
}

/**
 * Ascultă schimbările de stare ale cererilor proprii, pe loc. Serverul trimite semnalul pe
 * canalul „cerere:<număr>" (vezi 006-stare-in-timp-real.sql) — doar starea, nimic altceva.
 * Întoarce funcția care oprește ascultarea.
 */
export function onRequestStatus(
  ids: string[],
  callback: (id: string, status: RequestStatus) => void,
) {
  const channels = ids.map((id) =>
    supabase
      .channel(`cerere:${id}`)
      .on('broadcast', { event: 'status' }, ({ payload }) => {
        const status = (payload as { status?: RequestStatus })?.status;
        if (status) callback(id, status);
      })
      .subscribe(),
  );
  return () => {
    channels.forEach((channel) => supabase.removeChannel(channel));
  };
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
