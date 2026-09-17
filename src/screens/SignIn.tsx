import { useState } from 'react';
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
import { useApp } from '../AppState';
import { Icon } from '../components/Icon';
import { colors, gradients, photos, radius, shadow, space, type } from '../theme';

const PREFIX = '+373';

/** Grupează cifrele 2-3-3, cum se citește un număr moldovenesc cu voce tare. */
function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)].filter(Boolean).join(' ');
}

/** Câmp cu eticheta deasupra — nu doar placeholder, care dispare exact când ai nevoie de el. */
function Field({
  id,
  label,
  value,
  onChangeText,
  placeholder,
  autoComplete,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoComplete?: 'given-name' | 'family-name' | 'tel';
  children?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        {children}
        <TextInput
          id={id}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoComplete={autoComplete}
          keyboardType={autoComplete === 'tel' ? 'phone-pad' : 'default'}
          style={styles.input}
        />
      </View>
    </View>
  );
}

export function SignIn() {
  const { t, go, setAccount } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const insets = useSafeAreaInsets();

  const digits = phone.replace(/\D/g, '');
  const ready = firstName.trim().length > 1 && lastName.trim().length > 1 && digits.length === 8;

  const submit = () => {
    if (!ready) return;
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
      {/* Lumina de apă, aceeași ca pe ecranul principal — continuitate de la primul ecran. */}
      <LinearGradient colors={gradients.light} style={styles.light} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + space.xxl,
            paddingBottom: Math.max(insets.bottom, space.xl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: photos.logo }} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>{t.signInTitle}</Text>
        <Text style={styles.text}>{t.signInText}</Text>

        <View style={styles.fields}>
          <Field
            id="firstName"
            label={t.signInFirstName}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t.signInFirstNameEx}
            autoComplete="given-name"
          />
          <Field
            id="lastName"
            label={t.signInLastName}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t.signInLastNameEx}
            autoComplete="family-name"
          />
          <Field
            id="phone"
            label={t.signInPhone}
            value={formatPhone(phone)}
            onChangeText={setPhone}
            placeholder="60 123 456"
            autoComplete="tel"
          >
            <Text style={styles.prefix}>{PREFIX}</Text>
            <View style={styles.prefixDivider} />
          </Field>
        </View>

        <Pressable
          onPress={submit}
          disabled={!ready}
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready }}
          accessibilityLabel={t.signInContinue}
          style={styles.buttonWrap}
        >
          <LinearGradient
            colors={ready ? gradients.water : [colors.chip, colors.chip]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={[styles.buttonText, !ready && styles.buttonTextOff]}>
              {t.signInContinue}
            </Text>
            <Icon name="arrow-right" size={22} color={ready ? colors.white : colors.muted} />
          </LinearGradient>
        </Pressable>

        <View style={styles.why}>
          <Icon name="check" size={20} color={colors.navy} />
          <Text style={styles.whyText}>{t.signInWhy}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  light: { position: 'absolute', left: 0, right: 0, top: 0, height: 300 },
  scroll: { paddingHorizontal: space.xl },

  logo: { height: 42, width: 150, alignSelf: 'flex-start' },

  title: {
    ...type.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: space.xxl,
  },
  text: { ...type.body, color: colors.muted, marginTop: space.md },

  fields: { gap: space.xl, marginTop: space.section },
  label: {
    ...type.micro,
    color: colors.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    minHeight: 66,
    ...shadow.low,
  },
  fieldFocused: { borderColor: colors.navy },
  prefix: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  prefixDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.line,
    marginHorizontal: space.md,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    paddingVertical: space.md,
  },

  buttonWrap: { marginTop: space.section },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    minHeight: 64,
    borderRadius: radius.pill,
  },
  buttonText: { ...type.bodyStrong, fontSize: 18, color: colors.white },
  buttonTextOff: { color: colors.muted },

  why: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', marginTop: space.xl },
  whyText: { ...type.small, color: colors.muted, flex: 1 },
});
