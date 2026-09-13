import type { Application, NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';

// app을 불러오기 전에 준비되어야 하는 DB·인증 대역의 공유 상태다.
const testState = vi.hoisted(() => ({
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAA',
  selectResults: [] as unknown[][],
  insertResult: [] as unknown[],
  updateResult: [] as unknown[],
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

// 실제 PostgreSQL client 대신 테스트가 지정한 row를 쿼리 호출 순서대로 반환한다.
// Drizzle column 표현식은 실제 table 정의를 사용해 route의 query 조립은 그대로 실행한다.
vi.mock('../../src/db/index.js', async () => {
  const schema = await import('../../src/db/schema.js');

  const createSelectQuery = (rows: unknown[]) => {
    const query: Record<string, unknown> = {};
    query.from = vi.fn(() => query);
    query.where = vi.fn(() => query);
    query.orderBy = vi.fn(async () => rows);
    query.limit = vi.fn(async () => rows);
    query.then = (onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(rows).then(onFulfilled, onRejected);
    return query;
  };

  testState.select.mockImplementation(() => createSelectQuery(testState.selectResults.shift() ?? []));
  testState.insert.mockImplementation(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(async () => testState.insertResult),
    })),
  }));
  testState.update.mockImplementation(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => testState.updateResult),
      })),
    })),
  }));

  return {
    ...schema,
    db: {
      select: testState.select,
      insert: testState.insert,
      update: testState.update,
    },
  };
});

// JWT 검증은 이 테스트의 대상이 아니므로 인증을 마친 사용자만 재현한다.
vi.mock('../../src/middleware/auth.js', () => ({
  AUTH_ERROR_CODES: {
    TOKEN_MISSING: 'TOKEN_MISSING',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
  },
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    req.userId = testState.userId;
    next();
  },
  optionalAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

let appPromise: Promise<Application> | undefined;

/** DB·인증 mock이 등록된 뒤 실제 Express app을 한 번만 불러온다. */
export function loadTestApp() {
  appPromise ??= import('../../src/app.js').then(({ default: app }) => app);
  return appPromise;
}

/** 각 route 테스트가 사용할 DB 결과와 호출 기록을 초기화한다. */
export function resetDbMock() {
  testState.selectResults = [];
  testState.insertResult = [];
  testState.updateResult = [];
  testState.select.mockClear();
  testState.insert.mockClear();
  testState.update.mockClear();
}

/** 연속된 select 쿼리가 반환할 row 배열을 호출 순서대로 지정한다. */
export function setSelectResults(...results: unknown[][]) {
  testState.selectResults = results;
}

/** insert returning 결과를 지정한다. */
export function setInsertResult(result: unknown[]) {
  testState.insertResult = result;
}

/** update returning 결과를 지정한다. */
export function setUpdateResult(result: unknown[]) {
  testState.updateResult = result;
}

export const TEST_USER_ID = testState.userId;
export const dbSelectMock = testState.select;
export const dbInsertMock = testState.insert;
export const dbUpdateMock = testState.update;
