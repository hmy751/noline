import type { Application, NextFunction, Request, Response } from 'express';
import postgres from 'postgres';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAA',
}));

vi.mock('../../src/middleware/auth.js', () => ({
  AUTH_ERROR_CODES: {
    TOKEN_MISSING: 'TOKEN_MISSING',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
  },
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    req.userId = authState.userId;
    next();
  },
  optionalAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const USER_A = '01ARZ3NDEKTSV4RRFFQ69G5FAA';
const USER_B = '01ARZ3NDEKTSV4RRFFQ69G5FAE';
const TRIP_A = '01ARZ3NDEKTSV4RRFFQ69G5FAC';
const TRIP_B = '01ARZ3NDEKTSV4RRFFQ69G5FAG';
const DELETED_TRIP_A = '01ARZ3NDEKTSV4RRFFQ69G5FAH';
const SCHEDULE_A = '01ARZ3NDEKTSV4RRFFQ69G5FAB';
const SCHEDULE_A_SECOND = '01ARZ3NDEKTSV4RRFFQ69G5FAJ';
const DELETED_SCHEDULE_A = '01ARZ3NDEKTSV4RRFFQ69G5FAK';
const CROSS_OWNER_SCHEDULE = '01ARZ3NDEKTSV4RRFFQ69G5FAM';
const EXPENSE_A = '01ARZ3NDEKTSV4RRFFQ69G5FAD';
const DELETED_EXPENSE_A = '01ARZ3NDEKTSV4RRFFQ69G5FAN';
const CROSS_OWNER_EXPENSE = '01ARZ3NDEKTSV4RRFFQ69G5FAP';
const SCHEDULED_AT = '2026-09-20T01:30:00.000Z';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for PostgreSQL integration tests');
}

const sql = postgres(databaseUrl, { max: 1 });
let app: Application;

async function seedUsersAndTrips() {
  await sql`
    INSERT INTO users (id, email, name, provider, provider_id)
    VALUES
      (${USER_A}, 'user-a@example.com', 'User A', 'google', 'provider-a'),
      (${USER_B}, 'user-b@example.com', 'User B', 'google', 'provider-b')
  `;

  await sql`
    INSERT INTO trips (
      id, user_id, name, destination, country, base_currency,
      start_date, end_date, deleted_at
    )
    VALUES
      (${TRIP_A}, ${USER_A}, 'Trip A', 'Seoul', 'KR', 'KRW', '2026-09-19T00:00:00.000Z', '2026-09-22T00:00:00.000Z', NULL),
      (${TRIP_B}, ${USER_B}, 'Trip B', 'Busan', 'KR', 'KRW', '2026-09-19T00:00:00.000Z', '2026-09-22T00:00:00.000Z', NULL),
      (${DELETED_TRIP_A}, ${USER_A}, 'Deleted Trip A', 'Jeju', 'KR', 'KRW', '2026-09-19T00:00:00.000Z', '2026-09-22T00:00:00.000Z', '2026-09-18T00:00:00.000Z')
  `;
}

async function insertSchedule({
  id,
  userId,
  tripId = TRIP_A,
  deleted = false,
}: {
  id: string;
  userId: string;
  tripId?: string;
  deleted?: boolean;
}) {
  await sql`
    INSERT INTO schedules (
      id, user_id, trip_id, title, location, scheduled_at, deleted_at
    )
    VALUES (
      ${id}, ${userId}, ${tripId}, ${`Schedule ${id}`}, 'Museum', ${SCHEDULED_AT},
      ${deleted ? '2026-09-18T00:00:00.000Z' : null}
    )
  `;
}

async function insertExpense({ id, userId, deleted = false }: { id: string; userId: string; deleted?: boolean }) {
  await sql`
    INSERT INTO expenses (
      id, user_id, trip_id, schedule_id, title, amount, currency,
      category, date, has_receipt, deleted_at
    )
    VALUES (
      ${id}, ${userId}, ${TRIP_A}, NULL, ${`Expense ${id}`}, '12000.00', 'KRW',
      'food', '2026-09-20T00:00:00.000Z', 0,
      ${deleted ? '2026-09-18T00:00:00.000Z' : null}
    )
  `;
}

beforeAll(async () => {
  app = (await import('../../src/app.js')).default;
});

beforeEach(async () => {
  authState.userId = USER_A;
  await sql`TRUNCATE TABLE expenses, schedules, trips, refresh_tokens, users RESTART IDENTITY CASCADE`;
  await seedUsersAndTrips();
});

afterAll(async () => {
  await sql.end();
});

describe('Schedule PostgreSQL 접근 경계', () => {
  it('자기 소유가 아니거나 삭제된 부모 Trip에는 Schedule을 생성하지 않는다', async () => {
    authState.userId = USER_B;

    await request(app)
      .post('/api/schedules')
      .send({
        id: SCHEDULE_A,
        tripId: TRIP_A,
        title: 'Blocked schedule',
        location: 'Museum',
        address: null,
        scheduledAt: SCHEDULED_AT,
      })
      .expect(404);

    authState.userId = USER_A;

    await request(app)
      .post('/api/schedules')
      .send({
        id: SCHEDULE_A,
        tripId: DELETED_TRIP_A,
        title: 'Blocked schedule',
        location: 'Museum',
        address: null,
        scheduledAt: SCHEDULED_AT,
      })
      .expect(404);

    const rows = await sql`SELECT id FROM schedules WHERE id = ${SCHEDULE_A}`;
    expect(rows).toHaveLength(0);
  });

  it('Trip 하위 목록에서 다른 사용자와 삭제된 Schedule을 제외한다', async () => {
    await insertSchedule({ id: SCHEDULE_A, userId: USER_A });
    await insertSchedule({ id: DELETED_SCHEDULE_A, userId: USER_A, deleted: true });
    await insertSchedule({ id: CROSS_OWNER_SCHEDULE, userId: USER_B });

    const response = await request(app).get(`/api/trips/${TRIP_A}/schedules`).expect(200);
    expect(response.body.data.map(({ id }: { id: string }) => id)).toEqual([SCHEDULE_A]);

    authState.userId = USER_B;
    await request(app).get(`/api/trips/${TRIP_A}/schedules`).expect(404);
  });

  it('activation에서 현재 사용자 소유의 삭제되지 않은 자식만 반환한다', async () => {
    await insertSchedule({ id: SCHEDULE_A, userId: USER_A });
    await insertSchedule({ id: DELETED_SCHEDULE_A, userId: USER_A, deleted: true });
    await insertSchedule({ id: CROSS_OWNER_SCHEDULE, userId: USER_B });
    await insertExpense({ id: EXPENSE_A, userId: USER_A });
    await insertExpense({ id: DELETED_EXPENSE_A, userId: USER_A, deleted: true });
    await insertExpense({ id: CROSS_OWNER_EXPENSE, userId: USER_B });

    const response = await request(app).post(`/api/trips/${TRIP_A}/activate`).expect(200);

    expect(response.body.data.schedules.map(({ id }: { id: string }) => id)).toEqual([SCHEDULE_A]);
    expect(response.body.data.expenses.map(({ id }: { id: string }) => id)).toEqual([EXPENSE_A]);
  });

  it('수정과 삭제의 실제 UPDATE가 사용자 소유권과 soft-delete를 함께 적용한다', async () => {
    await insertSchedule({ id: SCHEDULE_A, userId: USER_A });
    await insertSchedule({ id: SCHEDULE_A_SECOND, userId: USER_A });
    await insertSchedule({ id: DELETED_SCHEDULE_A, userId: USER_A, deleted: true });

    authState.userId = USER_B;
    await request(app).put(`/api/schedules/${SCHEDULE_A}`).send({ title: 'Not allowed' }).expect(404);
    await request(app).delete(`/api/schedules/${SCHEDULE_A_SECOND}`).expect(404);

    authState.userId = USER_A;
    await request(app).put(`/api/schedules/${DELETED_SCHEDULE_A}`).send({ title: 'Not allowed' }).expect(404);
    await request(app).put(`/api/schedules/${SCHEDULE_A}`).send({ title: 'Allowed update' }).expect(200);
    await request(app).delete(`/api/schedules/${SCHEDULE_A_SECOND}`).expect(200);

    const [activeSchedule] = await sql`
      SELECT title, deleted_at FROM schedules WHERE id = ${SCHEDULE_A}
    `;
    const [deletedSchedule] = await sql`
      SELECT deleted_at FROM schedules WHERE id = ${SCHEDULE_A_SECOND}
    `;
    const [previouslyDeletedSchedule] = await sql`
      SELECT title FROM schedules WHERE id = ${DELETED_SCHEDULE_A}
    `;

    expect(activeSchedule.title).toBe('Allowed update');
    expect(activeSchedule.deleted_at).toBeNull();
    expect(deletedSchedule.deleted_at).toBeInstanceOf(Date);
    expect(previouslyDeletedSchedule.title).toBe(`Schedule ${DELETED_SCHEDULE_A}`);
  });
});
