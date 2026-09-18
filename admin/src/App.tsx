import { useEffect, useState, type ComponentType } from 'react';
import { Bell, CalendarDays, Inbox, LogOut, Tag, X, type LucideProps } from 'lucide-react';

import { api, auth } from './api';
import { Login } from './Login';
import { Departures } from './sections/Departures';
import { Notifications } from './sections/Notifications';
import { Offers } from './sections/Offers';
import { Requests } from './sections/Requests';

type Section = 'cereri' | 'notificari' | 'oferte' | 'plecari';
type Access = 'loading' | 'signedOut' | 'notOperator' | 'operator';

const NAV: { id: Section; label: string; icon: ComponentType<LucideProps> }[] = [
  { id: 'cereri', label: 'Cereri', icon: Inbox },
  { id: 'notificari', label: 'Notificări', icon: Bell },
  { id: 'oferte', label: 'Oferte', icon: Tag },
  { id: 'plecari', label: 'Plecări', icon: CalendarDays },
];

/** Secțiunea stă în adresă (#cereri), ca la reîncărcare operatorul să rămână unde era. */
function sectionFromHash(): Section {
  const hash = window.location.hash.replace('#', '');
  return NAV.some((n) => n.id === hash) ? (hash as Section) : 'cereri';
}

export default function App() {
  const [access, setAccess] = useState<Access>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [section, setSection] = useState<Section>(sectionFromHash);
  const [newRequests, setNewRequests] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Cine e logat, și dacă e chiar operator — nu orice cont logat este.
  useEffect(() => {
    const check = async () => {
      const current = await auth.email();
      setEmail(current);
      if (!current) setAccess('signedOut');
      else setAccess((await auth.isOperator()) ? 'operator' : 'notOperator');
    };
    check();
    return auth.onChange(check);
  }, []);

  const countNew = async () => {
    const requests = await api.requests.list();
    setNewRequests(requests.filter((r) => r.status === 'new').length);
  };

  // Cererile noi apar singure: numărul din meniu crește fără reîncărcarea paginii.
  useEffect(() => {
    if (access !== 'operator') return;
    countNew();
    return api.onChange(['requests'], countNew);
  }, [access]);

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Orice eroare de la server ajunge într-o bară vizibilă, nu se pierde în consolă.
  useEffect(() => {
    const onError = (e: PromiseRejectionEvent) => {
      setError((e.reason as Error)?.message ?? 'A apărut o eroare.');
    };
    window.addEventListener('unhandledrejection', onError);
    return () => window.removeEventListener('unhandledrejection', onError);
  }, []);

  const go = (id: Section) => {
    window.location.hash = id;
    setSection(id);
  };

  if (access === 'loading') return null;
  if (access === 'signedOut') return <Login />;

  if (access === 'notOperator') {
    return (
      <div className="login">
        <div className="card card-pad stack login-card">
          <img src="./logo.png" alt="Fabrica Tur" className="login-logo" />
          <h1 style={{ fontSize: 24 }}>Contul nu are acces de operator</h1>
          <p className="muted" style={{ margin: 0 }}>
            Ești logat ca <span className="strong">{email}</span>, dar contul nu e în lista
            operatorilor. Cere administratorului să te adauge.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => auth.signOut()}>
            <LogOut size={18} /> Ieși din cont
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="./logo.png" alt="Fabrica Tur" />
          <span className="brand-role">Operator</span>
        </div>

        <nav className="nav" aria-label="Secțiuni">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="nav-item"
              aria-current={section === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon size={20} />
              {label}
              {/* Cererile noi sunt treaba de făcut: numărul lor e mereu vizibil. */}
              {id === 'cereri' && newRequests > 0 ? (
                <span className="count" aria-label={`${newRequests} noi`}>
                  {newRequests}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="strong" style={{ display: 'block', wordBreak: 'break-all' }}>
            {email}
          </span>
          <button type="button" onClick={() => auth.signOut()}>
            Ieși din cont
          </button>
        </div>
      </aside>

      <main className="main">
        {error ? (
          <div className="error-bar" role="alert">
            <span>Nu s-a putut salva: {error}</span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setError(null)}>
              <X size={18} />
            </button>
          </div>
        ) : null}

        {section === 'cereri' && <Requests onChange={countNew} />}
        {section === 'notificari' && <Notifications />}
        {section === 'oferte' && <Offers />}
        {section === 'plecari' && <Departures />}
      </main>
    </div>
  );
}
