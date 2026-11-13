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

describe('항목별 편집 표식과 구버전 요청', () => {
  beforeEach(async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ amount: '20', currency: 'USD' }))
      .expect(201);
  });

  it('독립 항목과 되돌림은 FIFO/재전송 순서와 무관하게 정오 금액과 오후 분류로 수렴한다', async () => {
    for (const body of [
      { amount: '25', currency: 'USD', edit: edit(9) },
      { amount: '30', currency: 'USD', edit: edit(11) },
      { amount: '25', currency: 'USD', edit: edit(12, 0, 'tablet') },
      { category: 'transportation', edit: edit(16) },
      { amount: '30', currency: 'USD', edit: edit(11) },
      { amount: '25', currency: 'USD', edit: edit(9) },
    ]) {
      await updateExpense(body).expect(200);
    }
    const result = await request(app).get(`/api/expenses/${EXPENSE_ID}`).expect(200);
    expect(result.body.data).toMatchObject({
      amount: '25.00',
      currency: 'USD',
      category: 'transportation',
      fieldEdits: { amount: edit(12, 0, 'tablet'), category: edit(16) },
    });
  });

  it('같은 시각에는 순번과 고정 ID로 결정하고 같은 값의 더 늦은 편집도 보존한다', async () => {
    await updateExpense({ amount: '20', currency: 'USD', edit: edit(12, 2, 'b') }).expect(200);
    await updateExpense({ amount: '25', currency: 'USD', edit: edit(12, 1, 'z') }).expect(200);
    await updateExpense({ amount: '30', currency: 'USD', edit: edit(12, 2, 'a') }).expect(200);
    const result = await updateExpense({ category: 'other', edit: edit(10) }).expect(200);
    expect(result.body.data.amount).toBe('20.00');
    expect(result.body.data.fieldEdits.amount).toEqual(edit(12, 2, 'b'));
    const [{ version }] = await sql`SELECT version FROM expenses WHERE id = ${EXPENSE_ID}`;
    await updateExpense({ amount: '20', currency: 'USD', edit: edit(12, 2, 'b') }).expect(200);
    expect((await sql`SELECT version FROM expenses WHERE id = ${EXPENSE_ID}`)[0].version).toBe(version);
  });

  it('표식 없는 구버전 변경은 수용하되 표식 있는 다른 값과 충돌하면 전체 요청을 보류한다', async () => {
    const legacy = await updateExpense({ amount: '30' }).expect(200);
    expect(legacy.body.data.fieldEdits).toEqual({});

    await updateExpense({ amount: '25', currency: 'USD', edit: edit(12) }).expect(200);
    const same = await updateExpense({ amount: '25.0', category: 'other' }).expect(200);
    expect(same.body.data.fieldEdits.amount).toEqual(edit(12));

    const conflict = await updateExpense({ amount: '30', category: 'transportation' }).expect(409);
    expect(conflict.body.code).toBe('LEGACY_UPDATE_CONFLICT');
    expect(conflict.body.data).toMatchObject({ amount: '25.00', category: 'other' });
    expect((await request(app).get(`/api/expenses/${EXPENSE_ID}`)).body.data.category).toBe('other');
  });

  it('제목·시간·장소를 따로 병합하고 장소 묶음과 금액 묶음의 부분 변경을 거절한다', async () => {
    await updateSchedule({ title: 'New title', edit: edit(12) }).expect(200);
    await updateSchedule({ scheduledAt: '2026-09-20T10:00:00Z', edit: edit(10) }).expect(200);
    const result = await updateSchedule({
      location: 'New place',
      address: 'Address',
      latitude: 0,
      longitude: 0,
      edit: edit(11),
    }).expect(200);
    expect(result.body.data).toMatchObject({
      title: 'New title',
      scheduledAt: '2026-09-20T10:00:00.000Z',
      location: 'New place',
      latitude: '0.0000000',
      longitude: '0.0000000',
    });

    await updateSchedule({ location: 'Broken', edit: edit(14) }).expect(400);
    await updateExpense({ amount: '99', edit: edit(14) }).expect(400);
    await updateExpense({ amount: '99', currency: 'USD', edit: { time: 'bad', sequence: 0, id: 'a' } }).expect(400);
  });

  it('동시 요청도 독립 항목과 같은 항목의 최댓값을 잃지 않는다', async () => {
    await Promise.all([
      updateExpense({ amount: '25', currency: 'USD', edit: edit(12) }).expect(200),
      updateExpense({ amount: '30', currency: 'USD', edit: edit(11) }).expect(200),
      updateExpense({ category: 'transportation', edit: edit(16) }).expect(200),
    ]);
    expect((await request(app).get(`/api/expenses/${EXPENSE_ID}`)).body.data).toMatchObject({
      amount: '25.00',
      category: 'transportation',
    });
  });
});

describe('소유권·삭제·관계의 직렬화', () => {
  it('삭제된 자기 여행의 새 자식/재전송을 명시적으로 거절하며 다른 소유자는 404다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);
    await request(app).delete(`/api/trips/${TRIP_A}`).expect(200);
    for (const response of [
      await request(app).post('/api/schedules').send(scheduleBody()),
      await request(app).post('/api/expenses').send(expenseBody()),
      await updateSchedule({ title: 'late', edit: edit(23) }),
      await updateExpense({ amount: '99', currency: 'USD', edit: edit(23) }),
      await request(app).delete(`/api/expenses/${EXPENSE_ID}`),
    ]) {
      expect(response.status).toBe(410);
      expect(response.body.code).toBe('TRIP_DELETED');
      expect(response.body.data.tripId).toBe(TRIP_A);
    }
    authState.userId = USER_B;
    await updateSchedule({ title: 'leak', edit: edit(23) }).expect(404);
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAH' }))
      .expect(404);
    const [row] = await sql`SELECT count(*)::int AS count FROM expenses WHERE trip_id = ${TRIP_A}`;
    expect(row.count).toBe(1);
  });

  it('일정 또는 경비 자체가 삭제됐으면 늦은 UPDATE로 부활하지 않는다', async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);
    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);
    await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);
    const schedule = await updateSchedule({ title: 'late', edit: edit(23) }).expect(410);
    const expense = await updateExpense({ amount: '99', currency: 'USD', edit: edit(23) }).expect(410);
    expect(schedule.body.code).toBe('ENTITY_DELETED');
    expect(expense.body.code).toBe('ENTITY_DELETED');

    authState.userId = USER_B;
    await updateExpense({ title: 'leak', edit: edit(23) }).expect(404);
  });

  it.each(['expense-first', 'schedule-first', 'simultaneous'])(
    '%s에서도 경비를 남기고 일정 연결만 비운다',
    async (order) => {
      await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
      const create = () =>
        request(app)
          .post('/api/expenses')
          .send(expenseBody({ scheduleId: SCHEDULE_ID }))
          .expect(201);
      const remove = () => request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);
      if (order === 'expense-first') {
        await create();
        await remove();
      }
      if (order === 'schedule-first') {
        await remove();
        await create();
      }
      if (order === 'simultaneous') {
        await Promise.all([create(), remove()]);
      }
      const replay = await updateExpense({ scheduleId: SCHEDULE_ID, edit: edit(23) }).expect(200);
      expect(replay.body.data).toMatchObject({
        scheduleId: null,
        amount: '12000.00',
        date: '2026-09-20',
        deletedAt: null,
      });

      const createReplay = await request(app)
        .post('/api/expenses')
        .send(expenseBody({ scheduleId: SCHEDULE_ID }))
        .expect(200);
      expect(createReplay.body.data.scheduleId).toBeNull();
    },
  );

  it('다른 여행/사용자의 일정 연결과 부모를 거절하며 정상 경비는 그대로 둔다', async () => {
    await request(app)
      .post('/api/schedules')
      .send(scheduleBody({ tripId: TRIP_A_OTHER }))
      .expect(201);
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ scheduleId: SCHEDULE_ID }))
      .expect(404);
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ tripId: TRIP_B }))
      .expect(404);
    await request(app).post('/api/expenses').send(expenseBody()).expect(201);
    await updateExpense({ scheduleId: SCHEDULE_ID, edit: edit(12) }).expect(404);
    expect((await request(app).get(`/api/expenses/${EXPENSE_ID}`)).body.data.scheduleId).toBeNull();
  });
});

it('삭제된 경비의 생성 재전송은 연결 일정도 삭제됐어도 저장된 tombstone을 그대로 반환한다', async () => {
  await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
  const body = expenseBody({ scheduleId: SCHEDULE_ID });
  await request(app).post('/api/expenses').send(body).expect(201);
  await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);
  await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);
  const persisted = await request(app).post('/api/expenses').send(body).expect(200);
  expect(persisted.body.data.deletedAt).not.toBeNull();

  const replay = await request(app).post('/api/expenses').send(body).expect(200);
  expect(replay.body).toEqual(persisted.body);
});

it('여행 삭제와 생성이 겹쳐도 삭제 뒤 살아 있는 자식이 남지 않는다', async () => {
  const results = await Promise.all([
    request(app).post('/api/schedules').send(scheduleBody()),
    request(app).post('/api/expenses').send(expenseBody()),
    request(app).delete(`/api/trips/${TRIP_A}`),
  ]);
  expect(results[2].status).toBe(200);
  expect([201, 410]).toContain(results[0].status);
  expect([201, 410]).toContain(results[1].status);
  const [row] =
    await sql`SELECT (SELECT count(*) FROM schedules WHERE trip_id = ${TRIP_A} AND deleted_at IS NULL) + (SELECT count(*) FROM expenses WHERE trip_id = ${TRIP_A} AND deleted_at IS NULL) AS alive`;
  expect(Number(row.alive)).toBe(0);
});

describe('구버전 직접 요청의 서버 원문 보존', () => {
  const rawLegacy = {
    amount: '30',
    currency: 'USD',
    category: 'transportation',
    date: '2026-09-20T01:00:00+09:00',
    // 옛 앱이 보내던 추가 값은 복구 자료이며 권한이나 변경 근거로 쓰지 않는다.
    userId: USER_B,
    originalForm: { source: 'old-app', untouched: true },
  };
  beforeEach(async () => {
    await request(app).post('/api/schedules').send(scheduleBody()).expect(201);
    await request(app)
      .post('/api/expenses')
      .send(expenseBody({ amount: '20', currency: 'USD' }))
      .expect(201);
    await updateExpense({ amount: '25', currency: 'USD', edit: edit(12) }).expect(200);
  });

  it('옛 직접 요청을 서버에 원문 그대로 보존하고 키 순서가 다른 재시도도 한 보류로 합친다', async () => {
    const first = await updateExpense(rawLegacy).expect(409);
    const reordered = Object.fromEntries(Object.entries(rawLegacy).reverse());
    const replay = await updateExpense(reordered).expect(409);
    expect(first.body.hold).toMatchObject({
      userId: USER_A,
      tableName: 'expenses',
      recordId: EXPENSE_ID,
      tripId: TRIP_A,
      payload: rawLegacy,
    });
    expect(first.body.recoveryId).toBe(first.body.hold.id);
    expect(replay.body.recoveryId).toBe(first.body.recoveryId);
    expect(first.body.data).toMatchObject({ amount: '25.00', category: 'food', date: '2026-09-20' });

    const [{ count }] = await sql`SELECT count(*)::int AS count FROM legacy_update_holds WHERE user_id = ${USER_A}`;
    expect(count).toBe(1);
  });

  it('잘못된 payload·다른 사용자·명시적 새 편집은 구버전 보류를 만들지 않는다', async () => {
    await updateExpense({ ...rawLegacy, date: 'broken' }).expect(400);
    authState.userId = USER_B;
    await updateExpense(rawLegacy).expect(404);
    authState.userId = USER_A;
    await updateExpense({ amount: '30', currency: 'USD', edit: edit(11) }).expect(200);
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM legacy_update_holds`;
    expect(count).toBe(0);
  });
});
