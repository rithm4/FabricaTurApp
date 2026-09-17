import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { content, type Departure, type Resort, type ResortId } from './data';
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
  | 'profile';

/** Datele introduse la înregistrare. Aplicația nu cere nimic în plus. */
export type Account = {
  firstName: string;
  lastName: string;
  phone: string;
};

type Persisted = {
  account: Account;
  lang: Lang;
  notifOn: boolean[];
};

type AppState = {
  screen: ScreenName;
  go: (screen: ScreenName) => void;
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
    const payload: Persisted = { account, lang, notifOn };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [restored, account, lang, notifOn]);

  const value = useMemo<AppState>(
    () => ({
      screen,
      go: setScreen,
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
        setScreen('resort');
      },
      resort:
        content.resorts[lang].find((r) => r.id === resortId) ?? content.resorts[lang][0],
      fullName: [account.firstName, account.lastName].filter(Boolean).join(' '),
      signOut: () => {
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        setAccount(EMPTY);
        setScreen('signin');
      },
    }),
    [screen, lang, notifOn, account, departure, resortId],
  );

  if (!restored) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp trebuie folosit în interiorul <AppProvider>');
  return value;
}
