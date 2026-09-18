import { useRef, useState } from 'react';
import { ImagePlus, Megaphone, Star, Thermometer, Trash2 } from 'lucide-react';

import { api } from '../api';
import { discountOf, euro, todayIso } from '../format';
import type { Compose, Section, SectionProps } from '../nav';
import type { Lang, Localized, Resort } from '../types';
import { Loading, PageHeader, useToast } from '../ui';

type Tab = 'pret' | 'texte' | 'foto';
const TABS: { id: Tab; label: string }[] = [
  { id: 'pret', label: 'Preț și termen' },
  { id: 'texte', label: 'Texte' },
  { id: 'foto', label: 'Fotografii' },
];
const LANGS: Lang[] = ['ro', 'ru'];

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
        <span>
          {resort.nights} nopți{resort.short.ro ? ` · ${resort.short.ro}` : ''}
        </span>
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

/** Un text scurt în ambele limbi, alături. */
function TextPair({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  hint: string;
  value: Localized;
  onChange: (value: Localized) => void;
  placeholder: Localized;
}) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="pair">
        {LANGS.map((lang) => (
          <div key={lang} className="pair-col">
            <label htmlFor={`${id}-${lang}`} className="pair-lang">
              {lang.toUpperCase()}
            </label>
            <input
              id={`${id}-${lang}`}
              className="input"
              value={value[lang]}
              placeholder={placeholder[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <p className="field-note">{hint}</p>
    </div>
  );
}

/** O listă în ambele limbi: câte un element pe rând. Rândurile goale se ignoră la salvare. */
function ListPair({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: Record<Lang, string[]>;
  onChange: (value: Record<Lang, string[]>) => void;
}) {
  const count = (lang: Lang) => value[lang].filter((s) => s.trim()).length;
  const mismatch = count('ro') !== count('ru');

  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="pair">
        {LANGS.map((lang) => (
          <div key={lang} className="pair-col">
            <label htmlFor={`${id}-${lang}`} className="pair-lang">
              {lang.toUpperCase()} · {count(lang)}
            </label>
            <textarea
              id={`${id}-${lang}`}
              className="textarea"
              rows={Math.max(3, value[lang].length + 1)}
              value={value[lang].join('\n')}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value.split('\n') })}
            />
          </div>
        ))}
      </div>
      {/* Același număr de rânduri în ambele limbi: altfel clienții văd liste diferite. */}
      <p className={mismatch ? 'field-note over' : 'field-note'}>
        {mismatch ? `Româna are ${count('ro')} rânduri, rusa ${count('ru')}. Traduce-le pe toate.` : hint}
      </p>
    </div>
  );
}

/** Fotografiile: se salvează imediat, fără butonul „Salvează" al formularului. */
function Photos({ resort, refresh }: { resort: Resort; refresh: () => Promise<void> }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const save = async (photos: string[]) => {
    await api.resorts.update(resort.id, { photos });
    await refresh();
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const added: string[] = [];
      for (const [index, file] of Array.from(files).entries()) {
        setBusy(`Se încarcă ${index + 1} din ${files.length}…`);
        added.push(await api.resorts.uploadPhoto(resort.id, file));
      }
      await save([...resort.photos, ...added]);
      toast(added.length === 1 ? 'Fotografie adăugată' : `${added.length} fotografii adăugate`);
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  };

  const makeCover = async (url: string) => {
    await save([url, ...resort.photos.filter((p) => p !== url)]);
    toast('Copertă schimbată');
  };

  const remove = async (url: string) => {
    await save(resort.photos.filter((p) => p !== url));
    await api.resorts.removePhoto(url).catch(() => {});
    toast('Fotografie ștearsă');
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="field-note">
        {resort.photos.length === 0
          ? 'Deocamdată aplicația folosește fotografiile puse la construirea ei. Când adaugi prima fotografie aici, le înlocuiește.'
          : 'Prima fotografie e coperta: apare pe carduri și sus pe pagina hotelului.'}
      </p>

      {resort.photos.length > 0 ? (
        <div className="photos">
          {resort.photos.map((url, index) => (
            <figure key={url} className="photo">
              <img src={url} alt={`Fotografia ${index + 1}`} loading="lazy" />
              {index === 0 ? <span className="photo-cover">Copertă</span> : null}
              <div className="photo-actions">
                {index > 0 ? (
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => makeCover(url)}>
                    Fă copertă
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-sm btn-icon btn-secondary"
                  onClick={() => remove(url)}
                  aria-label={`Șterge fotografia ${index + 1}`}
                  title="Șterge"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </figure>
          ))}
        </div>
      ) : null}

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy !== null}
          onClick={() => input.current?.click()}
        >
          <ImagePlus size={18} /> {busy ?? 'Adaugă fotografii'}
        </button>
        <span className="hint">Se micșorează singure; poți alege mai multe odată.</span>
      </div>
    </div>
  );
}

/** Ce se compară pentru „Nesalvat": fotografiile și oferta săptămânii se salvează separat. */
const editable = (r: Resort) => {
  const { photos: _photos, featured: _featured, ...rest } = r;
  return JSON.stringify(rest);
};

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
  const [tab, setTab] = useState<Tab>('pret');

  const changed = editable(draft) !== editable(resort);

  // Datele noi de pe server intră în formular doar dacă operatorul nu lucrează la el:
  // o cerere nouă venită între timp nu trebuie să-i șteargă prețul abia scris.
  const serverKey = JSON.stringify(resort);
  const [base, setBase] = useState(serverKey);
  if (serverKey !== base) {
    setBase(serverKey);
    const baseResort = JSON.parse(base) as Resort;
    setDraft(
      editable(draft) === editable(baseResort)
        ? resort
        : { ...draft, photos: resort.photos, featured: resort.featured },
    );
  }

  const priceValid = Number.isInteger(draft.price) && draft.price > 0;
  const nightsValid = Number.isInteger(draft.nights) && draft.nights > 0;
  const oldPriceLow = draft.oldPrice !== null && draft.oldPrice <= draft.price;
  const untilPast = draft.offerUntil !== null && draft.offerUntil < todayIso();
  const discount = discountOf(draft);
  const savedDiscount = discountOf(resort);

  const set = <K extends keyof Resort>(key: K, value: Resort[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      // Un preț vechi mai mic decât cel nou nu înseamnă reducere: nu-l păstrăm.
      const { photos: _photos, featured: _featured, ...fields } = {
        ...draft,
        oldPrice: oldPriceLow ? null : draft.oldPrice,
      };
      await api.resorts.update(resort.id, fields);
      await refresh();
      toast(`${resort.name} — salvat, apare acum în aplicație`);
    } finally {
      setSaving(false);
    }
  };

  const makeFeatured = async () => {
    await api.resorts.setFeatured(resort.id);
    await refresh();
    toast(`${resort.name} e acum oferta săptămânii`);
  };

  const num = (value: string) => (value === '' ? 0 : Math.round(Number(value)));

  return (
    <div className="card card-pad stack offer">
      <div className="offer-head">
        <div>
          <h2>{resort.name}</h2>
          <p className="muted">{resort.city.ro}</p>
        </div>
        <div className="offer-flags">
          {changed ? <span className="badge badge-new">Nesalvat</span> : null}
          {/* O singură ofertă a săptămânii: e prima în aplicație, pe Acasă și în promoție. */}
          {resort.featured ? (
            <span className="badge badge-booked">Oferta săptămânii</span>
          ) : (
            <button type="button" className="btn btn-sm btn-secondary" onClick={makeFeatured}>
              Fă oferta săptămânii
            </button>
          )}
        </div>
      </div>

      <AppPreview resort={draft} />

      <div className="segmented tabs" role="tablist" aria-label={`Secțiuni ${resort.name}`}>
        {TABS.map(({ id, label }) => (
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

      {tab === 'pret' ? (
        <>
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

          <div className="field">
            <label htmlFor={`${resort.id}-until`}>Oferta e valabilă până la (opțional)</label>
            <div className="until-row">
              <input
                id={`${resort.id}-until`}
                className="input"
                type="date"
                min={todayIso()}
                value={draft.offerUntil ?? ''}
                onChange={(e) => set('offerUntil', e.target.value || null)}
                aria-invalid={untilPast}
              />
              {draft.offerUntil ? (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => set('offerUntil', null)}>
                  Fără termen
                </button>
              ) : null}
            </div>
            <p className={untilPast ? 'field-note over' : 'field-note'}>
              {untilPast
                ? 'Data a trecut: aplicația nu mai arată termenul. Alege o dată nouă sau „Fără termen".'
                : draft.offerUntil
                  ? `Pe pagina ofertei apare: „Oferta este valabilă până la ${new Date(`${draft.offerUntil}T12:00:00`).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}." După această zi, rândul dispare singur.`
                  : 'Fără termen: pe pagina ofertei nu apare nicio dată limită.'}
            </p>
          </div>
        </>
      ) : null}

      {tab === 'texte' ? (
        <>
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
            hint="Câte un rând pe linie. Apare pe pagina ofertei săptămânii."
            value={draft.includes}
            onChange={(v) => set('includes', v)}
          />
          <ListPair
            id={`${resort.id}-features`}
            label="Avantajele hotelului"
            hint="Câte un rând pe linie. Apare pe pagina hotelului."
            value={draft.features}
            onChange={(v) => set('features', v)}
          />
          <ListPair
            id={`${resort.id}-tags`}
            label="Etichete scurte"
            hint="Câte una pe linie, 1–3 cuvinte. Apar în lista de destinații."
            value={draft.tags}
            onChange={(v) => set('tags', v)}
          />
        </>
      ) : null}

      {tab === 'foto' ? <Photos resort={resort} refresh={refresh} /> : null}

      {tab !== 'foto' || changed ? (
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
      ) : null}
    </div>
  );
}

export function Offers({ data, ready, refresh, go }: SectionProps) {
  if (!ready) return <Loading />;

  return (
    <>
      <PageHeader
        title="Oferte"
        text="Prețurile, textele și fotografiile fiecărui hotel. Ce salvezi apare în aplicație pe loc, fără o versiune nouă a aplicației."
      />

      <div className="offers">
        {data.resorts.map((resort) => (
          <ResortEditor key={resort.id} resort={resort} refresh={refresh} go={go} />
        ))}
      </div>
    </>
  );
}
