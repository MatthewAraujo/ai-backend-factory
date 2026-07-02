import { DomainError } from '@/core/errors/domain-error';

export class InvalidAccountEmailError extends DomainError {
  constructor() {
    super('Account email must be valid.');
  }
}

export class MissingAccountPasswordHashError extends DomainError {
  constructor() {
    super('Account password hash is required.');
  }
}
