import type { Account } from '@/domain/factory/enterprise/entities/account';

export abstract class AccountsRepository {
  abstract create(account: Account): Promise<void>;
  abstract save(account: Account): Promise<void>;
  abstract findByEmail(email: string): Promise<Account | null>;
  abstract findById(id: string): Promise<Account | null>;
}
