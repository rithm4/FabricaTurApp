import { ArrowRight, Bell, CalendarDays, Check, Inbox, Megaphone, Phone, Send, Users } from 'lucide-react';

import { api } from '../api';
import {
  daysUntil,
  departureLabel,
  digits,
  discountOf,
  euro,
  formatAgo,
  formatDateTime,
  formatRange,
  LOW_SEATS,
  upcoming,
  within,
} from '../format';
import type { SectionProps } from '../nav';
import { Loading, PageHeader, useToast } from '../ui';

const today = () => {
  const text = new Date().toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Pagina de start: ce e de făcut acum. Cererile de sunat, plecările care se umplu,
 * prețurile curente — fiecare cu acțiunea ei la un clic distanță.
 */
export function Today({ data, ready, refresh, go }: SectionProps) {
  const toast = useToast();
  if (!ready) return <Loading />;

  const { resorts, departures, requests, notifications } = data;
  const fresh = requests.filter((r) => r.status === 'new');
  const next = upcoming(departures);
  const soon = next.filter((d) => within(d.start, 30));
  const freeSeats = next.reduce((sum, d) => sum + d.seatsLeft, 0);
  const booked = requests.filter((r) => r.status === 'booked').length;
  const last = notifications[0];
  const resortName = (id: string) => resorts.find((r) => r.id === id)?.name ?? id;

  const markCalled = async (id: string, name: string) => {
    await api.requests.setStatus(id, 'called');
    await refresh();
    toast(`${name} — marcată ca sunată`);
  };

  const stats = [
    {
      label: 'Cereri noi',
      value: fresh.length,
      hint: fresh.length ? 'de sunat' : 'toate sunate',
      icon: Inbox,
      alert: fresh.length > 0,
      onClick: () => go('cereri'),
    },
    {
      label: 'Rezervate',
      value: booked,
      hint: `din ${requests.length} cereri`,
      icon: Check,
      onClick: () => go('cereri'),
    },
    {
      label: 'Plecări în 30 de zile',
      value: soon.length,
      hint: `${next.length} programate în total`,
      icon: CalendarDays,
      onClick: () => go('plecari'),
    },
    {
      label: 'Locuri libere',
      value: freeSeats,
      hint: 'în toate plecările viitoare',
      icon: Users,
      onClick: () => go('plecari'),
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" text={today()} />

      <div className="stats">
        {stats.map(({ label, value, hint, icon: Icon, alert, onClick }) => (
          <button
            key={label}
            type="button"
            className={alert ? 'stat stat-alert' : 'stat'}
            onClick={onClick}
          >
            <span className="stat-icon">
              <Icon size={19} />
            </span>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
            <span className="stat-hint">{hint}</span>
          </button>
        ))}
      </div>

      <div className="today-grid">
        {/* ── De sunat ── */}
        <section className="card panel">
          <div className="panel-head">
            <h2>De sunat</h2>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => go('cereri')}>
              Toate cererile <ArrowRight size={16} />
            </button>
          </div>

          {fresh.length === 0 ? (
            <p className="panel-empty">
              <Check size={18} /> Nicio cerere nouă. Cererile din aplicație apar aici pe loc.
            </p>
          ) : (
            <ul className="list">
              {fresh.slice(0, 6).map((r) => (
                <li key={r.id} className="list-row">
                  <div className="list-main">
                    <div className="list-title">
                      {r.name} <span className="lang-tag">{r.lang.toUpperCase()}</span>
                    </div>
                    <div className="list-sub">
                      {resortName(r.resortId)} ·{' '}
                      {departureLabel(departures.find((d) => d.id === r.departureId))} ·{' '}
                      {r.party} pers. · {formatAgo(r.createdAt)}
                    </div>
                  </div>
                  <div className="list-actions">
                    <a className="btn btn-sm btn-secondary" href={`tel:${digits(r.phone)}`}>
                      <Phone size={15} /> {r.phone}
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm btn-quiet"
                      onClick={() => markCalled(r.id, r.name)}
                    >
                      <Check size={16} /> Sunată
                    </button>
                  </div>
                </li>
              ))}
              {fresh.length > 6 ? (
                <li className="list-more">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => go('cereri')}>
                    Încă {fresh.length - 6} cereri noi <ArrowRight size={16} />
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </section>

        {/* ── Plecări apropiate ── */}
        <section className="card panel">
          <div className="panel-head">
            <h2>Plecări apropiate</h2>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => go('plecari')}>
              Toate <ArrowRight size={16} />
            </button>
          </div>

          {next.length === 0 ? (
            <p className="panel-empty">Nicio plecare programată. Adaug-o în Plecări.</p>
          ) : (
            <ul className="list">
              {next.slice(0, 5).map((d) => {
                const low = d.seatsLeft <= LOW_SEATS;
                return (
                  <li key={d.id} className="list-row">
                    <div className="list-main">
                      <div className="list-title">{formatRange(d.start, d.nights)}</div>
                      <div className="list-sub">
                        {resortName(d.resortId)} · {daysUntil(d.start)}
                      </div>
                    </div>
                    <div className="list-actions">
                      <span className={low ? 'badge badge-new' : 'badge badge-called'}>
                        {d.seatsLeft === 0 ? 'Complet' : `${d.seatsLeft} locuri`}
                      </span>
                      {/* Locurile puține se vând cel mai ușor cu o notificare. */}
                      {low && d.seatsLeft > 0 ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-quiet"
                          onClick={() => go('notificari', { audience: 'lastSeats', target: d.resortId })}
                        >
                          <Megaphone size={16} /> Anunță
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Prețurile curente ── */}
        <section className="card panel">
          <div className="panel-head">
            <h2>Oferte în aplicație</h2>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => go('oferte')}>
              Schimbă prețuri <ArrowRight size={16} />
            </button>
          </div>
          <ul className="list">
            {resorts.map((r) => {
              const discount = discountOf(r);
              return (
                <li key={r.id} className="list-row">
                  <div className="list-main">
                    <div className="list-title">{r.name}</div>
                    <div className="list-sub">
                      {r.city.ro} · {r.nights} nopți
                    </div>
                  </div>
                  <div className="list-actions">
                    {discount > 0 ? <span className="badge badge-new">−{euro(discount)}</span> : null}
                    <span className="price">
                      {discount > 0 ? <s>{euro(r.oldPrice!)}</s> : null}
                      {euro(r.price)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Ultima notificare ── */}
        <section className="card panel">
          <div className="panel-head">
            <h2>Ultima notificare</h2>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => go('notificari')}>
              Istoric <ArrowRight size={16} />
            </button>
          </div>
          {last ? (
            <div className="last-notif">
              <span className="last-notif-icon">
                <Bell size={18} />
              </span>
              <div className="list-main">
                <div className="list-title">{last.title.ro}</div>
                <div className="list-sub">{last.body.ro}</div>
                <div className="hint" style={{ marginTop: 6 }}>
                  Trimisă {formatDateTime(last.sentAt)}
                </div>
              </div>
            </div>
          ) : (
            <p className="panel-empty">Nicio notificare trimisă încă.</p>
          )}
          <div className="panel-foot">
            <button type="button" className="btn btn-primary" onClick={() => go('notificari')}>
              <Send size={17} /> Trimite o notificare
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
