import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 환경별 .env 파일 로드
const environment = process.env.NODE_ENV || 'development';
const envFileName = environment === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFileName);

dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL is not defined in ${envFileName}`);
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
