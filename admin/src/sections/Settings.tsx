import { useState } from 'react';

import { api } from '../api';
import type { SectionProps } from '../nav';
import type { Lang, Settings as SettingsData } from '../types';
import { Loading, PageHeader, useToast } from '../ui';

const LANGS: Lang[] = ['ro', 'ru'];

/** Doar cifrele: „+373 69 123 456" devine „37369123456", cum îl cere WhatsApp. */
const digitsOnly = (value: string) => value.replace(/\D/g, '');

function SettingsForm({ settings, refresh }: { settings: SettingsData; refresh: () => Promise<void> }) {
  const toast = useToast();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  // Ca la Oferte: datele noi de pe server intră doar dacă operatorul nu lucrează la formular.
  const serverKey = JSON.stringify(settings);
  const [base, setBase] = useState(serverKey);
  if (serverKey !== base) {
    setBase(serverKey);
    if (JSON.stringify(draft) === base) setDraft(settings);
  }

  const changed = JSON.stringify(draft) !== serverKey;
  const phone = digitsOnly(draft.whatsapp);
  // Un număr moldovenesc complet: 373 + 8 cifre. Alte țări au lungimi apropiate.
  const phoneValid = phone === '' || (phone.length >= 10 && phone.length <= 15);

  const save = async () => {
    setSaving(true);
    try {
      await api.settings.update({ ...draft, whatsapp: phone });
      await refresh();
      toast('Setări salvate — apar acum în aplicație');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card card-pad stack" style={{ maxWidth: 760 }}>
      <div className="field">
        <label htmlFor="whatsapp">Numărul de WhatsApp al agenției</label>
        <input
          id="whatsapp"
          className="input"
          inputMode="tel"
          placeholder="+373 69 123 456"
          value={draft.whatsapp}
          onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
          aria-invalid={!phoneValid}
          style={{ maxWidth: 320 }}
        />
        <p className={phoneValid ? 'field-note' : 'field-note over'}>
          {!phoneValid
            ? 'Scrie numărul întreg, cu prefixul țării: +373 și 8 cifre.'
            : phone
              ? 'Cererile ajung în panou și, în plus, clientul le poate trimite pe acest WhatsApp.'
              : 'Gol: cererile ajung doar aici, în panou. Clientul nu vede un buton de WhatsApp.'}
        </p>
      </div>

      <div className="field">
        <span className="label">Sloganul de pe ecranul de înregistrare</span>
        <div className="pair">
          {LANGS.map((lang) => (
            <div key={lang} className="pair-col">
              <label htmlFor={`tagline-${lang}`} className="pair-lang">
                {lang.toUpperCase()}
              </label>
              <input
                id={`tagline-${lang}`}
                className="input"
                value={draft.tagline[lang]}
                onChange={(e) =>
                  setDraft({ ...draft, tagline: { ...draft.tagline, [lang]: e.target.value } })
                }
              />
            </div>
          ))}
        </div>
        <p className="field-note">Prima frază pe care o vede un client nou. Gol = textul din aplicație.</p>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!changed || !phoneValid || saving}
          onClick={save}
        >
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
        {changed ? (
          <button type="button" className="btn btn-ghost" onClick={() => setDraft(settings)}>
            Renunță
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Settings({ data, ready, refresh }: SectionProps) {
  if (!ready) return <Loading />;
  return (
    <>
      <PageHeader title="Setări" text="Datele agenției folosite în aplicație." />
      <SettingsForm settings={data.settings} refresh={refresh} />
    </>
  );
}
