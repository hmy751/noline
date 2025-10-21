import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const environment = process.env.NODE_ENV || 'development';

// 환경별 .env 파일 경로 설정
const envFileName = environment === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, '../../', envFileName);

// 환경 파일 로드
const result = dotenv.config({ path: envPath });

// 개발 환경에서 파일 로드 확인
if (environment === 'development') {
  console.log(`📄 Loading environment from: ${envFileName}`);
  if (result.error) {
    console.warn(`⚠️  Warning: ${envFileName} not found, using default values`);
  }
}

const config = {
  env: environment,
  isProduction: environment === 'production',
  isDevelopment: environment === 'development',

  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER || 'noline-api',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  db: {
    url: process.env.DATABASE_URL,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  },
} as const;

// Validate required environment variables
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is required in environment variables');
}

if (!config.db.url) {
  throw new Error('DATABASE_URL is required in environment variables');
}

export default config;
