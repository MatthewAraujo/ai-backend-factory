import { randomUUID } from 'node:crypto';

export enum GenerationJobState {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

type GenerationJobProps = {
  completedAt?: Date | null;
  createdAt?: Date;
  failureReason?: string | null;
  id?: string;
  notes: string;
  outputPath?: string | null;
  ownerId: string;
  projectDescription: string;
  projectName: string;
  startedAt?: Date | null;
  state?: GenerationJobState;
  updatedAt?: Date;
};

export class GenerationJob {
  private constructor(private props: Required<GenerationJobProps>) {}

  static create(props: GenerationJobProps): GenerationJob {
    const projectName = props.projectName.trim();
    const projectDescription = props.projectDescription.trim();
    const notes = props.notes.trim();
    const ownerId = props.ownerId.trim();

    if (ownerId.length === 0) {
      throw new Error('Generation job owner is required.');
    }

    if (projectName.length === 0) {
      throw new Error('Generation job project name is required.');
    }

    if (projectDescription.length === 0) {
      throw new Error('Generation job project description is required.');
    }

    const createdAt = props.createdAt ?? new Date();

    return new GenerationJob({
      id: props.id ?? randomUUID(),
      ownerId,
      projectName,
      projectDescription,
      notes,
      state: props.state ?? GenerationJobState.PENDING,
      outputPath: props.outputPath ?? null,
      failureReason: props.failureReason ?? null,
      startedAt: props.startedAt ?? null,
      completedAt: props.completedAt ?? null,
      createdAt,
      updatedAt: props.updatedAt ?? createdAt,
    });
  }

  start(startedAt: Date = new Date()): void {
    if (this.props.state !== GenerationJobState.PENDING) {
      throw new Error('Only pending jobs can start.');
    }

    this.props.state = GenerationJobState.RUNNING;
    this.props.startedAt = startedAt;
    this.props.updatedAt = startedAt;
  }

  succeed(outputPath: string, completedAt: Date = new Date()): void {
    if (this.props.state !== GenerationJobState.RUNNING) {
      throw new Error('Only running jobs can succeed.');
    }

    const normalizedOutputPath = outputPath.trim();

    if (normalizedOutputPath.length === 0) {
      throw new Error('Successful jobs require an output path.');
    }

    this.props.state = GenerationJobState.SUCCEEDED;
    this.props.outputPath = normalizedOutputPath;
    this.props.failureReason = null;
    this.props.completedAt = completedAt;
    this.props.updatedAt = completedAt;
  }

  fail(failureReason: string, completedAt: Date = new Date()): void {
    if (this.props.state !== GenerationJobState.RUNNING) {
      throw new Error('Only running jobs can fail.');
    }

    const normalizedFailureReason = failureReason.trim();

    if (normalizedFailureReason.length === 0) {
      throw new Error('Failed jobs require a failure reason.');
    }

    this.props.state = GenerationJobState.FAILED;
    this.props.failureReason = normalizedFailureReason;
    this.props.outputPath = null;
    this.props.completedAt = completedAt;
    this.props.updatedAt = completedAt;
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get projectName(): string {
    return this.props.projectName;
  }

  get projectDescription(): string {
    return this.props.projectDescription;
  }

  get notes(): string {
    return this.props.notes;
  }

  get state(): GenerationJobState {
    return this.props.state;
  }

  get outputPath(): string | null {
    return this.props.outputPath;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
