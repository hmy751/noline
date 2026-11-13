import { beforeEach, expect, it } from '@jest/globals';

import { withTripOperation } from '@/shared/services/offline-prep/trip-operation';
import { useAuthStore } from '@/shared/store/auth';

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

beforeEach(() => useAuthStore.setState({ status: 'signed-in', userId: 'owner', sessionId: Symbol('session') }));
it('같은 여행은 순서대로 실행하고 다른 여행은 기다리지 않는다', async () => {
  const gate = createDeferred();
  const started = createDeferred();
  const events: string[] = [];
  const first = withTripOperation('a', async () => {
    started.resolve();
    await gate.promise;
    events.push('first');
  });
  await started.promise;
  const next = withTripOperation('a', async () => {
    events.push('next');
  });
  await withTripOperation('b', async () => {
    events.push('other');
  });
  expect(events).toEqual(['other']);

  gate.resolve();
  await Promise.all([first, next]);
  expect(events).toEqual(['other', 'first', 'next']);
});

it('실패한 작업 뒤의 요청도 시작한다', async () => {
  await expect(
    withTripOperation('a', async () => {
      throw new Error('failed');
    }),
  ).rejects.toThrow('failed');
  await expect(withTripOperation('a', async () => 'next')).resolves.toBe('next');
});

it.each(['session', 'user'])('대기 중 %s가 바뀐 이전 의도는 새 계정에서 실행하지 않는다', async (change) => {
  const gate = createDeferred();
  const started = createDeferred();
  let hasStartedNext = false;
  const first = withTripOperation('a', async () => {
    started.resolve();
    await gate.promise;
  });
  await started.promise;
  const next = withTripOperation('a', async () => {
    hasStartedNext = true;
  });
  const outcomes = Promise.allSettled([first, next]);

  useAuthStore.setState(change === 'session' ? { sessionId: Symbol('next') } : { userId: 'other' });
  gate.resolve();
  expect((await outcomes).map(({ status }) => status)).toEqual(['rejected', 'rejected']);
  expect(hasStartedNext).toBe(false);
});
