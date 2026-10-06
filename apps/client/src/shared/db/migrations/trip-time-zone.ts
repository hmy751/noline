interface MigrationDatabase {
  getAllSync<T>(query: string): T[];
  execSync(query: string): void;
}

/** 반복 실행 가능한 설치 DB upgrade. 기존 행과 sync_queue는 그대로 남긴다. */
export function migrateTripTimeZone(database: MigrationDatabase): void {
  const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(trips)');
  if (!columns.some(({ name }) => name === 'time_zone')) {
    database.execSync('ALTER TABLE trips ADD COLUMN time_zone TEXT');
  }
}
