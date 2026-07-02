import { Module } from '@nestjs/common';

import { Encrypter } from '@/domain/factory/application/cryptography/encrypter';
import { HashComparer } from '@/domain/factory/application/cryptography/hash-comparer';
import { HashGenerator } from '@/domain/factory/application/cryptography/hash-generator';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher';
import { JwtEncrypter } from '@/infra/cryptography/jwt-encrypter';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvModule } from '@/infra/env/env.module';

@Module({
  imports: [DatabaseModule, EnvModule],
  providers: [
    BcryptHasher,
    JwtEncrypter,
    JwtAuthGuard,
    {
      provide: HashGenerator,
      useExisting: BcryptHasher,
    },
    {
      provide: HashComparer,
      useExisting: BcryptHasher,
    },
    {
      provide: Encrypter,
      useExisting: JwtEncrypter,
    },
  ],
  exports: [JwtAuthGuard, HashGenerator, HashComparer, Encrypter],
})
export class AuthModule {}
