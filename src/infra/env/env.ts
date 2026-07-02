import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().min(1).default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),
  WORKSPACE_ROOT: z.string().min(1),
  JWT_PRIVATE_KEY: z.string().min(1).optional(),
  JWT_PUBLIC_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function buildEnv(rawEnv: Record<string, unknown>): Env {
  return envSchema.parse(rawEnv);
}

