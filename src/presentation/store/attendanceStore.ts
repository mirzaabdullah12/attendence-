import { create } from 'zustand';
import { container } from '@/core/di/container';
import type { LocationPermission } from '@/data/location/LocationService';
import type { AttendanceRecord, Employee, GeoPoint, GeofenceCheck } from '@/domain/entities';
import type { ResolvedShift } from '@/domain/usecases/attendance';

interface AttendanceState {
  open: AttendanceRecord | null;
  history: AttendanceRecord[];
  today: ResolvedShift | null;
  position: GeoPoint | null;
  geofence: GeofenceCheck | null;
  permission: LocationPermission;
  locating: boolean;
  busy: boolean;
  error: string | null;
  tracking: boolean;
  trailCount: number;

  load: (employee: Employee) => Promise<void>;
  refreshLocation: (employee: Employee) => Promise<GeoPoint | null>;
  clockIn: (employee: Employee, allowRemote?: boolean) => Promise<boolean>;
  clockOut: (employee: Employee) => Promise<boolean>;
  startBreak: (employee: Employee) => Promise<boolean>;
  endBreak: (employee: Employee) => Promise<boolean>;
  pushTrailPoint: (employee: Employee, point: GeoPoint) => Promise<void>;
  setTracking: (on: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export const useAttendanceStore = create<AttendanceState>()((set, get) => ({
  open: null,
  history: [],
  today: null,
  position: null,
  geofence: null,
  permission: 'undetermined',
  locating: false,
  busy: false,
  error: null,
  tracking: false,
  trailCount: 0,

  async load(employee) {
    try {
      const [{ open, history }, today] = await Promise.all([
        container.attendance.getState.execute(employee.id),
        container.attendance.resolveTodayShift.execute(employee).catch(() => null),
      ]);
      set({ open, history, today, trailCount: open?.trail.length ?? 0 });
    } catch (e) {
      set({ error: message(e, 'Could not load attendance') });
    }
  },

  async refreshLocation(employee) {
    set({ locating: true });
    try {
      const svc = container.locationService;
      let permission = await svc.getPermission();
      if (permission !== 'granted') permission = await svc.requestPermission();
      set({ permission });
      if (permission !== 'granted') {
        set({ locating: false, position: null, geofence: null });
        return null;
      }
      const position = await svc.getCurrentPosition();
      const preferred = get().today?.office.id ?? employee.defaultLocationId;
      const geofence = await container.attendance.evaluateGeofence.execute(position, preferred);
      set({ position, geofence, locating: false });
      return position;
    } catch (e) {
      set({ locating: false, error: message(e, 'Could not read GPS position') });
      return null;
    }
  },

  async clockIn(employee, allowRemote = false) {
    set({ busy: true, error: null });
    try {
      const position = (await get().refreshLocation(employee)) ?? get().position;
      const record = await container.attendance.clockIn.execute({ employee, position, allowRemote });
      set({ open: record, busy: false, trailCount: record.trail.length });
      await get().load(employee);
      return true;
    } catch (e) {
      set({ busy: false, error: message(e, 'Clock in failed') });
      return false;
    }
  },

  async clockOut(employee) {
    set({ busy: true, error: null });
    try {
      const position = (await get().refreshLocation(employee)) ?? get().position;
      await container.attendance.clockOut.execute(employee, position);
      set({ busy: false, open: null, tracking: false });
      await get().load(employee);
      return true;
    } catch (e) {
      set({ busy: false, error: message(e, 'Clock out failed') });
      return false;
    }
  },

  async startBreak(employee) {
    set({ busy: true, error: null });
    try {
      const record = await container.attendance.startBreak.execute(employee.id, get().position);
      set({ open: record, busy: false });
      return true;
    } catch (e) {
      set({ busy: false, error: message(e, 'Could not start break') });
      return false;
    }
  },

  async endBreak(employee) {
    set({ busy: true, error: null });
    try {
      const record = await container.attendance.endBreak.execute(employee.id, get().position);
      set({ open: record, busy: false });
      return true;
    } catch (e) {
      set({ busy: false, error: message(e, 'Could not end break') });
      return false;
    }
  },

  async pushTrailPoint(employee, point) {
    const record = await container.attendance.appendTrailPoint.execute(employee.id, point);
    const preferred = get().today?.office.id ?? employee.defaultLocationId;
    const geofence = await container.attendance.evaluateGeofence.execute(point, preferred);
    set({ position: point, geofence, open: record ?? get().open, trailCount: record?.trail.length ?? 0 });
  },

  setTracking: (tracking) => set({ tracking }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      open: null,
      history: [],
      today: null,
      position: null,
      geofence: null,
      error: null,
      tracking: false,
      trailCount: 0,
    }),
}));
