import { Module } from '@nestjs/common';

import { AuthenticateAccountUseCase } from '@/domain/factory/application/use-cases/authenticate-account';
import { RegisterAccountUseCase } from '@/domain/factory/application/use-cases/register-account';
import { AuthModule } from '@/infra/auth/auth.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvModule } from '@/infra/env/env.module';
import { AuthenticateAccountController } from '@/infra/http/controllers/authenticate-account.controller';
import { HealthController } from '@/infra/http/controllers/health.controller';
import { RegisterAccountController } from '@/infra/http/controllers/register-account.controller';

@Module({
  imports: [EnvModule, DatabaseModule, AuthModule],
  controllers: [
    HealthController,
    RegisterAccountController,
    AuthenticateAccountController,
  ],
  providers: [RegisterAccountUseCase, AuthenticateAccountUseCase],
})
export class HttpModule {}
