import { useState } from 'react';
import { Megaphone, Star, Thermometer } from 'lucide-react';

import { api } from '../api';
import { discountOf, euro } from '../format';
import type { Compose, Section, SectionProps } from '../nav';
import type { Resort } from '../types';
import { Loading, PageHeader, useToast } from '../ui';

/** Cardul de preț, așa cum îl vede clientul în aplicație — se schimbă pe măsură ce scrii. */
function AppPreview({ resort }: { resort: Resort }) {
  const discount = discountOf(resort);
  return (
    <div className="app-preview" aria-label="Cum apare în aplicație">
      <div className="app-preview-top">
        <span className="app-preview-name">{resort.name}</span>
        {discount > 0 ? <span className="app-badge">Reducere {euro(discount)}</span> : null}
      </div>
      <div className="app-preview-price">
        <span className="app-price">{resort.price > 0 ? euro(resort.price) : '—'}</span>
        {discount > 0 ? <s>{euro(resort.oldPrice!)}</s> : null}
        <span className="app-per">de persoană</span>
      </div>
      <div className="app-preview-facts">
        <span>{resort.nights} nopți</span>
        <span>
          <Star size={13} /> {resort.rating || '—'}
        </span>
        <span>
          <Thermometer size={13} /> {resort.waterTemp || '—'}
        </span>
      </div>
    </div>
  );
}

/** Formularul unui hotel. Butonul de salvare se aprinde doar când s-a schimbat ceva. */
function ResortEditor({
  resort,
  refresh,
  go,
}: {
  resort: Resort;
  refresh: () => Promise<void>;
  go: (section: Section, compose?: Compose) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState(resort);
  const [saving, setSaving] = useState(false);

  const changed = JSON.stringify(draft) !== JSON.stringify(resort);

  // Datele noi de pe server intră în formular doar dacă operatorul nu lucrează la el:
  // o cerere nouă venită între timp nu trebuie să-i șteargă prețul abia scris.
  const serverKey = JSON.stringify(resort);
  const [base, setBase] = useState(serverKey);
  if (serverKey !== base) {
    setBase(serverKey);
    if (JSON.stringify(draft) === base) setDraft(resort);
  }

  const priceValid = Number.isInteger(draft.price) && draft.price > 0;
  const nightsValid = Number.isInteger(draft.nights) && draft.nights > 0;
  const oldPriceLow = draft.oldPrice !== null && draft.oldPrice <= draft.price;
  const discount = discountOf(draft);
  const savedDiscount = discountOf(resort);

  const set = <K extends keyof Resort>(key: K, value: Resort[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      // Un preț vechi mai mic decât cel nou nu înseamnă reducere: nu-l păstrăm.
      const clean = { ...draft, oldPrice: oldPriceLow ? null : draft.oldPrice };
      setDraft(clean);
      await api.resorts.update(resort.id, clean);
      await refresh();
      toast(`${resort.name} — salvat, apare acum în aplicație`);
    } finally {
      setSaving(false);
    }
  };

  const num = (value: string) => (value === '' ? 0 : Math.round(Number(value)));

  return (
    <div className="card card-pad stack offer">
      <div className="offer-head">
        <div>
          <h2>{resort.name}</h2>
          <p className="muted">{resort.city.ro}</p>
        </div>
        {changed ? <span className="badge badge-new">Nesalvat</span> : null}
      </div>

      <AppPreview resort={draft} />

      <div className="grid-fields">
        <div className="field">
          <label htmlFor={`${resort.id}-price`}>Preț de persoană</label>
          <div className="input-affix">
            <input
              id={`${resort.id}-price`}
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              value={draft.price || ''}
              onChange={(e) => set('price', num(e.target.value))}
              aria-invalid={!priceValid}
            />
            <span>€</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor={`${resort.id}-old`}>Preț vechi (opțional)</label>
          <div className="input-affix">
            <input
              id={`${resort.id}-old`}
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="fără reducere"
              value={draft.oldPrice ?? ''}
              onChange={(e) => set('oldPrice', e.target.value ? num(e.target.value) : null)}
              aria-invalid={oldPriceLow}
            />
            <span>€</span>
          </div>
        </div>
      </div>

      {/* Reducerea se calculează din prețuri — nu se scrie de mână. */}
      <p className={oldPriceLow ? 'field-note over' : 'field-note'}>
        {oldPriceLow
          ? 'Prețul vechi trebuie să fie mai mare decât cel nou. Altfel nu apare nicio reducere.'
          : discount > 0
            ? `Clientul vede reducerea de ${euro(discount)}, calculată din cele două prețuri.`
            : 'Completează prețul vechi doar când faci o reducere.'}
      </p>

      <div className="grid-fields grid-fields-3">
        <div className="field">
          <label htmlFor={`${resort.id}-nights`}>Nopți</label>
          <input
            id={`${resort.id}-nights`}
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.nights || ''}
            onChange={(e) => set('nights', num(e.target.value))}
            aria-invalid={!nightsValid}
          />
        </div>
        <div className="field">
          <label htmlFor={`${resort.id}-rating`}>Nota Booking</label>
          <input
            id={`${resort.id}-rating`}
            className="input"
            value={draft.rating}
            placeholder="8,9"
            onChange={(e) => set('rating', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${resort.id}-water`}>Apa la sursă</label>
          <input
            id={`${resort.id}-water`}
            className="input"
            value={draft.waterTemp}
            placeholder="38–40 °C"
            onChange={(e) => set('waterTemp', e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!changed || !priceValid || !nightsValid || saving}
          onClick={save}
        >
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
        {changed ? (
          <button type="button" className="btn btn-ghost" onClick={() => setDraft(resort)}>
            Renunță
          </button>
        ) : savedDiscount > 0 ? (
          // O reducere salvată se vinde mai bine anunțată.
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => go('notificari', { audience: 'promo', target: resort.id })}
          >
            <Megaphone size={17} /> Anunță reducerea
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Offers({ data, ready, refresh, go }: SectionProps) {
  if (!ready) return <Loading />;

  return (
    <>
      <PageHeader
        title="Oferte"
        text="Prețurile și detaliile fiecărui hotel. Ce salvezi apare în aplicație pe loc, fără o versiune nouă a aplicației."
      />

      <div className="offers">
        {data.resorts.map((resort) => (
          <ResortEditor key={resort.id} resort={resort} refresh={refresh} go={go} />
        ))}
      </div>
    </>
  );
}
