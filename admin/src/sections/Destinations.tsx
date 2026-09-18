import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, MapPinPlus } from 'lucide-react';

import { api } from '../api';
import type { SectionProps } from '../nav';
import type { Resort } from '../types';
import { Loading, PageHeader, useToast } from '../ui';
import {
  AddResort,
  LANGS,
  ListPair,
  Photos,
  PreviewButton,
  useResortDraft,
} from './resortParts';

/** Ce ține de hotel și se schimbă rar. Prețul și ce include oferta sunt la Oferte. */
const DESTINATION_KEYS: (keyof Resort)[] = ['name', 'city', 'rating', 'waterTemp', 'features', 'tags'];

type Tab = 'detalii' | 'foto';

function DestinationCard({
  resort,
  refresh,
  above,
  below,
}: {
  resort: Resort;
  refresh: () => Promise<void>;
  /** Destinația de deasupra și cea de dedesubt în listă — pentru săgețile de ordine. */
  above?: Resort;
  below?: Resort;
}) {
  const toast = useToast();
  const { draft, set, changed, reset, fields } = useResortDraft(resort, DESTINATION_KEYS);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('detalii');

  const nameValid = draft.name.trim().length >= 2;
  const cityValid = draft.city.ro.trim() !== '' && draft.city.ru.trim() !== '';

  const save = async () => {
    setSaving(true);
    try {
      await api.resorts.update(resort.id, fields());
      await refresh();
      toast(`${draft.name.trim()} — salvat, apare acum în aplicație`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    await api.resorts.setActive(resort.id, !resort.active);
    await refresh();
    toast(resort.active ? `${resort.name} — ascunsă în aplicație` : `${resort.name} — afișată în aplicație`);
  };

  const move = async (other: Resort) => {
    await api.resorts.swapPositions(resort, other);
    await refresh();
  };

  // Fără fotografii proprii, o destinație nouă ar apărea cu o imagine generică.
  const needsPhotos = resort.photos.length === 0 && !['kumania', 'hungarospa'].includes(resort.id);

  return (
    <div className={resort.active ? 'card card-pad stack offer' : 'card card-pad stack offer is-hidden'}>
      <div className="offer-head">
        <div>
          <h2>{resort.name}</h2>
          <p className="muted">{resort.city.ro}</p>
        </div>
        <div className="offer-flags">
          {changed ? <span className="badge badge-new">Nesalvat</span> : null}
          {resort.featured ? <span className="badge badge-booked">Oferta săptămânii</span> : null}
        </div>
      </div>

      {/* Vizibilitatea și locul în listă: aceleași în aplicație, pe Acasă și în Destinații. */}
      <div className="offer-bar">
        <button
          type="button"
          className={resort.active ? 'visibility is-on' : 'visibility'}
          onClick={toggleActive}
          disabled={resort.featured && resort.active}
          title={
            resort.featured
              ? 'Oferta săptămânii nu poate fi ascunsă. Alege întâi alt hotel ca ofertă a săptămânii, la Oferte.'
              : undefined
          }
          aria-pressed={resort.active}
        >
          {resort.active ? <Eye size={17} /> : <EyeOff size={17} />}
          {resort.active ? 'Afișată în aplicație' : 'Ascunsă — apasă ca s-o afișezi'}
        </button>
        <span className="order">
          <span className="hint">Ordinea în listă</span>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-quiet"
            disabled={!above}
            onClick={() => above && move(above)}
            aria-label={`Mută ${resort.name} mai sus în listă`}
            title="Mai sus în listă"
          >
            <ArrowUp size={17} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-quiet"
            disabled={!below}
            onClick={() => below && move(below)}
            aria-label={`Mută ${resort.name} mai jos în listă`}
            title="Mai jos în listă"
          >
            <ArrowDown size={17} />
          </button>
        </span>
      </div>

      {!resort.active && needsPhotos ? (
        <p className="field-note over">
          Înainte s-o afișezi: adaugă fotografii, altfel în aplicație apare o imagine generică.
        </p>
      ) : null}

      <div className="segmented tabs" role="tablist" aria-label={`Secțiuni ${resort.name}`}>
        {(
          [
            { id: 'detalii', label: 'Detalii și texte' },
            { id: 'foto', label: `Fotografii${resort.photos.length ? ` · ${resort.photos.length}` : ''}` },
          ] as { id: Tab; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className="seg"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'detalii' ? (
        <>
          <div className="field">
            <label htmlFor={`${resort.id}-name`}>Numele hotelului</label>
            <input
              id={`${resort.id}-name`}
              className="input"
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              aria-invalid={!nameValid}
            />
          </div>

          <div className="field">
            <span className="label">Orașul</span>
            <div className="pair">
              {LANGS.map((lang) => (
                <div key={lang} className="pair-col">
                  <label htmlFor={`${resort.id}-city-${lang}`} className="pair-lang">
                    {lang === 'ro' ? 'Română' : 'Русский'}
                  </label>
                  <input
                    id={`${resort.id}-city-${lang}`}
                    className="input"
                    value={draft.city[lang]}
                    onChange={(e) => set('city', { ...draft.city, [lang]: e.target.value })}
                    aria-invalid={!draft.city[lang].trim()}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid-fields">
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
          <p className="field-note">Goale = nu apar pe pagina hotelului.</p>

          <ListPair
            id={`${resort.id}-features`}
            label="Avantajele hotelului"
            hint="Apare pe pagina hotelului (Destinații → hotelul), sub plecări, ca listă cu bife."
            value={draft.features}
            onChange={(v) => set('features', v)}
          />
          <ListPair
            id={`${resort.id}-tags`}
            label="Etichete scurte"
            hint="1–3 cuvinte fiecare. Apar pe cardul hotelului în lista de destinații."
            value={draft.tags}
            onChange={(v) => set('tags', v)}
            look="tag"
          />

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!changed || !nameValid || !cityValid || saving}
              onClick={save}
            >
              {saving ? 'Se salvează…' : 'Salvează'}
            </button>
            {changed ? (
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Renunță
              </button>
            ) : null}
            <span className="form-actions-end">
              <PreviewButton screen="resort" id={resort.id} name={resort.name} hidden={!resort.active} data={resort} label="Vezi pagina în aplicație" dirty={changed} />
            </span>
          </div>
        </>
      ) : (
        <>
          <Photos resort={resort} refresh={refresh} />
          <div className="form-actions">
            <span className="form-actions-end">
              <PreviewButton screen="resort" id={resort.id} name={resort.name} hidden={!resort.active} data={resort} label="Vezi pagina în aplicație" dirty={false} />
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Destinațiile: hotelurile, cu ce ține de ele și se schimbă rar — nume, oraș, avantaje,
 * fotografii — plus ce se vede în aplicație și în ce ordine.
 */
export function Destinations({ data, ready, refresh }: SectionProps) {
  const [adding, setAdding] = useState(false);
  if (!ready) return <Loading />;

  const list = data.resorts;

  return (
    <>
      <PageHeader
        title="Destinații"
        text="Hotelurile din aplicație: nume, fotografii, avantaje, ordinea în listă și ce se vede. Prețurile sunt la Oferte."
        actions={
          adding ? null : (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              <MapPinPlus size={18} /> Adaugă destinație
            </button>
          )
        }
      />

      {adding ? <AddResort resorts={list} refresh={refresh} onDone={() => setAdding(false)} /> : null}

      <div className="offers">
        {list.map((resort, index) => (
          <DestinationCard
            key={resort.id}
            resort={resort}
            refresh={refresh}
            above={list[index - 1]}
            below={list[index + 1]}
          />
        ))}
      </div>
    </>
  );
}
