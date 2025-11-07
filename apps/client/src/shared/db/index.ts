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
        base_currency TEXT NOT NULL DEFAULT 'EUR',
        latitude TEXT,
        longitude TEXT,
        city_id INTEGER,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
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
        scheduled_at TEXT NOT NULL,
        latitude TEXT,
        longitude TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      );
    `);

    // Expenses 테이블 생성
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        trip_id TEXT NOT NULL,
        schedule_id TEXT,
        title TEXT NOT NULL,
        amount TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        has_receipt INTEGER NOT NULL DEFAULT 0,
        receipt_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
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
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    // Sync Metadata 테이블 생성
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Offline Cities 테이블 생성 (오프라인 지도 메타데이터)
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS offline_cities (
        city_id INTEGER PRIMARY KEY NOT NULL,
        city_name TEXT NOT NULL,
        country TEXT,
        center_latitude TEXT NOT NULL,
        center_longitude TEXT NOT NULL,
        radius_km INTEGER NOT NULL DEFAULT 10,
        downloaded_at TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        tile_count INTEGER,
        reference_count INTEGER NOT NULL DEFAULT 1,
        mapbox_region_name TEXT,
        style_url TEXT DEFAULT 'mapbox://styles/mapbox/streets-v11',
        min_zoom INTEGER DEFAULT 10,
        max_zoom INTEGER DEFAULT 16,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Routes 테이블 생성 (오프라인 경로 정보)
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY NOT NULL,
        trip_id TEXT NOT NULL,
        from_schedule_id TEXT,
        to_schedule_id TEXT NOT NULL,
        profile TEXT NOT NULL,
        geometry TEXT NOT NULL,
        distance INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (from_schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (to_schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
      );
    `);

    // 인덱스 생성 (성능 최적화)
    expoDb.execSync(`
      CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
      CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_schedules_trip_id ON schedules(trip_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_deleted_at ON schedules(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_schedule_id ON expenses(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
      CREATE INDEX IF NOT EXISTS idx_routes_trip_id ON routes(trip_id);
      CREATE INDEX IF NOT EXISTS idx_routes_to_schedule_id ON routes(to_schedule_id);
      CREATE INDEX IF NOT EXISTS idx_routes_deleted_at ON routes(deleted_at);
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

  expoDb.execSync(`DROP TABLE IF EXISTS routes;`);
  expoDb.execSync(`DROP TABLE IF EXISTS offline_cities;`);
  expoDb.execSync(`DROP TABLE IF EXISTS sync_metadata;`);
  expoDb.execSync(`DROP TABLE IF EXISTS sync_queue;`);
  expoDb.execSync(`DROP TABLE IF EXISTS expenses;`);
  expoDb.execSync(`DROP TABLE IF EXISTS schedules;`);
  expoDb.execSync(`DROP TABLE IF EXISTS trips;`);

  await initializeDatabase();

  console.log('✅ Database reset complete');
}

// Export schema for type inference
export * from './schema';
