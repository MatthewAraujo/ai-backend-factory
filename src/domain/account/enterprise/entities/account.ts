import { randomUUID } from 'node:crypto';

type AccountProps = {
  email: string;
  passwordHash: string;
  createdAt?: Date;
  id?: string;
  updatedAt?: Date;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Account {
  private constructor(private readonly props: Required<AccountProps>) {}

  static create(props: AccountProps): Account {
    const email = props.email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      throw new Error('Account email must be valid.');
    }

    const passwordHash = props.passwordHash.trim();

    if (passwordHash.length === 0) {
      throw new Error('Account password hash is required.');
    }

    const createdAt = props.createdAt ?? new Date();

    return new Account({
      id: props.id ?? randomUUID(),
      email,
      passwordHash,
      createdAt,
      updatedAt: props.updatedAt ?? createdAt,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
