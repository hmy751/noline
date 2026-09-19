# 인증·API·로컬 DB 검토의 실행 근거

Main이 HEAD `10960e9` 이후 미커밋 작업 트리에서 직접 실행한 검사다. 제품 코드를 수정하지 않은 상태의 결함 재현이며, 아래 코드를 새 제품 테스트로 채택·수정하거나 결함을 해결했다는 의미는 아니다. 판단과 정책의 맥락은 [종합 기록](2026-09-19-01-auth-complexity-review-and-decisions.md)에서 읽는다.

## 실행 결과와 증명 범위

기존 client 전체 Jest: 23 suite·235 test 통과. 추가 검토는 신규 8개와 기존 SQLite fixture의 8개를 함께 실행해 총 16개 중 11개 통과·5개 실패였다. 신규 검사 중 실패 5개는 다음 기대값과 실제 결과의 차이다.

| 검사 | 기대 | 실제 |
| --- | --- | --- |
| apiClient 갱신 후 재시도 응답 | `{ trips: ['trip-a'] }` | `undefined` |
| 인증 필요 오류 전달 | `다시 로그인해주세요` | `알 수 없는 에러가 발생했습니다` |
| 저장 실패 후 유지된 signed-in 세션 | 기존 세션의 갱신 적용 `true` | `false` |
| 다른 계정 row와 소유자 불명 큐 공존 | `unresolved` | `different` |
| 별도 upsert 뒤 다른 transaction rollback | `independent` row 유지 | row도 함께 사라짐 |

신규 통과 3개는 동시 401의 갱신 공유·각 요청 1회 재전송, 갱신 거절로 종료한 일반 호출의 로그인 뒤 비재전송, `reauth-required`에서 저장 실패 후 계정 유지·다음 로그인 성공이다. 마지막 검사는 Store 단위다. 첫 번째 통과는 요청 횟수의 증거이며 응답 body의 정확성은 별도 실패 검사에서 확인했다.

Axios adapter와 SecureStore는 mock이며 SQLite 검사는 Node 메모리 SQLite와 실제 Drizzle SQL이다. 실제 기기·OAuth·서버 token rotation·전체 화면/DB/sync 연결·운영 발생 빈도는 입증하지 않는다. signed-in 저장 실패 재현은 Store 단위이며 실제 UI에서 항상 진입 가능한 경로라고 주장하지 않는다. 오류 클래스·정확한 문구가 최종 구현 제약은 아니며 재로그인 필요라는 의미가 호출부까지 전달돼야 한다.

## 다시 실행하는 방법

저장소 루트에서 기존 suite는 다음처럼 실행한다.

```sh
node node_modules/jest/bin/jest.js --config apps/client/jest.config.cjs --runInBand --silent
```

임시 디렉터리에 아래 설정을 `jest.config.cjs`, API·세션 검사를 `retry.test.ts`로 저장한다. [기존 SQLite fixture](../../../../../apps/client/tests/shared/services/auth/local-access.test.ts)를 같은 임시 디렉터리의 `local-access-audit.test.ts`로 복사한 뒤 마지막 절의 두 검사를 붙인다. 조사 당시 fixture SHA-256은 `3f46dc42b869210cdf127f85f8e2126a5d608faf77991fcba4b86c48936dd8f8`다. 기존 fixture가 달라졌다면 setup·row·검사 수를 다시 대조한다.

저장소 루트에서 `NOLINE_REVIEW_CLIENT_ROOT`에는 이 저장소의 `apps/client` 절대 경로를, 명령의 설정 경로에는 만든 임시 디렉터리를 지정한다. 기기 DB나 서버에 접속하지 않는다.

```sh
NOLINE_REVIEW_CLIENT_ROOT="$PWD/apps/client" node node_modules/jest/bin/jest.js --config /absolute/path/to/review/jest.config.cjs --runInBand --silent
```

```js
const root = process.env.NOLINE_REVIEW_CLIENT_ROOT;
if (!root) throw new Error('NOLINE_REVIEW_CLIENT_ROOT is required');
module.exports = {
  ...require(root + '/jest.config.cjs'),
  rootDir: root,
  roots: [root, __dirname],
  testMatch: [__dirname + '/*.test.ts'],
  modulePaths: [root + '/node_modules', root + '/../../node_modules'],
  transform: { '^.+\\.[jt]sx?$': [require.resolve(root + '/../../node_modules/babel-jest'), { configFile: root + '/babel.config.js' }] },
};
```

## API·세션 검사

```ts
import { beforeEach, expect, it, jest } from '@jest/globals';
import { AxiosError } from 'axios';
import apiClient from '@/shared/api/fetcher';
import { apiAxios } from '@/shared/api/axios-instances';
import { refreshTokens } from '@/shared/services/auth/auth-api';
import { useAuthStore } from '@/shared/store/auth';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/shared/services/auth/auth-api', () => ({ refreshTokens: jest.fn() }));
jest.mock('@/shared/api/axios-instances', () => ({ apiAxios: require('axios').default.create(), baseURL: 'https://example.invalid' }));

const login = { userId: 'user-a', accessToken: 'old', refreshToken: 'refresh' };
beforeEach(async () => {
  await useAuthStore.getState().login(login);
  jest.mocked(refreshTokens).mockReset();
});

it('full apiClient preserves response body after successful refresh and replay', async () => {
  let attempts = 0;
  apiAxios.defaults.adapter = async config => {
    attempts++;
    if (config.headers.Authorization !== 'Bearer new') {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
        status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config,
      });
    }
    return { status: 200, statusText: 'OK', data: { trips: ['trip-a'] }, headers: {}, config };
  };
  jest.mocked(refreshTokens).mockResolvedValue({ accessToken: 'new', refreshToken: 'new-refresh' });
  const result = await apiClient.get('/api/trips');
  expect(attempts).toBe(2);
  expect(refreshTokens).toHaveBeenCalledTimes(1);
  expect(result).toEqual({ trips: ['trip-a'] });
});

it('refresh rejection ends request and subsequent login does not replay it', async () => {
  let attempts = 0;
  apiAxios.defaults.adapter = async config => {
    attempts++;
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
      status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config,
    });
  };
  jest.mocked(refreshTokens).mockRejectedValue({ response: { status: 401 } });
  await expect(apiClient.get('/api/trips')).rejects.toBeDefined();
  expect(useAuthStore.getState().status).toBe('reauth-required');
  await useAuthStore.getState().login({ ...login, accessToken: 'new' });
  await Promise.resolve();
  expect(attempts).toBe(1);
});

it('auth rejection retains its recovery meaning through full apiClient', async () => {
  await useAuthStore.getState().requireReauthentication(useAuthStore.getState().sessionId);
  await expect(apiClient.get('/api/trips')).rejects.toMatchObject({ message: '다시 로그인해주세요' });
});

it('failed login persistence does not silently invalidate the retained session', async () => {
  const oldSession = useAuthStore.getState().sessionId;
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(useAuthStore.getState().login({ ...login, accessToken: 'replacement' })).rejects.toThrow('storage unavailable');
  expect(useAuthStore.getState()).toMatchObject({ status: 'signed-in', sessionId: oldSession });
  await expect(useAuthStore.getState().refreshTokens({ accessToken: 'renewed', refreshToken: 'renewed-refresh' }, oldSession)).resolves.toBe(true);
});

it('two concurrent 401 responses share one refresh and replay each request once', async () => {
  let attempts = 0;
  let originalAttempts = 0;
  let bothStarted!: () => void;
  let resolveRefresh!: (value: { accessToken: string; refreshToken: string }) => void;
  const ready = new Promise<void>(resolve => { bothStarted = resolve; });
  const refreshed = new Promise<{ accessToken: string; refreshToken: string }>(resolve => { resolveRefresh = resolve; });
  jest.mocked(refreshTokens).mockReturnValue(refreshed);
  apiAxios.defaults.adapter = async config => {
    attempts++;
    if (config.headers.Authorization !== 'Bearer new') {
      originalAttempts++;
      if (originalAttempts === 2) bothStarted();
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
        status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config,
      });
    }
    return { status: 200, statusText: 'OK', data: { ok: true }, headers: {}, config };
  };
  const pending = Promise.all([apiClient.get('/api/trips'), apiClient.get('/api/schedules')]);
  await ready;
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(refreshTokens).toHaveBeenCalledTimes(1);
  resolveRefresh({ accessToken: 'new', refreshToken: 'new-refresh' });
  await pending;
  expect(attempts).toBe(4);
  expect(refreshTokens).toHaveBeenCalledTimes(1);
});

it('reauth login persistence failure retains local account and a later login succeeds', async () => {
  await useAuthStore.getState().requireReauthentication(useAuthStore.getState().sessionId);
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(useAuthStore.getState().login({ ...login, accessToken: 'replacement' })).rejects.toThrow('storage unavailable');
  expect(useAuthStore.getState()).toMatchObject({ status: 'reauth-required', userId: 'user-a', session: { accessToken: null, refreshToken: null } });
  await useAuthStore.getState().login({ ...login, accessToken: 'replacement' });
  expect(useAuthStore.getState()).toMatchObject({ status: 'signed-in', userId: 'user-a', session: { accessToken: 'replacement' } });
});
```

## SQLite fixture에 추가할 검사

```ts
it('audit: unresolved queue is not hidden by an earlier different owner', async () => {
  await getDatabase().insert(syncQueue).values({ id: 'orphan', tableName: 'schedules', recordId: 'missing', action: 'UPDATE', payload: '{}', status: 'PENDING', retryCount: 0, createdAt: now });
  expect(await inspectLocalAccount('a')).toBe('unresolved');
});

it('audit: independent upsert is not rolled back by another failed transaction', async () => {
  const { runDatabaseTransaction } = require('@/shared/db');
  const { upsertSchedules } = require('@/shared/db/utils');
  let begin!: () => void;
  let release!: () => void;
  const begun = new Promise<void>(resolve => { begin = resolve; });
  const released = new Promise<void>(resolve => { release = resolve; });
  const failed = runDatabaseTransaction(async () => { begin(); await released; throw new Error('first failed'); }).catch(error => error);
  await begun;
  const row = await getDatabase().select().from(schedules).get();
  await upsertSchedules([{ ...row!, id: 'independent', title: 'independent' }]);
  release();
  await failed;
  const ids = (await getDatabase().select().from(schedules).all()).map(row => row.id);
  expect(ids).toContain('independent');
});
```
