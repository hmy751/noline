// 조사용 분리 실험. 현재 결함을 확인하는 assertion이며 수정 후 회귀 통과 기준이 아니다.
// Project root에서 node <이 파일 경로>로 실행한다. 네트워크·SecureStore·제품 DB에 접근하지 않는다.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = process.cwd();
const clientRequire = createRequire(path.join(root, 'apps/client/package.json'));
const ts = clientRequire('typescript');
const axios = clientRequire('axios');
axios.defaults.adapter = async () => { throw new Error('Network adapter is blocked in this probe'); };
const React = clientRequire('react');
const renderer = clientRequire('react-test-renderer');
const hashes = {};
const quiet = { log() {}, warn() {}, error() {} };
const results = [];

function readSource(relative) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  hashes[relative] = crypto.createHash('sha256').update(source).digest('hex');
  return source;
}
function execute(source, filename, dependencies = {}, bindings = {}) {
  const module = { exports: {} };
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
    fileName: filename,
  }).outputText;
  vm.runInNewContext(js, {
    module, exports: module.exports, console: quiet, setTimeout, clearTimeout,
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unstubbed import blocked: ${name} in ${filename}`);
    },
    ...bindings,
  }, { filename });
  return module.exports;
}
function load(relative, dependencies) {
  return execute(readSource(relative), relative, dependencies);
}
function extractFunction(relative, name, bindings) {
  const source = readSource(relative);
  const ast = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, `Function exists: ${name}`);
  return execute(`${node.getText(ast)}\nexports.subject = ${name};`, relative, {}, bindings).subject;
}
function record(scenario, observed) { results.push({ scenario, observed }); }
function fakeResponse(config, data, status = 200) {
  return { data, status, statusText: String(status), headers: {}, config };
}
function unauthorized(config) {
  return Promise.reject(new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, fakeResponse(config, {}, 401)));
}

async function probeAuthentication() {
  let refreshCalls = 0;
  let accessToken = 'expired-fixture-access-token';
  let sessionExpired = false;
  let failRefresh = false;
  const authStore = { setSessionExpired(value) { sessionExpired = value; } };
  const auth = load('apps/client/src/shared/services/auth/auth-interceptor.ts', {
    './token-storage': {
      getAccessToken: async () => accessToken,
      updateTokens: async data => { accessToken = data.accessToken; },
    },
    '@/shared/store/auth': { authStore },
    './auth-api': { refreshTokens: async () => {
      refreshCalls += 1;
      if (failRefresh) throw new axios.AxiosError('Network Error', 'ERR_NETWORK');
      return { accessToken: 'fresh-fixture-access-token', refreshToken: 'valid-fixture-refresh-token' };
    } },
  });
  // 실제 axios interceptor chain을 사용하되 모든 요청은 메모리 adapter에서 끝난다.
  const envelope = { success: true, data: [{ id: 'fixture-trip' }] };
  const apiAxios = axios.create({ adapter: config => {
    if (config.headers.Authorization?.includes('expired-fixture')) return unauthorized(config);
    return Promise.resolve(fakeResponse(config, envelope));
  } });
  const fetcher = load('apps/client/src/shared/api/fetcher.ts', {
    axios,
    './axios-instances': { apiAxios, baseURL: 'https://invalid.local' },
    '@/shared/services/auth/auth-interceptor': auth,
  }).default;
  const refreshedResult = await fetcher.get('/api/trips');
  accessToken = 'fresh-fixture-access-token';
  const normalResult = await fetcher.get('/api/trips');
  assert.deepEqual(normalResult, envelope);
  assert.deepEqual(refreshedResult, envelope.data);
  record('refresh-success-response-shape', { refreshCalls, normalResult, refreshedResult });

  const beforeRefresh = refreshCalls;
  accessToken = 'expired-fixture-access-token';
  const sync = load('apps/client/src/shared/services/sync/api.ts', {
    axios: { default: { create: () => axios.create({ adapter: unauthorized }) } },
    '@env': { EXPO_PUBLIC_API_URL: 'https://invalid.local' },
    '@/shared/services/auth': { getAccessToken: async () => accessToken, AuthRequiredError: auth.AuthRequiredError },
    '@/shared/store/auth': { authStore },
  }).default;
  let syncError;
  try { await sync.get('/api/sync/pull'); } catch (error) { syncError = error.name; }
  assert.equal(sessionExpired, true);
  assert.equal(refreshCalls, beforeRefresh);
  record('sync-401-valid-refresh-available', { sessionExpired, refreshAttempts: refreshCalls - beforeRefresh, error: syncError });

  sessionExpired = false;
  accessToken = 'expired-fixture-access-token';
  failRefresh = true;
  let ordinaryError;
  try { await fetcher.get('/api/trips'); } catch (error) {
    ordinaryError = { name: error.name, code: error.code, message: error.message };
  }
  assert.equal(sessionExpired, true);
  assert.equal(ordinaryError.code, 'UNKNOWN_ERROR');
  record('refresh-network-failure', { sessionExpired, ordinaryError });
}

function probeNavigation() {
  const state = { isAuthenticated: true, isInitialized: true, isSessionExpired: true };
  const redirects = [];
  const subject = extractFunction('apps/client/app/_layout.tsx', 'AuthRouter', {
    useAuthStore: () => state,
    useRouter: () => ({ replace: destination => redirects.push(destination) }),
    useSegments: () => ['(auth)', 'login'],
    useEffect: effect => effect(),
  });
  subject();
  assert.deepEqual(redirects, ['/(tabs)']);
  record('relogin-destination-authenticated-expired', { redirects });

  const trips = [
    { id: 'A', name: 'A', startDate: '2099-01-01', endDate: '2099-01-03' },
    { id: 'B', name: 'B', startDate: '2099-02-01', endDate: '2099-02-03' },
  ];
  let selection = 'B';
  const selectMainTrip = load('apps/client/src/entities/trip/utils/selectMainTrip.ts', {}).selectMainTrip;
  const initializer = extractFunction('apps/client/app/_layout.tsx', 'InitializeMainTrip', {
    useTripStore: () => ({ setSelectedTripId: id => { selection = id; } }),
    useGetTrips: () => ({ data: trips, isLoading: false, isError: false }),
    useEffect: effect => effect(), selectMainTrip,
  });
  initializer();
  assert.equal(selection, 'A');
  record('trip-list-effect-after-user-selected-B', { selectedBefore: 'B', selectedAfter: selection });
}

async function probeRepositories() {
  const router = load('apps/client/src/shared/services/offline-prep/router.ts', {
    './metadata': { hasAnyActivatedTrip: async () => false, getTripActivationStatus: async () => false },
    './errors': { OfflineError: class extends Error {} },
    '@/shared/store/network': { networkStore: { status: 'online' } },
  });
  for (const entity of ['schedule', 'expense']) {
    const capital = entity[0].toUpperCase() + entity.slice(1);
    let remoteUpdateCalls = 0;
    const local = { [`get${capital}TripIdLocal`]: async () => null };
    const api = {
      [`fetchCreate${capital}`]: async data => data,
      [`fetchUpdate${capital}`]: async () => { remoteUpdateCalls += 1; },
    };
    const repo = load(`apps/client/src/entities/${entity}/repository/${entity}-repository.ts`, {
      '@/shared/services/offline-prep/router': router,
      [`../lib/${entity}-local`]: local,
      [`../api/${entity}s`]: api,
    })[`${capital}Repository`];
    const created = await repo.create({ id: 'new-item', tripId: 'inactive-trip' });
    let updateError;
    try { await repo.update(created.id, { title: 'edit' }); } catch (error) { updateError = error.message; }
    assert.equal(remoteUpdateCalls, 0);
    assert.match(updateError, /not found/);
    record(`inactive-trip-create-then-edit-${entity}`, { created, updateError, remoteUpdateCalls });
  }
}

async function probeLogout() {
  const calls = [];
  let stats = { pending: 0, inProgress: 0, failed: 1, total: 1 };
  const logout = load('apps/client/src/shared/services/auth/logout-service.ts', {
    '@/shared/services/sync/queue': {
      getSyncQueueStats: async () => stats,
      clearSyncQueue: async () => calls.push('clearSyncQueue'),
    },
    './auth-api': { logout: async () => calls.push('serverLogout'), deleteAccount: async () => {} },
    '@/shared/store/auth': { authStore: { logout: async () => calls.push('clearAuth') } },
    '@/shared/db': { resetDatabase: async () => calls.push('resetDatabase') },
    '@/shared/lib/queryClient': { queryClient: { clear: () => calls.push('clearQueryCache') } },
  });
  const failedOnly = await logout.checkPendingSync();
  const result = await logout.performLogout();
  assert.equal(failedOnly.hasPending, false);
  assert.equal(result.success, true);
  assert.ok(calls.includes('resetDatabase'));
  record('logout-with-failed-unsent-item', { failedOnly, result, calls: [...calls] });
  stats = { pending: 1, inProgress: 0, failed: 0, total: 1 };
  calls.length = 0;
  const pendingResult = await logout.performLogout();
  assert.equal(pendingResult.hasPendingSync, true);
  assert.equal(calls.length, 0);
  record('logout-pending-control', { pendingResult, calls });
}

async function probeDelayedCurrency() {
  let trips = [];
  let hookResult;
  const { useCreateExpenseForm } = load('apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts', {
    'react-hook-form': clientRequire('react-hook-form'),
    '@hookform/resolvers/zod': { zodResolver: () => undefined },
    'expo-router': { useRouter: () => ({ back() {} }) },
    '@/entities/expense': { useCreateExpense: () => ({ mutate() {}, isPending: false }) },
    '@/entities/trip': { useGetTrips: () => ({ data: trips }) },
    '@/shared/services/id/ulid': { generateId: () => 'unused-fixture' },
    '@/shared/lib/datetime': { dateToISODateTime: value => value },
    './schema': { createExpenseFormSchema: {} },
  });
  function Probe() { hookResult = useCreateExpenseForm({ tripId: 'japan-trip' }); return null; }
  let component;
  await renderer.act(async () => { component = renderer.create(React.createElement(Probe)); });
  const before = hookResult.form.getValues('currency');
  trips = [{ id: 'japan-trip', baseCurrency: 'JPY' }];
  await renderer.act(async () => { component.update(React.createElement(Probe)); });
  const after = hookResult.form.getValues('currency');
  assert.equal(before, 'USD');
  assert.equal(after, 'USD');
  await renderer.act(async () => { component.unmount(); });
  record('expense-trip-data-arrives-after-form-mount', { tripCurrency: 'JPY', before, after });
}

async function probeManualSync() {
  const states = [];
  const engine = load('apps/client/src/shared/services/sync/engine.ts', {
    './api': { default: { post: async () => { throw new Error('Injected transport failure'); } } },
    './queue': {
      getPendingTasks: async () => [{ id: 'queue-fixture', tableName: 'trips', action: 'CREATE', recordId: 'new-trip', payload: '{}', retryCount: 0 }],
      deleteTask: async () => { throw new Error('Unexpected successful deletion'); },
      updateTaskStatus: async (_id, status) => states.push(status), retryFailedTask: async () => {},
    },
    './storage': { getLastSyncedAt: async () => null, setLastSyncedAt: async () => {} },
    '@/shared/db/utils': {},
    '@/shared/lib/queryClient': { queryClient: { invalidateQueries() {} } },
    '@/shared/db': { db: { select: () => ({ from: () => ({ where: async () => [] }) }) }, tripActivations: {} },
    'drizzle-orm': { eq() {} },
    './cleanup-job': { processPendingCleanups: async () => 0 },
    '@/shared/services/auth': { AuthRequiredError: class extends Error {} },
  });
  const result = await engine.triggerSync();
  assert.deepEqual(states, ['IN_PROGRESS', 'FAILED']);
  assert.equal(result.success, true);
  record('manual-sync-push-fails-no-active-trip', { states, result });
}

(async () => {
  await probeAuthentication();
  probeNavigation();
  await probeRepositories();
  await probeLogout();
  await probeDelayedCurrency();
  await probeManualSync();
  console.log(JSON.stringify({
    kind: 'isolated-source-probes-not-device-e2e',
    runAt: new Date().toISOString(),
    versions: { node: process.version, typescript: ts.version, axios: axios.VERSION, react: React.version },
    sourceSha256: hashes, results,
  }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
