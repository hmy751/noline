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
const TRIP_A_OTHER = '01ARZ3NDEKTSV4RRFFQ69G5FAF';
const TRIP_B = '01ARZ3NDEKTSV4RRFFQ69G5FAG';
const SCHEDULE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAB';
const EXPENSE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAD';
const SCHEDULED_AT = '2026-09-20T01:30:00.000Z';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for PostgreSQL integration tests');
}

const sql = postgres(databaseUrl, { max: 1 });
let app: Application;

function scheduleBody(overrides: Record<string, unknown> = {}) {
  return {
    id: SCHEDULE_ID,
    tripId: TRIP_A,
    title: 'Museum visit',
    location: 'National Museum',
    address: null,
    scheduledAt: SCHEDULED_AT,
    ...overrides,
  };
}

function expenseBody(overrides: Record<string, unknown> = {}) {
  return {
    id: EXPENSE_ID,
    tripId: TRIP_A,
    scheduleId: null,
    title: 'Lunch',
    amount: '12000.00',
    currency: 'KRW',
    category: 'food',
    date: '2026-09-20',
    hasReceipt: false,
    receiptUrl: null,
    ...overrides,
  };
}

async function seedUsersAndTrips() {
  await sql`
    INSERT INTO users (id, email, name, provider, provider_id)
    VALUES
      (${USER_A}, 'user-a@example.com', 'User A', 'google', 'provider-a'),
      (${USER_B}, 'user-b@example.com', 'User B', 'google', 'provider-b')
  `;

  await sql`
    INSERT INTO trips (id, user_id, name, destination, country, base_currency, start_date, end_date)
    VALUES
      (${TRIP_A}, ${USER_A}, 'Trip A', 'Seoul', 'KR', 'KRW', '2026-09-19T00:00:00.000Z', '2026-09-22T00:00:00.000Z'),
      (${TRIP_A_OTHER}, ${USER_A}, 'Trip A2', 'Jeju', 'KR', 'KRW', '2026-09-19T00:00:00.000Z', '2026-09-22T00:00:00.000Z'),
      (${TRIP_B}, ${USER_B}, 'Trip B', 'Busan', 'KR', 'KRW', '2026-09-19T00:00:00.000Z', '2026-09-22T00:00:00.000Z')
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

describe('Schedule 생성 재전송 PostgreSQL 동작', () => {
  it('같은 CREATE를 다시 보내면 행을 늘리지 않고 같은 Schedule을 200으로 반환한다', async () => {
    const first = await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    const second = await request(app).post('/api/schedules').send(scheduleBody()).expect(200);

    expect(second.body).toEqual(first.body);
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM schedules WHERE id = ${SCHEDULE_ID}`;
    expect(count).toBe(1);
  });

  it('두 요청이 동시에 도착해도 하나만 만들고 나머지는 같은 행을 반환한다', async () => {
    const results = await Promise.all([
      request(app).post('/api/schedules').send(scheduleBody()),
      request(app).post('/api/schedules').send(scheduleBody()),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([200, 201]);
    expect(results[0].body).toEqual(results[1].body);
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM schedules WHERE id = ${SCHEDULE_ID}`;
    expect(count).toBe(1);
  });

  it('다른 사용자가 같은 ID로 보내면 409로 거절하고 원래 행을 바꾸지 않는다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);

    authState.userId = USER_B;
    await request(app)
      .post('/api/schedules')
      .send(scheduleBody({ tripId: TRIP_B, title: 'Hijack' }))
      .expect(409);

    const [row] = await sql`SELECT user_id, title FROM schedules WHERE id = ${SCHEDULE_ID}`;
    expect(row).toEqual({ user_id: USER_A, title: 'Museum visit' });
  });

  it('같은 사용자라도 다른 Trip으로 같은 ID를 보내면 409로 거절한다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app)
      .post('/api/schedules')
      .send(scheduleBody({ tripId: TRIP_A_OTHER }))
      .expect(409);

    const [row] = await sql`SELECT trip_id FROM schedules WHERE id = ${SCHEDULE_ID}`;
    expect(row.trip_id).toBe(TRIP_A);
  });
});

describe('Expense 생성 재전송 PostgreSQL 동작', () => {
  it('같은 CREATE를 다시 보내면 행을 늘리지 않고 같은 Expense를 200으로 반환한다', async () => {
    const first = await request(app).post('/api/expenses').send(expenseBody()).expect(201);
    const second = await request(app).post('/api/expenses').send(expenseBody()).expect(200);

    expect(second.body).toEqual(first.body);
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM expenses WHERE id = ${EXPENSE_ID}`;
    expect(count).toBe(1);
  });

  it('두 요청이 동시에 도착해도 하나만 만들고 나머지는 같은 행을 반환한다', async () => {
    const results = await Promise.all([
      request(app).post('/api/expenses').send(expenseBody()),
      request(app).post('/api/expenses').send(expenseBody()),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([200, 201]);
    expect(results[0].body).toEqual(results[1].body);
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM expenses WHERE id = ${EXPENSE_ID}`;
    expect(count).toBe(1);
  });

  it('다른 사용자가 같은 ID로 보내면 409로 거절하고 원래 행을 바꾸지 않는다', async () => {
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);

    authState.userId = USER_B;
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ tripId: TRIP_B, title: 'Hijack' }))
      .expect(409);

    const [row] = await sql`SELECT user_id, title FROM expenses WHERE id = ${EXPENSE_ID}`;
    expect(row).toEqual({ user_id: USER_A, title: 'Lunch' });
  });
});

describe('생성 재전송의 추가 경계', () => {
  it('같은 사용자라도 다른 Trip으로 같은 Expense ID를 보내면 409로 거절한다', async () => {
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ tripId: TRIP_A_OTHER }))
      .expect(409);

    const [row] = await sql`SELECT trip_id FROM expenses WHERE id = ${EXPENSE_ID}`;
    expect(row.trip_id).toBe(TRIP_A);
  });

  it('이미 삭제된 Schedule의 CREATE가 다시 와도 되살리지 않고 삭제된 행을 200으로 반환한다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);

    const replay = await request(app).post('/api/schedules').send(scheduleBody()).expect(200);

    expect(replay.body.data.deletedAt).not.toBeNull();
    const [row] = await sql`SELECT deleted_at FROM schedules WHERE id = ${SCHEDULE_ID}`;
    expect(row.deleted_at).not.toBeNull();
  });

  it('이미 삭제된 Expense의 CREATE가 다시 와도 되살리지 않고 삭제된 행을 200으로 반환한다', async () => {
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);
    await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);

    const replay = await request(app).post('/api/expenses').send(expenseBody()).expect(200);

    expect(replay.body.data.deletedAt).not.toBeNull();
    const [row] = await sql`SELECT deleted_at FROM expenses WHERE id = ${EXPENSE_ID}`;
    expect(row.deleted_at).not.toBeNull();
  });
});

describe('삭제 재전송 PostgreSQL 동작', () => {
  it('Schedule DELETE를 다시 보내면 200과 처음 삭제 시각을 반환하고 행을 다시 바꾸지 않는다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    const first = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);
    const [afterFirst] = await sql`SELECT deleted_at, version FROM schedules WHERE id = ${SCHEDULE_ID}`;

    const second = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);

    expect(second.body).toEqual(first.body);
    const [afterSecond] = await sql`SELECT deleted_at, version FROM schedules WHERE id = ${SCHEDULE_ID}`;
    expect(afterSecond).toEqual(afterFirst);
  });

  it('다른 사용자의 Schedule DELETE는 계속 404이고 행을 바꾸지 않는다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);

    authState.userId = USER_B;
    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(404);

    const [row] = await sql`SELECT deleted_at FROM schedules WHERE id = ${SCHEDULE_ID}`;
    expect(row.deleted_at).toBeNull();
  });

  it('다른 사용자가 이미 삭제한 Schedule도 404로 응답해 존재를 드러내지 않는다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);

    authState.userId = USER_B;
    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(404);
  });

  it('Expense DELETE를 다시 보내면 200과 처음 삭제 시각을 반환하고 행을 다시 바꾸지 않는다', async () => {
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);
    const first = await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);
    const [afterFirst] = await sql`SELECT deleted_at, version FROM expenses WHERE id = ${EXPENSE_ID}`;

    const second = await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);

    expect(second.body).toEqual(first.body);
    const [afterSecond] = await sql`SELECT deleted_at, version FROM expenses WHERE id = ${EXPENSE_ID}`;
    expect(afterSecond).toEqual(afterFirst);
  });

  it('다른 사용자의 Expense DELETE는 계속 404이고 행을 바꾸지 않는다', async () => {
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);

    authState.userId = USER_B;
    await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(404);

    const [row] = await sql`SELECT deleted_at FROM expenses WHERE id = ${EXPENSE_ID}`;
    expect(row.deleted_at).toBeNull();
  });

  it('없는 ID의 DELETE는 404다', async () => {
    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(404);
    await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(404);
  });

  it('Trip DELETE를 다시 보내도 200이다', async () => {
    await request(app).delete(`/api/trips/${TRIP_A}`).expect(200);
    const second = await request(app).delete(`/api/trips/${TRIP_A}`).expect(200);

    expect(second.body.data.id).toBe(TRIP_A);
    expect(second.body.data.deletedAt).not.toBeNull();
  });
});
