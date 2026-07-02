import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { z } from 'zod';

import { RegisterAccountUseCase } from '@/domain/factory/application/use-cases/register-account';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { presentAccount } from '@/infra/http/presenters/account.presenter';
import { presentUseCaseError } from '@/infra/http/presenters/use-case-error-presenter';

const registerAccountBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type RegisterAccountBodySchema = z.infer<typeof registerAccountBodySchema>;

@Controller('/accounts')
export class RegisterAccountController {
  constructor(
    @Inject(RegisterAccountUseCase)
    private readonly registerAccount: RegisterAccountUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(
    @Body(new ZodValidationPipe(registerAccountBodySchema))
    body: RegisterAccountBodySchema,
  ) {
    const result = await this.registerAccount.execute(body);

    if (result.isLeft()) {
      throw presentUseCaseError(result.value);
    }

    return {
      account: presentAccount(result.value.account),
    };
  }
}
