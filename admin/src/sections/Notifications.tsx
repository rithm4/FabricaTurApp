import { useEffect, useState } from 'react';
import { Check, Send } from 'lucide-react';

import { api } from '../api';
import { audienceLabel, formatDateTime, targetLabel } from '../format';
import type {
  Audience,
  Lang,
  Localized,
  NotificationTarget,
  Resort,
  SentNotification,
} from '../types';

/** Cât încape pe ecranul de blocare fără să fie tăiat. Peste, sistemul pune „…". */
const TITLE_MAX = 50;
const BODY_MAX = 150;

const AUDIENCES: Audience[] = ['promo', 'lastSeats', 'newDepartures', 'news'];
const EMPTY: Localized = { ro: '', ru: '' };

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={over ? 'hint over' : 'hint'}>
      {value.length} / {max}
      {over ? ' — se va tăia pe telefon' : ''}
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

export function Notifications() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [history, setHistory] = useState<SentNotification[]>([]);

  const [audience, setAudience] = useState<Audience>('promo');
  const [target, setTarget] = useState<NotificationTarget>('promo');
  const [title, setTitle] = useState<Localized>(EMPTY);
  const [body, setBody] = useState<Localized>(EMPTY);
  const [previewLang, setPreviewLang] = useState<Lang>('ro');
  const [confirming, setConfirming] = useState(false);
  const [justSent, setJustSent] = useState<SentNotification | null>(null);

  const refresh = async () => {
    const [r, h] = await Promise.all([api.resorts.list(), api.notifications.list()]);
    setResorts(r);
    setHistory(h);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Ambele limbi sunt obligatorii: cine folosește aplicația în rusă ar primi altfel un mesaj gol.
  const complete = [title.ro, title.ru, body.ro, body.ru].every((s) => s.trim().length > 0);

  const send = async () => {
    const sent = await api.notifications.send({ audience, target, title, body });
    setJustSent(sent);
    setConfirming(false);
    setTitle(EMPTY);
    setBody(EMPTY);
    await refresh();
  };

  const edit = (setter: typeof setTitle, lang: Lang) => (value: string) => {
    setter((current) => ({ ...current, [lang]: value }));
    setConfirming(false);
    setJustSent(null);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Notificări</h1>
          <p>
            Scrie mesajul în ambele limbi și alege cui îl trimiți. Îl primesc doar cei care au
            pornită categoria respectivă în setările aplicației.
          </p>
        </div>
      </header>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-pad stack">
          <div className="stack" style={{ gap: 10 }}>
            <span className="label">Cui trimiți</span>
            <div className="audiences">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="audience"
                  aria-pressed={audience === a}
                  onClick={() => {
                    setAudience(a);
                    setConfirming(false);
                  }}
                >
                  <strong>{audienceLabel[a]}</strong>
                  <span>Cei care au pornită această categorie</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="target">Unde duce apăsarea</label>
            <select
              id="target"
              className="select"
              value={target}
              onChange={(e) => setTarget(e.target.value as NotificationTarget)}
            >
              <option value="promo">{targetLabel('promo', resorts)}</option>
              {resorts.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              <option value="bookings">{targetLabel('bookings', resorts)}</option>
            </select>
          </div>

          {(['ro', 'ru'] as Lang[]).map((lang) => (
            <fieldset key={lang} className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 12 }}>
              <legend className="section-title" style={{ padding: 0 }}>
                {lang === 'ro' ? 'Textul în română' : 'Textul în rusă'}
              </legend>
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

          {/* Trimiterea nu se poate retrage, deci cere o confirmare. */}
          {confirming ? (
            <div className="confirm">
              <span>Trimiți notificarea? Apare imediat în aplicație. Nu se poate anula.</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                  Nu încă
                </button>
                <button type="button" className="btn btn-primary" onClick={send}>
                  <Send size={17} /> Da, trimite
                </button>
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!complete}
                onClick={() => setConfirming(true)}
              >
                <Send size={17} /> Trimite notificarea
              </button>
              {!complete ? (
                <span className="hint">Completează titlul și textul în ambele limbi.</span>
              ) : null}
              {justSent ? (
                <span className="saved">
                  <Check size={17} /> Trimisă — apare acum în aplicație
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="stack" style={{ position: 'sticky', top: 24 }}>
          <div className="chips" style={{ justifyContent: 'center' }}>
            {(['ro', 'ru'] as Lang[]).map((lang) => (
              <button
                key={lang}
                type="button"
                className="chip"
                aria-pressed={previewLang === lang}
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
        Trimise
      </h2>
      <div className="card">
        {history.length === 0 ? (
          <p className="empty">Nicio notificare trimisă încă.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Când</th>
                  <th>Mesaj</th>
                  <th>Cui</th>
                  <th>Duce la</th>
                </tr>
              </thead>
              <tbody>
                {history.map((n) => (
                  <tr key={n.id}>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(n.sentAt)}
                    </td>
                    <td>
                      <div className="strong">{n.title.ro}</div>
                      <div className="muted">{n.body.ro}</div>
                    </td>
                    <td>{audienceLabel[n.audience]}</td>
                    <td>{targetLabel(n.target, resorts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
