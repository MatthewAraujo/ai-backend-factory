import {
  ConflictException,
  type HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import type { UseCaseError } from '@/core/errors/use-case-error';
import { AccountAlreadyExistsError } from '@/domain/factory/application/use-cases/errors/account-already-exists-error';
import { InvalidCredentialsError } from '@/domain/factory/application/use-cases/errors/invalid-credentials-error';
import { ResourceNotFoundError } from '@/domain/factory/application/use-cases/errors/resource-not-found-error';

export function presentUseCaseError(error: UseCaseError): HttpException {
  if (error instanceof AccountAlreadyExistsError) {
    return new ConflictException(error.message);
  }

  if (error instanceof InvalidCredentialsError) {
    return new UnauthorizedException(error.message);
  }

  if (error instanceof ResourceNotFoundError) {
    return new NotFoundException(error.message);
  }

  return new UnauthorizedException(error.message);
}
