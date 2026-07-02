import type { Account as PrismaAccount } from '@prisma/client';

import { Account } from '@/domain/account/enterprise/entities/account';

export function toDomainAccount(raw: PrismaAccount): Account {
  return Account.create({
    id: raw.id,
    email: raw.email,
    passwordHash: raw.passwordHash,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export function toPrismaAccount(account: Account): PrismaAccount {
  return {
    id: account.id,
    email: account.email,
    passwordHash: account.passwordHash,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
