import type { AttendanceRecord } from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import type { KeyValueStore } from '../storage/KeyValueStore';

const KEY = 'attendance_records';
const MAX_RECORDS = 400;

export class AttendanceRepositoryImpl implements AttendanceRepository {
  constructor(private readonly store: KeyValueStore) {}

  private async all(): Promise<AttendanceRecord[]> {
    return (await this.store.read<AttendanceRecord[]>(KEY)) ?? [];
  }

  async getOpenRecord(employeeId: string): Promise<AttendanceRecord | null> {
    const list = await this.all();
    return list.find((r) => r.employeeId === employeeId && !r.clockOutAt) ?? null;
  }

  async getHistory(employeeId: string, limit = 60): Promise<AttendanceRecord[]> {
    const list = await this.all();
    return list
      .filter((r) => r.employeeId === employeeId)
      .sort((a, b) => b.clockInAt - a.clockInAt)
      .slice(0, limit);
  }

  async save(record: AttendanceRecord): Promise<void> {
    const list = await this.all();
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    list.sort((a, b) => b.clockInAt - a.clockInAt);
    await this.store.write(KEY, list.slice(0, MAX_RECORDS));
  }
}
