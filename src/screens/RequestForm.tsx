import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '../components/Text';
import { useApp } from '../AppState';
import { profile } from '../data';
import { Icon } from '../components/Icon';
import { colors, radius, space, TOUCH, type } from '../theme';

const PARTY_SIZES = ['1', '2', '3+'];

export function RequestForm() {
  const { t, go, account, fullName, departure } = useApp();
  const [party, setParty] = useState('2');
  // Precompletat din cont: aceleași date nu se cer de două ori.
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState(account.phone || profile.phone);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            onPress={() => go('promo')}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Înapoi"
          >
            <Icon name="arrow-left" size={24} color={colors.navy} />
          </Pressable>
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
                <Text style={styles.chosenMeta}>{`${departure.nights} ${t.nights}`}</Text>
              </View>
              <Pressable
                onPress={() => go('resort')}
                style={styles.chosenChange}
                accessibilityRole="button"
              >
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
                    accessibilityLabel={`${size} persoane`}
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
              style={styles.input}
              autoComplete="name"
            />
          </View>

          <View>
            <Text style={styles.label}>{t.formPhone}</Text>
            <TextInput
              id="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={[styles.input, styles.inputStrong]}
              autoComplete="tel"
            />
          </View>

          <View style={styles.reassure}>
            <Icon name="check" size={20} color={colors.navy} />
            <Text style={styles.fine}>{t.formFine}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.section },

  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  back: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    minHeight: 60,
    fontSize: 17,
    color: colors.ink,
  },
  inputStrong: { fontWeight: '700' },

  reassure: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  fine: { ...type.small, color: colors.muted, flex: 1 },
});
