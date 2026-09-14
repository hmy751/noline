import { spawnSync } from 'node:child_process';
import process from 'node:process';

const docker = process.env.DOCKER_BIN || '/usr/local/bin/docker';
const databaseUrl = 'postgres://test:test@127.0.0.1:55432/noline_test';
const composeArgs = ['compose', '-p', 'noline-server-integration', '-f', 'docker-compose.test.yml'];
const testEnvironment = {
  ...process.env,
  NODE_ENV: 'test',
  JWT_SECRET: 'test-only-secret',
  DATABASE_URL: databaseUrl,
  CORS_ORIGIN: 'http://localhost:8081',
};

function run(command, args, environment = process.env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;

  return result.status === 0;
}

let databaseStarted = false;

try {
  databaseStarted = run(docker, [...composeArgs, 'up', '-d', '--wait']);

  if (!databaseStarted) {
    throw new Error('Failed to start the disposable PostgreSQL test database');
  }

  if (!run('pnpm', ['exec', 'drizzle-kit', 'push:pg', '--config', 'drizzle.integration.config.ts'], testEnvironment)) {
    throw new Error('Failed to apply the current Drizzle schema to the test database');
  }

  if (!run('pnpm', ['exec', 'vitest', 'run', '--config', 'vitest.integration.config.ts'], testEnvironment)) {
    throw new Error('PostgreSQL integration tests failed');
  }
} finally {
  if (databaseStarted) {
    run(docker, [...composeArgs, 'down', '-v']);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
