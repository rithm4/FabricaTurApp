import { supabase } from './supabase';
import type {
  Departure,
  NotificationDraft,
  OfferRequest,
  RequestStatus,
  Resort,
  ResortId,
  SentNotification,
  Settings,
} from './types';

/**
 * Stratul de date al panoului — singurul loc care vorbește cu baza de date.
 * Ecranele cer și primesc obiecte în forma din `types.ts`; aici se face traducerea
 * spre coloanele din `supabase/schema.sql`. Când vine CRM-ul, se leagă tot de aici.
 */

/** O eroare de la server devine o eroare obișnuită, cu mesaj citibil pentru operator. */
function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/** La fel, pentru liste: fără rânduri înseamnă o listă goală, nu lipsa listei. */
function rows<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  return check(result) ?? [];
}

// ── Traducerea rândurilor din baza de date ──────────────────────────────────

type ResortRow = {
  id: ResortId;
  name: string;
  city_ro: string;
  city_ru: string;
  price: number;
  old_price: number | null;
  rating: string;
  water_temp: string;
  nights: number;
  offer_until?: string | null;
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

type SettingsRow = { whatsapp: string; tagline_ro: string; tagline_ru: string };

const toResort = (r: ResortRow): Resort => ({
  id: r.id,
  name: r.name,
  city: { ro: r.city_ro, ru: r.city_ru },
  price: r.price,
  oldPrice: r.old_price,
  rating: r.rating,
  waterTemp: r.water_temp,
  nights: r.nights,
  offerUntil: r.offer_until ?? null,
  featured: r.featured ?? false,
  short: { ro: r.short_ro ?? '', ru: r.short_ru ?? '' },
  badge: { ro: r.badge_ro ?? '', ru: r.badge_ru ?? '' },
  includes: { ro: r.includes_ro ?? [], ru: r.includes_ru ?? [] },
  features: { ro: r.features_ro ?? [], ru: r.features_ru ?? [] },
  tags: { ro: r.tags_ro ?? [], ru: r.tags_ru ?? [] },
  photos: r.photos ?? [],
});

/** Rândurile goale dintr-o listă nu au ce căuta în aplicație. */
const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);

/** Fotografia micșorată în browser: telefoanele fac poze de 5 MB, aplicația are nevoie de ~300 KB. */
async function shrink(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Fotografia nu a putut fi citită.'))),
      'image/jpeg',
      0.82,
    ),
  );
}

const BUCKET = 'photos';

type DepartureRow = {
  id: string;
  resort_id: ResortId;
  start_date: string;
  nights: number;
  seats_total: number;
  seats_left: number;
};

const toDeparture = (d: DepartureRow): Departure => ({
  id: d.id,
  resortId: d.resort_id,
  start: d.start_date,
  nights: d.nights,
  seatsTotal: d.seats_total,
  seatsLeft: d.seats_left,
});

const fromDeparture = (d: Partial<Departure>) => ({
  ...(d.resortId !== undefined && { resort_id: d.resortId }),
  ...(d.start !== undefined && { start_date: d.start }),
  ...(d.nights !== undefined && { nights: d.nights }),
  ...(d.seatsTotal !== undefined && { seats_total: d.seatsTotal }),
  ...(d.seatsLeft !== undefined && { seats_left: d.seatsLeft }),
});

type RequestRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  resort_id: ResortId;
  departure_id: string | null;
  party: string;
  status: RequestStatus;
  lang: 'ro' | 'ru';
  note: string | null;
};

const toRequest = (r: RequestRow): OfferRequest => ({
  id: r.id,
  createdAt: r.created_at,
  name: r.name,
  phone: r.phone,
  resortId: r.resort_id,
  departureId: r.departure_id,
  party: r.party,
  status: r.status,
  lang: r.lang,
  // Înainte de rularea lui 002-notite.sql coloana lipsește; atunci notița e goală.
  note: r.note ?? '',
});

type NotificationRow = {
  id: string;
  sent_at: string;
  audience: SentNotification['audience'];
  target: SentNotification['target'];
  title_ro: string;
  title_ru: string;
  body_ro: string;
  body_ru: string;
};

const toNotification = (n: NotificationRow): SentNotification => ({
  id: n.id,
  sentAt: n.sent_at,
  audience: n.audience,
  target: n.target,
  title: { ro: n.title_ro, ru: n.title_ru },
  body: { ro: n.body_ro, ru: n.body_ru },
});

// ── Operațiile ──────────────────────────────────────────────────────────────

export const api = {
  resorts: {
    async list(): Promise<Resort[]> {
      return rows<ResortRow>(await supabase.from('resorts').select('*').order('id')).map(toResort);
    },
    async update(resortId: ResortId, patch: Partial<Resort>): Promise<void> {
      check(
        await supabase
          .from('resorts')
          .update({
            ...(patch.price !== undefined && { price: patch.price }),
            ...(patch.oldPrice !== undefined && { old_price: patch.oldPrice }),
            ...(patch.rating !== undefined && { rating: patch.rating }),
            ...(patch.waterTemp !== undefined && { water_temp: patch.waterTemp }),
            ...(patch.nights !== undefined && { nights: patch.nights }),
            ...(patch.offerUntil !== undefined && { offer_until: patch.offerUntil }),
            ...(patch.short !== undefined && {
              short_ro: patch.short.ro.trim(),
              short_ru: patch.short.ru.trim(),
            }),
            ...(patch.badge !== undefined && {
              badge_ro: patch.badge.ro.trim(),
              badge_ru: patch.badge.ru.trim(),
            }),
            ...(patch.includes !== undefined && {
              includes_ro: clean(patch.includes.ro),
              includes_ru: clean(patch.includes.ru),
            }),
            ...(patch.features !== undefined && {
              features_ro: clean(patch.features.ro),
              features_ru: clean(patch.features.ru),
            }),
            ...(patch.tags !== undefined && {
              tags_ro: clean(patch.tags.ro),
              tags_ru: clean(patch.tags.ru),
            }),
            ...(patch.photos !== undefined && { photos: patch.photos }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', resortId),
      );
    },
    /**
     * Face din hotelul dat oferta săptămânii. Întâi le scoate pe celelalte: serverul
     * nu acceptă două oferte ale săptămânii în același timp.
     */
    async setFeatured(resortId: ResortId): Promise<void> {
      check(await supabase.from('resorts').update({ featured: false }).neq('id', resortId));
      check(await supabase.from('resorts').update({ featured: true }).eq('id', resortId));
    },
    /** Încarcă o fotografie micșorată și întoarce adresa ei publică. */
    async uploadPhoto(resortId: ResortId, file: File): Promise<string> {
      const blob = await shrink(file);
      const path = `${resortId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      });
      if (error) throw new Error(error.message);
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },
    /** Șterge fișierul unei fotografii încărcate din panou. */
    async removePhoto(url: string): Promise<void> {
      const marker = `/object/public/${BUCKET}/`;
      const at = url.indexOf(marker);
      if (at < 0) return;
      const { error } = await supabase.storage.from(BUCKET).remove([url.slice(at + marker.length)]);
      if (error) throw new Error(error.message);
    },
  },

  settings: {
    async get(): Promise<Settings> {
      const row = rows<SettingsRow>(await supabase.from('settings').select('*').limit(1))[0];
      return {
        whatsapp: row?.whatsapp ?? '',
        tagline: { ro: row?.tagline_ro ?? '', ru: row?.tagline_ru ?? '' },
      };
    },
    async update(settings: Settings): Promise<void> {
      check(
        await supabase.from('settings').upsert({
          id: 1,
          whatsapp: settings.whatsapp.replace(/\D/g, ''),
          tagline_ro: settings.tagline.ro.trim(),
          tagline_ru: settings.tagline.ru.trim(),
        }),
      );
    },
  },

  departures: {
    async list(): Promise<Departure[]> {
      return rows<DepartureRow>(await supabase.from('departures').select('*').order('start_date')).map(
        toDeparture,
      );
    },
    async create(departure: Omit<Departure, 'id'>): Promise<void> {
      check(await supabase.from('departures').insert(fromDeparture(departure)));
    },
    async update(departureId: string, patch: Partial<Departure>): Promise<void> {
      check(await supabase.from('departures').update(fromDeparture(patch)).eq('id', departureId));
    },
    async remove(departureId: string): Promise<void> {
      check(await supabase.from('departures').delete().eq('id', departureId));
    },
  },

  requests: {
    async list(): Promise<OfferRequest[]> {
      return rows<RequestRow>(
        await supabase.from('requests').select('*').order('created_at', { ascending: false }),
      ).map(toRequest);
    },
    async setStatus(requestId: string, status: RequestStatus): Promise<void> {
      check(await supabase.from('requests').update({ status }).eq('id', requestId));
    },
    async setNote(requestId: string, note: string): Promise<void> {
      check(await supabase.from('requests').update({ note: note.trim() }).eq('id', requestId));
    },
    /** Pentru cereri de test sau trimise din greșeală. Cererile reale se anulează, nu se șterg. */
    async remove(requestId: string): Promise<void> {
      check(await supabase.from('requests').delete().eq('id', requestId));
    },
  },

  notifications: {
    async list(): Promise<SentNotification[]> {
      return rows<NotificationRow>(
        await supabase.from('notifications').select('*').order('sent_at', { ascending: false }),
      ).map(toNotification);
    },
    /**
     * Scrie notificarea în baza de date; aplicația o primește pe loc în lista „Noutăți".
     * Trimiterea push pe ecranul de blocare se adaugă separat, cu serverul de notificări.
     */
    async send(draft: NotificationDraft): Promise<SentNotification> {
      const row = check<NotificationRow>(
        await supabase
          .from('notifications')
          .insert({
            audience: draft.audience,
            target: draft.target,
            title_ro: draft.title.ro.trim(),
            title_ru: draft.title.ru.trim(),
            body_ro: draft.body.ro.trim(),
            body_ru: draft.body.ru.trim(),
          })
          .select()
          .single(),
      );
      return toNotification(row);
    },
    /** Dispare și din lista „Noutăți” a aplicației, pe loc. */
    async remove(notificationId: string): Promise<void> {
      check(await supabase.from('notifications').delete().eq('id', notificationId));
    },
  },

  /**
   * Anunță când se schimbă ceva în tabelele date — de exemplu o cerere nouă venită din
   * aplicație. Întoarce funcția care oprește ascultarea.
   */
  onChange(tables: string[], callback: () => void) {
    const channel = supabase.channel(`panou-${tables.join('-')}-${Math.random()}`);
    for (const table of tables) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, callback);
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// ── Contul operatorului ─────────────────────────────────────────────────────

export const auth = {
  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  /**
   * Un cont logat nu e automat operator: înscrierea e publică. Verificăm în lista
   * `operators`, pe care o poate completa doar proprietarul, din editorul SQL.
   */
  async isOperator(): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_operator');
    return !error && data === true;
  },
  async email(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  },
  onChange(callback: () => void) {
    const { data } = supabase.auth.onAuthStateChange(() => callback());
    return () => data.subscription.unsubscribe();
  },
};
