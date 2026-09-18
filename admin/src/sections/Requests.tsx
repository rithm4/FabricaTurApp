import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';

import { api } from '../api';
import { departureLabel, formatAgo, statusLabel } from '../format';
import type { Departure, OfferRequest, RequestStatus, Resort } from '../types';

const FILTERS: Array<'all' | RequestStatus> = ['all', 'new', 'called', 'booked', 'cancelled'];
const STATUSES: RequestStatus[] = ['new', 'called', 'booked', 'cancelled'];

/**
 * Cererile de ofertă venite din aplicație. Operatorul sună, apoi schimbă starea.
 * Cererile noi stau sus și sunt evidențiate: ele sunt treaba de făcut.
 */
export function Requests({ onChange }: { onChange: () => void }) {
  const [requests, setRequests] = useState<OfferRequest[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');

  const refresh = async () => {
    const [r, rs, ds] = await Promise.all([
      api.requests.list(),
      api.resorts.list(),
      api.departures.list(),
    ]);
    setRequests(r);
    setResorts(rs);
    setDepartures(ds);
  };

  useEffect(() => {
    refresh();
  }, []);

  const setStatus = async (id: string, status: RequestStatus) => {
    await api.requests.setStatus(id, status);
    await refresh();
    onChange();
  };

  const count = (f: 'all' | RequestStatus) =>
    f === 'all' ? requests.length : requests.filter((r) => r.status === f).length;
  const shown = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Cereri</h1>
          <p>
            Cererile de ofertă trimise din aplicație. Sună clientul, apoi schimbă starea cererii.
            Limba de lângă nume e cea în care folosește aplicația — în ea să vorbești.
          </p>
        </div>
      </header>

      <div className="chips" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Toate' : statusLabel[f]}
            <span className="n">{count(f)}</span>
          </button>
        ))}
      </div>

      <div className="card">
        {shown.length === 0 ? (
          <p className="empty">Nicio cerere în această categorie.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Primită</th>
                  <th>Client</th>
                  <th>Telefon</th>
                  <th>Hotel și plecare</th>
                  <th>Pers.</th>
                  <th>Stare</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((request) => {
                  const resort = resorts.find((r) => r.id === request.resortId);
                  const departure = departures.find((d) => d.id === request.departureId);
                  return (
                    <tr key={request.id} className={request.status === 'new' ? 'is-new' : undefined}>
                      <td className="muted">{formatAgo(request.createdAt)}</td>
                      <td>
                        <span className="strong">{request.name}</span>{' '}
                        <span className="lang-tag">{request.lang.toUpperCase()}</span>
                      </td>
                      <td>
                        {/* Pe un telefon sau un calculator cu apeluri, numărul se sună direct. */}
                        <a className="phone-link" href={`tel:${request.phone.replace(/\s/g, '')}`}>
                          <Phone size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                          {request.phone}
                        </a>
                      </td>
                      <td>
                        <div className="strong">{resort?.name ?? '—'}</div>
                        <div className="muted">{departureLabel(departure)}</div>
                      </td>
                      <td>{request.party}</td>
                      <td>
                        <select
                          className="select"
                          value={request.status}
                          aria-label={`Starea cererii lui ${request.name}`}
                          onChange={(e) => setStatus(request.id, e.target.value as RequestStatus)}
                          style={{ minWidth: 140 }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
