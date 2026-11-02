import { createId } from '@/core/utils/id';
import {
  DomainError,
  type AttendanceRecord,
  type Employee,
  type GeoPoint,
  type GeofenceCheck,
  type OfficeLocation,
  type ShiftTemplate,
} from '../entities';
import type {
  AttendanceRepository,
  LocationRepository,
  ScheduleRepository,
  ShiftRepository,
} from '../repositories';
import { openBreak } from '../services/attendance';
import { checkAgainstOffice, nearestOffice } from '../services/geo';
import { minutesEarlyLeave, minutesLate, todayKey } from '../services/time';

export interface ResolvedShift {
  shift: ShiftTemplate;
  office: OfficeLocation;
  scheduled: boolean;
}

/** Finds the shift and office that applies to the employee today (schedule first, defaults second). */
export class ResolveTodayShiftUseCase {
  constructor(
    private readonly schedule: ScheduleRepository,
    private readonly shifts: ShiftRepository,
    private readonly locations: LocationRepository,
  ) {}

  async execute(employee: Employee, now = Date.now()): Promise<ResolvedShift> {
    const date = todayKey(employee.timeZone, now);
    const entry = await this.schedule.getForDate(employee.id, date);
    const shiftId = entry?.shiftId ?? employee.defaultShiftId;
    const locationId = entry?.locationId ?? employee.defaultLocationId;
    const [shift, office] = await Promise.all([
      this.shifts.getById(shiftId),
      this.locations.getById(locationId),
    ]);
    if (!shift) throw new DomainError('No shift is configured for you today.', 'SHIFT_MISSING');
    if (!office) throw new DomainError('No office is assigned for you today.', 'OFFICE_MISSING');
    return { shift, office, scheduled: Boolean(entry) };
  }
}

export class EvaluateGeofenceUseCase {
  constructor(private readonly locations: LocationRepository) {}

  async execute(point: GeoPoint, preferredOfficeId?: string): Promise<GeofenceCheck> {
    const offices = await this.locations.getAll();
    if (preferredOfficeId) {
      const preferred = offices.find((o) => o.id === preferredOfficeId);
      if (preferred) {
        const direct = checkAgainstOffice(point, preferred);
        if (direct.inside) return direct;
      }
    }
    return nearestOffice(point, offices);
  }
}

export interface ClockInInput {
  employee: Employee;
  position: GeoPoint | null;
  /** When true, allows clocking in outside the geofence (flagged on the record). */
  allowRemote?: boolean;
}

export class ClockInUseCase {
  constructor(
    private readonly attendance: AttendanceRepository,
    private readonly resolveShift: ResolveTodayShiftUseCase,
    private readonly geofence: EvaluateGeofenceUseCase,
  ) {}

  async execute({ employee, position, allowRemote = false }: ClockInInput): Promise<AttendanceRecord> {
    const existing = await this.attendance.getOpenRecord(employee.id);
    if (existing) throw new DomainError('You are already clocked in.', 'ALREADY_CLOCKED_IN');

    const now = Date.now();
    const { shift, office } = await this.resolveShift.execute(employee, now);

    let check: GeofenceCheck = { office, distanceMeters: null, inside: false };
    if (position) check = await this.geofence.execute(position, office.id);

    if (!position && !allowRemote) {
      throw new DomainError('Location is required to clock in.', 'LOCATION_REQUIRED');
    }
    if (position && !check.inside && !allowRemote) {
      throw new DomainError(
        `You are outside the ${check.office?.name ?? 'office'} geofence.`,
        'OUTSIDE_GEOFENCE',
      );
    }

    const late = minutesLate(now, shift, employee.timeZone);
    const record: AttendanceRecord = {
      id: createId('att'),
      employeeId: employee.id,
      date: todayKey(employee.timeZone, now),
      shiftId: shift.id,
      locationId: check.office?.id ?? office.id,
      clockInAt: now,
      clockInLocation: position ?? undefined,
      clockInWithinGeofence: check.inside,
      distanceFromOfficeMeters: check.distanceMeters ?? undefined,
      breaks: [],
      trail: position ? [position] : [],
      status: late > 0 ? 'late' : 'on_time',
      lateByMinutes: late,
    };
    await this.attendance.save(record);
    return record;
  }
}

export class ClockOutUseCase {
  constructor(
    private readonly attendance: AttendanceRepository,
    private readonly shifts: ShiftRepository,
    private readonly geofence: EvaluateGeofenceUseCase,
  ) {}

  async execute(employee: Employee, position: GeoPoint | null): Promise<AttendanceRecord> {
    const record = await this.attendance.getOpenRecord(employee.id);
    if (!record) throw new DomainError('You are not clocked in.', 'NOT_CLOCKED_IN');
    const now = Date.now();
    const current = openBreak(record);
    if (current) {
      current.endAt = now;
      current.endLocation = position ?? undefined;
    }
    const shift = await this.shifts.getById(record.shiftId);
    let withinGeofence: boolean | undefined;
    if (position) {
      const check = await this.geofence.execute(position, record.locationId);
      withinGeofence = check.inside;
      record.trail.push(position);
    }
    const updated: AttendanceRecord = {
      ...record,
      clockOutAt: now,
      clockOutLocation: position ?? undefined,
      clockOutWithinGeofence: withinGeofence,
      earlyLeaveMinutes: shift ? minutesEarlyLeave(now, shift, employee.timeZone) : undefined,
    };
    await this.attendance.save(updated);
    return updated;
  }
}

export class StartBreakUseCase {
  constructor(private readonly attendance: AttendanceRepository) {}

  async execute(employeeId: string, position: GeoPoint | null): Promise<AttendanceRecord> {
    const record = await this.attendance.getOpenRecord(employeeId);
    if (!record) throw new DomainError('Clock in before starting a break.', 'NOT_CLOCKED_IN');
    if (openBreak(record)) throw new DomainError('You are already on a break.', 'ALREADY_ON_BREAK');
    const updated: AttendanceRecord = {
      ...record,
      breaks: [
        ...record.breaks,
        { id: createId('brk'), startAt: Date.now(), startLocation: position ?? undefined },
      ],
    };
    await this.attendance.save(updated);
    return updated;
  }
}

export class EndBreakUseCase {
  constructor(private readonly attendance: AttendanceRepository) {}

  async execute(employeeId: string, position: GeoPoint | null): Promise<AttendanceRecord> {
    const record = await this.attendance.getOpenRecord(employeeId);
    if (!record) throw new DomainError('You are not clocked in.', 'NOT_CLOCKED_IN');
    const current = openBreak(record);
    if (!current) throw new DomainError('You are not on a break.', 'NOT_ON_BREAK');
    const updated: AttendanceRecord = {
      ...record,
      breaks: record.breaks.map((b) =>
        b.id === current.id ? { ...b, endAt: Date.now(), endLocation: position ?? undefined } : b,
      ),
    };
    await this.attendance.save(updated);
    return updated;
  }
}

const MIN_TRAIL_GAP_MS = 20_000;

export class AppendTrailPointUseCase {
  constructor(private readonly attendance: AttendanceRepository) {}

  async execute(employeeId: string, point: GeoPoint): Promise<AttendanceRecord | null> {
    const record = await this.attendance.getOpenRecord(employeeId);
    if (!record) return null;
    const last = record.trail[record.trail.length - 1];
    if (last && point.timestamp - last.timestamp < MIN_TRAIL_GAP_MS) return record;
    const updated = { ...record, trail: [...record.trail, point].slice(-500) };
    await this.attendance.save(updated);
    return updated;
  }
}

export class GetAttendanceStateUseCase {
  constructor(private readonly attendance: AttendanceRepository) {}

  async execute(employeeId: string) {
    const [open, history] = await Promise.all([
      this.attendance.getOpenRecord(employeeId),
      this.attendance.getHistory(employeeId, 60),
    ]);
    return { open, history };
  }
}
