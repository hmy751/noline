/** @jest-environment node */
import { expect, it } from '@jest/globals';
import { createExpoSQLiteDatabase } from '../../../helpers/sqlite';
import { migrateRouteInputs } from '@/shared/db/migrations/route-inputs';

it('adds nullable coordinate provenance once without changing legacy geometry or sync payload', () => {
  const database = createExpoSQLiteDatabase();
  database.execSync(`
    CREATE TABLE routes (id TEXT PRIMARY KEY, geometry TEXT NOT NULL);
    INSERT INTO routes VALUES ('legacy', 'old-geometry');
    CREATE TABLE sync_queue (payload TEXT NOT NULL);
    INSERT INTO sync_queue VALUES ('{"original":true}');
  `);
  // The migration consumes SQLite's returned named rows, as the native adapter does.
  const adapter = {
    execSync: database.execSync,
    getAllSync: <T>(query: string): T[] => database.getAllSync(query) as T[],
  };
  migrateRouteInputs(adapter);
  migrateRouteInputs(adapter);
  expect(database.getAllSync('SELECT * FROM routes')).toEqual([
    { id: 'legacy', geometry: 'old-geometry', coordinates_key: null },
  ]);
  expect(database.getAllSync('SELECT * FROM sync_queue')).toEqual([{ payload: '{"original":true}' }]);
  expect(
    database
      .getAllSync('PRAGMA table_info(routes)')
      .filter((row) => !Array.isArray(row) && row.name === 'coordinates_key'),
  ).toHaveLength(1);
});
