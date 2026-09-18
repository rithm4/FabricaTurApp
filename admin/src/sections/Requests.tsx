import { useState } from 'react';
import { Inbox, Phone, Search, SearchX, X } from 'lucide-react';

import { api } from '../api';
import { departureLabel, digits, formatAgo, formatDateTime, statusLabel } from '../format';
import type { SectionProps } from '../nav';
import type { Departure, OfferRequest, RequestStatus, Resort } from '../types';
import { DeleteButton, Empty, Loading, PageHeader, useToast } from '../ui';

const FILTERS: Array<'all' | RequestStatus> = ['all', 'new', 'called', 'booked', 'cancelled'];
const STATUSES: RequestStatus[] = ['new', 'called', 'booked', 'cancelled'];

/**
 * Notița operatorului. Se salvează când operatorul iese din câmp — fără buton în plus.
 * Cât timp scrie, textul lui nu e înlocuit de reîncărcările venite de pe server.
 */
function Note({ request, refresh }: { request: OfferRequest; refresh: () => Promise<void> }) {
  const toast = useToast();
  const [draft, setDraft] = useState(request.note);
  const [editing, setEditing] = useState(false);
  const value = editing ? draft : request.note;

  const save = async () => {
    setEditing(false);
    if (draft.trim() === request.note) return;
    await api.requests.setNote(request.id, draft);
    await refresh();
    toast('Notiță salvată');
  };

  return (
    <textarea
      className="note"
      value={value}
      rows={Math.min(4, Math.max(1, value.split('\n').length))}
      maxLength={1000}
      placeholder="Notiță: ce s-a vorbit, când suni din nou…"
      aria-label={`Notiță pentru ${request.name}`}
      onFocus={() => {
        setDraft(request.note);
        setEditing(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        // Enter salvează; Shift+Enter trece pe rând nou.
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          setDraft(request.note);
          setEditing(false);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function RequestCard({
  request,
  resort,
  departure,
  refresh,
}: {
  request: OfferRequest;
  refresh: () => Promise<void>;
  resort: Resort | undefined;
  departure: Departure | undefined;
}) {
  const toast = useToast();

  /**
   * Locurile se schimbă singure pe server (vezi 003-stari-si-locuri.sql); mesajul spune
   * exact ce s-a întâmplat, ca operatorul să nu le mai scadă o dată de mână.
   */
  const seatsNote = (status: RequestStatus) => {
    const persons = request.party === '3+' ? 3 : Number(request.party);
    const exact = request.party === '3+' ? ' (3+ contează ca 3 — ajustează în Plecări)' : '';
    if (status === 'booked') {
      if (!departure) return ' · fără dată aleasă, locurile nu s-au schimbat';
      // Serverul nu coboară sub zero: dacă nu erau destule locuri, operatorul trebuie să afle.
      if (departure.seatsLeft < persons) {
        return ` · ATENȚIE: la ${departureLabel(departure)} erau doar ${departure.seatsLeft} locuri libere`;
      }
      return ` · locuri la ${departureLabel(departure)}: −${persons}${exact}`;
    }
    if (request.status === 'booked' && departure) return ` · ${persons} locuri eliberate`;
    return '';
  };

  const setStatus = async (status: RequestStatus) => {
    if (status === request.status) return;
    // Nota se calculează înainte de salvare, din locurile de dinainte de rezervare.
    const note = seatsNote(status);
    await api.requests.setStatus(request.id, status);
    await refresh();
    toast(
      `${request.name} — ${statusLabel[status].toLowerCase()}${note}`,
      note.includes('ATENȚIE') ? 'error' : 'ok',
    );
  };

  const remove = async () => {
    await api.requests.remove(request.id);
    await refresh();
    toast(request.status === 'booked' && departure ? 'Cerere ștearsă · locurile ei s-au eliberat' : 'Cerere ștearsă');
  };

  return (
    <article className={`request status-${request.status}`}>
      <div className="request-top">
        <div className="request-who">
          <div className="request-name">
            {request.name} <span className="lang-tag" title="Limba clientului">{request.lang.toUpperCase()}</span>
          </div>
          <a className="phone-link" href={`tel:${digits(request.phone)}`}>
            <Phone size={15} /> {request.phone}
          </a>
        </div>
        <time className="request-time" title={formatDateTime(request.createdAt)}>
          {formatAgo(request.createdAt)}
        </time>
      </div>

      <div className="request-trip">
        <span className="strong">{resort?.name ?? '—'}</span>
        <span className="dot" aria-hidden>·</span>
        <span>{departureLabel(departure)}</span>
        <span className="dot" aria-hidden>·</span>
        <span>{request.party === '1' ? '1 persoană' : `${request.party} persoane`}</span>
      </div>

      <Note request={request} refresh={refresh} />

      <div className="request-bottom">
        {/* Starea se schimbă dintr-un clic, fără listă derulantă. */}
        <div className="segmented" role="radiogroup" aria-label={`Starea cererii lui ${request.name}`}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={request.status === s}
              className={`seg seg-${s}`}
              onClick={() => setStatus(s)}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
        <DeleteButton label={`Șterge cererea lui ${request.name}`} onConfirm={remove} compact />
      </div>
    </article>
  );
}

/**
 * Cererile de ofertă venite din aplicație. Operatorul sună, notează ce s-a vorbit,
 * apoi schimbă starea. Cererile noi sunt evidențiate: ele sunt treaba de făcut.
 */
export function Requests({ data, ready, refresh }: SectionProps) {
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');
  const [query, setQuery] = useState('');
  if (!ready) return <Loading />;

  const { requests, resorts, departures } = data;

  // Caută după nume, telefon (oricum ar fi scris) sau notiță.
  const q = query.trim().toLowerCase();
  const qDigits = digits(q).replace('+', '');
  const matches = (r: OfferRequest) =>
    !q ||
    r.name.toLowerCase().includes(q) ||
    r.note.toLowerCase().includes(q) ||
    (qDigits.length >= 3 && digits(r.phone).includes(qDigits));

  const searched = requests.filter(matches);
  const count = (f: 'all' | RequestStatus) =>
    f === 'all' ? searched.length : searched.filter((r) => r.status === f).length;
  const shown = filter === 'all' ? searched : searched.filter((r) => r.status === filter);

  return (
    <>
      <PageHeader
        title="Cereri"
        text="Sună clientul în limba de lângă nume, notează ce ați vorbit și schimbă starea cererii."
      />

      <div className="toolbar">
        <div className="search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută după nume, telefon sau notiță"
            aria-label="Caută cereri"
          />
          {query ? (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Șterge căutarea">
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="chips">
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
      </div>

      {shown.length === 0 ? (
        <div className="card">
          {q ? (
            <Empty icon={<SearchX size={26} />} title="Nimic găsit" text={`Nicio cerere pentru „${query.trim()}".`} />
          ) : (
            <Empty
              icon={<Inbox size={26} />}
              title={filter === 'all' ? 'Nicio cerere încă' : 'Nicio cerere în această categorie'}
              text="Cererile trimise din aplicație apar aici pe loc, fără reîncărcare."
            />
          )}
        </div>
      ) : (
        <div className="requests">
          {shown.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              resort={resorts.find((r) => r.id === request.resortId)}
              departure={departures.find((d) => d.id === request.departureId)}
              refresh={refresh}
            />
          ))}
        </div>
      )}
    </>
  );
}
