import { useRef, useState, type ComponentType } from 'react';
import {
  BellOff,
  CalendarPlus,
  Copy,
  Megaphone,
  Newspaper,
  Send,
  Sparkles,
  Tag,
  type LucideProps,
} from 'lucide-react';

import { api } from '../api';
import { audienceLabel, buildTemplate, formatDateTime, targetLabel } from '../format';
import type { Compose, SectionProps } from '../nav';
import type {
  Audience,
  Lang,
  Localized,
  NotificationTarget,
  SentNotification,
} from '../types';
import { DeleteButton, Empty, Loading, PageHeader, useToast } from '../ui';

/** Cât încape pe ecranul de blocare fără să fie tăiat. Peste, sistemul pune „…". */
const TITLE_MAX = 50;
const BODY_MAX = 150;

const AUDIENCES: { id: Audience; icon: ComponentType<LucideProps> }[] = [
  { id: 'promo', icon: Tag },
  { id: 'lastSeats', icon: Megaphone },
  { id: 'newDepartures', icon: CalendarPlus },
  { id: 'news', icon: Newspaper },
];
const EMPTY: Localized = { ro: '', ru: '' };
const LANGS: Lang[] = ['ro', 'ru'];

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={over ? 'counter over' : 'counter'}>
      {over ? 'prea lung pentru ecranul telefonului · ' : ''}
      {value.length} / {max}
    </span>
  );
}

/** Cum arată notificarea pe ecranul de blocare, în limba aleasă. */
function PhonePreview({ title, body, lang }: { title: string; body: string; lang: Lang }) {
  const now = new Date();
  const locale = lang === 'ro' ? 'ro-RO' : 'ru-RU';

  return (
    <div className="phone" aria-label="Previzualizare pe telefon">
      <div className="phone-screen">
        <div className="phone-time">
          {now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="phone-date">
          {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="push">
          <div className="push-head">
            <img src="./favicon.png" alt="" />
            <span>Fabrica Tur</span>
            <span style={{ marginLeft: 'auto' }}>{lang === 'ro' ? 'acum' : 'сейчас'}</span>
          </div>
          <div className="push-title">
            {title || <span className="push-empty">Titlul notificării</span>}
          </div>
          <div className="push-body">
            {body || <span className="push-empty">Textul notificării</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({
  item,
  target,
  onReuse,
  onRemove,
}: {
  item: SentNotification;
  target: string;
  onReuse: () => void;
  onRemove: () => Promise<void>;
}) {
  const [lang, setLang] = useState<Lang>('ro');

  return (
    <li className="history-item">
      <div className="history-meta">
        <span className="badge badge-called">{audienceLabel[item.audience]}</span>
        <span className="hint">
          {formatDateTime(item.sentAt)} · duce la {target}
        </span>
      </div>
      <div className="history-text">
        <div className="list-title">{item.title[lang]}</div>
        <div className="list-sub">{item.body[lang]}</div>
      </div>
      <div className="history-actions">
        <div className="segmented segmented-sm" role="radiogroup" aria-label="Limba textului">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              className="seg"
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-sm btn-quiet" onClick={onReuse}>
          <Copy size={16} /> Folosește ca model
        </button>
        <DeleteButton label="Șterge notificarea din aplicație" onConfirm={onRemove} />
      </div>
    </li>
  );
}

export function Notifications({ data, ready, refresh, compose }: SectionProps & { compose?: Compose }) {
  const toast = useToast();
  const { resorts, departures, notifications: history } = data;

  const [audience, setAudience] = useState<Audience>('promo');
  const [target, setTarget] = useState<NotificationTarget>('promo');
  const [title, setTitle] = useState<Localized>(EMPTY);
  const [body, setBody] = useState<Localized>(EMPTY);
  const [previewLang, setPreviewLang] = useState<Lang>('ro');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  /** Hotelul despre care e vorba: cel spre care duce notificarea, altfel primul din ofertă. */
  const templateResort =
    resorts.find((r) => r.id === target) ?? resorts.find((r) => r.featured) ?? resorts[0];
  const template = templateResort ? buildTemplate(audience, templateResort, departures) : null;

  const fill = (t: { title: Localized; body: Localized }) => {
    setTitle(t.title);
    setBody(t.body);
    setConfirming(false);
  };

  // Venit din „Anunță" (Dashboard sau Plecări): categoria, hotelul și textul sunt deja pregătite.
  const [applied, setApplied] = useState<Compose | undefined>(undefined);
  if (compose && ready && applied !== compose) {
    setApplied(compose);
    setAudience(compose.audience);
    setTarget(compose.target);
    const resort = resorts.find((r) => r.id === compose.target);
    const t = resort ? buildTemplate(compose.audience, resort, departures) : null;
    if (t) fill(t);
  }

  if (!ready) return <Loading />;

  // Ambele limbi sunt obligatorii: cine folosește aplicația în rusă ar primi altfel un mesaj gol.
  const complete = [title.ro, title.ru, body.ro, body.ru].every((s) => s.trim().length > 0);
  const dirty = [title.ro, title.ru, body.ro, body.ru].some((s) => s.trim().length > 0);

  const send = async () => {
    setSending(true);
    try {
      await api.notifications.send({ audience, target, title, body });
      await refresh();
      setTitle(EMPTY);
      setBody(EMPTY);
      setConfirming(false);
      toast('Notificare trimisă — apare acum în aplicație');
    } finally {
      setSending(false);
    }
  };

  const edit = (setter: typeof setTitle, lang: Lang) => (value: string) => {
    setter((current) => ({ ...current, [lang]: value }));
    setConfirming(false);
  };

  const reuse = (n: SentNotification) => {
    setAudience(n.audience);
    setTarget(n.target);
    fill({ title: n.title, body: n.body });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('Textul e copiat în formular — modifică-l și trimite');
  };

  const remove = async (n: SentNotification) => {
    await api.notifications.remove(n.id);
    await refresh();
    toast('Notificare ștearsă din aplicație');
  };

  return (
    <>
      <PageHeader
        title="Notificări"
        text="Mesajul apare în lista „Noutăți” a aplicației, în limba fiecărui client. Îl primesc cei care au pornită categoria aleasă."
      />

      <div className="compose" ref={formRef}>
        <div className="card card-pad stack">
          <div className="stack" style={{ gap: 10 }}>
            <span className="label">1 · Despre ce e</span>
            <div className="audiences">
              {AUDIENCES.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="audience"
                  aria-pressed={audience === id}
                  onClick={() => {
                    setAudience(id);
                    setConfirming(false);
                  }}
                >
                  <Icon size={20} />
                  <strong>{audienceLabel[id]}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="target">2 · Unde duce apăsarea</label>
            <select
              id="target"
              className="select"
              value={target}
              onChange={(e) => setTarget(e.target.value as NotificationTarget)}
            >
              <option value="promo">{targetLabel('promo', resorts)}</option>
              {resorts.map((r) => (
                <option key={r.id} value={r.id}>
                  Pagina hotelului {r.name}
                </option>
              ))}
              <option value="bookings">{targetLabel('bookings', resorts)}</option>
            </select>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <div className="label-row">
              <span className="label">3 · Textul</span>
              {/* Cifrele vin din ofertă și din plecări: prețul și data nu pot fi greșite. */}
              {audience !== 'news' ? (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary btn-wrap"
                  disabled={!template}
                  onClick={() => template && fill(template)}
                  title={
                    template
                      ? `Scrie textul din datele pentru ${templateResort?.name}`
                      : 'Nu există plecări potrivite pentru un text automat'
                  }
                >
                  <Sparkles size={16} /> Completează din ofertă · {templateResort?.name}
                </button>
              ) : null}
            </div>

            <div className="lang-cols">
              {LANGS.map((lang) => (
                <fieldset key={lang} className="lang-col">
                  <legend>{lang === 'ro' ? 'Română' : 'Русский'}</legend>
                  <div className="field">
                    <label htmlFor={`title-${lang}`}>Titlu</label>
                    <input
                      id={`title-${lang}`}
                      className="input"
                      value={title[lang]}
                      onChange={(e) => edit(setTitle, lang)(e.target.value)}
                      onFocus={() => setPreviewLang(lang)}
                      placeholder={lang === 'ro' ? 'Reducere 68 € la Kumánia' : 'Скидка 68 € в Кумании'}
                    />
                    <Counter value={title[lang]} max={TITLE_MAX} />
                  </div>
                  <div className="field">
                    <label htmlFor={`body-${lang}`}>Text</label>
                    <textarea
                      id={`body-${lang}`}
                      className="textarea"
                      value={body[lang]}
                      onChange={(e) => edit(setBody, lang)(e.target.value)}
                      onFocus={() => setPreviewLang(lang)}
                      placeholder={
                        lang === 'ro'
                          ? 'Plecare 12 octombrie, 7 nopți cu transport.'
                          : 'Выезд 12 октября, 7 ночей с транспортом.'
                      }
                    />
                    <Counter value={body[lang]} max={BODY_MAX} />
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          {/* Trimiterea nu se poate retrage din telefoane, deci cere o confirmare. */}
          {confirming ? (
            <div className="confirm">
              <span>
                Trimiți notificarea către „{audienceLabel[audience]}”? Apare imediat în aplicație.
              </span>
              <span className="confirm-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                  Nu încă
                </button>
                <button type="button" className="btn btn-primary" onClick={send} disabled={sending}>
                  <Send size={17} /> {sending ? 'Se trimite…' : 'Da, trimite'}
                </button>
              </span>
            </div>
          ) : (
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!complete}
                onClick={() => setConfirming(true)}
              >
                <Send size={17} /> Trimite notificarea
              </button>
              {dirty ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setTitle(EMPTY);
                    setBody(EMPTY);
                  }}
                >
                  Golește
                </button>
              ) : null}
              {!complete ? (
                <span className="hint">Completează titlul și textul în ambele limbi.</span>
              ) : null}
            </div>
          )}
        </div>

        <div className="compose-preview">
          <div className="segmented" role="radiogroup" aria-label="Limba previzualizării">
            {LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={previewLang === lang}
                className="seg"
                onClick={() => setPreviewLang(lang)}
              >
                {lang === 'ro' ? 'Română' : 'Русский'}
              </button>
            ))}
          </div>
          <PhonePreview title={title[previewLang]} body={body[previewLang]} lang={previewLang} />
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 40 }}>
        Trimise <span className="muted">· {history.length}</span>
      </h2>
      <div className="card">
        {history.length === 0 ? (
          <Empty
            icon={<BellOff size={26} />}
            title="Nicio notificare trimisă încă"
            text="Ce trimiți apare aici, cu data și categoria."
          />
        ) : (
          <ul className="history">
            {history.map((n) => (
              <HistoryItem
                key={n.id}
                item={n}
                target={targetLabel(n.target as NotificationTarget, resorts)}
                onReuse={() => reuse(n)}
                onRemove={() => remove(n)}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

