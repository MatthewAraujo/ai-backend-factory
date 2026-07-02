import type { HashGenerator } from '@/domain/factory/application/cryptography/hash-generator';
import type { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { AccountAlreadyExistsError } from '@/domain/factory/application/use-cases/errors/account-already-exists-error';
import { RegisterAccountUseCase } from '@/domain/factory/application/use-cases/register-account';
import type { Account } from '@/domain/factory/enterprise/entities/account';

class InMemoryAccountsRepository implements AccountsRepository {
  public items: Account[] = [];

  async create(account: Account): Promise<void> {
    this.items.push(account);
  }

  async save(account: Account): Promise<void> {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(account.id),
    );
    this.items[itemIndex] = account;
  }

  async findByEmail(email: string): Promise<Account | null> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.items.find((item) => item.email === normalizedEmail) ?? null;
  }

  async findById(id: string): Promise<Account | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }
}

class FakeHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
}

describe('RegisterAccountUseCase', () => {
  it('registers a new account with a hashed password', async () => {
    const accountsRepository = new InMemoryAccountsRepository();
    const hashGenerator = new FakeHashGenerator();
    const sut = new RegisterAccountUseCase(accountsRepository, hashGenerator);

    const result = await sut.execute({
      email: 'Factory.User@example.com',
      password: 'secret-123',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      account: {
        email: 'factory.user@example.com',
        passwordHash: 'hashed:secret-123',
      },
    });
    expect(accountsRepository.items).toHaveLength(1);
  });

  it('rejects registration when the email is already in use', async () => {
    const accountsRepository = new InMemoryAccountsRepository();
    const hashGenerator = new FakeHashGenerator();
    const sut = new RegisterAccountUseCase(accountsRepository, hashGenerator);

    await sut.execute({
      email: 'factory.user@example.com',
      password: 'secret-123',
    });

    const result = await sut.execute({
      email: ' FACTORY.USER@example.com ',
      password: 'secret-456',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AccountAlreadyExistsError);
    expect(accountsRepository.items).toHaveLength(1);
  });
});
