import { buildEnv } from '@/infra/env/env';

describe('buildEnv', () => {
  it('rejects missing required bootstrap variables', () => {
    expect(() => {
      buildEnv({
        WORKSPACE_ROOT: '/tmp/ai-backend-factory/repos',
      });
    }).toThrow();
  });

  it('coerces numeric values and applies defaults', () => {
    const env = buildEnv({
      DATABASE_URL:
        'postgresql://postgres:postgres@127.0.0.1:5432/ai_backend_factory',
      PORT: '4444',
      REDIS_DB: '2',
      WORKSPACE_ROOT: '/tmp/ai-backend-factory/repos',
    });

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4444,
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: 6379,
      REDIS_DB: 2,
    });
  });

  it('treats blank jwt keys as undefined while bootstrapping auth-free environments', () => {
    const env = buildEnv({
      DATABASE_URL:
        'postgresql://postgres:postgres@127.0.0.1:5432/ai_backend_factory',
      JWT_PRIVATE_KEY: '   ',
      JWT_PUBLIC_KEY: '',
      WORKSPACE_ROOT: '/tmp/ai-backend-factory/repos',
    });

    expect(env.JWT_PRIVATE_KEY).toBeUndefined();
    expect(env.JWT_PUBLIC_KEY).toBeUndefined();
  });
});
