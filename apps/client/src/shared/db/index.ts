import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import { migrateTripTimeZone } from './migrations/trip-time-zone';

let databaseConnection: SQLite.SQLiteDatabase | undefined;

let database: ExpoSQLiteDatabase<typeof schema> | undefined;

export function isDatabaseReady(): boolean {
  return database !== undefined;
}

/** 스키마 준비에 성공한 DB만 제공한다. 호출만으로 초기화를 시작하지 않는다. */
export function getDatabase(): ExpoSQLiteDatabase<typeof schema> {
  if (!database) {
    throw new Error('로컬 DB 준비가 완료되지 않았습니다.');
  }
  return database;
}

function getDatabaseConnection(): SQLite.SQLiteDatabase {
  if (!databaseConnection) {
    const connection = SQLite.openDatabaseSync('noline.db');
    databaseConnection = connection;
  }

  return databaseConnection;
}

let transactionPauseCount = 0;

let pendingDatabaseOperation: Promise<unknown> = Promise.resolve();

function serializeDatabaseOperation<T>(operation: () => T | Promise<T>): Promise<T> {
  const result = pendingDatabaseOperation.then(() => operation());
  pendingDatabaseOperation = result.catch(() => undefined);
  return result;
}

/** 새 로컬 transaction을 거절하고 이미 접수한 저장의 종료를 기다린다.
 * operation 안에서는 resetDatabase 같은 비-transaction 작업만 실행한다.
 */
export async function withDatabaseTransactionsPaused<T>(operation: () => Promise<T>): Promise<T> {
  transactionPauseCount++;
  try {
    await pendingDatabaseOperation;
    return await operation();
  } finally {
    transactionPauseCount--;
  }
}

/** Drizzle의 동기 transaction API가 async callback을 기다리지 않아 commit 시점을 직접 관리한다. */
export function runDatabaseTransaction<T>(operation: () => Promise<T>): Promise<T> {
  if (transactionPauseCount > 0) {
    return Promise.reject(new Error('로그인 정보를 변경하는 중입니다. 잠시 후 다시 저장해주세요.'));
  }
  return serializeDatabaseOperation(async () => {
    const db = getDatabase();
    db.run(sql.raw('BEGIN'));
    try {
      const value = await operation();
      db.run(sql.raw('COMMIT'));
      return value;
    } catch (error) {
      db.run(sql.raw('ROLLBACK'));
      throw error;
    }
  });
}

/** transaction 밖에서 시작하는 sync·maintenance 작업을 local mutation과 같은 순서로 실행한다. */
export function runDatabaseOperation<T>(operation: () => T | Promise<T>): Promise<T> {
  return serializeDatabaseOperation(operation);
}

/**
 * DB 초기화 함수
 * - 앱 시작 시 호출
 * - 테이블 생성 SQL 실행
 */
export async function initializeDatabase() {
  if (database) {
    return;
  }

  try {
    console.log('[Database] Initializing local database...');
    const expoDb = getDatabaseConnection();

    // Trips 테이블 생성
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        country TEXT,
        base_currency TEXT NOT NULL DEFAULT 'USD',
        latitude TEXT,
        longitude TEXT,
        city_id INTEGER,
        time_zone TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        version INTEGER NOT NULL DEFAULT 1
      );
    `);

    // 설치된 DB의 시각·대기 sync payload는 변경하지 않는다.
    migrateTripTimeZone(expoDb);

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
        currency TEXT NOT NULL DEFAULT 'USD',
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

    // Trip Activations 테이블 생성 (활성화 관리)
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS trip_activations (
        id TEXT PRIMARY KEY NOT NULL,
        trip_id TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        is_activated INTEGER NOT NULL DEFAULT 1,
        activated_at TEXT NOT NULL,
        deactivated_at TEXT,
        expires_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'PENDING',
        last_sync_at TEXT,
        sync_progress INTEGER DEFAULT 0,
        cleanup_pending INTEGER NOT NULL DEFAULT 0,
        data_downloaded INTEGER NOT NULL DEFAULT 0,
        map_downloaded INTEGER NOT NULL DEFAULT 0,
        estimated_size INTEGER,
        actual_size INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
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
      CREATE INDEX IF NOT EXISTS idx_trip_activations_user_id ON trip_activations(user_id);
      CREATE INDEX IF NOT EXISTS idx_trip_activations_is_activated ON trip_activations(is_activated);
      CREATE INDEX IF NOT EXISTS idx_trip_activations_expires_at ON trip_activations(expires_at);
    `);

    database = drizzle(expoDb, { schema });
    console.log('[Database] Local database initialized successfully');
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * DB 초기화 (개발용)
 * - 모든 데이터 삭제
 * - 테이블 재생성
 */
export async function resetDatabase() {
  await runDatabaseOperation(async () => {
    database = undefined;
    console.log('[Database] Resetting database...');
    const expoDb = getDatabaseConnection();

    // 테이블과 큐를 함께 비운다. 재생성 실패 시 기존 데이터 전체를 되돌린다.
    expoDb.execSync('BEGIN');
    try {
      expoDb.execSync(`DROP TABLE IF EXISTS trip_activations;`);
      expoDb.execSync(`DROP TABLE IF EXISTS routes;`);
      expoDb.execSync(`DROP TABLE IF EXISTS offline_cities;`);
      expoDb.execSync(`DROP TABLE IF EXISTS sync_metadata;`);
      expoDb.execSync(`DROP TABLE IF EXISTS sync_queue;`);
      expoDb.execSync(`DROP TABLE IF EXISTS expenses;`);
      expoDb.execSync(`DROP TABLE IF EXISTS schedules;`);
      expoDb.execSync(`DROP TABLE IF EXISTS trips;`);

      await initializeDatabase();

      expoDb.execSync('COMMIT');
    } catch (error) {
      expoDb.execSync('ROLLBACK');
      database = undefined;
      throw error;
    }

    console.log('[Database] Database reset complete');
  });
}

// Export schema for type inference
export * from './schema';
