export abstract class UseCaseError extends Error {
  protected constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnexpectedUseCaseError extends UseCaseError {
  constructor(cause?: unknown) {
    super('Unexpected use-case error.', cause);
  }
}
