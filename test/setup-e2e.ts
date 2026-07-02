import 'reflect-metadata';
import path from 'node:path';

import { config } from 'dotenv';

config({ path: '.env' });
config({ path: '.env.test', override: true });

process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3333';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@127.0.0.1:5432/ai_backend_factory_test';
process.env.REDIS_HOST ??= '127.0.0.1';
process.env.REDIS_PORT ??= '6379';
process.env.REDIS_DB ??= '1';
process.env.WORKSPACE_ROOT ??= path.resolve(process.cwd(), 'repos');

