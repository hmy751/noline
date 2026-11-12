type MigrationDatabase = {
  getAllSync<T>(query: string): T[];
  execSync(query: string): void;
};

/** 기존 geometry의 입력 좌표는 추측하지 않는다. 알 수 없는 row는 다음 준비에서 교체한다. */
export const migrateRouteInputs = (database: MigrationDatabase): void => {
  const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(routes)');
  if (!columns.some(({ name }) => name === 'coordinates_key')) {
    database.execSync('ALTER TABLE routes ADD COLUMN coordinates_key TEXT');
  }
};
