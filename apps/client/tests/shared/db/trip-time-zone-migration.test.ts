/** @jest-environment node */
import { expect, it, jest } from '@jest/globals';
import { migrateTripTimeZone } from '@/shared/db/migrations/trip-time-zone';

interface TestDatabase {
  exec(query: string): void;
  prepare(query: string): { all(): unknown[]; get(): unknown };
  close(): void;
}

it('설치 DB에 시간대 열만 추가하고 여행 시각과 기존 대기 payload를 그대로 보존한다', () => {
  const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (name: string) => TestDatabase }>('node:sqlite');
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`
    CREATE TABLE trips (id TEXT PRIMARY KEY, start_date TEXT, end_date TEXT);
    INSERT INTO trips VALUES ('trip', '2026-10-01T00:00:00Z', '2026-10-03T00:00:00Z');
    CREATE TABLE sync_queue (payload TEXT);
    INSERT INTO sync_queue VALUES ('{"id":"trip","startDate":"2026-10-01T00:00:00Z"}');
  `);
  const database = {
    getAllSync: <T>(query: string) => sqlite.prepare(query).all() as T[],
    execSync: (query: string) => sqlite.exec(query),
  };
  migrateTripTimeZone(database);
  migrateTripTimeZone(database);
  expect(sqlite.prepare('SELECT * FROM trips').get()).toEqual({
    id: 'trip',
    start_date: '2026-10-01T00:00:00Z',
    end_date: '2026-10-03T00:00:00Z',
    time_zone: null,
  });
  expect(sqlite.prepare('SELECT payload FROM sync_queue').get()).toEqual({
    payload: '{"id":"trip","startDate":"2026-10-01T00:00:00Z"}',
  });
  sqlite.close();
});
