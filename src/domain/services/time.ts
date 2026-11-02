import type { ClockTime, DateKey, ShiftTemplate } from '../entities';

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
  dateKey: DateKey;
  minutesOfDay: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Break a timestamp into calendar parts for a given IANA time zone. */
export function zonedParts(timestamp: number, timeZone: string): ZonedParts {
  try {
    const parts = getFormatter(timeZone).formatToParts(new Date(timestamp));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
    const hour = Number(get('hour')) % 24;
    const minute = Number(get('minute'));
    const year = Number(get('year'));
    const month = Number(get('month'));
    const day = Number(get('day'));
    return {
      year,
      month,
      day,
      hour,
      minute,
      second: Number(get('second')),
      weekday: Math.max(0, WEEKDAYS.indexOf(get('weekday'))),
      dateKey: `${year}-${pad(month)}-${pad(day)}`,
      minutesOfDay: hour * 60 + minute,
    };
  } catch {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return {
      year,
      month,
      day,
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds(),
      weekday: d.getDay(),
      dateKey: `${year}-${pad(month)}-${pad(day)}`,
      minutesOfDay: d.getHours() * 60 + d.getMinutes(),
    };
  }
}

export function todayKey(timeZone: string, now = Date.now()): DateKey {
  return zonedParts(now, timeZone).dateKey;
}

export function parseClockTime(value: ClockTime): number {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatClockTime(value: ClockTime): string {
  const mins = parseClockTime(value);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

export function shiftLengthMinutes(shift: ShiftTemplate): number {
  const start = parseClockTime(shift.startTime);
  const end = parseClockTime(shift.endTime);
  return end > start ? end - start : 24 * 60 - start + end;
}

export function shiftCrossesMidnight(shift: ShiftTemplate): boolean {
  return parseClockTime(shift.endTime) <= parseClockTime(shift.startTime);
}

/**
 * Minutes late relative to the shift start (0 when on time).
 * Uses the employee's time zone so a 9 AM shift in New York is evaluated in New York time.
 */
export function minutesLate(clockInAt: number, shift: ShiftTemplate, timeZone: string): number {
  const { minutesOfDay } = zonedParts(clockInAt, timeZone);
  const start = parseClockTime(shift.startTime);
  let delta = minutesOfDay - start;
  // Night shifts: a clock-in shortly after midnight belongs to the previous day's shift.
  if (shiftCrossesMidnight(shift) && delta < -12 * 60) delta += 24 * 60;
  return Math.max(0, delta - shift.graceMinutes);
}

export function minutesEarlyLeave(clockOutAt: number, shift: ShiftTemplate, timeZone: string): number {
  const { minutesOfDay } = zonedParts(clockOutAt, timeZone);
  const end = parseClockTime(shift.endTime);
  let delta = end - minutesOfDay;
  if (shiftCrossesMidnight(shift) && delta > 12 * 60) delta -= 24 * 60;
  return Math.max(0, delta);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${pad(m)}m`;
}

export function formatDurationClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatTimeInZone(timestamp: number, timeZone: string): string {
  const { hour, minute } = zonedParts(timestamp, timeZone);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad(minute)} ${suffix}`;
}

export function addDays(dateKey: DateKey, days: number): DateKey {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function weekdayOf(dateKey: DateKey): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Monday-based week start for a date key. */
export function startOfWeek(dateKey: DateKey): DateKey {
  const wd = weekdayOf(dateKey);
  const offset = wd === 0 ? -6 : 1 - wd;
  return addDays(dateKey, offset);
}

export function formatDateKey(dateKey: DateKey, style: 'short' | 'long' = 'short'): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }
      : { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
  try {
    return new Intl.DateTimeFormat('en-US', opts).format(dt);
  } catch {
    return dateKey;
  }
}

const FRIENDLY_ZONE_NAMES: Record<string, string> = {
  'Asia/Karachi': 'PKT',
};

export function timeZoneAbbreviation(timeZone: string, now = Date.now()): string {
  if (FRIENDLY_ZONE_NAMES[timeZone]) return FRIENDLY_ZONE_NAMES[timeZone];
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(
      new Date(now),
    );
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}
