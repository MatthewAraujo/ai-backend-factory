export abstract class GenerationJobDispatcher {
  abstract dispatch(generationJobId: string): Promise<void>;
}
