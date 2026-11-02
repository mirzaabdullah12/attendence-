import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Banner, Button, Card, Field, Logo8Star } from '@/presentation/components';
import { useHaptics } from '@/presentation/hooks/useHaptics';
import { useAuthStore } from '@/presentation/store/authStore';
import { useTheme } from '@/presentation/theme';

const DEMO = [
  { code: 'EMP001', pin: '1234', label: 'Ahmed Raza · PK Day · Lahore' },
  { code: 'EMP003', pin: '1234', label: 'Bilal Hussain · PK Night · Islamabad' },
  { code: 'US001', pin: '1234', label: 'John Carter · US 9 to 9 · New York' },
  { code: 'EMP002', pin: '1234', label: 'Sara Khan · Manager · Karachi' },
  { code: 'US002', pin: '1234', label: 'Emily Chen · Manager · Los Angeles' },
];

export default function LoginScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { login, loading, error, clearError } = useAuthStore();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');

  const submit = async (c = code, p = pin) => {
    haptics.tap();
    const ok = await login(c, p);
    if (ok) {
      haptics.success();
      router.replace('/(tabs)');
    } else {
      haptics.error();
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Logo8Star size={64} wordmark={false} />
            <Logo8Star size={28} />
            <AppText variant="h1" center>
              Attendance
            </AppText>
            <AppText variant="small" tone="muted" center>
              GPS verified clock in · Pakistan & United States
            </AppText>
          </View>

          <Card style={styles.form}>
            <Field
              label="Employee code"
              placeholder="EMP001"
              autoCapitalize="characters"
              autoCorrect={false}
              value={code}
              onChangeText={(v) => {
                clearError();
                setCode(v);
              }}
            />
            <Field
              label="PIN"
              placeholder="••••"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              value={pin}
              onChangeText={(v) => {
                clearError();
                setPin(v);
              }}
              onSubmitEditing={() => submit()}
            />
            {error && <Banner message={error} onDismiss={clearError} />}
            <Button title="Sign in" size="lg" loading={loading} onPress={() => submit()} fullWidth />
          </Card>

          <View style={styles.demo}>
            <AppText variant="caption" tone="faint">
              DEMO ACCOUNTS · PIN 1234
            </AppText>
            {DEMO.map((d) => (
              <Pressable
                key={d.code}
                onPress={() => {
                  setCode(d.code);
                  setPin(d.pin);
                  void submit(d.code, d.pin);
                }}
                style={({ pressed }) => [
                  styles.demoRow,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <AppText variant="bodyStrong">{d.code}</AppText>
                <AppText variant="small" tone="muted">
                  {d.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 24 },
  hero: { alignItems: 'center', gap: 10 },
  form: { gap: 14 },
  demo: { gap: 8 },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
