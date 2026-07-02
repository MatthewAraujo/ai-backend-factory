import path from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.e2e-spec.ts'],
    setupFiles: [path.resolve(__dirname, 'test/setup-e2e.ts')],
  },
});

