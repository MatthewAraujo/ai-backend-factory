export abstract class GeneratedServiceWorkflowRunner {
  abstract run(params: {
    featureFileRelativePath: string;
    repositoryPath: string;
  }): Promise<void>;
}
