import type { Account as PrismaAccount } from '@prisma/client';

import { Account } from '@/domain/factory/enterprise/entities/account';

export function toDomainAccount(raw: PrismaAccount): Account {
  return Account.create(
    {
      email: raw.email,
      passwordHash: raw.passwordHash,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    raw.id,
  );
}

export function toPrismaAccount(account: Account): PrismaAccount {
  return {
    id: account.id.toString(),
    email: account.email,
    passwordHash: account.passwordHash,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
