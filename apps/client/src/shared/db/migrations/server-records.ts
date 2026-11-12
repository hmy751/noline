type MigrationDatabase = {
  execSync(query: string): void;
};

/** 기존 낙관적 행에서 서버 판본을 추정하지 않는다. 검증한 최초 수신부터 증거를 남긴다. */
export const migrateServerRecords = (db: MigrationDatabase): void => {
  db.execSync(`CREATE TABLE IF NOT EXISTS server_records (
    key TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, table_name TEXT NOT NULL,
    record_id TEXT NOT NULL, trip_id TEXT, version INTEGER,
    record TEXT, deleted_at TEXT
  )`);
};
