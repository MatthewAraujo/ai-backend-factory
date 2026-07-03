import { Module } from '@nestjs/common';

import { GeneratedServiceGenerator } from '@/domain/factory/application/services/generated-service-generator';
import { GeneratedServiceWorkflowRunner } from '@/domain/factory/application/services/generated-service-workflow-runner';
import { GenerationJobDispatcher } from '@/domain/factory/application/services/generation-job-dispatcher';
import { AuthenticateAccountUseCase } from '@/domain/factory/application/use-cases/authenticate-account';
import { CreateGenerationJobUseCase } from '@/domain/factory/application/use-cases/create-generation-job';
import { GetGenerationJobDetailsUseCase } from '@/domain/factory/application/use-cases/get-generation-job-details';
import { ListUserGenerationJobsUseCase } from '@/domain/factory/application/use-cases/list-user-generation-jobs';
import { ProcessGenerationJobUseCase } from '@/domain/factory/application/use-cases/process-generation-job';
import { RegisterAccountUseCase } from '@/domain/factory/application/use-cases/register-account';
import { OnGenerationJobTerminalState } from '@/domain/notification/application/subscribers/on-generation-job-terminal-state';
import { ListNotificationsUseCase } from '@/domain/notification/application/use-cases/list-notifications';
import { ReadNotificationUseCase } from '@/domain/notification/application/use-cases/read-notification';
import { AuthModule } from '@/infra/auth/auth.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvModule } from '@/infra/env/env.module';
import { InProcessGenerationJobDispatcher } from '@/infra/events/in-process-generation-job-dispatcher';
import { RegisterDomainEventHandlers } from '@/infra/events/register-domain-event-handlers';
import { EnvWorkspaceRootPathProvider } from '@/infra/filesystem/env-workspace-root-path-provider';
import { LocalGeneratedServiceGenerator } from '@/infra/filesystem/local-generated-service-generator';
import { WorkspaceRootPathProvider } from '@/infra/filesystem/workspace-root-path-provider';
import { AuthenticateAccountController } from '@/infra/http/controllers/authenticate-account.controller';
import { CreateGenerationJobController } from '@/infra/http/controllers/create-generation-job.controller';
import { GetGenerationJobController } from '@/infra/http/controllers/get-generation-job.controller';
import { HealthController } from '@/infra/http/controllers/health.controller';
import { ListGenerationJobsController } from '@/infra/http/controllers/list-generation-jobs.controller';
import { ListNotificationsController } from '@/infra/http/controllers/list-notifications.controller';
import { ReadNotificationController } from '@/infra/http/controllers/read-notification.controller';
import { RegisterAccountController } from '@/infra/http/controllers/register-account.controller';
import { GitCliProcessRunner } from '@/infra/process/git-cli-process-runner';
import { GitProcessRunner } from '@/infra/process/git-process-runner';
import { OrchestrationGeneratedServiceWorkflowRunner } from '@/infra/process/orchestration-generated-service-workflow-runner';

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
    ProcessGenerationJobUseCase,
    ListUserGenerationJobsUseCase,
    GetGenerationJobDetailsUseCase,
    ListNotificationsUseCase,
    ReadNotificationUseCase,
    OnGenerationJobTerminalState,
    RegisterDomainEventHandlers,
    GitCliProcessRunner,
    OrchestrationGeneratedServiceWorkflowRunner,
    {
      provide: GitProcessRunner,
      useExisting: GitCliProcessRunner,
    },
    {
      provide: GeneratedServiceWorkflowRunner,
      useExisting: OrchestrationGeneratedServiceWorkflowRunner,
    },
    {
      provide: WorkspaceRootPathProvider,
      useClass: EnvWorkspaceRootPathProvider,
    },
    {
      provide: GeneratedServiceGenerator,
      useClass: LocalGeneratedServiceGenerator,
    },
    {
      provide: GenerationJobDispatcher,
      useClass: InProcessGenerationJobDispatcher,
    },
  ],
})
export class HttpModule {}
