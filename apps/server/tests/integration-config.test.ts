import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

const loadConfig = async () => (await import('../vitest.integration.config.js')).default;

describe('integration database target', () => {
  it('uses the disposable Compose database when no URL is supplied', async () => {
    vi.stubEnv('DATABASE_URL', undefined);
    const config = await loadConfig();

    expect(config.test?.env?.DATABASE_URL).toBe('postgres://test:test@127.0.0.1:55432/noline_test');
  });

  it.each([
    'postgres://test:test@127.0.0.1:55433/noline_test',
    'postgresql://test:test@localhost:55433/noline_test',
    'postgres://test:test@[::1]:55433/noline_test',
  ])('accepts an explicitly supplied local test database: %s', async (url) => {
    vi.stubEnv('DATABASE_URL', url);
    const config = await loadConfig();

    expect(config.test?.env?.DATABASE_URL).toBe(url);
  });

  it.each([
    'postgres://test:test@127.0.0.1:5432/noline_dev',
    'postgres://test:test@db.example.com:5432/noline_test',
    'postgres://test:test@localhost.example.com/noline_test',
    'https://localhost/noline_test',
    'postgres://test:test@localhost/noline_test?host=db.example.com',
    'postgres://test:test@localhost/noline_test#fragment',
    'postgres://test:test@localhost/',
    '',
    'not-a-url',
  ])('rejects an unsafe or invalid target before tests run: %s', async (url) => {
    vi.stubEnv('DATABASE_URL', url);

    await expect(loadConfig()).rejects.toThrow();
  });
});
