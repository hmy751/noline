import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-secret',
      DATABASE_URL: 'postgres://test:test@127.0.0.1:55432/noline_test',
      CORS_ORIGIN: 'http://localhost:8081',
    },
  },
});
