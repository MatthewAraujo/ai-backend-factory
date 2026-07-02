import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { buildEnv } from '@/infra/env/env';
import { EnvModule } from '@/infra/env/env.module';
import { HttpModule } from '@/infra/http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: buildEnv,
    }),
    EnvModule,
    HttpModule,
  ],
})
export class AppModule {}
