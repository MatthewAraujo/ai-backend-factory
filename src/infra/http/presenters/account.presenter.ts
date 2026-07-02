import type { Account } from '@/domain/factory/enterprise/entities/account';

export function presentAccount(account: Account) {
  return {
    id: account.id.toString(),
    email: account.email,
  };
}
