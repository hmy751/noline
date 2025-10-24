import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

/**
 * SQLite DB 인스턴스
 * - expo-sqlite를 사용한 로컬 DB
 * - DB 파일명: noline.db
 */
const expoDb = SQLite.openDatabaseSync('noline.db');

/**
 * Drizzle ORM 클라이언트
 * - 타입 안전한 쿼리 작성 가능
 * - schema를 통해 테이블 정의 연결
 */
export const db = drizzle(expoDb, { schema });

/**
 * DB 초기화 함수
 * - 앱 시작 시 호출
 * - 테이블 생성 SQL 실행
 */
export async function initializeDatabase() {
  try {
    console.log('📦 Initializing local database...');

    // Trips 테이블 생성
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        country TEXT,
        latitude TEXT,
        longitude TEXT,
        city_id INTEGER,
        start_date INTEGER,
        end_date INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1
      );
    `);

    // Schedules 테이블 생성
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        trip_id TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        address TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        latitude TEXT,
        longitude TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      );
    `);

    // Sync Queue 테이블 생성
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER
      );
    `);

    // 인덱스 생성 (성능 최적화)
    expoDb.execSync(`
      CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
      CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_schedules_trip_id ON schedules(trip_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_deleted_at ON schedules(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
    `);

    console.log('✅ Local database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * DB 초기화 (개발용)
 * - 모든 데이터 삭제
 * - 테이블 재생성
 */
export async function resetDatabase() {
  console.log('🔄 Resetting database...');

  expoDb.execSync(`DROP TABLE IF EXISTS sync_queue;`);
  expoDb.execSync(`DROP TABLE IF EXISTS schedules;`);
  expoDb.execSync(`DROP TABLE IF EXISTS trips;`);

  await initializeDatabase();

  console.log('✅ Database reset complete');
}

// Export schema for type inference
export * from './schema';
