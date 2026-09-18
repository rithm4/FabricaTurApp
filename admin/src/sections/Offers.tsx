import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import { api } from '../api';
import { discountOf, euro } from '../format';
import type { Resort } from '../types';

/** Formularul unui hotel. Butonul de salvare se aprinde doar când s-a schimbat ceva. */
function ResortEditor({ resort, onSaved }: { resort: Resort; onSaved: () => void }) {
  const [draft, setDraft] = useState(resort);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(resort), [resort]);

  const changed = JSON.stringify(draft) !== JSON.stringify(resort);
  const priceValid = draft.price > 0;
  const oldPriceLow = draft.oldPrice !== null && draft.oldPrice <= draft.price;
  const discount = discountOf(draft);

  const set = <K extends keyof Resort>(key: K, value: Resort[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    await api.resorts.update(resort.id, draft);
    setSaved(true);
    onSaved();
  };

  return (
    <div className="card card-pad stack">
      <div>
        <h2 style={{ fontSize: 22 }}>{resort.name}</h2>
        <p className="muted" style={{ margin: '2px 0 0' }}>
          {resort.city.ro}
        </p>
      </div>

      <div className="grid-2" style={{ gap: 14 }}>
        <div className="field">
          <label htmlFor={`${resort.id}-price`}>Preț de persoană, €</label>
          <input
            id={`${resort.id}-price`}
            className="input"
            type="number"
            min={1}
            value={draft.price || ''}
            onChange={(e) => set('price', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${resort.id}-old`}>Preț vechi, €</label>
          <input
            id={`${resort.id}-old`}
            className="input"
            type="number"
            min={1}
            placeholder="fără reducere"
            value={draft.oldPrice ?? ''}
            onChange={(e) => set('oldPrice', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </div>

      {/* Ce vede omul în aplicație, calculat din prețuri — nu scris de mână. */}
      <div className="hint" style={{ fontSize: 15 }}>
        {oldPriceLow ? (
          <span className="hint over">
            Prețul vechi trebuie să fie mai mare decât cel nou, altfel nu apare nicio reducere.
          </span>
        ) : discount > 0 ? (
          <>
            În aplicație apare: <span className="badge badge-new">Reducere {euro(discount)}</span>{' '}
            și prețul tăiat {euro(draft.oldPrice!)}.
          </>
        ) : (
          'Fără reducere: în aplicație apare doar prețul.'
        )}
      </div>

      <div className="grid-2" style={{ gap: 14 }}>
        <div className="field">
          <label htmlFor={`${resort.id}-nights`}>Nopți</label>
          <input
            id={`${resort.id}-nights`}
            className="input"
            type="number"
            min={1}
            value={draft.nights}
            onChange={(e) => set('nights', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${resort.id}-rating`}>Nota Booking</label>
          <input
            id={`${resort.id}-rating`}
            className="input"
            value={draft.rating}
            onChange={(e) => set('rating', e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${resort.id}-water`}>Temperatura apei la sursă</label>
        <input
          id={`${resort.id}-water`}
          className="input"
          value={draft.waterTemp}
          onChange={(e) => set('waterTemp', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!changed || !priceValid}
          onClick={save}
        >
          Salvează
        </button>
        {changed ? (
          <button type="button" className="btn btn-ghost" onClick={() => setDraft(resort)}>
            Renunță
          </button>
        ) : null}
        {saved && !changed ? (
          <span className="saved">
            <Check size={17} /> Salvat
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Offers() {
  const [resorts, setResorts] = useState<Resort[]>([]);

  const refresh = async () => setResorts(await api.resorts.list());

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Oferte</h1>
          <p>
            Prețurile și detaliile fiecărui hotel. Ce salvezi aici apare în aplicație — fără o
            versiune nouă a aplicației.
          </p>
        </div>
      </header>

      <div className="grid-2">
        {resorts.map((resort) => (
          <ResortEditor key={resort.id} resort={resort} onSaved={refresh} />
        ))}
      </div>
    </>
  );
}
