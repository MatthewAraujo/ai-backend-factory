import { Injectable } from '@nestjs/common';
import type { Account as PrismaAccount } from '@prisma/client';

import type { AccountsRepository } from '@/domain/account/application/repositories/accounts-repository';
import type { Account } from '@/domain/account/enterprise/entities/account';
import {
  toDomainAccount,
  toPrismaAccount,
} from '@/infra/database/prisma/mappers/prisma-account-mapper';

type PrismaAccountsClient = {
  account: {
    create(args: { data: PrismaAccount }): Promise<PrismaAccount>;
    update(args: {
      data: PrismaAccount;
      where: { id: string };
    }): Promise<PrismaAccount>;
    findUnique(args: {
      where: { email?: string; id?: string };
    }): Promise<PrismaAccount | null>;
  };
};

@Injectable()
export class PrismaAccountsRepository implements AccountsRepository {
  constructor(private readonly prisma: PrismaAccountsClient) {}

  async create(account: Account): Promise<void> {
    await this.prisma.account.create({
      data: toPrismaAccount(account),
    });
  }

  async save(account: Account): Promise<void> {
    await this.prisma.account.update({
      where: {
        id: account.id.toString(),
      },
      data: toPrismaAccount(account),
    });
  }

  async findByEmail(email: string): Promise<Account | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const account = await this.prisma.account.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!account) {
      return null;
    }

    return toDomainAccount(account);
  }

  async findById(id: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        id,
      },
    });

    if (!account) {
      return null;
    }

    return toDomainAccount(account);
  }
}
