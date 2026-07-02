import { z } from 'zod';

const optionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length === 0 ? undefined : trimmedValue;
}, z.string().min(1).optional());

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().min(1).default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),
  WORKSPACE_ROOT: z.string().min(1),
  JWT_PRIVATE_KEY: optionalNonEmptyString,
  JWT_PUBLIC_KEY: optionalNonEmptyString,
});

export type Env = z.infer<typeof envSchema>;

export function buildEnv(rawEnv: Record<string, unknown>): Env {
  return envSchema.parse(rawEnv);
}
