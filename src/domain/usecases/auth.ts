import { DomainError, type Employee } from '../entities';
import type { EmployeeRepository } from '../repositories';

export class LoginUseCase {
  constructor(private readonly employees: EmployeeRepository) {}

  async execute(code: string, pin: string): Promise<Employee> {
    const employee = await this.employees.findByCredentials(code.trim().toUpperCase(), pin.trim());
    if (!employee) throw new DomainError('Invalid employee code or PIN.', 'AUTH_INVALID');
    return employee;
  }
}
