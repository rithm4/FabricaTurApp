import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BatteryFull,
  Check,
  ImagePlus,
  Plus,
  RefreshCw,
  Signal,
  Smartphone,
  Star,
  Tag,
  Thermometer,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';

import { api } from '../api';
import { discountOf, euro } from '../format';
import type { Lang, Localized, Resort } from '../types';
import { useToast } from '../ui';

/**
 * Piesele comune ale paginilor Oferte și Destinații: formularul în două limbi, listele cu
 * bife, fotografiile, previzualizarea în aplicație și ciorna unui formular.
 */

export const LANGS: Lang[] = ['ro', 'ru'];

// ── Ciorna unui formular ────────────────────────────────────────────────────

/**
 * Ciorna câmpurilor `keys` ale unei destinații. Datele noi de pe server intră în formular
 * doar dacă operatorul nu lucrează la el: o cerere nouă venită între timp nu trebuie
 * să-i șteargă prețul abia scris. Celelalte câmpuri rămân mereu cele de pe server.
 */
export function useResortDraft(resort: Resort, keys: (keyof Resort)[]) {
  const pick = (r: Resort) =>
    JSON.stringify(Object.fromEntries(keys.map((key) => [key, r[key]])));
  const serverKey = pick(resort);
  const [draft, setDraft] = useState<Resort>(resort);
  const [base, setBase] = useState(serverKey);

  if (serverKey !== base) {
    setBase(serverKey);
    setDraft(
      pick(draft) === base
        ? resort
        : { ...resort, ...Object.fromEntries(keys.map((key) => [key, draft[key]])) },
    );
  }

  const set = <K extends keyof Resort>(key: K, value: Resort[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return {
    draft,
    set,
    changed: pick(draft) !== serverKey,
    reset: () => setDraft(resort),
    /** Doar câmpurile acestui formular, pentru salvare. */
    fields: () => Object.fromEntries(keys.map((key) => [key, draft[key]])) as Partial<Resort>,
  };
}

// ── Previzualizarea în aplicație ────────────────────────────────────────────

/**
 * Adresa aplicației: pe calculator, serverul local de dezvoltare; publicat, aplicația stă
 * cu un nivel mai sus decât panoul (…/FabricaTurApp/ și …/FabricaTurApp/admin/).
 */
const APP_URL = import.meta.env.DEV
  ? 'http://localhost:8081/'
  : new URL('../', window.location.href).toString();

/** O amprentă scurtă a datelor, ca adresa să se schimbe când se schimbă ceva salvat. */
function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Mărimea reală a telefonului desenat: ecran de 390 × 844, plus rama. */
const DEVICE_W = 416;
const DEVICE_H = 870;

/**
 * Cât se micșorează telefonul ca să încapă în fereastră. Aplicația dinăuntru se așază
 * mereu la lățimea unui telefon adevărat; se micșorează doar imaginea, ca o fotografie.
 */
function useDeviceScale() {
  const fit = () =>
    Math.min(1, (window.innerHeight - 170) / DEVICE_H, (window.innerWidth - 48) / DEVICE_W);
  const [scale, setScale] = useState(fit);
  useEffect(() => {
    const onResize = () => setScale(fit());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return Math.max(0.4, scale);
}

/**
 * Butonul „Vezi în aplicație": deschide aplicația adevărată într-un telefon desenat, direct
 * pe pagina ofertei sau a hotelului. Arată ce e salvat — de aceea cere salvarea întâi.
 */
export function PreviewButton({
  resort,
  screen,
  label,
  dirty,
}: {
  resort: Resort;
  screen: 'promo' | 'resort';
  label: string;
  dirty: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('ro');
  const [reload, setReload] = useState(0);
  const scale = useDeviceScale();

  // Se reîncarcă singur după fiecare salvare: cheia se schimbă odată cu datele.
  const version = `${hash(JSON.stringify(resort))}-${reload}`;
  const src = `${APP_URL}?preview=${screen}&resort=${encodeURIComponent(resort.id)}&lang=${lang}&v=${encodeURIComponent(version)}`;

  return (
    <>
      <button type="button" className="btn btn-sm btn-secondary" onClick={() => setOpen(true)}>
        <Smartphone size={16} /> {label}
      </button>

      {open ? (
        <div className="modal" role="dialog" aria-modal="true" aria-label={label} onClick={() => setOpen(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <strong>{label}</strong>
                <span className="hint">{resort.name}</span>
              </div>
              <button type="button" className="btn btn-icon btn-quiet" onClick={() => setOpen(false)} aria-label="Închide">
                <X size={20} />
              </button>
            </div>

            <div className="modal-tools">
              <div className="segmented segmented-sm" role="radiogroup" aria-label="Limba">
                {LANGS.map((l) => (
                  <button key={l} type="button" role="radio" aria-checked={lang === l} className="seg" onClick={() => setLang(l)}>
                    {l === 'ro' ? 'Română' : 'Русский'}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setReload((n) => n + 1)}>
                <RefreshCw size={15} /> Reîncarcă
              </button>
            </div>

            {dirty ? (
              <p className="field-note over" style={{ margin: 0 }}>
                Ai modificări nesalvate: aici se vede varianta salvată. Salvează ca să le vezi.
              </p>
            ) : null}
            {!resort.active ? (
              <p className="field-note" style={{ margin: 0 }}>
                Destinația e ascunsă: clienții nu o văd încă. Aici o vezi doar tu.
              </p>
            ) : null}

            {/* Un telefon adevărat: proporțiile unui iPhone, ramă, butoane, bara de sus. */}
            <div className="device-stage" style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
            <div className="device" style={{ transform: `scale(${scale})` }}>
              <span className="device-btn device-btn-power" aria-hidden />
              <span className="device-btn device-btn-vol-up" aria-hidden />
              <span className="device-btn device-btn-vol-down" aria-hidden />
              <div className="device-screen">
                <div className="device-status" aria-hidden>
                  <span>
                    {new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="device-island" />
                  <span className="device-icons">
                    <Signal size={15} strokeWidth={2.6} />
                    <Wifi size={15} strokeWidth={2.6} />
                    <BatteryFull size={20} strokeWidth={2} />
                  </span>
                </div>
                <iframe key={src} src={src} title={`${label} — ${resort.name}`} />
                <span className="device-home" aria-hidden />
              </div>
            </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Cardul de preț, așa cum îl vede clientul în aplicație — se schimbă pe măsură ce scrii. */
export function AppPreview({ resort }: { resort: Resort }) {
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
export function TextPair({
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

/**
 * O listă în ambele limbi, arătată ca în aplicație: fiecare rând cu bifa lui.
 * Rândurile goale se ignoră la salvare.
 */
export function ListPair({
  id,
  label,
  hint,
  value,
  onChange,
  look = 'check',
}: {
  id: string;
  label: string;
  hint: string;
  /** `check` = listă cu bife; `tag` = etichete scurte. */
  look?: 'check' | 'tag';
  value: Record<Lang, string[]>;
  onChange: (value: Record<Lang, string[]>) => void;
}) {
  const count = (lang: Lang) => value[lang].filter((s) => s.trim()).length;
  const mismatch = count('ro') !== count('ru');

  const update = (lang: Lang, items: string[]) => onChange({ ...value, [lang]: items });
  const setItem = (lang: Lang, index: number, text: string) =>
    update(lang, value[lang].map((item, i) => (i === index ? text : item)));
  const removeItem = (lang: Lang, index: number) =>
    update(lang, value[lang].filter((_, i) => i !== index));
  const moveUp = (lang: Lang, index: number) => {
    const items = [...value[lang]];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    update(lang, items);
  };
  const addItem = (lang: Lang) => {
    update(lang, [...value[lang], '']);
    // Cursorul trece direct în rândul nou, gata de scris.
    requestAnimationFrame(() =>
      document.getElementById(`${id}-${lang}-${value[lang].length}`)?.focus(),
    );
  };

  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="pair">
        {LANGS.map((lang) => (
          <div key={lang} className="pair-col">
            <span className="pair-lang">
              {lang === 'ro' ? 'Română' : 'Русский'} · {count(lang)}
            </span>
            {/* Fiecare rând arată ca în aplicație: o bifă (sau o etichetă) urmată de text. */}
            <ol className="bullets">
              {value[lang].map((item, index) => (
                <li key={index} className="bullet-row">
                  <span className={look === 'check' ? 'bullet-check' : 'bullet-tag'} aria-hidden>
                    {look === 'check' ? <Check size={14} strokeWidth={3} /> : <Tag size={13} />}
                  </span>
                  {/* Rândul lung trece pe mai multe linii, ca în aplicație, nu se taie. */}
                  <textarea
                    rows={1}
                    id={`${id}-${lang}-${index}`}
                    className="bullet-input"
                    value={item}
                    placeholder="Scrie rândul…"
                    aria-label={`${label}, ${lang.toUpperCase()}, rândul ${index + 1}`}
                    onChange={(e) => setItem(lang, index, e.target.value)}
                    onKeyDown={(e) => {
                      // Enter adaugă rândul următor, ca într-o listă obișnuită.
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem(lang);
                      }
                    }}
                  />
                  <span className="bullet-actions">
                    {index > 0 ? (
                      <button
                        type="button"
                        className="bullet-btn"
                        onClick={() => moveUp(lang, index)}
                        aria-label={`Mută rândul ${index + 1} mai sus`}
                        title="Mută mai sus"
                      >
                        <ArrowUp size={15} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="bullet-btn"
                      onClick={() => removeItem(lang, index)}
                      aria-label={`Șterge rândul ${index + 1}`}
                      title="Șterge rândul"
                    >
                      <X size={15} />
                    </button>
                  </span>
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-sm btn-ghost bullet-add" onClick={() => addItem(lang)}>
              <Plus size={15} /> Adaugă rând
            </button>
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
export function Photos({ resort, refresh }: { resort: Resort; refresh: () => Promise<void> }) {
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

/** „Hotel Zalakaros" → „zalakaros": identificatorul intern, fără diacritice și spații. */
function slugOf(name: string, taken: string[]) {
  const base =
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/^hotel\s+/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'destinatie';
  let slug = base.length >= 2 ? base : `${base}-1`;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/**
 * Formularul unei destinații noi: doar ce trebuie ca să existe. Textele și fotografiile
 * se completează apoi în cardul ei, iar în aplicație apare abia când o faci vizibilă.
 */
export function AddResort({
  resorts,
  refresh,
  onDone,
}: {
  resorts: Resort[];
  refresh: () => Promise<void>;
  onDone: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [city, setCity] = useState<Localized>({ ro: '', ru: '' });
  const [price, setPrice] = useState(0);
  const [nights, setNights] = useState(7);
  const [saving, setSaving] = useState(false);

  const duplicate = resorts.some((r) => r.name.trim().toLowerCase() === name.trim().toLowerCase());
  const valid =
    name.trim().length >= 2 &&
    city.ro.trim() !== '' &&
    city.ru.trim() !== '' &&
    price > 0 &&
    nights > 0 &&
    !duplicate;

  const create = async () => {
    setSaving(true);
    try {
      await api.resorts.create({
        id: slugOf(name, resorts.map((r) => r.id)),
        name,
        city,
        price,
        nights,
        position: Math.max(0, ...resorts.map((r) => r.position)) + 1,
      });
      await refresh();
      toast(`${name.trim()} — adăugată. Completează textele și fotografiile, apoi fă-o vizibilă.`);
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card card-pad stack add-resort">
      <div>
        <h2 style={{ fontSize: 20 }}>Destinație nouă</h2>
        <p className="muted">
          Rămâne ascunsă în aplicație până îi completezi textele și fotografiile și o faci vizibilă.
        </p>
      </div>
      <div className="grid-fields add-grid">
        <div className="field">
          <label htmlFor="new-name">Numele hotelului</label>
          <input
            id="new-name"
            className="input"
            value={name}
            placeholder="Hotel Zalakaros"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={duplicate}
            autoFocus
          />
        </div>
        <div className="grid-fields">
          <div className="field">
            <label htmlFor="new-price">Preț de persoană</label>
            <div className="input-affix">
              <input
                id="new-price"
                className="input"
                type="number"
                min={1}
                value={price || ''}
                onChange={(e) => setPrice(Math.round(Number(e.target.value)))}
              />
              <span>€</span>
            </div>
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
        </div>
      </div>
      <div className="field">
        <span className="label">Orașul</span>
        <div className="pair">
          {LANGS.map((lang) => (
            <div key={lang} className="pair-col">
              <label htmlFor={`new-city-${lang}`} className="pair-lang">
                {lang === 'ro' ? 'Română' : 'Русский'}
              </label>
              <input
                id={`new-city-${lang}`}
                className="input"
                value={city[lang]}
                placeholder={lang === 'ro' ? 'Zalakaros' : 'Залакарош'}
                onChange={(e) => setCity({ ...city, [lang]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
      {duplicate ? <p className="field-note over">Există deja o destinație cu acest nume.</p> : null}
      <div className="form-actions">
        <button type="button" className="btn btn-primary" disabled={!valid || saving} onClick={create}>
          <Plus size={17} /> {saving ? 'Se adaugă…' : 'Adaugă destinația'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Renunță
        </button>
      </div>
    </div>
  );
}

