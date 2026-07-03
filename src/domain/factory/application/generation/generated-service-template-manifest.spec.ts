import {
  GENERATED_SERVICE_TEMPLATE_VERSION,
  getGeneratedServiceTemplateManifest,
} from '@/domain/factory/application/generation/generated-service-template-manifest';

describe('generated service template manifest', () => {
  it('describes the expected generic-foundation artifact set', () => {
    const manifest = getGeneratedServiceTemplateManifest();

    expect(manifest.version).toBe(GENERATED_SERVICE_TEMPLATE_VERSION);
    expect(manifest.templateRoot.endsWith('/templates/generated-service/v1')).toBe(
      true,
    );
    expect(manifest.artifacts).toEqual(
      expect.arrayContaining([
        '.github/workflows/ci.yml',
        'PROJECT.md',
        'README.md',
        'docker-compose.yml',
        'package.json',
        'prisma/schema.prisma',
        'src/core/entities/entity.ts',
        'src/core/errors/use-case-error.ts',
        'src/domain/auth/application/use-cases/authenticate.ts',
        'src/domain/notification/application/use-cases/list-notifications.ts',
        'src/infra/cache/redis/redis.module.ts',
        'src/infra/http/controllers/health.controller.ts',
        'test/e2e/health.e2e-spec.ts',
      ]),
    );
  });

  it('keeps v1 output limited to generic foundation modules', () => {
    const manifest = getGeneratedServiceTemplateManifest();
    const domainRoots = new Set(
      manifest.artifacts
        .filter((artifact) => artifact.startsWith('src/domain/'))
        .map((artifact) => artifact.split('/')[2])
        .filter((segment): segment is string => Boolean(segment)),
    );

    expect([...domainRoots].sort()).toEqual(['auth', 'notification']);
    expect(manifest.excludedScopes).toEqual(
      expect.arrayContaining([
        'custom business routes',
        'domain-specific entities',
        'domain-specific modules',
      ]),
    );
  });
});
