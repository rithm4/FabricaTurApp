import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Cere permisiunea de a trimite notificări. Întoarce `true` dacă o avem.
 *
 * Se cere în două momente, amândouă cu sens pentru om:
 *  - imediat după înregistrare, când tocmai și-a lăsat datele ca să primească oferte;
 *  - când pornește din nou o categorie din „Setări notificări", dacă o refuzase.
 *
 * Browserul nu are notificări push de acest fel, deci pe web nu cerem nimic.
 */
export async function askNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    // Pe Android 13+, canalul trebuie să existe înainte de cerere, altfel dialogul nu apare.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('oferte', {
        name: 'Oferte și promoții',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    // Dacă omul a refuzat definitiv, sistemul nu mai arată dialogul; nu insistăm.
    if (!current.canAskAgain) return false;

    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}
