import { defineConfig } from 'vitest/config';

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://test:test@127.0.0.1:55432/noline_test';
const databaseTarget = new URL(databaseUrl);

// 통합 검사는 테이블을 비우므로 로컬 전용 테스트 DB만 허용한다.
if (
  !['postgres:', 'postgresql:'].includes(databaseTarget.protocol) ||
  !['localhost', '127.0.0.1', '[::1]'].includes(databaseTarget.hostname) ||
  databaseTarget.pathname !== '/noline_test' ||
  databaseTarget.search ||
  databaseTarget.hash
) {
  throw new Error('Integration tests require a local noline_test database URL without query parameters or fragments');
}

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
      DATABASE_URL: databaseUrl,
      CORS_ORIGIN: 'http://localhost:8081',
    },
  },
});
