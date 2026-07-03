import { Module } from '@nestjs/common';

import { AuthenticateAccountUseCase } from '@/domain/factory/application/use-cases/authenticate-account';
import { CreateGenerationJobUseCase } from '@/domain/factory/application/use-cases/create-generation-job';
import { GetGenerationJobDetailsUseCase } from '@/domain/factory/application/use-cases/get-generation-job-details';
import { ListUserGenerationJobsUseCase } from '@/domain/factory/application/use-cases/list-user-generation-jobs';
import { RegisterAccountUseCase } from '@/domain/factory/application/use-cases/register-account';
import { ListNotificationsUseCase } from '@/domain/notification/application/use-cases/list-notifications';
import { ReadNotificationUseCase } from '@/domain/notification/application/use-cases/read-notification';
import { AuthModule } from '@/infra/auth/auth.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvModule } from '@/infra/env/env.module';
import { AuthenticateAccountController } from '@/infra/http/controllers/authenticate-account.controller';
import { CreateGenerationJobController } from '@/infra/http/controllers/create-generation-job.controller';
import { GetGenerationJobController } from '@/infra/http/controllers/get-generation-job.controller';
import { HealthController } from '@/infra/http/controllers/health.controller';
import { ListGenerationJobsController } from '@/infra/http/controllers/list-generation-jobs.controller';
import { ListNotificationsController } from '@/infra/http/controllers/list-notifications.controller';
import { ReadNotificationController } from '@/infra/http/controllers/read-notification.controller';
import { RegisterAccountController } from '@/infra/http/controllers/register-account.controller';

@Module({
  imports: [EnvModule, DatabaseModule, AuthModule],
  controllers: [
    HealthController,
    RegisterAccountController,
    AuthenticateAccountController,
    CreateGenerationJobController,
    ListGenerationJobsController,
    GetGenerationJobController,
    ListNotificationsController,
    ReadNotificationController,
  ],
  providers: [
    RegisterAccountUseCase,
    AuthenticateAccountUseCase,
    CreateGenerationJobUseCase,
    ListUserGenerationJobsUseCase,
    GetGenerationJobDetailsUseCase,
    ListNotificationsUseCase,
    ReadNotificationUseCase,
  ],
})
export class HttpModule {}
