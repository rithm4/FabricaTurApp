import { useCallback, useEffect, useState } from 'react';

import { api } from './api';

/** Cât așteptăm între încercări când serverul nu răspunde. */
const RETRY_MS = 15_000;

/**
 * Încarcă datele și le reîncarcă singur când se schimbă ceva pe server —
 * o cerere nouă din aplicație, sau o modificare făcută de alt operator.
 * `ready` e fals doar până la prima încărcare reușită.
 *
 * Dacă serverul nu răspunde, datele deja arătate rămân pe ecran, `error` spune de ce,
 * iar încărcarea se reia singură: la fiecare 15 secunde și imediat ce revine internetul.
 */
export function useLive<T>(load: () => Promise<T>, tables: string[], initial: T) {
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await load());
      setReady(true);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message || 'Serverul nu răspunde.');
    }
  }, [load]);

  const key = tables.join(',');
  useEffect(() => {
    refresh();
    const stop = api.onChange(key.split(','), refresh);
    window.addEventListener('online', refresh);
    return () => {
      stop();
      window.removeEventListener('online', refresh);
    };
  }, [key, refresh]);

  useEffect(() => {
    if (!error) return;
    const timer = setInterval(refresh, RETRY_MS);
    return () => clearInterval(timer);
  }, [error, refresh]);

  return { data, ready, error, refresh };
}

/** Toate datele de care au nevoie secțiunile, într-o singură încărcare. */
export async function loadAll() {
  const [resortList, departures, requests, notifications, settings] = await Promise.all([
    api.resorts.list(),
    api.departures.list(),
    api.requests.list(),
    api.notifications.list(),
    api.settings.get(),
  ]);
  // Aceeași ordine ca în aplicație: oferta săptămânii prima.
  const resorts = [...resortList].sort((a, b) => Number(b.featured) - Number(a.featured));
  return { resorts, departures, requests, notifications, settings };
}

export type AllData = Awaited<ReturnType<typeof loadAll>>;

export const EMPTY_DATA: AllData = {
  resorts: [],
  departures: [],
  requests: [],
  notifications: [],
  settings: { whatsapp: '', tagline: { ro: '', ru: '' } },
};

export const ALL_TABLES = ['resorts', 'departures', 'requests', 'notifications', 'settings'];
