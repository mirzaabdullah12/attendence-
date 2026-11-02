import { createId } from '@/core/utils/id';
import { DomainError, type Employee, type GeoPoint, type OfficeLocation, type Region } from '../entities';
import type { LocationRepository } from '../repositories';

export interface AddOfficeInput {
  name: string;
  address: string;
  region: Region;
  timeZone: string;
  radiusMeters: number;
  point: GeoPoint;
}

export class AddOfficeLocationUseCase {
  constructor(private readonly locations: LocationRepository) {}

  async execute(actor: Employee, input: AddOfficeInput): Promise<OfficeLocation> {
    if (actor.role !== 'manager') {
      throw new DomainError('Only managers can add office locations.', 'FORBIDDEN');
    }
    if (!input.name.trim()) throw new DomainError('Office name is required.', 'VALIDATION');
    const office: OfficeLocation = {
      id: createId('loc'),
      name: input.name.trim(),
      address: input.address.trim() || 'Pinned from current GPS position',
      region: input.region,
      timeZone: input.timeZone,
      latitude: input.point.latitude,
      longitude: input.point.longitude,
      radiusMeters: Math.min(2000, Math.max(50, Math.round(input.radiusMeters))),
      isCustom: true,
    };
    await this.locations.add(office);
    return office;
  }
}

export class RemoveOfficeLocationUseCase {
  constructor(private readonly locations: LocationRepository) {}

  async execute(actor: Employee, id: string): Promise<void> {
    if (actor.role !== 'manager') {
      throw new DomainError('Only managers can remove office locations.', 'FORBIDDEN');
    }
    const office = await this.locations.getById(id);
    if (!office?.isCustom) throw new DomainError('Built-in offices cannot be removed.', 'FORBIDDEN');
    await this.locations.remove(id);
  }
}
