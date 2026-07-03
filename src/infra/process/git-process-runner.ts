export abstract class GitProcessRunner {
  abstract initRepository(directory: string): Promise<void>;
  abstract createInitialCommit(
    directory: string,
    message: string,
  ): Promise<void>;
}
