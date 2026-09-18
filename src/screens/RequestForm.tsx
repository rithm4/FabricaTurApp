import { useState } from 'react';
import {
  Image,
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
import { calendar } from '../components/Departures';
import { useApp, type OfferRequest } from '../AppState';
import { formatPhone, lastSeatsLabel, nightsLabel, personsLabel } from '../i18n';
import { LOW_SEATS, type Departure } from '../data';
import { isServerId, submitRequest } from '../remote';
import { Icon } from '../components/Icon';
import { colors, radius, shadow, space, type, webInputReset } from '../theme';

const PARTY_SIZES = ['1', '2', '3+'];

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** „69123456" → „69 123 456": grupat ca să se verifice ușor dintr-o privire. */
const groupPhone = (digits: string) =>
  [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)].filter(Boolean).join(' ');

/** „591 €" → 591: prețul ca număr, pentru costul estimativ. */
const priceOf = (price: string) => Number(price.replace(/[^\d]/g, '')) || 0;

/**
 * O dată de plecare de ales direct în formular: fila de calendar, nopțile și locurile.
 * Aleasă: chenar bleumarin și bifă — se vede de departe ce e selectat.
 */
function DateOption({
  departure,
  selected,
  onSelect,
}: {
  departure: Departure;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, lang } = useApp();
  const cal = departure.start ? calendar(departure.start, departure.nights, lang) : null;
  const full = departure.seatsLeft <= 0;
  const low = !full && departure.seatsLeft <= LOW_SEATS;

  return (
    <Pressable
      onPress={onSelect}
      disabled={full}
      style={[styles.option, selected && styles.optionOn, full && styles.optionFull]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: full }}
      accessibilityLabel={`${departure.dates}, ${nightsLabel(departure.nights, lang)}`}
    >
      {cal ? (
        <View style={[styles.leaf, full && styles.leafFull]}>
          <View style={[styles.leafBand, full && styles.leafBandFull]}>
            <Text style={styles.leafMonth}>{cal.month}</Text>
          </View>
          <Text style={styles.leafDay}>{cal.day}</Text>
        </View>
      ) : null}
      <Text style={styles.optionNights}>{nightsLabel(departure.nights, lang)}</Text>
      <Text style={[styles.optionSeats, low && styles.optionLow]} numberOfLines={2}>
        {full
          ? t.departuresFull
          : low
            ? lastSeatsLabel(departure.seatsLeft, lang)
            : `${departure.seatsLeft} ${t.departuresSeats}`}
      </Text>
      {selected ? (
        <View style={styles.optionCheck}>
          <Icon name="check" size={13} color={colors.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function RequestForm() {
  const { t, lang, go, account, fullName, departure, resort, addRequest, agency, departuresFor } =
    useApp();
  const dates = departuresFor(resort.id);
  // Data vine aleasă de pe Acasă sau de pe pagina hotelului; se poate schimba chiar aici.
  const [chosen, setChosen] = useState<Departure | null>(departure);
  const [party, setParty] = useState('2');
  // Precompletat din cont: aceleași date nu se cer de două ori.
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState(
    groupPhone(account.phone.replace(/\D/g, '').replace(/^373/, '')),
  );
  // Câmpul activ primește chenar bleumarin — indicatorul nostru de focus, în locul celui de browser.
  const [focused, setFocused] = useState<'name' | 'phone' | null>(null);
  /** Arătăm ce lipsește abia după o încercare de trimitere, nu în timp ce omul scrie. */
  const [tried, setTried] = useState(false);
  /** Cât timp cererea pleacă spre server, butonul nu mai primește apăsări — nu trimitem de două ori. */
  const [sending, setSending] = useState(false);

  const nameMissing = name.trim().length < 2;
  const phoneMissing = phone.replace(/\D/g, '').length < 8;
  // Cu numărul agenției completat, cererea pleacă și pe WhatsApp.
  const viaWhatsApp = agency.whatsapp.length > 0;

  // Costul estimativ: prețul de persoană înmulțit cu câte persoane; la „3+", „de la".
  const perPerson = priceOf(resort.price);
  const persons = party === '3+' ? 3 : Number(party);
  const estimate = perPerson * persons;

  const submit = async () => {
    if (nameMissing || phoneMissing) {
      setTried(true);
      return;
    }
    if (sending) return;
    setSending(true);

    const fullPhone = formatPhone(phone);

    // Cererea pleacă în baza de date și apare pe loc în panoul operatorului. Numărul primit
    // înapoi e cheia cu care aplicația află mai târziu ce a făcut agenția cu ea.
    const serverId = await submitRequest({
      name: name.trim(),
      phone: fullPhone,
      resortId: resort.id,
      departureId: isServerId(chosen?.id) ? chosen!.id : null,
      party,
      lang,
    });
    const received = serverId !== null;

    const request: OfferRequest = {
      id: String(Date.now()),
      resortName: resort.name,
      dates: chosen?.dates ?? null,
      start: chosen?.start,
      nights: chosen?.nights,
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
        .replace('{dates}', chosen?.dates ?? t.waNoDate)
        .replace('{party}', party)
        .replace('{name}', name.trim())
        .replace('{phone}', fullPhone);
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

        {/* Pentru ce hotel e cererea — cu fotografia, ca omul să fie sigur că e cel dorit. */}
        <View style={styles.hotel}>
          <Image source={resort.gallery[0]} style={styles.hotelPhoto} resizeMode="cover" />
          <View style={styles.hotelBody}>
            <Text style={styles.hotelName} numberOfLines={2}>
              {resort.name}
            </Text>
            <Text style={styles.hotelCity}>{resort.city}</Text>
            <Text style={styles.hotelPrice}>
              {`${resort.price} `}
              <Text style={styles.hotelPer}>{t.formPerPerson}</Text>
            </Text>
          </View>
        </View>

        {/* 1 · Data */}
        <View style={styles.section}>
          <Text style={styles.step}>{`1 · ${t.formStepDate}`}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionsBox}
            contentContainerStyle={styles.options}
          >
            {dates.map((d) => (
              <DateOption
                key={d.id}
                departure={d}
                selected={chosen?.id === d.id}
                onSelect={() => setChosen(d)}
              />
            ))}
            {/* Fără o dată anume: consultantul propune una la telefon. */}
            <Pressable
              onPress={() => setChosen(null)}
              style={[styles.option, styles.optionAny, !chosen && styles.optionOn]}
              accessibilityRole="radio"
              accessibilityState={{ checked: !chosen }}
            >
              <View style={styles.anyIcon}>
                <Icon name="calendar" size={22} color={colors.navy} />
              </View>
              <Text style={styles.optionNights}>{t.formNoDate}</Text>
              <Text style={styles.optionSeats} numberOfLines={2}>
                {t.formNoDateHint}
              </Text>
              {!chosen ? (
                <View style={styles.optionCheck}>
                  <Icon name="check" size={13} color={colors.white} />
                </View>
              ) : null}
            </Pressable>
          </ScrollView>
          {chosen ? (
            <View style={styles.chosenLine}>
              <Icon name="calendar" size={16} color={colors.navy} />
              <Text style={styles.chosenText}>{chosen.dates}</Text>
            </View>
          ) : null}
        </View>

        {/* 2 · Câte persoane */}
        <View style={styles.section}>
          <Text style={styles.step}>{`2 · ${t.formWho}`}</Text>
          <View style={styles.partyRow}>
            {PARTY_SIZES.map((size) => {
              const active = size === party;
              return (
                <Pressable
                  key={size}
                  onPress={() => setParty(size)}
                  style={[styles.party, active && styles.partyActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={personsLabel(size, lang)}
                >
                  <Icon name="users" size={18} color={active ? colors.white : colors.navy} />
                  <Text style={[styles.partyText, active && styles.partyTextActive]}>{size}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Costul estimativ: omul știe de la început cam cât va plăti. */}
          {perPerson > 0 ? (
            <View style={styles.estimate}>
              <View style={styles.estimateBody}>
                <Text style={styles.estimateLabel}>{t.formEstimate}</Text>
                <Text style={styles.estimateFor}>{personsLabel(party, lang)}</Text>
              </View>
              <Text style={styles.estimateSum}>
                {party === '3+' ? `${t.formFrom} ` : ''}
                {`${estimate} €`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 3 · Datele de contact */}
        <View style={styles.section}>
          <Text style={styles.step}>{`3 · ${t.formStepContact}`}</Text>

          <Text style={styles.label}>{t.formName}</Text>
          <TextInput
            id="name"
            value={name}
            onChangeText={setName}
            placeholder={t.formNameEx}
            placeholderTextColor={colors.placeholder}
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

          <Text style={[styles.label, styles.labelNext]}>{t.formPhone}</Text>
          <View
            style={[
              styles.phoneBox,
              focused === 'phone' && styles.inputFocused,
              tried && phoneMissing && styles.inputError,
            ]}
          >
            <Text style={styles.prefix}>+373</Text>
            <View style={styles.prefixDivider} />
            <TextInput
              id="phone"
              value={phone}
              onChangeText={(v) => setPhone(groupPhone(v.replace(/\D/g, '').slice(0, 8)))}
              keyboardType="phone-pad"
              placeholder={t.signInPhoneEx}
              placeholderTextColor={colors.placeholder}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              style={[styles.phoneInput, webInputReset]}
              autoComplete="tel"
            />
          </View>
          {tried && phoneMissing ? <Text style={styles.error}>{t.signInNeedPhone}</Text> : null}
        </View>

        <View style={styles.reassure}>
          <Icon name="check" size={18} color={colors.greenInk} />
          <Text style={styles.fine}>{t.formFine}</Text>
        </View>
      </ScrollView>

      {/*
        Butonul stă în ecran, nu în bara comună de jos: are nevoie de ce s-a completat
        în formular. Deasupra lui, pe scurt, ce se trimite.
      */}
      <CtaBar>
        <CtaPill
          icon={viaWhatsApp ? 'whatsapp' : 'send'}
          kicker={[chosen?.dates ?? capitalize(t.waNoDate), personsLabel(party, lang)].join(' · ')}
          label={sending ? '…' : viaWhatsApp ? t.formSendWa : t.formSend}
          onPress={submit}
        />
      </CtaBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },
  muted: { color: colors.muted },

  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { ...type.title, color: colors.ink, flex: 1 },

  hotel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  // Lățimea și înălțimea explicite: pe web, o imagine fără ele iese la mărimea fișierului.
  hotelPhoto: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.chipBlue },
  hotelBody: { flex: 1, minWidth: 0 },
  hotelName: { ...type.bodyStrong, color: colors.ink },
  hotelCity: { ...type.small, color: colors.muted },
  hotelPrice: { ...type.bodyStrong, color: colors.navy, marginTop: 2 },
  hotelPer: { ...type.small, color: colors.muted },

  section: { marginTop: space.xxl },
  step: { ...type.heading, color: colors.ink, marginBottom: space.md },

  // Datele: se derulează în lateral până la marginile ecranului.
  optionsBox: { marginHorizontal: -space.lg },
  options: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: 10 },
  option: {
    width: 108,
    minHeight: 150,
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  optionOn: { borderColor: colors.navy, backgroundColor: colors.chipBlue },
  optionFull: { backgroundColor: colors.surface },
  optionAny: { width: 124 },
  optionNights: {
    ...type.smallStrong,
    color: colors.ink,
    marginTop: space.sm,
    textAlign: 'center',
  },
  optionSeats: { ...type.micro, color: colors.muted, marginTop: 2, textAlign: 'center' },
  optionLow: { color: colors.magentaText, fontWeight: '600' },
  optionCheck: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  anyIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chosenLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  chosenText: { ...type.smallStrong, color: colors.navy },

  // Fila de calendar, ca pe Acasă.
  leaf: {
    width: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    alignItems: 'center',
  },
  leafFull: { backgroundColor: colors.surface },
  leafBand: { alignSelf: 'stretch', backgroundColor: colors.navy, paddingVertical: 3 },
  leafBandFull: { backgroundColor: colors.muted },
  leafMonth: {
    ...type.micro,
    fontSize: 12,
    lineHeight: 15,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  leafDay: { fontSize: 24, lineHeight: 32, fontWeight: '600', color: colors.ink },

  partyRow: { flexDirection: 'row', gap: space.md },
  party: {
    flex: 1,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
  },
  partyActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  partyText: { ...type.title, color: colors.body },
  partyTextActive: { color: colors.white },

  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  estimateBody: { flex: 1 },
  estimateLabel: { ...type.small, color: colors.muted },
  estimateFor: { ...type.smallStrong, color: colors.ink },
  estimateSum: { ...type.title, color: colors.navy },

  label: {
    ...type.micro,
    fontWeight: '500',
    color: colors.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  labelNext: { marginTop: space.lg },
  input: {
    backgroundColor: colors.white,
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
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    paddingLeft: space.lg,
  },
  prefix: { fontSize: 17, fontWeight: '500', color: colors.ink },
  prefixDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 14,
    marginLeft: space.md,
    backgroundColor: colors.line,
  },
  phoneInput: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: space.md,
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  error: { ...type.smallStrong, color: colors.magentaText, marginTop: space.sm },

  reassure: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    marginTop: space.xl,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.greenSurface,
  },
  fine: { ...type.small, color: colors.greenInk, flex: 1 },
});
