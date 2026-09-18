import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';

import { auth } from './api';

/** Traduce erorile de autentificare în ceva ce un operator înțelege. */
function explain(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Email sau parolă greșită.';
  if (/email not confirmed/i.test(message)) return 'Contul nu e confirmat încă.';
  if (/fetch|network/i.test(message)) return 'Nu există conexiune la server. Verifică internetul.';
  return message;
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await auth.signIn(email.trim(), password);
    } catch (err) {
      setError(explain((err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="card card-pad stack login-card" onSubmit={submit}>
        <img src="./logo.png" alt="Fabrica Tur" className="login-logo" />
        <div>
          <h1 style={{ fontSize: 26 }}>Panoul operatorului</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Intră cu contul de operator primit de la administrator.
          </p>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Parolă</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? (
          <p className="hint over" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          <LogIn size={18} /> {busy ? 'Se verifică…' : 'Intră'}
        </button>
      </form>
    </div>
  );
}
