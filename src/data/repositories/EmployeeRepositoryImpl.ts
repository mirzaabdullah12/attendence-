import type { Employee } from '@/domain/entities';
import type { EmployeeRepository } from '@/domain/repositories';
import { SEED_EMPLOYEES } from '../seed';

export class EmployeeRepositoryImpl implements EmployeeRepository {
  async getAll(): Promise<Employee[]> {
    return SEED_EMPLOYEES;
  }

  async getById(id: string): Promise<Employee | null> {
    return SEED_EMPLOYEES.find((e) => e.id === id) ?? null;
  }

  async findByCredentials(code: string, pin: string): Promise<Employee | null> {
    return SEED_EMPLOYEES.find((e) => e.code === code && e.pin === pin) ?? null;
  }
}
