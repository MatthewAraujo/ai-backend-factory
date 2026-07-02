import { Account } from '@/domain/account/enterprise/entities/account';

describe('Account', () => {
  it('normalizes the email address on creation', () => {
    const account = Account.create({
      email: '  Factory.User@Example.com ',
      passwordHash: 'hashed-password',
    });

    expect(account.email).toBe('factory.user@example.com');
  });

  it('rejects invalid email addresses', () => {
    expect(() =>
      Account.create({
        email: 'invalid-email',
        passwordHash: 'hashed-password',
      }),
    ).toThrowError('Account email must be valid.');
  });

  it('requires a non-empty password hash', () => {
    expect(() =>
      Account.create({
        email: 'factory.user@example.com',
        passwordHash: '   ',
      }),
    ).toThrowError('Account password hash is required.');
  });
});
