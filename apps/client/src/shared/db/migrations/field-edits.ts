type MigrationDatabase = {
  getAllSync<T>(query: string): T[];
  execSync(query: string): void;
};
/** 기존 값과 큐를 유지하고 아직 관측하지 않은 편집 표식만 추가한다. */
export const migrateFieldEdits = (db: MigrationDatabase): void => {
  for (const table of ['schedules', 'expenses']) {
    const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);

    if (!columns.some((column) => column.name === 'field_edits')) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN field_edits TEXT NOT NULL DEFAULT '{}'`);
    }
  }

  db.execSync(`CREATE TABLE IF NOT EXISTS legacy_sync_holds (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    current TEXT NOT NULL,
    created_at TEXT NOT NULL,
    server_backed INTEGER NOT NULL DEFAULT 0
  )`);

  const holdColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(legacy_sync_holds)');

  if (!holdColumns.some((column) => column.name === 'server_backed')) {
    db.execSync('ALTER TABLE legacy_sync_holds ADD COLUMN server_backed INTEGER NOT NULL DEFAULT 0');
  }

  db.execSync(`CREATE TABLE IF NOT EXISTS legacy_hold_acks (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    acknowledged INTEGER NOT NULL DEFAULT 0
  )`);

  const ackColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(legacy_hold_acks)');

  if (!ackColumns.some((column) => column.name === 'acknowledged')) {
    db.execSync('ALTER TABLE legacy_hold_acks ADD COLUMN acknowledged INTEGER NOT NULL DEFAULT 0');
  }
};
