import { Inject, Injectable } from '@nestjs/common';

import type { Encrypter } from '@/domain/factory/application/cryptography/encrypter';
import { signJwt } from '@/infra/auth/jwt';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(@Inject(EnvService) private readonly envService: EnvService) {}

  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return signJwt(
      payload,
      this.envService.jwtAccessTokenSecret,
      60 * 60 * 24 * 7,
    );
  }
}
