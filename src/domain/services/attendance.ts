import type { AttendanceRecord, BreakSession, DutyState } from '../entities';

export function dutyStateOf(record: AttendanceRecord | null): DutyState {
  if (!record || record.clockOutAt) return 'off_duty';
  const open = record.breaks.find((b) => !b.endAt);
  return open ? 'on_break' : 'on_duty';
}

export function openBreak(record: AttendanceRecord | null): BreakSession | null {
  if (!record) return null;
  return record.breaks.find((b) => !b.endAt) ?? null;
}

export function totalBreakMs(record: AttendanceRecord, now = Date.now()): number {
  return record.breaks.reduce((sum, b) => sum + ((b.endAt ?? now) - b.startAt), 0);
}

/** Net worked time: on-duty duration minus breaks. */
export function workedMs(record: AttendanceRecord, now = Date.now()): number {
  const end = record.clockOutAt ?? now;
  return Math.max(0, end - record.clockInAt - totalBreakMs(record, now));
}
