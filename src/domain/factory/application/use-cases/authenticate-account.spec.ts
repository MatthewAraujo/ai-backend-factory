import type { Encrypter } from '@/domain/factory/application/cryptography/encrypter';
import type { HashComparer } from '@/domain/factory/application/cryptography/hash-comparer';
import type { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { AuthenticateAccountUseCase } from '@/domain/factory/application/use-cases/authenticate-account';
import { InvalidCredentialsError } from '@/domain/factory/application/use-cases/errors/invalid-credentials-error';
import type { Account } from '@/domain/factory/enterprise/entities/account';
import { makeAccount } from '../../../../../test/factories/make-account';

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

class FakeHashComparer implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

class FakeEncrypter implements Encrypter {
  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return `token:${String(payload.sub)}`;
  }
}

describe('AuthenticateAccountUseCase', () => {
  it('authenticates an existing account and returns an access token', async () => {
    const accountsRepository = new InMemoryAccountsRepository();
    const sut = new AuthenticateAccountUseCase(
      accountsRepository,
      new FakeHashComparer(),
      new FakeEncrypter(),
    );

    await accountsRepository.create(
      makeAccount({
        id: 'account-1',
        email: 'factory.user@example.com',
        passwordHash: 'hashed:secret-123',
      }),
    );

    const result = await sut.execute({
      email: 'FACTORY.USER@example.com',
      password: 'secret-123',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      accessToken: 'token:account-1',
    });
  });

  it('rejects authentication when the credentials are invalid', async () => {
    const accountsRepository = new InMemoryAccountsRepository();
    const sut = new AuthenticateAccountUseCase(
      accountsRepository,
      new FakeHashComparer(),
      new FakeEncrypter(),
    );

    await accountsRepository.create(
      makeAccount({
        email: 'factory.user@example.com',
        passwordHash: 'hashed:secret-123',
      }),
    );

    const result = await sut.execute({
      email: 'factory.user@example.com',
      password: 'wrong-password',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
  });
});
