import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type Env } from '@/infra/env/env';

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true })!;
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true })!;
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true })!;
  }

  get redisHost(): string {
    return this.configService.get('REDIS_HOST', { infer: true })!;
  }

  get redisPort(): number {
    return this.configService.get('REDIS_PORT', { infer: true })!;
  }

  get redisDb(): number {
    return this.configService.get('REDIS_DB', { infer: true })!;
  }

  get workspaceRoot(): string {
    return this.configService.get('WORKSPACE_ROOT', { infer: true })!;
  }

  get jwtPrivateKey(): string | undefined {
    return this.configService.get('JWT_PRIVATE_KEY');
  }

  get jwtPublicKey(): string | undefined {
    return this.configService.get('JWT_PUBLIC_KEY');
  }
}

