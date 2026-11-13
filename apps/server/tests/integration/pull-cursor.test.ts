import postgres from 'postgres';
import request, { type Response } from 'supertest';
import { ulid } from 'ulid';
import { it, expect, afterAll } from 'vitest';

import app from '../../src/app.js';
import { generateTokens } from '../../src/services/jwt.js';

const sql = postgres(process.env.DATABASE_URL!);
afterAll(() => sql.end());

it.each([
  { timing: 'pull 전에', assignBeforePull: true },
  { timing: 'pull 도중에', assignBeforePull: false },
])('$timing ID를 받은 쓰기도 다음 cursor가 생성·수정·삭제를 모두 전달한다', async ({ assignBeforePull }) => {
  const [owner, trip, created, updated, deleted] = Array.from({ length: 5 }, () => ulid());
  await sql`insert into users (id,email,name,provider,provider_id)
    values (${owner},'pull@example.test','pull','google',${owner})`;
  await sql`insert into trips (id,user_id,name,destination,start_date,end_date)
    values (${trip},${owner},'cursor','Seoul',now(),now())`;
  for (const id of [updated, deleted]) {
    await sql`insert into expenses (id,user_id,trip_id,title,amount,category,date)
      values (${id},${owner},${trip},'before',25,'food',now())`;
  }
  const token = generateTokens(owner).accessToken;
  const pull = (cursor?: string) =>
    request(app)
      .get('/api/sync/pull')
      .set('Authorization', 'Bearer ' + token)
      .query({ activatedTripIds: trip, cursor })
      .expect(200);
  const initial = await pull();
  let during!: Promise<Response>;
  let writerId!: string;

  await sql.begin(async (writer) => {
    if (assignBeforePull) {
      await writer`select pg_current_xact_id()`;
    }

    // 테이블 읽기를 멈춰 snapshot이 확정된 뒤, 응답 전에 실제 쓰기를 주입한다.
    await writer`lock table expenses in access exclusive mode`;
    during = pull(initial.body.data.nextCursor).then((response) => response);
    const deadline = Date.now() + 8000;
    while (true) {
      const [state] = await sql`select exists(select 1 from pg_locks
        where relation = 'expenses'::regclass and mode = 'AccessShareLock' and not granted) as waiting`;
      if (state.waiting) {
        break;
      }
      if (Date.now() >= deadline) {
        throw new Error('pull did not reach the locked expense query');
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    // 변경 시각이 지난 수신 시각보다 오래돼도, 늦게 확정한 쓰기를 누락하면 안 된다.
    const oldTime = '2001-01-01T00:00:00.000Z';
    await writer`insert into expenses (id,user_id,trip_id,title,amount,category,date,updated_at)
      values (${created},${owner},${trip},'new',15,'food',now(),${oldTime})`;
    await writer`update expenses set amount=30, updated_at=${oldTime} where id=${updated}`;
    await writer`update expenses set deleted_at=${oldTime}, updated_at=${oldTime} where id=${deleted}`;

    const [transaction] = await writer`select pg_current_xact_id()::text as id`;
    writerId = transaction.id;
  });

  const first = await during;
  expect(first.body.data.expenses).toEqual([]);
  expect(BigInt(first.body.data.nextCursor)).toBeLessThanOrEqual(BigInt(writerId));

  const next = await pull(first.body.data.nextCursor);
  expect(next.body.data.expenses).toHaveLength(3);
  expect(next.body.data.expenses).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: created, title: 'new' }),
      expect.objectContaining({ id: updated, amount: '30.00' }),
      expect.objectContaining({ id: deleted, deletedAt: expect.any(String) }),
    ]),
  );
});
