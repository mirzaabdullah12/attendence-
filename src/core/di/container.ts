/**
 * Composition root. Wires data-layer implementations into domain use cases.
 * Presentation code imports `container` and never touches repositories directly.
 */
import { ExpoLocationService } from '@/data/location/LocationService';
import { AttendanceRepositoryImpl } from '@/data/repositories/AttendanceRepositoryImpl';
import { EmployeeRepositoryImpl } from '@/data/repositories/EmployeeRepositoryImpl';
import { LocationRepositoryImpl } from '@/data/repositories/LocationRepositoryImpl';
import { ScheduleRepositoryImpl } from '@/data/repositories/ScheduleRepositoryImpl';
import { ShiftRepositoryImpl } from '@/data/repositories/ShiftRepositoryImpl';
import { AsyncStorageStore } from '@/data/storage/KeyValueStore';
import {
  AppendTrailPointUseCase,
  ClockInUseCase,
  ClockOutUseCase,
  EndBreakUseCase,
  EvaluateGeofenceUseCase,
  GetAttendanceStateUseCase,
  ResolveTodayShiftUseCase,
  StartBreakUseCase,
} from '@/domain/usecases/attendance';
import { LoginUseCase } from '@/domain/usecases/auth';
import { AddOfficeLocationUseCase, RemoveOfficeLocationUseCase } from '@/domain/usecases/locations';
import {
  AutoFillWeekUseCase,
  GetWeekScheduleUseCase,
  RemoveScheduleEntryUseCase,
  UpsertScheduleEntryUseCase,
} from '@/domain/usecases/schedule';

const store = new AsyncStorageStore();

const employeeRepo = new EmployeeRepositoryImpl();
const shiftRepo = new ShiftRepositoryImpl();
const locationRepo = new LocationRepositoryImpl(store);
const scheduleRepo = new ScheduleRepositoryImpl(store);
const attendanceRepo = new AttendanceRepositoryImpl(store);

const resolveTodayShift = new ResolveTodayShiftUseCase(scheduleRepo, shiftRepo, locationRepo);
const evaluateGeofence = new EvaluateGeofenceUseCase(locationRepo);

export const container = {
  locationService: new ExpoLocationService(),
  repos: {
    employees: employeeRepo,
    shifts: shiftRepo,
    locations: locationRepo,
  },
  auth: {
    login: new LoginUseCase(employeeRepo),
  },
  attendance: {
    resolveTodayShift,
    evaluateGeofence,
    clockIn: new ClockInUseCase(attendanceRepo, resolveTodayShift, evaluateGeofence),
    clockOut: new ClockOutUseCase(attendanceRepo, shiftRepo, evaluateGeofence),
    startBreak: new StartBreakUseCase(attendanceRepo),
    endBreak: new EndBreakUseCase(attendanceRepo),
    appendTrailPoint: new AppendTrailPointUseCase(attendanceRepo),
    getState: new GetAttendanceStateUseCase(attendanceRepo),
  },
  schedule: {
    getWeek: new GetWeekScheduleUseCase(scheduleRepo),
    upsert: new UpsertScheduleEntryUseCase(scheduleRepo),
    remove: new RemoveScheduleEntryUseCase(scheduleRepo),
    autoFillWeek: new AutoFillWeekUseCase(scheduleRepo),
  },
  locations: {
    add: new AddOfficeLocationUseCase(locationRepo),
    remove: new RemoveOfficeLocationUseCase(locationRepo),
  },
};

export type Container = typeof container;
