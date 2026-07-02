import { DomainError } from '@/core/errors/domain-error';

export class MissingGenerationJobOwnerError extends DomainError {
  constructor() {
    super('Generation job owner is required.');
  }
}

export class MissingGenerationJobProjectNameError extends DomainError {
  constructor() {
    super('Generation job project name is required.');
  }
}

export class MissingGenerationJobProjectDescriptionError extends DomainError {
  constructor() {
    super('Generation job project description is required.');
  }
}

export class InvalidGenerationJobStartTransitionError extends DomainError {
  constructor() {
    super('Only pending jobs can start.');
  }
}

export class InvalidGenerationJobSuccessTransitionError extends DomainError {
  constructor() {
    super('Only running jobs can succeed.');
  }
}

export class MissingGenerationJobOutputPathError extends DomainError {
  constructor() {
    super('Successful jobs require an output path.');
  }
}

export class InvalidGenerationJobFailureTransitionError extends DomainError {
  constructor() {
    super('Only running jobs can fail.');
  }
}

export class MissingGenerationJobFailureReasonError extends DomainError {
  constructor() {
    super('Failed jobs require a failure reason.');
  }
}
