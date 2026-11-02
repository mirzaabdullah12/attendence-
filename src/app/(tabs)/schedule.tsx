import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { DateKey, Employee, ScheduleEntry } from '@/domain/entities';
import { addDays, formatClockTime, formatDateKey, todayKey, weekdayOf } from '@/domain/services/time';
import {
  AppHeader,
  AppText,
  Banner,
  Button,
  Card,
  ChoiceChips,
  Field,
  Icon,
  Pill,
  Screen,
  Sheet,
} from '@/presentation/components';
import { useHaptics } from '@/presentation/hooks/useHaptics';
import { useAuthStore } from '@/presentation/store/authStore';
import { useScheduleStore } from '@/presentation/store/scheduleStore';
import { useTheme } from '@/presentation/theme';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const actor = useAuthStore((s) => s.employee) as Employee;
  const store = useScheduleStore();
  const [editing, setEditing] = useState<{ date: DateKey; entry: ScheduleEntry | null } | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const target = useMemo(
    () => store.employees.find((e) => e.id === store.viewEmployeeId) ?? actor,
    [store.employees, store.viewEmployeeId, actor],
  );
  const today = todayKey(actor.timeZone);
  const canEdit = actor.role === 'manager' || target.id === actor.id;
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(store.weekStart, i)), [store.weekStart]);
  const byDate = useMemo(() => new Map(store.entries.map((e) => [e.date, e])), [store.entries]);
  const regionShifts = store.shifts.filter((s) => s.region === target.region);
  const regionLocations = store.locations.filter((l) => l.region === target.region);

  const openEditor = (date: DateKey) => {
    if (!canEdit) return;
    haptics.tap();
    const entry = byDate.get(date) ?? null;
    setShiftId(entry?.shiftId ?? target.defaultShiftId);
    setLocationId(entry?.locationId ?? target.defaultLocationId);
    setNote(entry?.note ?? '');
    setEditing({ date, entry });
  };

  const save = async () => {
    if (!editing || !shiftId || !locationId) return;
    const ok = await store.upsert(actor, {
      id: editing.entry?.id,
      employeeId: target.id,
      date: editing.date,
      shiftId,
      locationId,
      note,
    });
    if (ok) {
      haptics.success();
      setEditing(null);
    } else haptics.error();
  };

  const remove = async () => {
    if (!editing?.entry) return;
    await store.remove(editing.entry.id);
    haptics.success();
    setEditing(null);
  };

  const weekLabel = `${formatDateKey(days[0])} – ${formatDateKey(days[6])}`;
  const scheduledHours = store.entries.reduce((sum, e) => {
    const s = store.shifts.find((x) => x.id === e.shiftId);
    if (!s) return sum;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return sum + mins / 60;
  }, 0);

  return (
    <Screen>
      <AppHeader title="Schedule" subtitle={`${store.entries.length} shifts · ${Math.round(scheduledHours)} h planned`} />
      {store.error && <Banner message={store.error} onDismiss={store.clearError} />}

      {actor.role === 'manager' && (
        <ChoiceChips
          value={target.id}
          choices={store.employees.map((e) => ({ value: e.id, label: e.name, caption: `${e.code} · ${e.region}` }))}
          onChange={(id) => void store.setViewEmployee(id)}
        />
      )}

      <Card padded={false}>
        <View style={[styles.weekNav, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => store.shiftWeek(-1)} hitSlop={10}>
            <Icon name="chevron-left" color={theme.colors.text} />
          </Pressable>
          <Pressable onPress={() => store.goToToday(actor)}>
            <AppText variant="bodyStrong" center>
              {weekLabel}
            </AppText>
            <AppText variant="caption" tone="faint" center>
              TAP FOR THIS WEEK
            </AppText>
          </Pressable>
          <Pressable onPress={() => store.shiftWeek(1)} hitSlop={10}>
            <Icon name="chevron-right" color={theme.colors.text} />
          </Pressable>
        </View>

        {days.map((date, i) => {
          const entry = byDate.get(date);
          const shift = entry && store.shifts.find((s) => s.id === entry.shiftId);
          const office = entry && store.locations.find((l) => l.id === entry.locationId);
          const isToday = date === today;
          const workDay = target.workDays.includes(weekdayOf(date));
          return (
            <Pressable
              key={date}
              onPress={() => openEditor(date)}
              disabled={!canEdit}
              style={({ pressed }) => [
                styles.day,
                i < 6 && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                pressed && { opacity: 0.6 },
              ]}
            >
              <View
                style={[
                  styles.dayBadge,
                  { backgroundColor: isToday ? theme.colors.primary : theme.colors.surfaceAlt, borderRadius: theme.radius.md },
                ]}
              >
                <AppText variant="caption" style={{ color: isToday ? theme.colors.onPrimary : theme.colors.textMuted }}>
                  {DAY_NAMES[weekdayOf(date)].toUpperCase()}
                </AppText>
                <AppText variant="h3" style={{ color: isToday ? theme.colors.onPrimary : theme.colors.text }}>
                  {Number(date.slice(-2))}
                </AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                {shift ? (
                  <>
                    <AppText variant="bodyStrong">
                      {formatClockTime(shift.startTime)} – {formatClockTime(shift.endTime)}
                    </AppText>
                    <AppText variant="small" tone="muted">
                      {shift.name} · {office?.name ?? 'Unknown office'}
                    </AppText>
                    {entry?.note ? (
                      <AppText variant="small" tone="faint">
                        {entry.note}
                      </AppText>
                    ) : null}
                  </>
                ) : (
                  <AppText variant="small" tone="faint">
                    {workDay ? 'Not scheduled' : 'Day off'}
                  </AppText>
                )}
              </View>
              {shift && <Pill label={shift.tone === 'long' ? '12h' : shift.tone} tone={shift.tone === 'night' ? 'info' : 'neutral'} />}
            </Pressable>
          );
        })}
      </Card>

      {canEdit && (
        <Button
          title="Auto-fill week with default shift"
          variant="secondary"
          onPress={() => {
            haptics.tap();
            void store.autoFill(actor, target);
          }}
        />
      )}

      <Sheet
        visible={Boolean(editing)}
        title={editing ? formatDateKey(editing.date, 'long') : ''}
        onClose={() => setEditing(null)}
      >
        <AppText variant="caption" tone="muted">
          SHIFT
        </AppText>
        <ChoiceChips
          value={shiftId}
          choices={regionShifts.map((s) => ({
            value: s.id,
            label: s.name,
            caption: `${formatClockTime(s.startTime)} – ${formatClockTime(s.endTime)}`,
          }))}
          onChange={setShiftId}
        />
        <AppText variant="caption" tone="muted">
          OFFICE
        </AppText>
        <ChoiceChips
          value={locationId}
          choices={regionLocations.map((l) => ({ value: l.id, label: l.name, caption: l.address }))}
          onChange={setLocationId}
        />
        <Field label="Note" placeholder="Optional note, e.g. client visit" value={note} onChangeText={setNote} />
        <Button title={editing?.entry ? 'Update shift' : 'Assign shift'} onPress={save} fullWidth />
        {editing?.entry && <Button title="Remove from schedule" variant="ghost" onPress={remove} fullWidth />}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  day: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  dayBadge: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
});
