import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { z } from 'zod';

import { AuthenticateAccountUseCase } from '@/domain/factory/application/use-cases/authenticate-account';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { presentUseCaseError } from '@/infra/http/presenters/use-case-error-presenter';

const authenticateAccountBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type AuthenticateAccountBodySchema = z.infer<
  typeof authenticateAccountBodySchema
>;

@Controller('/sessions')
export class AuthenticateAccountController {
  constructor(
    @Inject(AuthenticateAccountUseCase)
    private readonly authenticateAccount: AuthenticateAccountUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body(new ZodValidationPipe(authenticateAccountBodySchema))
    body: AuthenticateAccountBodySchema,
  ) {
    const result = await this.authenticateAccount.execute(body);

    if (result.isLeft()) {
      throw presentUseCaseError(result.value);
    }

    return result.value;
  }
}
