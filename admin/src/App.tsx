import { useEffect, useState, type ComponentType } from 'react';
import {
  Bell,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Tag,
  WifiOff,
  type LucideProps,
} from 'lucide-react';

import { auth } from './api';
import { ALL_TABLES, EMPTY_DATA, loadAll, useLive } from './live';
import { Login } from './Login';
import type { Compose, Section } from './nav';
import { Departures } from './sections/Departures';
import { Notifications } from './sections/Notifications';
import { Offers } from './sections/Offers';
import { Requests } from './sections/Requests';
import { Today } from './sections/Today';
import { ToastProvider } from './ui';

type Access = 'loading' | 'signedOut' | 'notOperator' | 'operator';

const NAV: { id: Section; label: string; icon: ComponentType<LucideProps> }[] = [
  { id: 'azi', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cereri', label: 'Cereri', icon: Inbox },
  { id: 'notificari', label: 'Notificări', icon: Bell },
  { id: 'oferte', label: 'Oferte', icon: Tag },
  { id: 'plecari', label: 'Plecări', icon: CalendarDays },
];

/** Secțiunea stă în adresă (#cereri), ca la reîncărcare operatorul să rămână unde era. */
function sectionFromHash(): Section {
  const hash = window.location.hash.replace('#', '');
  return NAV.some((n) => n.id === hash) ? (hash as Section) : 'azi';
}

function Panel({ email }: { email: string | null }) {
  const [section, setSection] = useState<Section>(sectionFromHash);
  const [compose, setCompose] = useState<Compose | undefined>();
  // O singură încărcare pentru tot panoul, reîmprospătată singură la orice schimbare.
  const { data, ready, error, refresh } = useLive(loadAll, ALL_TABLES, EMPTY_DATA);
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    await refresh();
    setRetrying(false);
  };

  const newRequests = data.requests.filter((r) => r.status === 'new').length;

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Numărul cererilor noi apare și în titlul filei — se vede și când panoul e în fundal.
  useEffect(() => {
    document.title = newRequests > 0 ? `(${newRequests}) Fabrica Tur — panou` : 'Fabrica Tur — panou';
  }, [newRequests]);

  const go = (id: Section, preset?: Compose) => {
    setCompose(preset);
    // O intrare nouă în istoric: butonul Înapoi al browserului duce la secțiunea de dinainte.
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
    setSection(id);
    window.scrollTo({ top: 0 });
  };

  const props = { data, ready, refresh, go };

  return (
    <div className="shell">
      {/* Pe telefon: logo sus, meniul jos, la îndemâna degetului. */}
      <header className="topbar">
        <img src="./logo.png" alt="Fabrica Tur" />
        <button
          type="button"
          className="btn btn-icon btn-quiet"
          onClick={() => auth.signOut()}
          aria-label="Ieși din cont"
          title="Ieși din cont"
        >
          <LogOut size={19} />
        </button>
      </header>

      <aside className="sidebar">
        <div className="brand">
          <img src="./logo.png" alt="Fabrica Tur" />
          <span className="brand-role">Panou</span>
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
              <span className="nav-icon">
                <Icon size={20} />
                {/* Cererile noi sunt treaba de făcut: numărul lor e mereu vizibil. */}
                {id === 'cereri' && newRequests > 0 ? (
                  <span className="count" aria-label={`${newRequests} noi`}>
                    {newRequests}
                  </span>
                ) : null}
              </span>
              <span className="nav-label">{label}</span>
              {id === 'cereri' && newRequests > 0 ? (
                <span className="count-end" aria-hidden>
                  {newRequests}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="avatar" aria-hidden>
            {(email ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="sidebar-email" title={email ?? ''}>
            {email}
          </span>
          <button
            type="button"
            className="btn btn-icon btn-quiet"
            onClick={() => auth.signOut()}
            aria-label="Ieși din cont"
            title="Ieși din cont"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        {/* Fără server: datele deja încărcate rămân, dar operatorul știe că pot fi vechi. */}
        {error ? (
          <div className={ready ? 'offline-bar' : 'offline-bar offline-full'} role="alert">
            <WifiOff size={20} />
            <div className="offline-text">
              <strong>Nu mă pot conecta la server.</strong>
              <span>
                {ready
                  ? 'Datele de pe ecran pot fi vechi și modificările nu se salvează. Reîncerc singur.'
                  : 'Verifică internetul. Reîncerc singur la fiecare 15 secunde.'}
              </span>
            </div>
            <button type="button" className="btn btn-sm btn-secondary" onClick={retry} disabled={retrying}>
              <RefreshCw size={16} className={retrying ? 'spin' : undefined} />
              {retrying ? 'Se conectează…' : 'Încearcă acum'}
            </button>
          </div>
        ) : null}

        {!ready && error ? null : (
          <>
            {section === 'azi' && <Today {...props} />}
            {section === 'cereri' && <Requests {...props} />}
            {section === 'notificari' && <Notifications {...props} compose={compose} />}
            {section === 'oferte' && <Offers {...props} />}
            {section === 'plecari' && <Departures {...props} />}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [access, setAccess] = useState<Access>('loading');
  const [email, setEmail] = useState<string | null>(null);

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
            operatorilor. Cere administratorului să te adauge, apoi reîncarcă pagina.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => auth.signOut()}>
            <LogOut size={18} /> Ieși din cont
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Panel email={email} />
    </ToastProvider>
  );
}
