import { useRef, useState, type Ref } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { useApp } from '../AppState';
import { kumania } from '../images';
import type { Lang } from '../i18n';
import { colors, gradients, radius, shadow, space, TOUCH, type, webInputReset } from '../theme';

const PREFIX = '+373';
const logo = require('../../assets/logo-fabrica-tur.png');

/**
 * Aduce orice formă în care se scrie un număr moldovenesc la cele 8 cifre de după +373.
 *
 * Oamenii scriu des cu zero în față (069 123 456) sau lipesc numărul întreg
 * (+373 69 123 456). Fără această curățare, zero-ul ar rămâne și ultima cifră s-ar pierde.
 */
function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, '');
  if (digits.length >= 11 && digits.startsWith('373')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 8);
}

/** Grupează cifrele 2-3-3, cum se citește un număr moldovenesc cu voce tare. */
function formatPhone(digits: string) {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)].filter(Boolean).join(' ');
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoComplete: 'given-name' | 'family-name' | 'tel';
  /** Mesajul de sub câmp; apare doar după o încercare de trimitere, nu în timp ce omul scrie. */
  error?: string;
  inputRef?: Ref<TextInput>;
  /** Ce se întâmplă la tasta Următorul / Gata de pe tastatură. */
  onSubmit: () => void;
  last?: boolean;
  children?: React.ReactNode;
};

/** Câmp cu eticheta deasupra — nu doar placeholder, care dispare exact când ai nevoie de el. */
function Field({
  id,
  label,
  value,
  onChangeText,
  placeholder,
  autoComplete,
  error,
  inputRef,
  onSubmit,
  last,
  children,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const isPhone = autoComplete === 'tel';

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        {children}
        <TextInput
          id={id}
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoComplete={autoComplete}
          autoCapitalize={isPhone ? 'none' : 'words'}
          keyboardType={isPhone ? 'phone-pad' : 'default'}
          returnKeyType={last ? 'done' : 'next'}
          onSubmitEditing={onSubmit}
          blurOnSubmit={last}
          style={[styles.input, webInputReset]}
        />
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="clock" size={16} color={colors.magentaText} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Comutatorul de limbă, pus chiar pe primul ecran: un vorbitor de rusă nu trebuie să ghicească. */
function LangSwitch() {
  const { lang, setLang } = useApp();
  const options: { value: Lang; label: string }[] = [
    { value: 'ro', label: 'RO' },
    { value: 'ru', label: 'RU' },
  ];

  return (
    <View style={styles.lang}>
      {options.map((option) => {
        const active = option.value === lang;
        return (
          <Pressable
            key={option.value}
            onPress={() => setLang(option.value)}
            style={[styles.langOption, active && styles.langOptionActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.value === 'ro' ? 'Română' : 'Русский'}
          >
            <Text style={[styles.langText, active && styles.langTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SignIn() {
  const { t, go, setAccount } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  /** Devine adevărat după prima apăsare pe Continuă; abia atunci arătăm ce lipsește. */
  const [tried, setTried] = useState(false);
  const insets = useSafeAreaInsets();

  const lastRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const digits = normalizePhone(phone);
  const missing = {
    first: firstName.trim().length < 2,
    last: lastName.trim().length < 2,
    phone: digits.length !== 8,
  };
  const ready = !missing.first && !missing.last && !missing.phone;

  const submit = () => {
    if (!ready) {
      setTried(true);
      return;
    }
    setAccount({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: `${PREFIX} ${formatPhone(digits)}`,
    });
    go('home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/*
        `flexGrow: 1` face conținutul exact cât ecranul: în repaus nu se derulează nimic.
        Derularea devine posibilă doar când tastatura îl împinge în sus.
      */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Prima impresie e locul, nu formularul. */}
        <View style={styles.hero}>
          <Image
            source={kumania[0]}
            style={styles.heroImage}
            resizeMode="cover"
            accessibilityLabel="Bazinul termal interior de la Hotel Kumánia"
          />
          <LinearGradient
            colors={['rgba(9,20,52,0.45)', 'rgba(9,20,52,0)', 'rgba(9,20,52,0.85)']}
            locations={[0, 0.35, 1]}
            style={styles.heroScrim}
          />

          <View style={[styles.topBar, { top: insets.top + space.lg }]}>
            <View style={styles.logoPill}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <LangSwitch />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.title}>{t.signInTitle}</Text>
            <Text style={styles.tagline}>{t.signInTagline}</Text>
          </View>
        </View>

        {/*
          Cardul are înălțimea conținutului și stă ancorat jos; fotografia umple ce rămâne.
          Pe un telefon mic se strânge poza, nu formularul.
        */}
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom + space.lg, 40) }]}>
          <View style={styles.fields}>
            <Field
              id="firstName"
              label={t.signInFirstName}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t.signInFirstNameEx}
              autoComplete="given-name"
              error={tried && missing.first ? t.signInNeedFirst : undefined}
              onSubmit={() => lastRef.current?.focus()}
            />
            <Field
              id="lastName"
              label={t.signInLastName}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t.signInLastNameEx}
              autoComplete="family-name"
              error={tried && missing.last ? t.signInNeedLast : undefined}
              inputRef={lastRef}
              onSubmit={() => phoneRef.current?.focus()}
            />
            <Field
              id="phone"
              label={t.signInPhone}
              value={formatPhone(digits)}
              onChangeText={setPhone}
              placeholder="69 123 456"
              autoComplete="tel"
              error={tried && missing.phone ? t.signInNeedPhone : undefined}
              inputRef={phoneRef}
              onSubmit={submit}
              last
            >
              <Text style={styles.prefix}>{PREFIX}</Text>
              <View style={styles.prefixDivider} />
            </Field>
          </View>

          {/* Butonul arată mereu activ: un buton gri care nu reacționează pare stricat. */}
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel={t.signInContinue}
            style={styles.buttonWrap}
          >
            <LinearGradient
              colors={gradients.water}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{t.signInContinue}</Text>
              <Icon name="arrow-right" size={22} color={colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Sub această înălțime, logo-ul și titlul de pe fotografie ar începe să se suprapună. */
const HERO_MIN = 260;
const OVERLAP = 28;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  scroll: { flexGrow: 1 },

  hero: {
    flex: 1,
    minHeight: HERO_MIN,
    backgroundColor: '#0C1636',
    justifyContent: 'flex-end',
  },
  heroImage: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },

  topBar: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Fără fundal și fără umbră: logo-ul are text alb pe elipse colorate, deci stă singur
  // pe voalul întunecat al fotografiei. O umbră ar fi desenată pe web ca un dreptunghi
  // în jurul containerului, nu pe conturul elipselor.
  logoPill: {},
  logo: { width: 126, height: 70 },

  lang: {
    flexDirection: 'row',
    backgroundColor: 'rgba(9,20,52,0.55)',
    borderRadius: radius.pill,
    padding: 4,
    gap: 2,
  },
  langOption: {
    minWidth: TOUCH,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
  },
  langOptionActive: { backgroundColor: colors.white },
  langText: { ...type.smallStrong, color: colors.white },
  langTextActive: { color: colors.navy },

  heroText: { paddingHorizontal: space.xl, marginBottom: OVERLAP + space.lg },
  title: {
    ...type.display,
    fontSize: 36,
    lineHeight: 42,
    // Greutate medie, nu bold: peste o fotografie, literele groase arată apăsat și greu.
    fontWeight: '500',
    color: colors.white,
    letterSpacing: -0.4,
    // O umbră fină ține lizibilitatea pe care o dădea grosimea literelor.
    textShadowColor: 'rgba(9,20,52,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  tagline: {
    ...type.body,
    color: colors.onDarkMuted,
    marginTop: space.sm,
    textShadowColor: 'rgba(9,20,52,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl + 4,
    borderTopRightRadius: radius.xxl + 4,
    marginTop: -OVERLAP,
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
  },

  fields: { gap: space.md },
  label: {
    ...type.micro,
    color: colors.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.surface,
    paddingHorizontal: space.lg,
    minHeight: 60,
  },
  fieldFocused: { borderColor: colors.navy, backgroundColor: colors.white },
  fieldError: { borderColor: colors.magentaText, backgroundColor: colors.white },
  prefix: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  prefixDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.dash,
    marginHorizontal: space.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    paddingVertical: space.md,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm },
  errorText: { ...type.smallStrong, color: colors.magentaText },

  buttonWrap: { marginTop: space.xxl, borderRadius: radius.pill, ...shadow.card },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    minHeight: 60,
    borderRadius: radius.pill,
  },
  buttonText: { ...type.bodyStrong, fontSize: 18, color: colors.white },
});
