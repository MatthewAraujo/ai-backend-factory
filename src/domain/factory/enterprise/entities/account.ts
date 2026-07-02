import { AggregateRoot } from '@/core/entities/aggregate-root';
import {
  type UniqueEntityIDLike,
  resolveUniqueEntityID,
} from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import {
  InvalidAccountEmailError,
  MissingAccountPasswordHashError,
} from '@/domain/factory/enterprise/errors/account-errors';

type AccountProps = {
  createdAt: Date;
  email: string;
  passwordHash: string;
  updatedAt: Date;
};

type CreateAccountProps = Optional<AccountProps, 'createdAt' | 'updatedAt'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Account extends AggregateRoot<AccountProps> {
  private constructor(
    props: AccountProps,
    id?: ReturnType<typeof resolveUniqueEntityID>,
  ) {
    super(props, id);
  }

  static create(props: CreateAccountProps, id?: UniqueEntityIDLike): Account {
    const email = props.email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      throw new InvalidAccountEmailError();
    }

    const passwordHash = props.passwordHash.trim();

    if (passwordHash.length === 0) {
      throw new MissingAccountPasswordHashError();
    }

    const createdAt = props.createdAt ?? new Date();

    return new Account(
      {
        email,
        passwordHash,
        createdAt,
        updatedAt: props.updatedAt ?? createdAt,
      },
      resolveUniqueEntityID(id),
    );
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
