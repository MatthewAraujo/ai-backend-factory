import { Module } from '@nestjs/common';

import { EnvModule } from '@/infra/env/env.module';
import { HealthController } from '@/infra/http/controllers/health.controller';

@Module({
  imports: [EnvModule],
  controllers: [HealthController],
})
export class HttpModule {}
