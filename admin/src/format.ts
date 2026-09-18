import type { Audience, Departure, NotificationTarget, RequestStatus, Resort } from './types';

/** Intervalul unei plecări, cum îl citește un om: „12 – 19 octombrie". */
export function formatRange(start: string, nights: number) {
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(from);
  to.setDate(from.getDate() + nights);

  const day = (d: Date) => d.getDate();
  const month = (d: Date) => d.toLocaleDateString('ro-RO', { month: 'long' });

  return from.getMonth() === to.getMonth()
    ? `${day(from)} – ${day(to)} ${month(to)}`
    : `${day(from)} ${month(from)} – ${day(to)} ${month(to)}`;
}

/** „acum 20 de minute", „ieri", „12 septembrie" — cât de nouă e o cerere, dintr-o privire. */
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

export const euro = (amount: number) => `${amount} €`;

/** Reducerea, calculată din prețuri — nu scrisă de mână, ca să nu se poată contrazice cu ele. */
export function discountOf(resort: Resort) {
  return resort.oldPrice && resort.oldPrice > resort.price ? resort.oldPrice - resort.price : 0;
}

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
