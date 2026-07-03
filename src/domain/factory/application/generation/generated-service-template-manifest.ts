import { readdirSync } from 'node:fs';
import path from 'node:path';

export const GENERATED_SERVICE_TEMPLATE_VERSION = 'v1';

type GeneratedServiceTemplateManifest = {
  artifacts: string[];
  excludedScopes: string[];
  templateRoot: string;
  version: string;
};

const excludedScopes = [
  'custom business routes',
  'domain-specific entities',
  'domain-specific modules',
];

export function getGeneratedServiceTemplateManifest(): GeneratedServiceTemplateManifest {
  const templateRoot = path.resolve(
    process.cwd(),
    'templates/generated-service',
    GENERATED_SERVICE_TEMPLATE_VERSION,
  );

  return {
    version: GENERATED_SERVICE_TEMPLATE_VERSION,
    templateRoot,
    artifacts: collectArtifacts(templateRoot),
    excludedScopes,
  };
}

function collectArtifacts(root: string, currentDir: string = root): string[] {
  const directoryEntries = readdirSync(currentDir, {
    withFileTypes: true,
  });

  return directoryEntries
    .flatMap((entry) => {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        return collectArtifacts(root, absolutePath);
      }

      return [path.relative(root, absolutePath).replaceAll(path.sep, '/')];
    })
    .sort((left, right) => left.localeCompare(right));
}
