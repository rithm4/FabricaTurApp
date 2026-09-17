import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  useFonts,
} from '@expo-google-fonts/inter-tight';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './src/components/Text';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/AppState';
import { CtaBar, CtaPill } from './src/components/CtaPill';
import { Screen } from './src/components/Screen';
import { TabBar } from './src/components/TabBar';
import { Bookings } from './src/screens/Bookings';
import { Home } from './src/screens/Home';
import { Notifications } from './src/screens/Notifications';
import { Profile } from './src/screens/Profile';
import { Promo } from './src/screens/Promo';
import { RequestForm } from './src/screens/RequestForm';
import { ResortDetail } from './src/screens/ResortDetail';
import { Resorts } from './src/screens/Resorts';
import { SignIn } from './src/screens/SignIn';
import { colors, radius, space, type } from './src/theme';

/** Bara de jos diferă în funcție de ecran: navigație, buton principal sau nimic. */
function Footer() {
  const { screen, t, go } = useApp();

  if (screen === 'resort') {
    return (
      <CtaBar>
        <CtaPill icon="plus" kicker={`${t.fromPrice} 542 €`} label={t.askOffer} onPress={() => go('form')} />
      </CtaBar>
    );
  }

  if (screen === 'promo') {
    return (
      <CtaBar>
        <CtaPill icon="plus" kicker={`542 € · 7 ${t.days}`} label={t.askOffer} onPress={() => go('form')} />
      </CtaBar>
    );
  }

  if (screen === 'form') {
    return (
      <CtaBar>
        <CtaPill icon="send" label={t.formSend} onPress={() => go('bookings')} />
        <Pressable onPress={() => go('bookings')} style={styles.whatsapp} accessibilityRole="button">
          <Text style={styles.whatsappText}>{t.formWa}</Text>
        </Pressable>
      </CtaBar>
    );
  }

  return <TabBar />;
}

function Router() {
  const { screen } = useApp();

  // Înregistrarea are fundalul ei și nicio bară de navigație.
  if (screen === 'signin') {
    return (
      <>
        <StatusBar style="dark" />
        <Screen key={screen}>
          <SignIn />
        </Screen>
      </>
    );
  }

  // Ecranele cu fotografie pe toată lățimea încep sub bara de sistem, nu sub ea.
  const fullBleed = screen === 'resort' || screen === 'promo';

  return (
    <SafeAreaView style={styles.app} edges={fullBleed ? [] : ['top']}>
      <StatusBar style={fullBleed ? 'light' : 'dark'} />
      <View style={styles.content}>
        <Screen key={screen}>
          {screen === 'home' && <Home />}
          {screen === 'list' && <Resorts />}
          {screen === 'resort' && <ResortDetail />}
          {screen === 'notif' && <Notifications />}
          {screen === 'promo' && <Promo />}
          {screen === 'form' && <RequestForm />}
          {screen === 'bookings' && <Bookings />}
          {screen === 'profile' && <Profile />}
        </Screen>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });

  // Fără acest gard, primul cadru s-ar reda cu fontul de sistem și ar sări la Inter Tight.
  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Router />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.canvas },
  loading: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  whatsapp: {
    minHeight: 56,
    marginTop: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappText: { ...type.bodyStrong, color: colors.whatsappInk },
});
