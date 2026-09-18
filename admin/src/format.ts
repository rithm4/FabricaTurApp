import type {
  Audience,
  Departure,
  Lang,
  Localized,
  NotificationTarget,
  RequestStatus,
  Resort,
} from './types';

/** Sub acest prag, aplicația arată „Ultimele locuri" — același prag ca în aplicație. */
export const LOW_SEATS = 6;

const locale = (lang: Lang) => (lang === 'ro' ? 'ro-RO' : 'ru-RU');

/** Intervalul unei plecări, cum îl citește un om: „12 – 19 octombrie", „12 – 19 октября". */
export function formatRange(start: string, nights: number, lang: Lang = 'ro') {
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(from);
  to.setDate(from.getDate() + nights);
  const dayMonth = (d: Date) =>
    d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long' });

  return from.getMonth() === to.getMonth()
    ? `${from.getDate()} – ${dayMonth(to)}`
    : `${dayMonth(from)} – ${dayMonth(to)}`;
}

/** „acum 20 min", „ieri", „12 septembrie" — cât de nouă e o cerere, dintr-o privire. */
export function formatAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'chiar acum';
  if (minutes < 60) return `acum ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `acum ${hours} h`;
  if (hours < 48) return 'ieri';
  return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Plecare în următoarele `days` zile (inclusiv azi). */
export const within = (start: string, days: number) =>
  (new Date(`${start}T12:00:00`).getTime() - Date.now()) / 86_400_000 <= days;

/** Câte zile până la plecare: „azi", „mâine", „peste 12 zile". */
export function daysUntil(start: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Math.round(
    (new Date(`${start}T12:00:00`).getTime() - today.getTime()) / 86_400_000,
  );
  if (days <= 0) return 'azi';
  if (days === 1) return 'mâine';
  return `peste ${days} ${days < 20 ? 'zile' : 'de zile'}`;
}

/** Data de azi, AAAA-LL-ZZ, în ora locală (nu UTC — după miezul nopții contează). */
export function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Plecările care n-au avut loc încă, cea mai apropiată prima. */
export const upcoming = (departures: Departure[]) =>
  departures
    .filter((d) => d.start >= todayIso())
    .sort((a, b) => a.start.localeCompare(b.start));

export const euro = (amount: number) => `${amount} €`;

/** Reducerea, calculată din prețuri — nu scrisă de mână, ca să nu se poată contrazice cu ele. */
export function discountOf(resort: Resort) {
  return resort.oldPrice && resort.oldPrice > resort.price ? resort.oldPrice - resort.price : 0;
}

/** Numărul de telefon doar cu cifre, pentru căutare și pentru legătura „tel:". */
export const digits = (phone: string) => phone.replace(/[^\d+]/g, '');

export const statusLabel: Record<RequestStatus, string> = {
  new: 'Nouă',
  called: 'Sunată',
  booked: 'Rezervată',
  cancelled: 'Anulată',
};

/** Numele celor patru categorii, exact ca în setările din aplicație. */
export const audienceLabel: Record<Audience, string> = {
  promo: 'Promoții cu preț redus',
  lastSeats: 'Ultimele locuri la o plecare',
  newDepartures: 'Plecări noi în calendar',
  news: 'Noutăți despre stațiuni',
};

export function targetLabel(target: NotificationTarget, resorts: Resort[]) {
  if (target === 'promo') return 'Oferta săptămânii';
  if (target === 'bookings') return 'Rezervările mele';
  return resorts.find((r) => r.id === target)?.name ?? target;
}

export function departureLabel(departure: Departure | undefined) {
  return departure ? formatRange(departure.start, departure.nights) : 'fără dată aleasă';
}

// ── Șabloanele de notificare ───────────────────────────────────────────────

/** Rusa are trei forme: 1 ночь, 3 ночи, 7 ночей. */
function ru(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const nightsText = (n: number): Localized => ({
  ro: n === 1 ? '1 noapte' : `${n} nopți`,
  ru: `${n} ${ru(n, 'ночь', 'ночи', 'ночей')}`,
});

const seatsText = (n: number): Localized => ({
  ro: n === 1 ? 'Ultimul loc' : `Ultimele ${n} locuri`,
  ru: n === 1 ? 'Последнее место' : `Последние ${n} ${ru(n, 'место', 'места', 'мест')}`,
});

export type Template = { title: Localized; body: Localized };

/**
 * Textul notificării, scris din datele reale ale ofertei — prețul, reducerea, data.
 * Operatorul îl poate modifica înainte de trimitere; cifrele pornesc garantat corecte.
 * Întoarce `null` când nu există date pentru categoria aleasă (ex. nicio plecare).
 */
export function buildTemplate(
  audience: Audience,
  resort: Resort,
  departures: Departure[],
): Template | null {
  const next = upcoming(departures.filter((d) => d.resortId === resort.id));
  const name = resort.name;

  if (audience === 'promo') {
    const discount = discountOf(resort);
    // Anunțăm o plecare la care chiar se mai poate merge, nu una plină.
    const first = next.find((d) => d.seatsLeft > 0);
    const when: Localized = first
      ? {
          ro: ` Plecare ${formatRange(first.start, first.nights, 'ro')}.`,
          ru: ` Выезд ${formatRange(first.start, first.nights, 'ru')}.`,
        }
      : { ro: '', ru: '' };
    const nights = nightsText(resort.nights);
    return discount > 0
      ? {
          title: { ro: `Reducere ${discount} € la ${name}`, ru: `Скидка ${discount} € в ${name}` },
          body: {
            ro: `${resort.price} € de persoană în loc de ${resort.oldPrice} €, ${nights.ro} cu transport.${when.ro}`,
            ru: `${resort.price} € с человека вместо ${resort.oldPrice} €, ${nights.ru} с транспортом.${when.ru}`,
          },
        }
      : {
          title: {
            ro: `${name}: ${resort.price} € de persoană`,
            ru: `${name}: ${resort.price} € с человека`,
          },
          body: {
            ro: `${nights.ro} cu transport inclus.${when.ro}`,
            ru: `${nights.ru} с транспортом.${when.ru}`,
          },
        };
  }

  if (audience === 'lastSeats') {
    // Doar o plecare care chiar e aproape plină — „Ultimele 22 de locuri" ar fi o minciună.
    // Dintre ele, cea cu cele mai puține locuri; la egalitate, cea mai apropiată.
    const low = next
      .filter((d) => d.seatsLeft > 0 && d.seatsLeft <= LOW_SEATS)
      .sort((a, b) => a.seatsLeft - b.seatsLeft)[0];
    if (!low) return null;
    const seats = seatsText(low.seatsLeft);
    return {
      title: { ro: `${seats.ro} la ${name}`, ru: `${seats.ru} в ${name}` },
      body: {
        ro: `Plecarea ${formatRange(low.start, low.nights, 'ro')}. Trimite o cerere din aplicație și te sunăm noi.`,
        ru: `Выезд ${formatRange(low.start, low.nights, 'ru')}. Отправьте заявку в приложении, и мы вам перезвоним.`,
      },
    };
  }

  if (audience === 'newDepartures') {
    // Cea mai îndepărtată plecare e, de regulă, cea adăugată ultima.
    const last = next[next.length - 1];
    if (!last) return null;
    return {
      title: { ro: `Plecare nouă la ${name}`, ru: `Новый выезд в ${name}` },
      body: {
        ro: `${formatRange(last.start, last.nights, 'ro')}, ${nightsText(last.nights).ro} cu transport. Locurile sunt limitate.`,
        ru: `${formatRange(last.start, last.nights, 'ru')}, ${nightsText(last.nights).ru} с транспортом. Количество мест ограничено.`,
      },
    };
  }

  return null;
}
