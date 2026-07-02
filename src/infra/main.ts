import 'reflect-metadata';

import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@/infra/app.module';
import { EnvService } from '@/infra/env/env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(new ConsoleLogger('HTTP'));
  app.enableShutdownHooks();

  const envService = app.get(EnvService);

  await app.listen(envService.port);
}

void bootstrap();
