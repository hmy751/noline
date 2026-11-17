import { parseCommaList } from './env-list.js';
import { environment } from './environment.js';

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
    // 운영 앱과 시험용 앱은 번들 ID가 달라 Google iOS 클라이언트도 다르다. 쉼표로 여러 개를 허용한다.
    iosClientIds: parseCommaList(process.env.GOOGLE_IOS_CLIENT_ID),
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
