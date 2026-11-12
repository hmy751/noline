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
};
