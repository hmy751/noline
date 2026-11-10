import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
export const environment = process.env.NODE_ENV || 'development';

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
