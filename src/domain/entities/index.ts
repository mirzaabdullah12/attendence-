/**
 * Domain entities. Pure TypeScript, no framework imports.
 */

export type Region = 'PK' | 'US';
export type Role = 'employee' | 'manager';

/** "HH:mm" 24-hour clock string, e.g. "09:00" */
export type ClockTime = string;
/** "YYYY-MM-DD" calendar date key in the employee's time zone */
export type DateKey = string;

export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface OfficeLocation {
  id: string;
  name: string;
  region: Region;
  address: string;
  latitude: number;
  longitude: number;
  /** Geofence radius in meters */
  radiusMeters: number;
  timeZone: string;
  isCustom?: boolean;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  region: Region;
  startTime: ClockTime;
  endTime: ClockTime;
  /** Minutes after startTime before a clock-in is considered late */
  graceMinutes: number;
  /** Paid break allowance in minutes */
  breakAllowanceMinutes: number;
  /** Accent color token used by UI for this shift */
  tone: 'day' | 'evening' | 'night' | 'long';
}

export interface Employee {
  id: string;
  code: string;
  pin: string;
  name: string;
  role: Role;
  region: Region;
  timeZone: string;
  title: string;
  defaultShiftId: string;
  defaultLocationId: string;
  /** 0 = Sunday … 6 = Saturday */
  workDays: number[];
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: DateKey;
  shiftId: string;
  locationId: string;
  note?: string;
}

export interface BreakSession {
  id: string;
  startAt: number;
  endAt?: number;
  startLocation?: GeoPoint;
  endLocation?: GeoPoint;
}

export type AttendanceStatus = 'on_time' | 'late';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: DateKey;
  shiftId: string;
  locationId?: string;
  clockInAt: number;
  clockOutAt?: number;
  clockInLocation?: GeoPoint;
  clockOutLocation?: GeoPoint;
  clockInWithinGeofence: boolean;
  clockOutWithinGeofence?: boolean;
  distanceFromOfficeMeters?: number;
  breaks: BreakSession[];
  /** GPS breadcrumb trail captured while on duty */
  trail: GeoPoint[];
  status: AttendanceStatus;
  lateByMinutes: number;
  earlyLeaveMinutes?: number;
}

export type DutyState = 'off_duty' | 'on_duty' | 'on_break';

export interface GeofenceCheck {
  office: OfficeLocation | null;
  distanceMeters: number | null;
  inside: boolean;
}

export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}
