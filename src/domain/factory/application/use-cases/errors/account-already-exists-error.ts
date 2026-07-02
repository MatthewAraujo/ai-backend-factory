import { UseCaseError } from '@/core/errors/use-case-error';

export class AccountAlreadyExistsError extends UseCaseError {
  constructor() {
    super('Account already exists.');
  }
}
