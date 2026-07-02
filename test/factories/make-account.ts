import { Account } from '@/domain/account/enterprise/entities/account';

type MakeAccountOverrides = Partial<{
  createdAt: Date;
  email: string;
  id: string;
  passwordHash: string;
  updatedAt: Date;
}>;

export function makeAccount(overrides: MakeAccountOverrides = {}): Account {
  return Account.create(
    {
      email: overrides.email ?? 'factory.user@example.com',
      passwordHash: overrides.passwordHash ?? 'hashed-password',
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
    },
    overrides.id,
  );
}
