import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AttendanceRecord, Employee } from '@/domain/entities';
import { totalBreakMs, workedMs } from '@/domain/services/attendance';
import { formatDateKey, formatDuration, formatTimeInZone, startOfWeek, todayKey } from '@/domain/services/time';
import { AppHeader, AppText, Card, EmptyState, Pill, Screen } from '@/presentation/components';
import { useAttendanceStore } from '@/presentation/store/attendanceStore';
import { useAuthStore } from '@/presentation/store/authStore';
import { useScheduleStore } from '@/presentation/store/scheduleStore';
import { useTheme } from '@/presentation/theme';

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' | 'danger' }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="h2" tone={tone ?? 'text'}>
        {value}
      </AppText>
    </View>
  );
}

function RecordCard({ record, employee }: { record: AttendanceRecord; employee: Employee }) {
  const theme = useTheme();
  const shifts = useScheduleStore((s) => s.shifts);
  const locations = useScheduleStore((s) => s.locations);
  const shift = shifts.find((s) => s.id === record.shiftId);
  const office = locations.find((l) => l.id === record.locationId);
  const open = !record.clockOutAt;
  const tz = employee.timeZone;

  return (
    <Card>
      <View style={styles.head}>
        <View>
          <AppText variant="h3">{formatDateKey(record.date, 'long')}</AppText>
          <AppText variant="small" tone="muted">
            {shift?.name ?? 'Shift'} · {office?.name ?? 'Unknown office'}
          </AppText>
        </View>
        <AppText variant="h3">{open ? 'Open' : formatDuration(workedMs(record))}</AppText>
      </View>

      <View style={styles.times}>
        <View style={styles.time}>
          <AppText variant="caption" tone="faint">
            IN
          </AppText>
          <AppText variant="bodyStrong">{formatTimeInZone(record.clockInAt, tz)}</AppText>
        </View>
        <View style={[styles.arrow, { backgroundColor: theme.colors.border }]} />
        <View style={styles.time}>
          <AppText variant="caption" tone="faint">
            OUT
          </AppText>
          <AppText variant="bodyStrong">{record.clockOutAt ? formatTimeInZone(record.clockOutAt, tz) : '—'}</AppText>
        </View>
        <View style={styles.time}>
          <AppText variant="caption" tone="faint">
            BREAKS
          </AppText>
          <AppText variant="bodyStrong">
            {record.breaks.length} · {formatDuration(totalBreakMs(record))}
          </AppText>
        </View>
      </View>

      <View style={styles.pills}>
        {record.status === 'late' ? (
          <Pill label={`Late ${record.lateByMinutes} min`} tone="warning" />
        ) : (
          <Pill label="On time" tone="success" />
        )}
        {record.clockInWithinGeofence ? <Pill label="In geofence" tone="info" /> : <Pill label="Remote" tone="danger" />}
        {record.earlyLeaveMinutes ? <Pill label={`Left ${record.earlyLeaveMinutes} min early`} tone="warning" /> : null}
        {record.trail.length > 1 && <Pill label={`${record.trail.length} GPS points`} />}
      </View>
    </Card>
  );
}

export default function HistoryScreen() {
  const employee = useAuthStore((s) => s.employee) as Employee;
  const history = useAttendanceStore((s) => s.history);

  const weekly = useMemo(() => {
    const weekStart = startOfWeek(todayKey(employee.timeZone));
    const inWeek = history.filter((r) => r.date >= weekStart);
    const worked = inWeek.reduce((sum, r) => sum + workedMs(r), 0);
    const late = inWeek.filter((r) => r.status === 'late').length;
    const remote = inWeek.filter((r) => !r.clockInWithinGeofence).length;
    return { days: new Set(inWeek.map((r) => r.date)).size, worked, late, remote };
  }, [history, employee.timeZone]);

  return (
    <Screen>
      <AppHeader title="History" subtitle="Your attendance log" />
      <Card>
        <AppText variant="caption" tone="muted" style={{ marginBottom: 10 }}>
          THIS WEEK
        </AppText>
        <View style={styles.stats}>
          <Stat label="DAYS" value={String(weekly.days)} />
          <Stat label="WORKED" value={formatDuration(weekly.worked)} />
          <Stat label="LATE" value={String(weekly.late)} tone={weekly.late ? 'warning' : 'success'} />
          <Stat label="REMOTE" value={String(weekly.remote)} tone={weekly.remote ? 'danger' : undefined} />
        </View>
      </Card>

      {history.length === 0 ? (
        <EmptyState title="No attendance yet" body="Your clock-ins will appear here once you start a shift." />
      ) : (
        history.map((r) => <RecordCard key={r.id} record={r} employee={employee} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { gap: 2 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  times: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  time: { gap: 2 },
  arrow: { width: 18, height: StyleSheet.hairlineWidth },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
