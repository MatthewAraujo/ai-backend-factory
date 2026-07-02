import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Account } from '@/domain/factory/enterprise/entities/account';
import {
  InvalidAccountEmailError,
  MissingAccountPasswordHashError,
} from '@/domain/factory/enterprise/errors/account-errors';

describe('Account', () => {
  it('normalizes the email address on creation', () => {
    const account = Account.create({
      email: '  Factory.User@Example.com ',
      passwordHash: 'hashed-password',
    });

    expect(account.email).toBe('factory.user@example.com');
    expect(account.id).toBeInstanceOf(UniqueEntityID);
  });

  it('rejects invalid email addresses', () => {
    expect(() =>
      Account.create({
        email: 'invalid-email',
        passwordHash: 'hashed-password',
      }),
    ).toThrowError(InvalidAccountEmailError);
  });

  it('requires a non-empty password hash', () => {
    expect(() =>
      Account.create({
        email: 'factory.user@example.com',
        passwordHash: '   ',
      }),
    ).toThrowError(MissingAccountPasswordHashError);
  });
});
