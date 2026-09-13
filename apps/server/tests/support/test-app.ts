import type { Application, NextFunction, Request, Response } from 'express';
import type { Schedule } from '../../src/db/schema.js';
import { vi } from 'vitest';

// app을 불러오기 전에 준비되어야 하는 DB·인증 대역의 공유 상태다.
const testState = vi.hoisted(() => ({
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAA',
  schedules: [] as Schedule[],
  select: vi.fn(),
}));

// 실제 PostgreSQL client 대신 테스트가 지정한 Schedule row를 반환한다.
// Drizzle column 표현식은 실제 table 정의를 사용해 route의 query 조립은 그대로 실행한다.
vi.mock('../../src/db/index.js', async () => {
  const schema = await import('../../src/db/schema.js');

  return {
    ...schema,
    db: {
      select: testState.select,
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

/** 각 Schedule route 테스트가 사용할 DB 조회 결과와 호출 기록을 초기화한다. */
export function resetScheduleQueryMock() {
  testState.schedules = [];
  testState.select.mockReset();
  testState.select.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(async () => testState.schedules),
      })),
    })),
  }));
}

/** PostgreSQL이 반환했다고 가정할 Schedule row를 지정한다. */
export function setScheduleRows(schedules: Schedule[]) {
  testState.schedules = schedules;
}

export const TEST_USER_ID = testState.userId;
export const dbSelectMock = testState.select;
