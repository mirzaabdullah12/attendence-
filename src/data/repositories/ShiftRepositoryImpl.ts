import type { ShiftTemplate } from '@/domain/entities';
import type { ShiftRepository } from '@/domain/repositories';
import { SEED_SHIFTS } from '../seed';

export class ShiftRepositoryImpl implements ShiftRepository {
  async getAll(): Promise<ShiftTemplate[]> {
    return SEED_SHIFTS;
  }

  async getById(id: string): Promise<ShiftTemplate | null> {
    return SEED_SHIFTS.find((s) => s.id === id) ?? null;
  }
}
