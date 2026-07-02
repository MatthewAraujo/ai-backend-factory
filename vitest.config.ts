import path from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.e2e-spec.ts', 'dist/**', 'node_modules/**'],
    setupFiles: [path.resolve(__dirname, 'test/setup-unit.ts')],
    coverage: {
      provider: 'v8',
      reportsDirectory: path.resolve(__dirname, 'coverage'),
      reporter: ['text', 'html'],
    },
  },
});

