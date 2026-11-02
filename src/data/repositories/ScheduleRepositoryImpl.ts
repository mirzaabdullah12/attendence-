import type { DateKey, ScheduleEntry } from '@/domain/entities';
import type { ScheduleRepository } from '@/domain/repositories';
import type { KeyValueStore } from '../storage/KeyValueStore';

const KEY = 'schedule_entries';

export class ScheduleRepositoryImpl implements ScheduleRepository {
  constructor(private readonly store: KeyValueStore) {}

  private async all(): Promise<ScheduleEntry[]> {
    return (await this.store.read<ScheduleEntry[]>(KEY)) ?? [];
  }

  async getForEmployee(employeeId: string, from: DateKey, to: DateKey): Promise<ScheduleEntry[]> {
    const list = await this.all();
    return list
      .filter((e) => e.employeeId === employeeId && e.date >= from && e.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getForDate(employeeId: string, date: DateKey): Promise<ScheduleEntry | null> {
    const list = await this.all();
    return list.find((e) => e.employeeId === employeeId && e.date === date) ?? null;
  }

  async upsert(entry: ScheduleEntry): Promise<void> {
    const list = await this.all();
    const next = list.filter(
      (e) => e.id !== entry.id && !(e.employeeId === entry.employeeId && e.date === entry.date),
    );
    await this.store.write(KEY, [...next, entry]);
  }

  async remove(id: string): Promise<void> {
    const list = await this.all();
    await this.store.write(
      KEY,
      list.filter((e) => e.id !== id),
    );
  }
}
