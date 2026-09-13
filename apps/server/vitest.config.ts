import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-secret',
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      CORS_ORIGIN: 'http://localhost:8081',
    },
  },
});
