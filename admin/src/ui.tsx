import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, Check, Trash2, X } from 'lucide-react';

// ── Mesajul scurt de jos: „Salvat", „Notificare ștearsă" ───────────────────

type Toast = { id: number; text: string; kind: 'ok' | 'error' };

const ToastContext = createContext<(text: string, kind?: Toast['kind']) => void>(() => {});

/** Confirmarea oricărei acțiuni apare în același loc, cu același aspect. */
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);

  const show = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = ++next.current;
    setToasts((list) => [...list.slice(-2), { id, text, kind }]);
    // Erorile rămân mai mult: trebuie citite, nu doar observate.
    setTimeout(
      () => setToasts((list) => list.filter((t) => t.id !== id)),
      kind === 'error' ? 8000 : 2600,
    );
  }, []);

  // Orice eroare de la server ajunge aici, nu se pierde în consolă.
  useEffect(() => {
    const onError = (e: PromiseRejectionEvent) => {
      show(`Nu s-a putut salva: ${(e.reason as Error)?.message ?? 'eroare necunoscută'}`, 'error');
    };
    window.addEventListener('unhandledrejection', onError);
    return () => window.removeEventListener('unhandledrejection', onError);
  }, [show]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.kind === 'ok' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{t.text}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Închide"
              onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Antetul paginii ─────────────────────────────────────────────────────────

export function PageHeader({
  title,
  text,
  actions,
}: {
  title: string;
  text?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

// ── Ștergere în doi pași ────────────────────────────────────────────────────

/**
 * Primul clic cere confirmarea chiar pe loc, fără fereastră de sistem; al doilea șterge.
 * Dacă operatorul se răzgândește, confirmarea dispare singură după câteva secunde.
 */
export function DeleteButton({
  label,
  onConfirm,
  compact,
}: {
  label: string;
  onConfirm: () => void | Promise<void>;
  compact?: boolean;
}) {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!asking) return;
    const timer = setTimeout(() => setAsking(false), 5000);
    return () => clearTimeout(timer);
  }, [asking]);

  if (asking) {
    return (
      <span className="confirm-inline">
        <button type="button" className="btn btn-sm btn-danger-solid" onClick={onConfirm} autoFocus>
          Da, șterge
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking(false)}>
          Nu
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={compact ? 'btn btn-icon btn-quiet' : 'btn btn-sm btn-quiet'}
      onClick={() => setAsking(true)}
      aria-label={label}
      title={label}
    >
      <Trash2 size={17} />
      {compact ? null : 'Șterge'}
    </button>
  );
}

// ── Stări goale și încărcare ────────────────────────────────────────────────

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p className="empty-title">{title}</p>
      {text ? <p className="empty-text">{text}</p> : null}
    </div>
  );
}

export function Loading() {
  return (
    <div className="loading" aria-label="Se încarcă">
      <span />
      <span />
      <span />
    </div>
  );
}
