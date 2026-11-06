import { jest } from '@jest/globals';

type SQLiteTestRow = Record<string, unknown> | unknown[];
type SQLiteTestRunResult = { changes: number; lastInsertRowId: number };
type SQLiteTestStatement = {
  setReturnArrays?: (enabled: boolean) => void;
  columns: () => Array<{ name: string }>;
  all: (...params: unknown[]) => SQLiteTestRow[];
  run: (...params: unknown[]) => SQLiteTestRunResult;
};
type SQLiteTestDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SQLiteTestStatement;
};
type ExpoSQLiteTestDatabase = {
  execSync: (statement: string) => void;
  getAllSync: (query: string) => SQLiteTestRow[];
  prepareSync: (query: string) => {
    executeForRawResultSync: (params: unknown[]) => { getAllSync: () => unknown[][] };
    executeSync: (params: unknown[]) =>
      | SQLiteTestRunResult
      | {
          getAllSync: () => unknown[][];
          getFirstSync: () => unknown[] | null;
        };
  };
};

/** 실제 SQLite 위에서 Expo의 동기 어댑터를 재현한다. */
export const createExpoSQLiteDatabase = (): ExpoSQLiteTestDatabase => {
  const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (name: string) => SQLiteTestDatabase }>(
    'node:sqlite',
  );
  const sqlite = new DatabaseSync(':memory:');

  return {
    execSync: (statement: string) => sqlite.exec(statement),
    getAllSync: (query: string) => sqlite.prepare(query).all(),
    prepareSync: (query: string) => ({
      executeForRawResultSync: (params: unknown[]) => {
        const statement = sqlite.prepare(query);
        const rows = readRows(statement, params);

        return { getAllSync: () => rows };
      },
      executeSync: (params: unknown[]) => {
        const statement = sqlite.prepare(query);

        if (statement.columns().length) {
          const rows = readRows(statement, params);

          return { getAllSync: () => rows, getFirstSync: () => rows[0] ?? null };
        }

        return statement.run(...params);
      },
    }),
  };
};

const readRows = (statement: SQLiteTestStatement, params: unknown[]): unknown[][] => {
  const columns = statement.columns();

  if (statement.setReturnArrays) {
    statement.setReturnArrays(true);
  }

  return statement.all(...params).map((row) => {
    if (Array.isArray(row)) {
      return row;
    }

    return columns.map(({ name }) => row[name]);
  });
};
