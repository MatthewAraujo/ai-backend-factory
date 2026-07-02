import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import type { HashComparer } from '@/domain/factory/application/cryptography/hash-comparer';
import type { HashGenerator } from '@/domain/factory/application/cryptography/hash-generator';

@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  async hash(plain: string): Promise<string> {
    return hash(plain, 8);
  }

  async compare(plain: string, passwordHash: string): Promise<boolean> {
    return compare(plain, passwordHash);
  }
}
