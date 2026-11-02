import type { OfficeLocation } from '@/domain/entities';
import type { LocationRepository } from '@/domain/repositories';
import { SEED_LOCATIONS } from '../seed';
import type { KeyValueStore } from '../storage/KeyValueStore';

const KEY = 'custom_locations';

export class LocationRepositoryImpl implements LocationRepository {
  constructor(private readonly store: KeyValueStore) {}

  private async custom(): Promise<OfficeLocation[]> {
    return (await this.store.read<OfficeLocation[]>(KEY)) ?? [];
  }

  async getAll(): Promise<OfficeLocation[]> {
    return [...SEED_LOCATIONS, ...(await this.custom())];
  }

  async getById(id: string): Promise<OfficeLocation | null> {
    return (await this.getAll()).find((l) => l.id === id) ?? null;
  }

  async add(location: OfficeLocation): Promise<void> {
    const list = await this.custom();
    await this.store.write(KEY, [...list, location]);
  }

  async remove(id: string): Promise<void> {
    const list = await this.custom();
    await this.store.write(
      KEY,
      list.filter((l) => l.id !== id),
    );
  }
}
