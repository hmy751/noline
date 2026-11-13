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

const scheduleBody = (overrides: Record<string, unknown> = {}) => {
  return {
    id: SCHEDULE_ID,
    tripId: TRIP_A,
    title: 'Museum visit',
    location: 'National Museum',
    address: null,
    scheduledAt: SCHEDULED_AT,
    ...overrides,
  };
};

const expenseBody = (overrides: Record<string, unknown> = {}) => {
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
};

const seedUsersAndTrips = async () => {
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
};

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

const edit = (hour: number, sequence = 0, id = 'device-a') => ({
  time: `2026-11-10T${String(hour).padStart(2, '0')}:00:00.000Z`,
  sequence,
  id,
});
const updateExpense = (body: Record<string, unknown>) => request(app).put(`/api/expenses/${EXPENSE_ID}`).send(body);
const updateSchedule = (body: Record<string, unknown>) => request(app).put(`/api/schedules/${SCHEDULE_ID}`).send(body);

it.each(['live', 'entity-deleted', 'trip-deleted'])(
  '%s도 저장 불가능한 텍스트·JSON 편집 ID·연도를 삭제 성공으로 바꾸지 않는다',
  async (state) => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ amount: '20', currency: 'USD' }))
      .expect(201);
    if (state === 'entity-deleted') {
      await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);
      await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);
    }
    if (state === 'trip-deleted') {
      await request(app).delete(`/api/trips/${TRIP_A}`).expect(200);
    }
    for (const body of [
      { title: 'valid title', category: 'bad\u0000category' },
      { title: '\ud800' },
      { title: 'valid title', edit: edit(12, 0, 'bad\u0000id') },
      { title: 'valid title', edit: edit(12, 0, '\ud800') },
      { title: 'valid title', date: '0000-01-01' },
    ]) {
      await updateExpense(body).expect(500);
    }
    for (const body of [
      { title: 'valid title', address: 'bad\u0000address' },
      { title: '\ud800' },
      { title: 'valid title', edit: edit(12, 0, 'bad\u0000id') },
      { title: 'valid title', scheduledAt: '0000-01-01T00:00:00Z' },
    ]) {
      await updateSchedule(body).expect(500);
    }
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM legacy_update_holds`;
    expect(count).toBe(0);
  },
);

it('PostgreSQL의 유효한 지수·반올림·NaN과 Unicode 길이 계약을 유지한다', async () => {
  await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
  await request(app)
    .post('/api/expenses')
    .send(expenseBody({ amount: '20', currency: 'USD' }))
    .expect(201);
  const exponent = await updateExpense({ amount: ' +3.125e+1 ', title: '😀'.repeat(200) }).expect(200);
  expect(exponent.body.data.amount).toBe('31.25');

  const rounded = await updateExpense({ amount: '99999999.994' }).expect(200);
  expect(rounded.body.data.amount).toBe('99999999.99');

  await updateExpense({ amount: '99999999.995' }).expect(500);
  const nan = await updateExpense({ amount: 'NaN' }).expect(200);
  expect(nan.body.data.amount).toBe('NaN');

  const coordinate = await updateSchedule({ latitude: 999.99999994 }).expect(200);
  expect(coordinate.body.data.latitude).toBe('999.9999999');

  await updateSchedule({ latitude: 999.99999995 }).expect(500);
  await request(app).delete(`/api/trips/${TRIP_A}`).expect(200);
  await updateExpense({ amount: 'NaN' }).expect(410);
});

it('VARCHAR는 Unicode 문자 수와 초과 공백 절단을 CREATE·UPDATE·삭제 판정에 동일하게 적용한다', async () => {
  const title = '😀'.repeat(200);
  const padded = { title: title + '   ', currency: 'USD   ' };
  const created = await request(app).post('/api/expenses').send(expenseBody(padded)).expect(201);
  expect(created.body.data).toMatchObject({ title, currency: 'USD' });

  const updated = await updateExpense({ title: 'é'.repeat(200) + ' ', currency: 'EUR  ' }).expect(200);
  expect(updated.body.data).toMatchObject({ title: 'é'.repeat(200), currency: 'EUR' });

  await updateExpense({ title: title + 'x' }).expect(500);
  await updateExpense({ currency: 'USD x' }).expect(500);
  await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);
  await updateExpense(padded).expect(410);
  await updateExpense({ title: title + 'x' }).expect(500);
  await request(app).delete(`/api/trips/${TRIP_A}`).expect(200);
  await request(app).post('/api/expenses').send(expenseBody(padded)).expect(410);
  await updateExpense(padded).expect(410);
  await updateExpense({ currency: 'USD x' }).expect(500);
});
