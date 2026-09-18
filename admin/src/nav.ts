import type { AllData } from './live';
import type { Audience, NotificationTarget } from './types';

export type Section = 'azi' | 'cereri' | 'notificari' | 'oferte' | 'plecari' | 'setari';

/** Notificarea pregătită din alt ecran — de exemplu „Anunță clienții" de lângă o plecare. */
export type Compose = { audience: Audience; target: NotificationTarget };

/** Ce primește fiecare secțiune: aceleași date pentru toate, ca cifrele să nu se contrazică. */
export type SectionProps = {
  data: AllData;
  ready: boolean;
  refresh: () => Promise<void>;
  go: (section: Section, compose?: Compose) => void;
};
