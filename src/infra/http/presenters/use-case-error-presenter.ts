import {
  ConflictException,
  type HttpException,
  UnauthorizedException,
} from '@nestjs/common';

import type { UseCaseError } from '@/core/errors/use-case-error';
import { AccountAlreadyExistsError } from '@/domain/factory/application/use-cases/errors/account-already-exists-error';
import { InvalidCredentialsError } from '@/domain/factory/application/use-cases/errors/invalid-credentials-error';

export function presentUseCaseError(error: UseCaseError): HttpException {
  if (error instanceof AccountAlreadyExistsError) {
    return new ConflictException(error.message);
  }

  if (error instanceof InvalidCredentialsError) {
    return new UnauthorizedException(error.message);
  }

  return new UnauthorizedException(error.message);
}
