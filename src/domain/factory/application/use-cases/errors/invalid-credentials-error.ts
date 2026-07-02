import { UseCaseError } from '@/core/errors/use-case-error';

export class InvalidCredentialsError extends UseCaseError {
  constructor() {
    super('Invalid credentials.');
  }
}
