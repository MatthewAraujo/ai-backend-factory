import type { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import type { Account } from '@/domain/factory/enterprise/entities/account';

export class InMemoryAccountsRepository implements AccountsRepository {
  public items: Account[] = [];

  async create(account: Account): Promise<void> {
    this.items.push(account);
  }

  async save(account: Account): Promise<void> {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(account.id),
    );

    if (itemIndex >= 0) {
      this.items[itemIndex] = account;
    }
  }

  async findByEmail(email: string): Promise<Account | null> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.items.find((item) => item.email === normalizedEmail) ?? null;
  }

  async findById(id: string): Promise<Account | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }
}
