import { useEffect, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { api } from '../api';
import { formatRange } from '../format';
import type { Departure, Resort, ResortId } from '../types';

/** Sub acest prag, aplicația arată „Ultimele locuri" — același prag ca în aplicație. */
const LOW_SEATS = 6;

function SeatsStepper({ departure, onChange }: { departure: Departure; onChange: () => void }) {
  const set = async (seatsLeft: number) => {
    await api.departures.update(departure.id, {
      seatsLeft: Math.max(0, Math.min(departure.seatsTotal, seatsLeft)),
    });
    onChange();
  };

  const range = formatRange(departure.start, departure.nights);

  return (
    <div className="stepper">
      <button
        type="button"
        className="btn btn-secondary btn-icon"
        onClick={() => set(departure.seatsLeft - 1)}
        disabled={departure.seatsLeft <= 0}
        aria-label={`Un loc mai puțin, ${range}`}
      >
        <Minus size={18} />
      </button>
      <span className="value" aria-live="polite">
        {departure.seatsLeft}
      </span>
      <button
        type="button"
        className="btn btn-secondary btn-icon"
        onClick={() => set(departure.seatsLeft + 1)}
        disabled={departure.seatsLeft >= departure.seatsTotal}
        aria-label={`Un loc în plus, ${range}`}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

function AddDeparture({ resortId, onAdded }: { resortId: ResortId; onAdded: () => void }) {
  const [start, setStart] = useState('');
  const [nights, setNights] = useState(7);
  const [seats, setSeats] = useState(30);

  const valid = start !== '' && nights > 0 && seats > 0;

  const add = async () => {
    await api.departures.create({ resortId, start, nights, seatsTotal: seats, seatsLeft: seats });
    setStart('');
    onAdded();
  };

  return (
    <div className="card card-pad">
      <h2 className="section-title">Adaugă o plecare</h2>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: '1 1 180px' }}>
          <label htmlFor="new-start">Data plecării</label>
          <input
            id="new-start"
            className="input"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: '0 1 120px' }}>
          <label htmlFor="new-nights">Nopți</label>
          <input
            id="new-nights"
            className="input"
            type="number"
            min={1}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
          />
        </div>
        <div className="field" style={{ flex: '0 1 120px' }}>
          <label htmlFor="new-seats">Locuri</label>
          <input
            id="new-seats"
            className="input"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
        </div>
        <button type="button" className="btn btn-primary" disabled={!valid} onClick={add}>
          <Plus size={17} /> Adaugă
        </button>
      </div>
      {start ? (
        <p className="hint" style={{ margin: '10px 0 0' }}>
          În aplicație apare: <span className="strong">{formatRange(start, nights)}</span>
        </p>
      ) : null}
    </div>
  );
}

export function Departures() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [resortId, setResortId] = useState<ResortId>('kumania');

  const refresh = async () => {
    const [r, d] = await Promise.all([api.resorts.list(), api.departures.list()]);
    setResorts(r);
    setDepartures(d);
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (departure: Departure) => {
    const range = formatRange(departure.start, departure.nights);
    if (!window.confirm(`Ștergi plecarea ${range}? Dispare din aplicație.`)) return;
    await api.departures.remove(departure.id);
    refresh();
  };

  const shown = departures.filter((d) => d.resortId === resortId);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Plecări</h1>
          <p>
            Datele de plecare pentru fiecare hotel și locurile rămase. Când scad la {LOW_SEATS} sau
            mai puțin, aplicația afișează „Ultimele locuri".
          </p>
        </div>
      </header>

      <div className="chips" style={{ marginBottom: 16 }}>
        {resorts.map((r) => (
          <button
            key={r.id}
            type="button"
            className="chip"
            aria-pressed={resortId === r.id}
            onClick={() => setResortId(r.id)}
          >
            {r.name}
            <span className="n">{departures.filter((d) => d.resortId === r.id).length}</span>
          </button>
        ))}
      </div>

      <div className="stack">
        <div className="card">
          {shown.length === 0 ? (
            <p className="empty">Nicio plecare pentru acest hotel. Adaugă una mai jos.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Perioada</th>
                    <th>Nopți</th>
                    <th>Locuri rămase</th>
                    <th>Ocupare</th>
                    <th aria-label="Acțiuni" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((d) => {
                    const low = d.seatsLeft <= LOW_SEATS;
                    const taken = d.seatsTotal - d.seatsLeft;
                    return (
                      <tr key={d.id}>
                        <td className="strong">{formatRange(d.start, d.nights)}</td>
                        <td>{d.nights}</td>
                        <td>
                          <SeatsStepper departure={d} onChange={refresh} />
                        </td>
                        <td>
                          <div className={low ? 'seats-bar low' : 'seats-bar'}>
                            <span style={{ width: `${(taken / d.seatsTotal) * 100}%` }} />
                          </div>
                          <div className="hint" style={{ marginTop: 4 }}>
                            {taken} din {d.seatsTotal} ocupate
                            {low ? ' · ultimele locuri' : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            onClick={() => remove(d)}
                            aria-label={`Șterge plecarea ${formatRange(d.start, d.nights)}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AddDeparture resortId={resortId} onAdded={refresh} />
      </div>
    </>
  );
}
