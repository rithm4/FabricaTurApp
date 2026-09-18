import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BackHandler } from 'react-native';

import { type Departure, type NotificationItem, type Resort, type ResortId } from './data';
import {
  EMPTY_REMOTE,
  buildDepartures,
  buildNotifications,
  buildResorts,
  fetchRemote,
  onRemoteChange,
  type Remote,
} from './remote';
import { strings, type Lang, type Strings } from './i18n';

export type ScreenName =
  | 'signin'
  | 'home'
  | 'list'
  | 'resort'
  | 'notif'
  | 'promo'
  | 'form'
  | 'bookings'
  | 'profile'
  | 'notifSettings';

/** Datele introduse la înregistrare. Aplicația nu cere nimic în plus. */
export type Account = {
  firstName: string;
  lastName: string;
  phone: string;
};

/** O cerere de ofertă trimisă din aplicație. */
export type OfferRequest = {
  id: string;
  resortName: string;
  /** Intervalul plecării alese; lipsește dacă omul n-a ales o dată anume. */
  dates: string | null;
  party: string;
  createdAt: number;
  /** Pe unde a plecat: la agenție prin server, pe WhatsApp, sau doar salvată pe telefon. */
  channel: 'sent' | 'whatsapp' | 'saved';
};

type Persisted = {
  account: Account;
  lang: Lang;
  notifOn: boolean[];
  requests: OfferRequest[];
};

/** Rădăcinile tab-urilor: a ajunge la una înseamnă a începe un drum nou, deci golește istoricul. */
const TAB_ROOTS: ScreenName[] = ['home', 'list', 'notif', 'profile'];

type GoOptions = {
  /**
   * Golește istoricul. Pentru momentele după care drumul înapoi n-ar mai avea sens —
   * de exemplu după trimiterea cererii, ca Înapoi să nu te ducă la formularul deja trimis.
   */
  reset?: boolean;
};

type AppState = {
  screen: ScreenName;
  go: (screen: ScreenName, options?: GoOptions) => void;
  /** Ecranul anterior din istoric; dacă istoricul e gol, Acasă. */
  back: () => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Strings;
  notifOn: boolean[];
  toggleNotif: (index: number) => void;
  account: Account;
  setAccount: (account: Account) => void;
  /** Plecarea aleasă din listă; formularul o preia ca să nu o mai ceară o dată. */
  departure: Departure | null;
  setDeparture: (departure: Departure | null) => void;
  /** Deschide pagina unei stațiuni anume. */
  openResort: (id: ResortId) => void;
  /** Alege stațiunea fără să navigheze — pentru plecările alese de pe Acasă. */
  selectResort: (id: ResortId) => void;
  /** Hotelurile, cu prețurile de pe server când sunt disponibile. */
  resorts: Resort[];
  /** Plecările unui hotel, de pe server când sunt disponibile. */
  departuresFor: (resortId: ResortId) => Departure[];
  /** Noutățile trimise din panoul operatorului. */
  notifications: NotificationItem[];
  /** Cererile trimise, cea mai nouă prima. */
  requests: OfferRequest[];
  addRequest: (request: OfferRequest) => void;
  /** Stațiunea afișată acum pe pagina de detaliu. */
  resort: Resort;
  /** Numele complet, așa cum îl arătăm în salut și în profil. */
  fullName: string;
  /** Șterge contul salvat și readuce aplicația la înregistrare. */
  signOut: () => void;
};

const AppContext = createContext<AppState | null>(null);

const EMPTY: Account = { firstName: '', lastName: '', phone: '' };
const STORAGE_KEY = 'fabricatur.account.v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenName>('signin');
  const [lang, setLang] = useState<Lang>('ro');
  const [notifOn, setNotifOn] = useState([true, true, true, false]);
  const [account, setAccount] = useState<Account>(EMPTY);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [resortId, setResortId] = useState<ResortId>('kumania');
  const [requests, setRequests] = useState<OfferRequest[]>([]);
  /** Ce a venit de pe server. Până răspunde, și dacă nu răspunde, ecranele folosesc data.ts. */
  const [remote, setRemote] = useState<Remote>(EMPTY_REMOTE);

  // Datele de pe server se reîncarcă la orice schimbare din panou: o notificare trimisă
  // apare în „Noutăți" fără ca omul să facă ceva.
  useEffect(() => {
    let alive = true;
    const load = () => fetchRemote().then((data) => alive && setRemote(data));
    load();
    const stop = onRemoteChange(load);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  /** Ecranele prin care a trecut omul, ca Înapoi să ducă de unde a venit, nu într-un loc fix. */
  const [history, setHistory] = useState<ScreenName[]>([]);

  const go = (next: ScreenName, options?: GoOptions) => {
    if (next === screen) return;
    if (options?.reset || next === 'signin' || TAB_ROOTS.includes(next)) setHistory([]);
    else setHistory([...history, screen]);
    setScreen(next);
  };

  const back = () => {
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setScreen(previous ?? 'home');
  };

  // Butonul fizic Înapoi de pe Android urmează același istoric. Fără asta, închidea
  // aplicația de pe orice ecran. Pe Acasă și pe înregistrare îl lăsăm să închidă, ca de obicei.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length > 0) {
        back();
        return true;
      }
      if (screen !== 'home' && screen !== 'signin') {
        go('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  });
  /** Cât timp citim din memorie nu afișăm nimic, ca să nu clipească ecranul de înregistrare. */
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let alive = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const saved = JSON.parse(raw) as Partial<Persisted>;
        if (saved.lang) setLang(saved.lang);
        if (saved.notifOn) setNotifOn(saved.notifOn);
        if (saved.requests) setRequests(saved.requests);
        if (saved.account?.phone) {
          setAccount(saved.account);
          setScreen('home');
        }
      })
      // Memoria poate fi blocată sau plină; atunci pornim pur și simplu de la înregistrare.
      .catch(() => {})
      .finally(() => {
        if (alive) setRestored(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Salvăm la fiecare schimbare, dar abia după ce am terminat de citit,
  // altfel prima scriere ar suprascrie ce tocmai încercam să restaurăm.
  useEffect(() => {
    if (!restored) return;
    const payload: Persisted = { account, lang, notifOn, requests };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [restored, account, lang, notifOn, requests]);

  // Hotelurile cu prețurile de pe server, în limba aleasă; data.ts când serverul lipsește.
  const resorts = useMemo(() => buildResorts(remote, lang, strings[lang]), [remote, lang]);

  const value = useMemo<AppState>(
    () => ({
      screen,
      go,
      back,
      lang,
      setLang,
      t: strings[lang],
      notifOn,
      toggleNotif: (index) =>
        setNotifOn((current) => current.map((on, i) => (i === index ? !on : on))),
      account,
      setAccount,
      departure,
      setDeparture,
      openResort: (id) => {
        setResortId(id);
        go('resort');
      },
      selectResort: setResortId,
      requests,
      addRequest: (request) => setRequests((current) => [request, ...current]),
      resort: resorts.find((r) => r.id === resortId) ?? resorts[0],
      resorts,
      departuresFor: (id) => buildDepartures(remote, lang, id),
      notifications: buildNotifications(remote, lang, strings[lang]),
      fullName: [account.firstName, account.lastName].filter(Boolean).join(' '),
      signOut: () => {
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        setAccount(EMPTY);
        // Cererile țin de cont: la ieșire pleacă odată cu el.
        setRequests([]);
        setHistory([]);
        setScreen('signin');
      },
    }),
    // `go` și `back` citesc `history` și `screen`, deci se reconstruiesc odată cu ele.
    [screen, lang, notifOn, account, departure, resortId, history, requests, remote],
  );

  if (!restored) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp trebuie folosit în interiorul <AppProvider>');
  return value;
}
