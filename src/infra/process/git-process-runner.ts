export abstract class GitProcessRunner {
  abstract initRepository(directory: string): Promise<void>;
}
