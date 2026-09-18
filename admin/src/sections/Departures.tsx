import { useState } from 'react';
import { CalendarX, ChevronDown, Megaphone, Minus, Pencil, Plus } from 'lucide-react';

import { api } from '../api';
import { daysUntil, formatRange, LOW_SEATS, todayIso } from '../format';
import type { Compose, Section, SectionProps } from '../nav';
import type { Departure, Resort, ResortId } from '../types';
import { DeleteButton, Empty, Loading, PageHeader, useToast } from '../ui';

type Go = (section: Section, compose?: Compose) => void;

/** Locurile rămase, cu plus și minus: un loc vândut la telefon e un singur clic. */
function SeatsStepper({ departure, refresh }: { departure: Departure; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const range = formatRange(departure.start, departure.nights);

  const set = async (seatsLeft: number) => {
    setBusy(true);
    try {
      await api.departures.update(departure.id, {
        seatsLeft: Math.max(0, Math.min(departure.seatsTotal, seatsLeft)),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stepper">
      <button
        type="button"
        className="btn btn-secondary btn-icon btn-round"
        onClick={() => set(departure.seatsLeft - 1)}
        disabled={busy || departure.seatsLeft <= 0}
        aria-label={`Un loc vândut, ${range}`}
        title="Un loc vândut"
      >
        <Minus size={18} />
      </button>
      <span className="value" aria-live="polite">
        {departure.seatsLeft}
        <small>/ {departure.seatsTotal}</small>
      </span>
      <button
        type="button"
        className="btn btn-secondary btn-icon btn-round"
        onClick={() => set(departure.seatsLeft + 1)}
        disabled={busy || departure.seatsLeft >= departure.seatsTotal}
        aria-label={`Un loc eliberat, ${range}`}
        title="Un loc eliberat"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

/** Schimbarea datei, a nopților sau a numărului total de locuri, direct în rând. */
function EditRow({
  departure,
  refresh,
  onDone,
}: {
  departure: Departure;
  refresh: () => Promise<void>;
  onDone: () => void;
}) {
  const toast = useToast();
  const [start, setStart] = useState(departure.start);
  const [nights, setNights] = useState(departure.nights);
  const [total, setTotal] = useState(departure.seatsTotal);

  // Locurile deja vândute rămân vândute; se schimbă doar câte mai sunt libere.
  const taken = departure.seatsTotal - departure.seatsLeft;
  const valid = start !== '' && nights > 0 && total > 0 && total >= taken;

  const save = async () => {
    await api.departures.update(departure.id, {
      start,
      nights,
      seatsTotal: total,
      seatsLeft: total - taken,
    });
    await refresh();
    toast(`Plecarea ${formatRange(start, nights)} — salvată`);
    onDone();
  };

  return (
    <div className="dep-row dep-edit">
      <div className="dep-edit-fields">
        <div className="field">
          <label htmlFor={`${departure.id}-start`}>Data plecării</label>
          <input
            id={`${departure.id}-start`}
            className="input"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${departure.id}-nights`}>Nopți</label>
          <input
            id={`${departure.id}-nights`}
            className="input"
            type="number"
            min={1}
            value={nights || ''}
            onChange={(e) => setNights(Math.round(Number(e.target.value)))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${departure.id}-total`}>Locuri în total</label>
          <input
            id={`${departure.id}-total`}
            className="input"
            type="number"
            min={Math.max(1, taken)}
            value={total || ''}
            onChange={(e) => setTotal(Math.round(Number(e.target.value)))}
            aria-invalid={total < taken}
          />
        </div>
      </div>
      <p className={total < taken ? 'field-note over' : 'field-note'}>
        {total < taken
          ? `Sunt deja ${taken} locuri vândute — totalul nu poate fi mai mic.`
          : start
            ? `În aplicație: ${formatRange(start, nights || 1)} · ${Math.max(0, total - taken)} locuri libere`
            : 'Alege data plecării.'}
      </p>
      <div className="form-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={!valid} onClick={save}>
          Salvează
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          Renunță
        </button>
      </div>
    </div>
  );
}

function DepartureRow({
  departure,
  refresh,
  go,
  past,
}: {
  departure: Departure;
  refresh: () => Promise<void>;
  go: Go;
  past?: boolean;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const range = formatRange(departure.start, departure.nights);
  const low = departure.seatsLeft <= LOW_SEATS;
  const taken = departure.seatsTotal - departure.seatsLeft;

  if (editing) {
    return <EditRow departure={departure} refresh={refresh} onDone={() => setEditing(false)} />;
  }

  const remove = async () => {
    await api.departures.remove(departure.id);
    await refresh();
    toast(`Plecarea ${range} — ștearsă din aplicație`);
  };

  return (
    <div className={past ? 'dep-row is-past' : 'dep-row'}>
      <div className="dep-when">
        <div className="list-title">{range}</div>
        <div className="list-sub">
          {departure.nights} nopți · {past ? 'a avut loc' : daysUntil(departure.start)}
        </div>
      </div>

      <div className="dep-seats">
        {past ? (
          <span className="muted">
            {taken} din {departure.seatsTotal} ocupate
          </span>
        ) : (
          <SeatsStepper departure={departure} refresh={refresh} />
        )}
      </div>

      <div className="dep-fill">
        <div className={low && !past ? 'seats-bar low' : 'seats-bar'}>
          <span style={{ width: `${(taken / departure.seatsTotal) * 100}%` }} />
        </div>
        <div className="hint">
          {departure.seatsLeft === 0
            ? 'Complet'
            : low && !past
              ? 'Ultimele locuri — apare în aplicație'
              : `${Math.round((taken / departure.seatsTotal) * 100)}% ocupat`}
        </div>
      </div>

      <div className="dep-actions">
        {!past && low && departure.seatsLeft > 0 ? (
          <button
            type="button"
            className="btn btn-sm btn-quiet"
            onClick={() => go('notificari', { audience: 'lastSeats', target: departure.resortId })}
            title="Trimite o notificare despre ultimele locuri"
          >
            <Megaphone size={16} /> Anunță
          </button>
        ) : null}
        {!past ? (
          <button
            type="button"
            className="btn btn-icon btn-quiet"
            onClick={() => setEditing(true)}
            aria-label={`Modifică plecarea ${range}`}
            title="Modifică"
          >
            <Pencil size={17} />
          </button>
        ) : null}
        <DeleteButton label={`Șterge plecarea ${range}`} onConfirm={remove} compact />
      </div>
    </div>
  );
}

function AddDeparture({
  resort,
  existing,
  refresh,
  go,
}: {
  resort: Resort;
  existing: Departure[];
  refresh: () => Promise<void>;
  go: Go;
}) {
  const toast = useToast();
  const [start, setStart] = useState('');
  const [nights, setNights] = useState(resort.nights);
  const [seats, setSeats] = useState(30);
  const [added, setAdded] = useState(false);

  const duplicate = existing.some((d) => d.start === start);
  const inPast = start !== '' && start < todayIso();
  const valid = start !== '' && nights > 0 && seats > 0 && !duplicate && !inPast;

  const add = async () => {
    await api.departures.create({
      resortId: resort.id,
      start,
      nights,
      seatsTotal: seats,
      seatsLeft: seats,
    });
    await refresh();
    toast(`Plecarea ${formatRange(start, nights)} — adăugată în aplicație`);
    setStart('');
    setAdded(true);
  };

  return (
    <div className="card card-pad">
      <h2 className="section-title">Adaugă o plecare la {resort.name}</h2>
      <div className="add-row">
        <div className="field">
          <label htmlFor="new-start">Data plecării</label>
          <input
            id="new-start"
            className="input"
            type="date"
            min={todayIso()}
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setAdded(false);
            }}
            aria-invalid={duplicate || inPast}
          />
        </div>
        <div className="field">
          <label htmlFor="new-nights">Nopți</label>
          <input
            id="new-nights"
            className="input"
            type="number"
            min={1}
            value={nights || ''}
            onChange={(e) => setNights(Math.round(Number(e.target.value)))}
          />
        </div>
        <div className="field">
          <label htmlFor="new-seats">Locuri</label>
          <input
            id="new-seats"
            className="input"
            type="number"
            min={1}
            value={seats || ''}
            onChange={(e) => setSeats(Math.round(Number(e.target.value)))}
          />
        </div>
        <button type="button" className="btn btn-primary" disabled={!valid} onClick={add}>
          <Plus size={17} /> Adaugă
        </button>
      </div>
      <p className={duplicate || inPast ? 'field-note over' : 'field-note'}>
        {duplicate
          ? 'Există deja o plecare în această zi.'
          : inPast
            ? 'Data e în trecut.'
            : start
              ? `În aplicație apare: ${formatRange(start, nights || 1)}`
              : 'Alege data; nopțile pornesc de la oferta hotelului.'}
      </p>
      {/* După o plecare nouă, clienții care urmăresc calendarul pot fi anunțați. */}
      {added ? (
        <button
          type="button"
          className="btn btn-sm btn-quiet"
          style={{ marginTop: 8 }}
          onClick={() => go('notificari', { audience: 'newDepartures', target: resort.id })}
        >
          <Megaphone size={16} /> Anunță plecarea nouă
        </button>
      ) : null}
    </div>
  );
}

export function Departures({ data, ready, refresh, go }: SectionProps) {
  const [resortId, setResortId] = useState<ResortId>('kumania');
  const [showPast, setShowPast] = useState(false);
  if (!ready) return <Loading />;

  const { resorts, departures } = data;
  const resort = resorts.find((r) => r.id === resortId) ?? resorts[0];
  const today = todayIso();
  const mine = departures
    .filter((d) => d.resortId === resort?.id)
    .sort((a, b) => a.start.localeCompare(b.start));
  const future = mine.filter((d) => d.start >= today);
  const past = mine.filter((d) => d.start < today).reverse();

  return (
    <>
      <PageHeader
        title="Plecări"
        text={`Locurile scad singure când marchezi o cerere „Rezervată”; plus și minus sunt pentru vânzările făcute altfel. De la ${LOW_SEATS} locuri în jos, aplicația arată „Ultimele locuri”.`}
      />

      <div className="chips" style={{ marginBottom: 16 }}>
        {resorts.map((r) => (
          <button
            key={r.id}
            type="button"
            className="chip"
            aria-pressed={resort?.id === r.id}
            onClick={() => {
              setResortId(r.id);
              setShowPast(false);
            }}
          >
            {r.name}
            <span className="n">
              {departures.filter((d) => d.resortId === r.id && d.start >= today).length}
            </span>
          </button>
        ))}
      </div>

      <div className="stack">
        <div className="card">
          {future.length === 0 ? (
            <Empty
              icon={<CalendarX size={26} />}
              title="Nicio plecare programată"
              text="Adaugă una mai jos — apare imediat în aplicație."
            />
          ) : (
            <div className="dep-list">
              <div className="dep-row dep-head" aria-hidden>
                <span>Perioada</span>
                <span>Locuri libere</span>
                <span>Ocupare</span>
                <span />
              </div>
              {future.map((d) => (
                <DepartureRow key={d.id} departure={d} refresh={refresh} go={go} />
              ))}
            </div>
          )}
        </div>

        {resort ? (
          <AddDeparture key={resort.id} resort={resort} existing={mine} refresh={refresh} go={go} />
        ) : null}

        {past.length > 0 ? (
          <div className="card">
            <button
              type="button"
              className="disclosure"
              aria-expanded={showPast}
              onClick={() => setShowPast((v) => !v)}
            >
              <span>Plecări trecute · {past.length}</span>
              <ChevronDown size={18} />
            </button>
            {showPast ? (
              <div className="dep-list">
                {past.map((d) => (
                  <DepartureRow key={d.id} departure={d} refresh={refresh} go={go} past />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
