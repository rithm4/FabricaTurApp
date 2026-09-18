import { supabase } from './supabase';
import type {
  Departure,
  NotificationDraft,
  OfferRequest,
  RequestStatus,
  Resort,
  ResortId,
  SentNotification,
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
};

const toResort = (r: ResortRow): Resort => ({
  id: r.id,
  name: r.name,
  city: { ro: r.city_ro, ru: r.city_ru },
  price: r.price,
  oldPrice: r.old_price,
  rating: r.rating,
  waterTemp: r.water_temp,
  nights: r.nights,
});

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
            updated_at: new Date().toISOString(),
          })
          .eq('id', resortId),
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
