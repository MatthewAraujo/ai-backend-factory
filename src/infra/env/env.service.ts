import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '@/infra/env/env';

@Injectable()
export class EnvService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService<Env, true>,
  ) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.configService.getOrThrow('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.configService.getOrThrow('PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow('DATABASE_URL', { infer: true });
  }

  get redisHost(): string {
    return this.configService.getOrThrow('REDIS_HOST', { infer: true });
  }

  get redisPort(): number {
    return this.configService.getOrThrow('REDIS_PORT', { infer: true });
  }

  get redisDb(): number {
    return this.configService.getOrThrow('REDIS_DB', { infer: true });
  }

  get workspaceRoot(): string {
    return this.configService.getOrThrow('WORKSPACE_ROOT', { infer: true });
  }

  get jwtPrivateKey(): string | undefined {
    return this.configService.get('JWT_PRIVATE_KEY');
  }

  get jwtPublicKey(): string | undefined {
    return this.configService.get('JWT_PUBLIC_KEY');
  }
}
