import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import type { Employee } from '@/domain/entities';
import { formatClockTime, timeZoneAbbreviation } from '@/domain/services/time';
import { AppHeader, AppText, Button, Card, Pill, Row, Screen, Segmented } from '@/presentation/components';
import { useAttendanceStore } from '@/presentation/store/attendanceStore';
import { useAuthStore } from '@/presentation/store/authStore';
import { useScheduleStore } from '@/presentation/store/scheduleStore';
import { useSettingsStore } from '@/presentation/store/settingsStore';
import { useTheme } from '@/presentation/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const employee = useAuthStore((s) => s.employee) as Employee;
  const logout = useAuthStore((s) => s.logout);
  const settings = useSettingsStore();
  const shifts = useScheduleStore((s) => s.shifts);
  const locations = useScheduleStore((s) => s.locations);
  const open = useAttendanceStore((s) => s.open);
  const resetAttendance = useAttendanceStore((s) => s.reset);

  const shift = shifts.find((s) => s.id === employee.defaultShiftId);
  const office = locations.find((l) => l.id === employee.defaultLocationId);
  const initials = employee.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const doLogout = () => {
    if (open) {
      Alert.alert('You are clocked in', 'Clock out before signing out so your hours are recorded.');
      return;
    }
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          resetAttendance();
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppHeader title="Profile" />

      <Card>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <AppText variant="h2" style={{ color: theme.colors.onPrimary }}>
              {initials}
            </AppText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="h2">{employee.name}</AppText>
            <AppText variant="small" tone="muted">
              {employee.title} · {employee.code}
            </AppText>
            <View style={styles.pills}>
              <Pill label={employee.role === 'manager' ? 'Manager' : 'Employee'} tone={employee.role === 'manager' ? 'info' : 'neutral'} />
              <Pill label={employee.region === 'PK' ? 'Pakistan' : 'United States'} />
            </View>
          </View>
        </View>
      </Card>

      <Card padded={false} style={{ paddingHorizontal: 16 }}>
        <Row title="Time zone" subtitle={employee.timeZone} right={<AppText variant="small" tone="muted">{timeZoneAbbreviation(employee.timeZone)}</AppText>} />
        <Row
          title="Default shift"
          subtitle={shift ? `${formatClockTime(shift.startTime)} – ${formatClockTime(shift.endTime)}` : '—'}
          right={<AppText variant="small" tone="muted">{shift?.name ?? ''}</AppText>}
        />
        <Row title="Default office" subtitle={office?.address ?? '—'} right={<AppText variant="small" tone="muted">{office?.name ?? ''}</AppText>} />
        <Row
          title="Work days"
          subtitle={employee.workDays.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
          last
        />
      </Card>

      <View style={{ gap: 8 }}>
        <AppText variant="caption" tone="muted">
          APPEARANCE
        </AppText>
        <Segmented
          value={settings.themeMode}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={settings.setThemeMode}
        />
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="caption" tone="muted">
          TRACKING
        </AppText>
        <Card padded={false} style={{ paddingHorizontal: 16 }}>
          <Row
            title="Live GPS trail while on duty"
            subtitle="Records a breadcrumb every ~30 s or 25 m"
            right={
              <Switch
                value={settings.liveTracking}
                onValueChange={settings.setLiveTracking}
                trackColor={{ true: theme.colors.success, false: theme.colors.border }}
              />
            }
          />
          <Row
            title="Haptic feedback"
            right={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={settings.setHaptics}
                trackColor={{ true: theme.colors.success, false: theme.colors.border }}
              />
            }
            last
          />
        </Card>
      </View>

      <Button title="Sign out" variant="danger" onPress={doLogout} />
      <AppText variant="caption" tone="faint" center>
        8STAR ATTENDANCE · v1.0.0
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  pills: { flexDirection: 'row', gap: 6, marginTop: 6 },
});
