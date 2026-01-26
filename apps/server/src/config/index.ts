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
    accessTokenExpiresIn: '1h', // 1시간
    refreshTokenExpiresIn: '30d', // 30일
  },

  db: {
    url: process.env.DATABASE_URL,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  },

  googleMaps: {
    placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
    geoDirectionsApiKey: process.env.GOOGLE_GEO_DIRECTIONS_API_KEY,
  },

  googleOAuth: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  },

  appleOAuth: {
    clientId: process.env.APPLE_CLIENT_ID, // App Bundle ID (예: com.noline.app)
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // PEM 형식
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
