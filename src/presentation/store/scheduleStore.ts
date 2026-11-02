import { create } from 'zustand';
import { container } from '@/core/di/container';
import type { DateKey, Employee, OfficeLocation, ScheduleEntry, ShiftTemplate } from '@/domain/entities';
import { addDays, startOfWeek, todayKey } from '@/domain/services/time';
import type { UpsertScheduleInput } from '@/domain/usecases/schedule';

interface ScheduleState {
  weekStart: DateKey;
  entries: ScheduleEntry[];
  shifts: ShiftTemplate[];
  locations: OfficeLocation[];
  employees: Employee[];
  /** Whose schedule is shown (managers can switch) */
  viewEmployeeId: string | null;
  loading: boolean;
  error: string | null;

  init: (employee: Employee) => Promise<void>;
  loadWeek: (employeeId: string, weekStart?: DateKey) => Promise<void>;
  shiftWeek: (delta: number) => Promise<void>;
  goToToday: (employee: Employee) => Promise<void>;
  setViewEmployee: (employeeId: string) => Promise<void>;
  upsert: (actor: Employee, input: UpsertScheduleInput) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  autoFill: (actor: Employee, target: Employee) => Promise<void>;
  reloadLocations: () => Promise<void>;
  clearError: () => void;
}

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export const useScheduleStore = create<ScheduleState>()((set, get) => ({
  weekStart: startOfWeek(todayKey('UTC')),
  entries: [],
  shifts: [],
  locations: [],
  employees: [],
  viewEmployeeId: null,
  loading: false,
  error: null,

  async init(employee) {
    const [shifts, locations, employees] = await Promise.all([
      container.repos.shifts.getAll(),
      container.repos.locations.getAll(),
      container.repos.employees.getAll(),
    ]);
    const weekStart = startOfWeek(todayKey(employee.timeZone));
    set({ shifts, locations, employees, viewEmployeeId: employee.id, weekStart });
    await get().loadWeek(employee.id, weekStart);
  },

  async loadWeek(employeeId, weekStart = get().weekStart) {
    set({ loading: true, error: null });
    try {
      const entries = await container.schedule.getWeek.execute(employeeId, weekStart);
      set({ entries, weekStart, loading: false });
    } catch (e) {
      set({ loading: false, error: message(e, 'Could not load schedule') });
    }
  },

  async shiftWeek(delta) {
    const id = get().viewEmployeeId;
    if (!id) return;
    await get().loadWeek(id, addDays(get().weekStart, delta * 7));
  },

  async goToToday(employee) {
    const id = get().viewEmployeeId ?? employee.id;
    await get().loadWeek(id, startOfWeek(todayKey(employee.timeZone)));
  },

  async setViewEmployee(employeeId) {
    set({ viewEmployeeId: employeeId });
    await get().loadWeek(employeeId);
  },

  async upsert(actor, input) {
    try {
      await container.schedule.upsert.execute(actor, input);
      await get().loadWeek(input.employeeId);
      return true;
    } catch (e) {
      set({ error: message(e, 'Could not save schedule') });
      return false;
    }
  },

  async remove(id) {
    await container.schedule.remove.execute(id);
    const employeeId = get().viewEmployeeId;
    if (employeeId) await get().loadWeek(employeeId);
  },

  async autoFill(actor, target) {
    try {
      if (actor.role !== 'manager' && actor.id !== target.id) throw new Error('Not allowed');
      await container.schedule.autoFillWeek.execute(target, get().weekStart);
      await get().loadWeek(target.id);
    } catch (e) {
      set({ error: message(e, 'Could not auto-fill week') });
    }
  },

  async reloadLocations() {
    set({ locations: await container.repos.locations.getAll() });
  },

  clearError: () => set({ error: null }),
}));
