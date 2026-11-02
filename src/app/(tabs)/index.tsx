import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import type { Employee } from '@/domain/entities';
import { dutyStateOf, openBreak, totalBreakMs, workedMs } from '@/domain/services/attendance';
import { formatDistance } from '@/domain/services/geo';
import {
  formatClockTime,
  formatDurationClock,
  formatDuration,
  formatTimeInZone,
  parseClockTime,
  shiftLengthMinutes,
  timeZoneAbbreviation,
  zonedParts,
} from '@/domain/services/time';
import { AppHeader, AppText, Banner, Button, Card, Icon, Pill, Screen } from '@/presentation/components';
import { useHaptics } from '@/presentation/hooks/useHaptics';
import { useNow } from '@/presentation/hooks/useNow';
import { useAttendanceStore } from '@/presentation/store/attendanceStore';
import { useAuthStore } from '@/presentation/store/authStore';
import { useTheme } from '@/presentation/theme';

const pad = (n: number) => String(n).padStart(2, '0');

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ClockScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const employee = useAuthStore((s) => s.employee) as Employee;
  const store = useAttendanceStore();
  const now = useNow(1000);
  const [refreshing, setRefreshing] = useState(false);

  const parts = zonedParts(now, employee.timeZone);
  const duty = dutyStateOf(store.open);
  const currentBreak = openBreak(store.open);
  const shift = store.today?.shift;
  const office = store.today?.office;

  useEffect(() => {
    void store.refreshLocation(employee);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([store.load(employee), store.refreshLocation(employee)]);
    setRefreshing(false);
  }, [employee, store]);

  const shiftProgress = useMemo(() => {
    if (!shift) return null;
    const start = parseClockTime(shift.startTime);
    const length = shiftLengthMinutes(shift);
    let elapsed = parts.minutesOfDay - start;
    if (elapsed < 0 && length + start > 24 * 60) elapsed += 24 * 60;
    if (elapsed < 0) return { phase: 'upcoming' as const, ratio: 0, startsIn: -elapsed };
    if (elapsed >= length) return { phase: 'ended' as const, ratio: 1, startsIn: 0 };
    return { phase: 'active' as const, ratio: elapsed / length, startsIn: 0 };
  }, [shift, parts.minutesOfDay]);

  const geo = store.geofence;
  const inside = Boolean(geo?.inside);

  const doClockIn = async () => {
    haptics.tap();
    const ok = await store.clockIn(employee);
    if (ok) {
      haptics.success();
      return;
    }
    const err = useAttendanceStore.getState().error ?? '';
    if (err.includes('geofence') || err.includes('Location is required')) {
      Alert.alert(
        'Outside office geofence',
        `${err}\n\nYou can still clock in remotely. This will be flagged on your record for manager review.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: store.clearError },
          {
            text: 'Clock in remotely',
            style: 'destructive',
            onPress: async () => {
              store.clearError();
              const done = await store.clockIn(employee, true);
              if (done) haptics.success();
              else haptics.error();
            },
          },
        ],
      );
    } else {
      haptics.error();
    }
  };

  const doClockOut = () => {
    haptics.tap();
    const worked = store.open ? formatDuration(workedMs(store.open, now)) : '';
    Alert.alert('Clock out?', `You have worked ${worked} today.`, [
      { text: 'Stay clocked in', style: 'cancel' },
      {
        text: 'Clock out',
        style: 'destructive',
        onPress: async () => {
          const ok = await store.clockOut(employee);
          if (ok) haptics.success();
          else haptics.error();
        },
      },
    ]);
  };

  const toggleBreak = async () => {
    haptics.tap();
    const ok = duty === 'on_break' ? await store.endBreak(employee) : await store.startBreak(employee);
    if (ok) haptics.success();
    else haptics.error();
  };

  const dutyPill = {
    off_duty: <Pill label="Off duty" tone="neutral" dot />,
    on_duty: <Pill label="On duty" tone="success" dot />,
    on_break: <Pill label="On break" tone="warning" dot />,
  }[duty];

  const otherZone = employee.region === 'PK' ? 'America/New_York' : 'Asia/Karachi';
  const otherLabel = employee.region === 'PK' ? 'New York' : 'Lahore';

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}
    >
      <AppHeader right={dutyPill} />

      <View>
        <AppText variant="small" tone="muted">
          {greeting(parts.hour)},
        </AppText>
        <AppText variant="h1">{employee.name.split(' ')[0]}</AppText>
      </View>

      {store.error && <Banner message={store.error} onDismiss={store.clearError} />}

      {/* Live clock */}
      <Card tone="primary" style={styles.clockCard}>
        <AppText variant="caption" style={{ color: theme.colors.onPrimary, opacity: 0.6 }}>
          {employee.region === 'PK' ? 'PAKISTAN' : 'UNITED STATES'} · {timeZoneAbbreviation(employee.timeZone, now)}
        </AppText>
        <AppText variant="display" style={{ color: theme.colors.onPrimary, fontVariant: ['tabular-nums'] }}>
          {pad(parts.hour % 12 === 0 ? 12 : parts.hour % 12)}:{pad(parts.minute)}
          <AppText variant="h2" style={{ color: theme.colors.onPrimary, opacity: 0.7 }}>
            {' '}
            {parts.hour >= 12 ? 'PM' : 'AM'}
          </AppText>
        </AppText>
        <View style={styles.clockFooter}>
          <AppText variant="small" style={{ color: theme.colors.onPrimary, opacity: 0.7 }}>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parts.weekday]},{' '}
            {parts.day}/{pad(parts.month)}/{parts.year}
          </AppText>
          <AppText variant="small" style={{ color: theme.colors.onPrimary, opacity: 0.7 }}>
            {otherLabel} {formatTimeInZone(now, otherZone)}
          </AppText>
        </View>
      </Card>

      {/* Today's shift */}
      <Card>
        <View style={styles.cardHead}>
          <AppText variant="h3">Today&apos;s shift</AppText>
          {store.today?.scheduled ? <Pill label="Scheduled" tone="info" /> : <Pill label="Default shift" />}
        </View>
        {shift && office ? (
          <>
            <View style={styles.shiftRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="h2">
                  {formatClockTime(shift.startTime)} – {formatClockTime(shift.endTime)}
                </AppText>
                <AppText variant="small" tone="muted">
                  {shift.name} · {Math.round(shiftLengthMinutes(shift) / 60)}h · {office.name}
                </AppText>
              </View>
              {shiftProgress?.phase === 'upcoming' && (
                <Pill label={`Starts in ${formatDuration(shiftProgress.startsIn * 60000)}`} tone="info" />
              )}
              {shiftProgress?.phase === 'active' && <Pill label="In progress" tone="success" dot />}
              {shiftProgress?.phase === 'ended' && <Pill label="Ended" />}
            </View>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.round((shiftProgress?.ratio ?? 0) * 100)}%`, backgroundColor: theme.colors.text },
                ]}
              />
            </View>
            <AppText variant="caption" tone="faint">
              GRACE {shift.graceMinutes} MIN · BREAK ALLOWANCE {shift.breakAllowanceMinutes} MIN
            </AppText>
          </>
        ) : (
          <AppText variant="small" tone="muted">
            No shift configured. Ask your manager to schedule you.
          </AppText>
        )}
      </Card>

      {/* Location */}
      <Card tone={store.permission !== 'granted' ? 'warning' : inside ? 'success' : 'alt'}>
        <View style={styles.cardHead}>
          <View style={styles.inline}>
            <Icon name="navigate" size={18} color={theme.colors.text} />
            <AppText variant="h3">Location</AppText>
          </View>
          <Pressable onPress={() => store.refreshLocation(employee)} hitSlop={10} disabled={store.locating}>
            <AppText variant="caption" tone="muted">
              {store.locating ? 'LOCATING…' : 'REFRESH'}
            </AppText>
          </Pressable>
        </View>
        {store.permission !== 'granted' ? (
          <AppText variant="small">
            Location permission is required to verify you are at an 8star office. Tap refresh to grant it.
          </AppText>
        ) : geo?.office ? (
          <>
            <AppText variant="bodyStrong">
              {inside ? `At ${geo.office.name}` : `${formatDistance(geo.distanceMeters)} from ${geo.office.name}`}
            </AppText>
            <AppText variant="small" tone="muted">
              {inside ? 'Inside geofence' : `Outside geofence (radius ${geo.office.radiusMeters} m)`}
              {store.position?.accuracy ? ` · accuracy ±${Math.round(store.position.accuracy)} m` : ''}
            </AppText>
            {duty !== 'off_duty' && (
              <View style={styles.inline}>
                <View
                  style={[
                    styles.liveDot,
                    { backgroundColor: store.tracking ? theme.colors.success : theme.colors.textFaint },
                  ]}
                />
                <AppText variant="caption" tone="muted">
                  {store.tracking ? `LIVE TRACKING · ${store.trailCount} POINTS` : 'TRACKING PAUSED'}
                </AppText>
              </View>
            )}
          </>
        ) : (
          <AppText variant="small" tone="muted">
            Waiting for GPS fix…
          </AppText>
        )}
      </Card>

      {/* Session timers */}
      {store.open && (
        <Card>
          <View style={styles.timers}>
            <View style={styles.timer}>
              <AppText variant="caption" tone="muted">
                WORKED
              </AppText>
              <AppText variant="h2" style={{ fontVariant: ['tabular-nums'] }}>
                {formatDurationClock(workedMs(store.open, now))}
              </AppText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.timer}>
              <AppText variant="caption" tone="muted">
                {currentBreak ? 'ON BREAK' : 'BREAKS'}
              </AppText>
              <AppText
                variant="h2"
                tone={currentBreak ? 'warning' : 'text'}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatDurationClock(currentBreak ? now - currentBreak.startAt : totalBreakMs(store.open, now))}
              </AppText>
            </View>
          </View>
          <AppText variant="small" tone="muted">
            Clocked in at {formatTimeInZone(store.open.clockInAt, employee.timeZone)}
            {store.open.status === 'late' ? ` · late by ${store.open.lateByMinutes} min` : ' · on time'}
            {store.open.clockInWithinGeofence ? '' : ' · remote'}
          </AppText>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {duty === 'off_duty' ? (
          <Button
            title={inside ? 'Clock In' : 'Clock In'}
            variant="success"
            size="lg"
            loading={store.busy}
            onPress={doClockIn}
            fullWidth
            icon={<Icon name="clock" size={20} color="#fff" />}
          />
        ) : (
          <>
            <Button
              title={duty === 'on_break' ? 'End Break' : 'Start Break'}
              variant={duty === 'on_break' ? 'success' : 'warning'}
              size="lg"
              loading={store.busy}
              onPress={toggleBreak}
              fullWidth
            />
            <Button title="Clock Out" variant="danger" size="lg" loading={store.busy} onPress={doClockOut} fullWidth />
          </>
        )}
        {duty === 'off_duty' && !inside && store.permission === 'granted' && (
          <AppText variant="small" tone="muted" center>
            You are outside the office geofence. Remote clock-in will be flagged.
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  clockCard: { gap: 6 },
  clockFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  fill: { height: '100%', borderRadius: 3 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  timers: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timer: { flex: 1, gap: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 40, marginHorizontal: 12 },
  actions: { gap: 10 },
});
