import { createId } from '@/core/utils/id';
import { DomainError, type DateKey, type Employee, type ScheduleEntry } from '../entities';
import type { ScheduleRepository } from '../repositories';
import { addDays, startOfWeek, weekdayOf } from '../services/time';

export class GetWeekScheduleUseCase {
  constructor(private readonly schedule: ScheduleRepository) {}

  async execute(employeeId: string, anyDateInWeek: DateKey): Promise<ScheduleEntry[]> {
    const from = startOfWeek(anyDateInWeek);
    const to = addDays(from, 6);
    return this.schedule.getForEmployee(employeeId, from, to);
  }
}

export interface UpsertScheduleInput {
  id?: string;
  employeeId: string;
  date: DateKey;
  shiftId: string;
  locationId: string;
  note?: string;
}

export class UpsertScheduleEntryUseCase {
  constructor(private readonly schedule: ScheduleRepository) {}

  async execute(actor: Employee, input: UpsertScheduleInput): Promise<ScheduleEntry> {
    if (actor.role !== 'manager' && actor.id !== input.employeeId) {
      throw new DomainError('Only managers can edit other schedules.', 'FORBIDDEN');
    }
    const existing = await this.schedule.getForDate(input.employeeId, input.date);
    const entry: ScheduleEntry = {
      id: input.id ?? existing?.id ?? createId('sch'),
      employeeId: input.employeeId,
      date: input.date,
      shiftId: input.shiftId,
      locationId: input.locationId,
      note: input.note?.trim() || undefined,
    };
    await this.schedule.upsert(entry);
    return entry;
  }
}

export class RemoveScheduleEntryUseCase {
  constructor(private readonly schedule: ScheduleRepository) {}

  async execute(id: string): Promise<void> {
    await this.schedule.remove(id);
  }
}

/** Fills every empty work day in the week with the employee's default shift and office. */
export class AutoFillWeekUseCase {
  constructor(private readonly schedule: ScheduleRepository) {}

  async execute(employee: Employee, anyDateInWeek: DateKey): Promise<ScheduleEntry[]> {
    const from = startOfWeek(anyDateInWeek);
    const existing = await this.schedule.getForEmployee(employee.id, from, addDays(from, 6));
    const taken = new Set(existing.map((e) => e.date));
    const created: ScheduleEntry[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(from, i);
      if (taken.has(date) || !employee.workDays.includes(weekdayOf(date))) continue;
      const entry: ScheduleEntry = {
        id: createId('sch'),
        employeeId: employee.id,
        date,
        shiftId: employee.defaultShiftId,
        locationId: employee.defaultLocationId,
      };
      await this.schedule.upsert(entry);
      created.push(entry);
    }
    return [...existing, ...created].sort((a, b) => a.date.localeCompare(b.date));
  }
}
