import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import type { CurrentUser } from '@/infra/auth/current-user';
import { verifyJwt } from '@/infra/auth/jwt';
import { EnvService } from '@/infra/env/env.service';

type AuthenticatedRequest = {
  currentUser?: CurrentUser;
  headers: Record<string, string | string[] | undefined>;
};

type JwtPayload = {
  sub?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AccountsRepository)
    private readonly accountsRepository: AccountsRepository,
    @Inject(EnvService) private readonly envService: EnvService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromAuthorizationHeader(
      request.headers.authorization,
    );

    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    let payload: JwtPayload;

    try {
      payload = verifyJwt(
        token,
        this.envService.jwtAccessTokenSecret,
      ) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const account = await this.accountsRepository.findById(payload.sub);

    if (!account) {
      throw new UnauthorizedException('Invalid access token.');
    }

    request.currentUser = {
      id: account.id.toString(),
      email: account.email,
    };

    return true;
  }

  private extractTokenFromAuthorizationHeader(
    authorizationHeader?: string | string[],
  ): string | null {
    if (typeof authorizationHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
