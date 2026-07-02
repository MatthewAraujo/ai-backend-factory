import { Module } from '@nestjs/common';

import { AccountsRepository } from '@/domain/account/application/repositories/accounts-repository';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PrismaAccountsRepository } from '@/infra/database/prisma/repositories/prisma-accounts-repository';
import { PrismaGenerationJobsRepository } from '@/infra/database/prisma/repositories/prisma-generation-jobs-repository';
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository';

@Module({
  providers: [
    PrismaService,
    {
      provide: AccountsRepository,
      useClass: PrismaAccountsRepository,
    },
    {
      provide: GenerationJobsRepository,
      useClass: PrismaGenerationJobsRepository,
    },
    {
      provide: NotificationsRepository,
      useClass: PrismaNotificationsRepository,
    },
  ],
  exports: [
    PrismaService,
    AccountsRepository,
    GenerationJobsRepository,
    NotificationsRepository,
  ],
})
export class DatabaseModule {}
