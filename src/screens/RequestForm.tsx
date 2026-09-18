import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '../components/Text';
import { BackButton } from '../components/BackButton';
import { CtaBar, CtaPill } from '../components/CtaPill';
import { useApp, type OfferRequest } from '../AppState';
import { nightsLabel } from '../i18n';
import { agency, profile } from '../data';
import { isServerId, submitRequest } from '../remote';
import { Icon } from '../components/Icon';
import { colors, radius, space, TOUCH, type, webInputReset } from '../theme';

const PARTY_SIZES = ['1', '2', '3+'];

export function RequestForm() {
  const { t, lang, go, back, account, fullName, departure, resort, addRequest } = useApp();
  const [party, setParty] = useState('2');
  // Precompletat din cont: aceleași date nu se cer de două ori.
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState(account.phone || profile.phone);
  // Câmpul activ primește chenar bleumarin — indicatorul nostru de focus, în locul celui de browser.
  const [focused, setFocused] = useState<'name' | 'phone' | null>(null);
  /** Arătăm ce lipsește abia după o încercare de trimitere, nu în timp ce omul scrie. */
  const [tried, setTried] = useState(false);
  /** Cât timp cererea pleacă spre server, butonul nu mai primește apăsări — nu trimitem de două ori. */
  const [sending, setSending] = useState(false);

  const nameMissing = name.trim().length < 2;
  const phoneMissing = phone.replace(/\D/g, '').length < 8;
  // Cu numărul agenției completat, cererea pleacă pe WhatsApp; altfel rămâne doar pe telefon.
  const viaWhatsApp = agency.whatsapp.length > 0;

  const submit = async () => {
    if (nameMissing || phoneMissing) {
      setTried(true);
      return;
    }
    if (sending) return;
    setSending(true);

    // Cererea pleacă în baza de date și apare pe loc în panoul operatorului. Numărul primit
    // înapoi e cheia cu care aplicația află mai târziu ce a făcut agenția cu ea.
    const serverId = await submitRequest({
      name: name.trim(),
      phone: phone.trim(),
      resortId: resort.id,
      // Plecările de rezervă din data.ts nu există pe server; atunci cererea pleacă fără dată.
      departureId: isServerId(departure?.id) ? departure!.id : null,
      party,
      lang,
    });
    const received = serverId !== null;

    const request: OfferRequest = {
      id: String(Date.now()),
      resortName: resort.name,
      dates: departure?.dates ?? null,
      party,
      createdAt: Date.now(),
      // Starea spune cinstit ce s-a întâmplat: ajunsă la agenție, sau doar salvată pe telefon.
      channel: received ? 'sent' : viaWhatsApp ? 'whatsapp' : 'saved',
      serverId: serverId || undefined,
      status: received ? 'new' : undefined,
    };
    addRequest(request);

    if (viaWhatsApp) {
      const text = t.waMessage
        .replace('{resort}', resort.name)
        .replace('{dates}', departure?.dates ?? t.waNoDate)
        .replace('{party}', party)
        .replace('{name}', name.trim())
        .replace('{phone}', phone.trim());
      Linking.openURL(`https://wa.me/${agency.whatsapp}?text=${encodeURIComponent(text)}`).catch(
        () => {},
      );
    }

    setSending(false);
    // Istoricul se golește: Înapoi din Rezervări nu trebuie să ducă la formularul deja trimis.
    go('bookings', { reset: true });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>{t.formTitle}</Text>
        </View>

        <View style={styles.fields}>
          {departure && (
            <View style={styles.chosen}>
              <View style={styles.chosenIcon}>
                <Icon name="calendar" size={22} color={colors.white} />
              </View>
              <View style={styles.chosenBody}>
                <Text style={styles.chosenLabel}>{t.departuresChosen}</Text>
                <Text style={styles.chosenDate}>{departure.dates}</Text>
                <Text style={styles.chosenMeta}>
                  {`${resort.name} · ${nightsLabel(departure.nights, lang)}`}
                </Text>
              </View>
              {/* Înapoi la lista de unde a fost aleasă data — pe Acasă sau pe pagina stațiunii. */}
              <Pressable onPress={back} style={styles.chosenChange} accessibilityRole="button">
                <Text style={styles.chosenChangeText}>{t.departuresChange}</Text>
              </Pressable>
            </View>
          )}

          <View>
            <Text style={styles.label}>{t.formWho}</Text>
            <View style={styles.partyRow}>
              {PARTY_SIZES.map((size) => {
                const active = size === party;
                return (
                  <Pressable
                    key={size}
                    onPress={() => setParty(size)}
                    style={[styles.party, active && styles.partyActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${size} ${t.persons}`}
                  >
                    <Text style={[styles.partyText, active && styles.partyTextActive]}>{size}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.label}>{t.formName}</Text>
            <TextInput
              id="name"
              value={name}
              onChangeText={setName}
              placeholder={t.formNameEx}
              placeholderTextColor={colors.muted}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              style={[
                styles.input,
                focused === 'name' && styles.inputFocused,
                tried && nameMissing && styles.inputError,
                webInputReset,
              ]}
              autoComplete="name"
              autoCapitalize="words"
            />
            {tried && nameMissing ? <Text style={styles.error}>{t.formNeedName}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>{t.formPhone}</Text>
            <TextInput
              id="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              style={[
                styles.input,
                styles.inputStrong,
                focused === 'phone' && styles.inputFocused,
                tried && phoneMissing && styles.inputError,
                webInputReset,
              ]}
              autoComplete="tel"
            />
            {tried && phoneMissing ? <Text style={styles.error}>{t.signInNeedPhone}</Text> : null}
          </View>

          <View style={styles.reassure}>
            <Icon name="check" size={20} color={colors.navy} />
            <Text style={styles.fine}>{t.formFine}</Text>
          </View>
        </View>
      </ScrollView>

      {/*
        Butonul stă în ecran, nu în bara comună de jos: are nevoie de ce s-a completat
        în formular. Din bara comună nu vedea nimic, așa că cererea nu se salva nicăieri.
      */}
      <CtaBar>
        <CtaPill
          icon={viaWhatsApp ? 'whatsapp' : 'send'}
          label={viaWhatsApp ? t.formSendWa : t.formSend}
          onPress={submit}
        />
      </CtaBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },

  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { ...type.title, color: colors.ink, flex: 1 },

  fields: { gap: space.xxl, marginTop: space.xxl },

  chosen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.chipBlue,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  chosenIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chosenBody: { flex: 1, minWidth: 0 },
  chosenLabel: {
    ...type.micro,
    color: colors.navy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chosenDate: { ...type.bodyStrong, color: colors.ink, marginTop: 2 },
  chosenMeta: { ...type.small, color: colors.muted },
  chosenChange: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: space.sm },
  chosenChangeText: { ...type.smallStrong, color: colors.link },
  label: {
    ...type.micro,
    fontWeight: '500',
    color: colors.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: space.md,
  },

  partyRow: { flexDirection: 'row', gap: space.md },
  party: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
  },
  partyActive: { backgroundColor: colors.navy },
  partyText: { ...type.title, color: colors.body },
  partyTextActive: { color: colors.white },

  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    // Grosimea rămâne 2 și la focus; se schimbă doar culoarea, ca textul să nu sară cu un pixel.
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    minHeight: 60,
    fontSize: 17,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.navy },
  inputError: { borderColor: colors.magentaText },
  inputStrong: { fontWeight: '600' },
  error: { ...type.smallStrong, color: colors.magentaText, marginTop: space.sm },

  reassure: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  fine: { ...type.small, color: colors.muted, flex: 1 },
});
