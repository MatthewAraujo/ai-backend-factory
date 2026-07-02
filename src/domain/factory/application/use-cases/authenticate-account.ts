import { Inject, Injectable } from '@nestjs/common';

import { type Either, left, right } from '@/core/either';
import { Encrypter } from '@/domain/factory/application/cryptography/encrypter';
import { HashComparer } from '@/domain/factory/application/cryptography/hash-comparer';
import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { InvalidCredentialsError } from '@/domain/factory/application/use-cases/errors/invalid-credentials-error';

type AuthenticateAccountUseCaseRequest = {
  email: string;
  password: string;
};

type AuthenticateAccountUseCaseResponse = Either<
  InvalidCredentialsError,
  {
    accessToken: string;
  }
>;

@Injectable()
export class AuthenticateAccountUseCase {
  constructor(
    @Inject(AccountsRepository)
    private readonly accountsRepository: AccountsRepository,
    @Inject(HashComparer)
    private readonly hashComparer: HashComparer,
    @Inject(Encrypter)
    private readonly encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateAccountUseCaseRequest): Promise<AuthenticateAccountUseCaseResponse> {
    const account = await this.accountsRepository.findByEmail(email);

    if (!account) {
      return left(new InvalidCredentialsError());
    }

    const doesPasswordMatch = await this.hashComparer.compare(
      password,
      account.passwordHash,
    );

    if (!doesPasswordMatch) {
      return left(new InvalidCredentialsError());
    }

    const accessToken = await this.encrypter.encrypt({
      sub: account.id.toString(),
    });

    return right({
      accessToken,
    });
  }
}
