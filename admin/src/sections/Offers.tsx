import { useState } from 'react';
import { EyeOff, Megaphone } from 'lucide-react';

import { api } from '../api';
import { discountOf, euro, todayIso } from '../format';
import type { Compose, Section, SectionProps } from '../nav';
import type { Resort } from '../types';
import { Loading, PageHeader, useToast } from '../ui';
import { AppPreview, ListPair, PreviewButton, TextPair, useResortDraft } from './resortParts';

/** Câmpurile ofertei: ce se schimbă de la o săptămână la alta. Restul ține de Destinații. */
const OFFER_KEYS: (keyof Resort)[] = [
  'price',
  'oldPrice',
  'nights',
  'offerUntil',
  'short',
  'badge',
  'includes',
];

function OfferCard({
  resort,
  refresh,
  go,
}: {
  resort: Resort;
  refresh: () => Promise<void>;
  go: (section: Section, compose?: Compose) => void;
}) {
  const toast = useToast();
  const { draft, set, changed, reset, fields } = useResortDraft(resort, OFFER_KEYS);
  const [saving, setSaving] = useState(false);

  const priceValid = Number.isInteger(draft.price) && draft.price > 0;
  const nightsValid = Number.isInteger(draft.nights) && draft.nights > 0;
  const oldPriceLow = draft.oldPrice !== null && draft.oldPrice <= draft.price;
  const untilPast = draft.offerUntil !== null && draft.offerUntil < todayIso();
  const discount = discountOf(draft);
  const savedDiscount = discountOf(resort);
  const num = (value: string) => (value === '' ? 0 : Math.round(Number(value)));

  const save = async () => {
    setSaving(true);
    try {
      // Un preț vechi mai mic decât cel nou nu înseamnă reducere: nu-l păstrăm.
      const values = fields();
      if (oldPriceLow) values.oldPrice = null;
      await api.resorts.update(resort.id, values);
      await refresh();
      toast(`${resort.name} — oferta salvată, apare acum în aplicație`);
    } finally {
      setSaving(false);
    }
  };

  const makeFeatured = async () => {
    await api.resorts.setFeatured(resort.id);
    await refresh();
    toast(`${resort.name} e acum oferta săptămânii`);
  };

  return (
    <div className={resort.active ? 'card card-pad stack offer' : 'card card-pad stack offer is-hidden'}>
      <div className="offer-head">
        <div>
          <h2>{resort.name}</h2>
          <p className="muted">{resort.city.ro}</p>
        </div>
        <div className="offer-flags">
          {changed ? <span className="badge badge-new">Nesalvat</span> : null}
          {/* O singură ofertă a săptămânii: e prima în aplicație, pe Acasă și în promoție. */}
          {!resort.active ? (
            // O ofertă ascunsă se poate pregăti; apare când destinația devine vizibilă.
            <span className="badge badge-cancelled">
              <EyeOff size={14} /> Ascunsă în aplicație
            </span>
          ) : resort.featured ? (
            <span className="badge badge-booked">Oferta săptămânii</span>
          ) : (
            <button type="button" className="btn btn-sm btn-secondary" onClick={makeFeatured}>
              Fă oferta săptămânii
            </button>
          )}
        </div>
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

      <div className="grid-fields">
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
          <label htmlFor={`${resort.id}-until`}>Valabilă până la (opțional)</label>
          <input
            id={`${resort.id}-until`}
            className="input"
            type="date"
            min={todayIso()}
            value={draft.offerUntil ?? ''}
            onChange={(e) => set('offerUntil', e.target.value || null)}
            aria-invalid={untilPast}
          />
        </div>
      </div>
      <p className={untilPast ? 'field-note over' : 'field-note'}>
        {untilPast ? (
          'Data a trecut: aplicația nu mai arată termenul. Alege o dată nouă sau șterge-o.'
        ) : draft.offerUntil ? (
          <>
            Pe pagina ofertei apare „Oferta este valabilă până la{' '}
            {new Date(`${draft.offerUntil}T12:00:00`).toLocaleDateString('ro-RO', {
              day: 'numeric',
              month: 'long',
            })}
            ”; după această zi dispare singur.{' '}
            <button type="button" className="link-btn" onClick={() => set('offerUntil', null)}>
              Fără termen
            </button>
          </>
        ) : (
          'Fără termen: pe pagina ofertei nu apare nicio dată limită.'
        )}
      </p>

      <TextPair
        id={`${resort.id}-short`}
        label="Ce e inclus, pe scurt"
        hint="Apare după numărul de nopți: „10 nopți · Transport și mic dejun”."
        value={draft.short}
        onChange={(v) => set('short', v)}
        placeholder={{ ro: 'Transport și mic dejun', ru: 'Транспорт и завтрак' }}
      />
      <TextPair
        id={`${resort.id}-badge`}
        label="Eticheta de pe fotografia ofertei"
        hint="Apare doar când hotelul e oferta săptămânii. Gol = fără etichetă."
        value={draft.badge}
        onChange={(v) => set('badge', v)}
        placeholder={{ ro: 'Ofertă limitată', ru: 'Ограниченное предложение' }}
      />
      <ListPair
        id={`${resort.id}-includes`}
        label="Ce include oferta"
        hint="Apare pe pagina ofertei săptămânii (Acasă → „Vezi oferta”), sub preț, ca listă cu bife."
        value={draft.includes}
        onChange={(v) => set('includes', v)}
      />

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
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Renunță
          </button>
        ) : null}
        <span className="form-actions-end">
          <PreviewButton resort={resort} screen="promo" label="Vezi oferta în aplicație" dirty={changed} />
          {!changed && savedDiscount > 0 ? (
            // O reducere salvată se vinde mai bine anunțată.
            <button
              type="button"
              className="btn btn-sm btn-quiet"
              onClick={() => go('notificari', { audience: 'promo', target: resort.id })}
            >
              <Megaphone size={16} /> Anunță reducerea
            </button>
          ) : null}
        </span>
      </div>
    </div>
  );
}

/**
 * Ofertele: prețul, reducerea, termenul și ce include — ce se schimbă des. Numele, textele
 * despre hotel și fotografiile sunt la Destinații.
 */
export function Offers({ data, ready, refresh, go }: SectionProps) {
  if (!ready) return <Loading />;

  const visible = data.resorts.filter((r) => r.active);
  const hidden = data.resorts.filter((r) => !r.active);

  return (
    <>
      <PageHeader
        title="Oferte"
        text="Prețul, reducerea și ce include fiecare ofertă. Ce salvezi apare în aplicație pe loc."
      />

      <div className="offers">
        {/* Destinațiile ascunse la urmă: oferta lor se poate pregăti înainte să fie publicată. */}
        {[...visible, ...hidden].map((resort) => (
          <OfferCard key={resort.id} resort={resort} refresh={refresh} go={go} />
        ))}
      </div>

    </>
  );
}
