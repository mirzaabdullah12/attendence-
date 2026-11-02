import type {
  AttendanceRecord,
  DateKey,
  Employee,
  OfficeLocation,
  ScheduleEntry,
  ShiftTemplate,
} from '../entities';

export interface EmployeeRepository {
  getAll(): Promise<Employee[]>;
  getById(id: string): Promise<Employee | null>;
  findByCredentials(code: string, pin: string): Promise<Employee | null>;
}

export interface LocationRepository {
  getAll(): Promise<OfficeLocation[]>;
  getById(id: string): Promise<OfficeLocation | null>;
  add(location: OfficeLocation): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface ShiftRepository {
  getAll(): Promise<ShiftTemplate[]>;
  getById(id: string): Promise<ShiftTemplate | null>;
}

export interface ScheduleRepository {
  getForEmployee(employeeId: string, from: DateKey, to: DateKey): Promise<ScheduleEntry[]>;
  getForDate(employeeId: string, date: DateKey): Promise<ScheduleEntry | null>;
  upsert(entry: ScheduleEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface AttendanceRepository {
  getOpenRecord(employeeId: string): Promise<AttendanceRecord | null>;
  getHistory(employeeId: string, limit?: number): Promise<AttendanceRecord[]>;
  save(record: AttendanceRecord): Promise<void>;
}
