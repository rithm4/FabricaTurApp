import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, FilePlus2, ImagePlus, Newspaper, Pencil, Trash2 } from 'lucide-react';

import { api } from '../api';
import { formatDateTime } from '../format';
import type { SectionProps } from '../nav';
import type { Article, Lang, Localized, Resort } from '../types';
import { DeleteButton, Empty, Loading, PageHeader, useToast } from '../ui';
import { LANGS, PreviewButton, TextPair } from './resortParts';

/** Un text lung în ambele limbi, alături; pe telefon, unul sub altul. */
function BodyPair({ value, onChange }: { value: Localized; onChange: (v: Localized) => void }) {
  return (
    <div className="field">
      <span className="label">Textul articolului</span>
      <div className="pair">
        {LANGS.map((lang: Lang) => (
          <div key={lang} className="pair-col">
            <label htmlFor={`body-${lang}`} className="pair-lang">
              {lang === 'ro' ? 'Română' : 'Русский'} · {value[lang].split(/\s+/).filter(Boolean).length} cuvinte
            </label>
            <textarea
              id={`body-${lang}`}
              className="textarea article-body"
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <p className="field-note">
        Un rând gol începe un paragraf nou. Un rând care începe cu „- ” devine un punct din listă.
      </p>
    </div>
  );
}

/** Editorul unui articol: se deschide în locul rândului din listă. */
function ArticleEditor({
  article,
  resorts,
  refresh,
  onClose,
}: {
  article: Article;
  resorts: Resort[];
  refresh: () => Promise<void>;
  onClose: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState(article);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const editable = (a: Article) =>
    JSON.stringify([a.title, a.summary, a.body, a.resortId, a.cover]);
  const changed = editable(draft) !== editable(article);
  const hasTitle = draft.title.ro.trim().length > 0;
  const missingRu = hasTitle && (!draft.title.ru.trim() || !draft.body.ru.trim());

  const set = <K extends keyof Article>(key: K, value: Article[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.articles.update(article.id, {
        title: draft.title,
        summary: draft.summary,
        body: draft.body,
        resortId: draft.resortId,
        cover: draft.cover,
      });
      await refresh();
      toast(article.published ? 'Articol salvat — apare acum în aplicație' : 'Ciornă salvată');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async () => {
    if (changed) await save();
    await api.articles.update(article.id, { published: !article.published });
    await refresh();
    toast(article.published ? 'Articolul e din nou ciornă — nu se mai vede în aplicație' : 'Articol publicat — apare acum în aplicație');
  };

  const uploadCover = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      set('cover', await api.articles.uploadCover(file));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="card card-pad stack article-editor">
      <div className="offer-head">
        <div>
          <h2>{draft.title.ro.trim() || 'Articol nou'}</h2>
          <p className="muted">
            {article.published ? 'Publicat' : 'Ciornă'} · modificat {formatDateTime(article.updatedAt)}
          </p>
        </div>
        <div className="offer-flags">
          {changed ? <span className="badge badge-new">Nesalvat</span> : null}
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
            Închide
          </button>
        </div>
      </div>

      {/* Coperta: prima impresie, pe Acasă și sus pe pagina articolului. */}
      <div className="field">
        <span className="label">Fotografia de copertă</span>
        <div className="cover-row">
          {draft.cover ? (
            <img src={draft.cover} alt="" className="cover-preview" />
          ) : (
            <div className="cover-preview cover-empty">
              <Newspaper size={26} />
            </div>
          )}
          <div className="stack" style={{ gap: 8 }}>
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => uploadCover(e.target.files)} />
            <button type="button" className="btn btn-sm btn-secondary" disabled={uploading} onClick={() => input.current?.click()}>
              <ImagePlus size={16} /> {uploading ? 'Se încarcă…' : draft.cover ? 'Schimbă fotografia' : 'Adaugă fotografie'}
            </button>
            {draft.cover ? (
              <button type="button" className="btn btn-sm btn-quiet" onClick={() => set('cover', '')}>
                <Trash2 size={16} /> Fără fotografie
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <TextPair
        id={`${article.id}-title`}
        label="Titlul"
        hint="Scurt și clar: spune ce afli din articol."
        value={draft.title}
        onChange={(v) => set('title', v)}
        placeholder={{ ro: 'Ce iei cu tine la băile termale', ru: 'Что взять с собой на термальные купальни' }}
      />
      <TextPair
        id={`${article.id}-summary`}
        label="Rezumatul"
        hint="O frază, sub titlu, în lista de articole."
        value={draft.summary}
        onChange={(v) => set('summary', v)}
        placeholder={{ ro: 'O listă scurtă, ca să nu uiți nimic acasă.', ru: 'Короткий список, чтобы ничего не забыть дома.' }}
      />
      <BodyPair value={draft.body} onChange={(v) => set('body', v)} />

      <div className="field">
        <label htmlFor={`${article.id}-resort`}>Legat de un hotel (opțional)</label>
        <select
          id={`${article.id}-resort`}
          className="select"
          value={draft.resortId ?? ''}
          onChange={(e) => set('resortId', e.target.value || null)}
          style={{ maxWidth: 360 }}
        >
          <option value="">Niciunul</option>
          {resorts.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <p className="field-note">La finalul articolului apare butonul „Vezi hotelul”.</p>
      </div>

      {missingRu ? (
        <p className="field-note over">
          Lipsește traducerea în rusă: cine folosește aplicația în rusă îl va citi în română.
        </p>
      ) : null}

      <div className="form-actions">
        <button type="button" className="btn btn-primary" disabled={!changed || !hasTitle || saving} onClick={save}>
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
        <button
          type="button"
          className={article.published ? 'visibility is-on' : 'visibility'}
          disabled={!hasTitle}
          onClick={togglePublished}
          aria-pressed={article.published}
          title={hasTitle ? undefined : 'Scrie întâi titlul'}
        >
          {article.published ? <Eye size={17} /> : <EyeOff size={17} />}
          {article.published ? 'Publicat — apasă ca să-l retragi' : 'Ciornă — apasă ca să-l publici'}
        </button>
        <span className="form-actions-end">
          <PreviewButton
            screen="article"
            id={article.id}
            name={draft.title.ro || 'Articol nou'}
            hidden={!article.published}
            hiddenNote="Articolul e ciornă: clienții nu îl văd încă. Aici îl vezi doar tu."
            data={article}
            label="Vezi articolul în aplicație"
            dirty={changed}
          />
        </span>
      </div>
    </div>
  );
}

export function Articles({ data, ready, refresh }: SectionProps) {
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  if (!ready) return <Loading />;

  const list = data.articles;

  const create = async () => {
    const id = await api.articles.create(Math.max(0, ...list.map((a) => a.position)) + 1);
    await refresh();
    setOpenId(id);
  };

  const remove = async (article: Article) => {
    await api.articles.remove(article.id);
    await refresh();
    toast('Articol șters');
  };

  const move = async (a: Article, b: Article) => {
    await api.articles.swapPositions(a, b);
    await refresh();
  };

  return (
    <>
      <PageHeader
        title="Articole"
        text="Sfaturi și informații pentru clienți. Primele trei apar pe Acasă, în „Sfaturi utile”; toate, în lista de articole."
        actions={
          <button type="button" className="btn btn-primary" onClick={create}>
            <FilePlus2 size={18} /> Scrie un articol
          </button>
        }
      />

      {list.length === 0 ? (
        <div className="card">
          <Empty icon={<Newspaper size={26} />} title="Niciun articol încă" text="Scrie primul: apare în aplicație după ce îl publici." />
        </div>
      ) : (
        <div className="stack">
          {list.map((article, index) =>
            openId === article.id ? (
              <ArticleEditor
                key={article.id}
                article={article}
                resorts={data.resorts}
                refresh={refresh}
                onClose={() => setOpenId(null)}
              />
            ) : (
              <div key={article.id} className="card article-row">
                {article.cover ? (
                  <img src={article.cover} alt="" className="article-thumb" />
                ) : (
                  <div className="article-thumb cover-empty">
                    <Newspaper size={22} />
                  </div>
                )}
                <div className="list-main">
                  <div className="list-title">{article.title.ro.trim() || 'Fără titlu'}</div>
                  <div className="list-sub">
                    {article.summary.ro || 'Fără rezumat'}
                  </div>
                  <div className="article-meta">
                    <span className={article.published ? 'badge badge-booked' : 'badge badge-cancelled'}>
                      {article.published ? 'Publicat' : 'Ciornă'}
                    </span>
                    {index < 3 && article.published ? <span className="hint">Apare pe Acasă</span> : null}
                  </div>
                </div>
                <div className="list-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-quiet"
                    disabled={index === 0}
                    onClick={() => move(article, list[index - 1])}
                    aria-label="Mai sus în listă"
                    title="Mai sus în listă"
                  >
                    <ArrowUp size={17} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-quiet"
                    disabled={index === list.length - 1}
                    onClick={() => move(article, list[index + 1])}
                    aria-label="Mai jos în listă"
                    title="Mai jos în listă"
                  >
                    <ArrowDown size={17} />
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setOpenId(article.id)}>
                    <Pencil size={15} /> Modifică
                  </button>
                  <DeleteButton label={`Șterge articolul ${article.title.ro}`} onConfirm={() => remove(article)} compact />
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </>
  );
}
