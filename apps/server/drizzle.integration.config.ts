import type { Config } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for PostgreSQL integration tests');
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString,
  },
  verbose: false,
  strict: false,
} satisfies Config;
