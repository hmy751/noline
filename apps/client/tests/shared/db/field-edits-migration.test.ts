/** @jest-environment node */
import { expect, it, jest } from '@jest/globals';

import { migrateFieldEdits } from '@/shared/db/migrations/field-edits';
it('설치 DB의 값과 구버전 큐를 보존하며 표식과 보류 저장소를 반복 안전하게 추가한다', () => {
  const { DatabaseSync } = jest.requireActual<{
    DatabaseSync: new (file: string) => {
      exec(sql: string): void;
      prepare(sql: string): { all(): unknown[]; get(): unknown };
      close(): void;
    };
  }>('node:sqlite');
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE schedules (id TEXT, title TEXT); INSERT INTO schedules VALUES ('s','제목');
    CREATE TABLE expenses (id TEXT, amount TEXT); INSERT INTO expenses VALUES ('e','30');
    CREATE TABLE sync_queue (payload TEXT); INSERT INTO sync_queue VALUES ('{"amount":"30","title":"원문"}');`);
  const adapter = {
    execSync: (sql: string) => sqlite.exec(sql),
    getAllSync: <T>(sql: string) => sqlite.prepare(sql).all() as T[],
  };
  migrateFieldEdits(adapter);
  migrateFieldEdits(adapter);
  expect(sqlite.prepare('SELECT * FROM schedules').get()).toEqual({ id: 's', title: '제목', field_edits: '{}' });
  expect(sqlite.prepare('SELECT * FROM expenses').get()).toEqual({ id: 'e', amount: '30', field_edits: '{}' });
  expect(sqlite.prepare('SELECT payload FROM sync_queue').get()).toEqual({ payload: '{"amount":"30","title":"원문"}' });
  expect(sqlite.prepare('SELECT * FROM legacy_sync_holds').all()).toEqual([]);
  sqlite.close();
});
