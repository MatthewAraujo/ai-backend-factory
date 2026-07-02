import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.e2e-spec.ts'],
    setupFiles: [path.resolve(__dirname, 'test/setup-e2e.ts')],
  },
});
