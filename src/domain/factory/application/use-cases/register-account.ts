import { Inject, Injectable } from '@nestjs/common';

import { type Either, left, right } from '@/core/either';
import { HashGenerator } from '@/domain/factory/application/cryptography/hash-generator';
import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { AccountAlreadyExistsError } from '@/domain/factory/application/use-cases/errors/account-already-exists-error';
import { Account } from '@/domain/factory/enterprise/entities/account';

type RegisterAccountUseCaseRequest = {
  email: string;
  password: string;
};

type RegisterAccountUseCaseResponse = Either<
  AccountAlreadyExistsError,
  {
    account: Account;
  }
>;

@Injectable()
export class RegisterAccountUseCase {
  constructor(
    @Inject(AccountsRepository)
    private readonly accountsRepository: AccountsRepository,
    @Inject(HashGenerator)
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute({
    email,
    password,
  }: RegisterAccountUseCaseRequest): Promise<RegisterAccountUseCaseResponse> {
    const existingAccount = await this.accountsRepository.findByEmail(email);

    if (existingAccount) {
      return left(new AccountAlreadyExistsError());
    }

    const passwordHash = await this.hashGenerator.hash(password);
    const account = Account.create({
      email,
      passwordHash,
    });

    await this.accountsRepository.create(account);

    return right({
      account,
    });
  }
}
