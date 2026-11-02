import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/presentation/store/authStore';
import { useSettingsStore } from '@/presentation/store/settingsStore';
import { useTheme } from '@/presentation/theme';

export default function Index() {
  const theme = useTheme();
  const hydrated = useAuthStore((s) => s.hydrated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const employee = useAuthStore((s) => s.employee);

  if (!hydrated || !settingsHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }
  return <Redirect href={employee ? '/(tabs)' : '/login'} />;
}
