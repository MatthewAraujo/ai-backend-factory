import { Module } from '@nestjs/common';

import { HealthController } from '@/infra/http/controllers/health.controller';

@Module({
  controllers: [HealthController],
})
export class HttpModule {}

