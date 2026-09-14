// 조사 전용: 제품 TS 함수를 실행하지만 DB·서버·native SDK는 메모리 대체물이다.
// 제약/실제 SQLite transaction/외부 API/화면 E2E를 검증하지 않는다. 실패도 관찰 결과로 기록한다.
// 현재 결함을 확인하는 assertion을 포함한다. 수정 후 회귀 테스트가 아니다.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const root = process.cwd();
const requireClient = createRequire(path.join(root, 'apps/client/package.json'));
const ts = requireClient('typescript');
const React = requireClient('react');
const renderer = requireClient('react-test-renderer');
const hashes = {}, results = [];
const quiet = { log() {}, error() {}, warn() {} };
const clone = x => JSON.parse(JSON.stringify(x));
function source(p) {
  const s = fs.readFileSync(path.join(root, p), 'utf8');
  hashes[p] = crypto.createHash('sha256').update(s).digest('hex');
  return s;
}
function load(p, deps = {}, bindings = {}, transform = s => s) {
  const module = { exports: {} };
  const js = ts.transpileModule(transform(source(p)), { fileName: p,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(js, { module, exports: module.exports, console: quiet, React,
    require(name) {
      if (Object.hasOwn(deps, name)) return deps[name];
      throw new Error(`Blocked import ${name} in ${p}`);
    }, ...bindings }, { filename: p });
  return module.exports;
}
function initializerOnly(name) {
  return s => {
    const ast = ts.createSourceFile('source.tsx', s, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let initializer;
    function visit(n) {
      if (ts.isVariableDeclaration(n) && n.name.getText(ast) === name) initializer = n.initializer;
      ts.forEachChild(n, visit);
    }
    visit(ast); assert.ok(initializer, name);
    return `export const subject = ${initializer.getText(ast)};`;
  };
}
const report = (scenario, observed, kind = 'defect-observed') => results.push({ scenario, kind, observed: clone(observed) });
const col = (t, k) => ({ t, k });
const table = name => new Proxy({ name }, { get: (t, k) => k === 'name' ? name : col(name, k) });
const orm = {
  eq: (c, v) => row => row[c.k] === v,
  and: (...ps) => row => ps.every(p => p(row)),
  isNull: c => row => row[c.k] == null,
  isNotNull: c => row => row[c.k] != null,
  lt: (c, v) => row => row[c.k] < v,
  desc: c => ({ ...c, descending: true }),
  sql: (_strings, c) => ({ increment: c.k }),
};
// 함수가 보낸 select/upsert/update/delete의 의미만 관찰하는 adapter. SQL/제약/격리 수준 모형이 아니다.
function fixture(seed = {}) {
  const names = ['trips', 'tripActivations', 'schedules', 'expenses', 'offlineCities', 'routes', 'syncQueue'];
  const rows = Object.fromEntries(names.map(n => [n, clone(seed[n] || [])]));
  const tables = Object.fromEntries(names.map(n => [n, table(n)]));
  const operations = [];
  function apply(row, set) {
    for (const [k, v] of Object.entries(set)) if (v !== undefined) row[k] = v?.increment ? (row[v.increment] || 0) + 1 : v;
  }
  function deferred(run) {
    let done = false, value;
    const once = () => { if (!done) { done = true; value = run(); } return value; };
    return { run: once, then(resolve, reject) { return Promise.resolve().then(once).then(resolve, reject); } };
  }
  const db = {
    select(projection) {
      let t, pred = () => true, order, max = Infinity;
      const all = () => {
        let selected = rows[t.name].filter(pred).slice();
        if (order) selected.sort((a, b) => String(a[order.k]).localeCompare(String(b[order.k])) * (order.descending ? -1 : 1));
        selected = selected.slice(0, max);
        return selected.map(r => projection ? Object.fromEntries(Object.entries(projection).map(([k, c]) => [k, r[c.k]])) : { ...r });
      };
      const q = { from(v) { t = v; return q; }, where(v) { pred = v; return q; },
        orderBy(v) { order = v; return q; }, limit(v) { max = v; return q; }, all, get: () => all()[0],
        then(resolve, reject) { return Promise.resolve().then(all).then(resolve, reject); } };
      return q;
    },
    insert(t) { return { values(data) {
      let conflict;
      const q = deferred(() => {
        for (const item of Array.isArray(data) ? data : [data]) {
          const key = conflict?.target.k;
          const existing = key && rows[t.name].find(r => r[key] === item[key]);
          if (existing) apply(existing, conflict.set); else rows[t.name].push({ ...item });
        }
        operations.push({ type: 'insert', table: t.name });
      });
      q.onConflictDoUpdate = options => { conflict = options; return q; };
      return q;
    } }; },
    update(t) { return { set(data) { return { where(pred) { return deferred(() => {
      rows[t.name].filter(pred).forEach(r => apply(r, data));
      operations.push({ type: 'update', table: t.name, data });
    }); } }; } }; },
    delete(t) { return { where(pred) { return deferred(() => {
      rows[t.name] = rows[t.name].filter(r => !pred(r));
      operations.push({ type: 'delete', table: t.name });
    }); } }; },
    transaction: async callback => callback(db),
  };
  let id = 0;
  const common = {
    '@/shared/db': { db, ...tables }, '@/shared/db/schema': tables, 'drizzle-orm': orm,
    '@/shared/db/utils': { withTransaction: async fn => fn(), getCurrentISOString: () => '2026-09-13T09:00:00.000Z' },
    '@/shared/store/auth': { authStore: { userId: 'U' } },
    '@/shared/services/id/ulid': { generateId: () => `fixture-${++id}` },
    '@/shared/lib/queryClient': { queryClient: { invalidateQueries() {} } },
    '@tanstack/react-query': { useMutation: x => x, useQuery: x => x, useQueryClient: () => ({ invalidateQueries() {} }) },
    '@/shared/lib/lifecycle': { TRIP_ACTIVATION_GRACE_DAYS: 7, SOFT_DELETE_VACUUM_DAYS: 7 },
  };
  for (const [entity, key] of [['trip', 'tripQueryKeys'], ['schedule', 'scheduleQueryKeys'], ['expense', 'expenseQueryKeys'], ['route', 'routeQueryKeys']]) {
    common[`@/entities/${entity}/data/keys`] = load(`apps/client/src/entities/${entity}/data/keys.ts`);
  }
  const queue = load('apps/client/src/shared/services/sync/queue.ts', { ...common,
    '../id/ulid': common['@/shared/services/id/ulid'] });
  common['./queue'] = common['@/shared/services/sync/queue'] = queue;
  return { rows, tables, db, common, queue, operations };
}
const trip = { id: 'A', userId: 'U', name: 'A', destination: 'Tokyo', country: 'JP',
  latitude: '35', longitude: '139', cityId: 1, startDate: '2026-10-01T00:00:00.000Z', endDate: '2026-10-03T00:00:00.000Z', deletedAt: null };
const schedule = { id: 'S', tripId: 'A', userId: 'U', title: 'saved', location: 'place', scheduledAt: '2026-10-01T01:00:00.000Z', latitude: '35', longitude: '139', deletedAt: null, version: 1 };
function activationHooks(f, opts = {}) {
  let maps = 0, routes = 0;
  const deps = { ...f.common, './keys': f.common['@/entities/trip/data/keys'],
    '@/shared/api/fetcher': { post: async () => {
      if (opts.failServer) throw new Error('fixture server failure');
      return { data: { trips: [trip], schedules: [schedule], expenses: [] } };
    } },
    '@/shared/services/offline-map/download': { downloadOfflineMapInBackground: async () => { maps++; if (opts.failMap) throw new Error('fixture map failure'); } },
    '@/shared/services/directions/route-downloader': { downloadRoutesForSchedules: async () => { routes++; return { downloaded: 0 }; } },
    '@/shared/services/offline-map': { cleanupOfflineMapForTrip: async () => {} },
  };
  return {
    activate: load('apps/client/src/entities/trip/data/useActivateTrip.ts', deps).useActivateTrip().mutationFn,
    deactivate: load('apps/client/src/entities/trip/data/useDeactivateTrip.ts', deps).useDeactivateTrip().mutationFn,
    counters: () => ({ maps, routes }),
  };
}
async function activationScenarios() {
  const f = fixture({ trips: [trip] }), h = activationHooks(f);
  await h.activate('A');
  assert.equal(f.rows.tripActivations[0].isActivated, true);
  assert.equal(f.rows.tripActivations[0].cleanupPending, false);
  report('first-activation-data-control', { activation: f.rows.tripActivations[0], schedules: f.rows.schedules.length, calls: h.counters() }, 'control');
  await h.activate('A');
  assert.equal(h.counters().maps, 1);
  report('retry-activation-while-map-not-ready', { mapDownloaded: f.rows.tripActivations[0].mapDownloaded, callsAfterTwoActivations: h.counters() });

  await f.queue.addToSyncQueue('schedules', 'S', 'CREATE', { ...schedule });
  const deactivated = await h.deactivate({ tripId: 'A', cleanupData: true });
  assert.equal(deactivated.cleanupPending, true);
  await h.activate('A');
  assert.equal(f.rows.tripActivations[0].cleanupPending, true);
  // 서버 전송이 끝난 조건을 부여한다. queue 전송 자체는 이 시나리오의 검증 대상이 아니다.
  f.rows.syncQueue = [];
  const cleanup = load('apps/client/src/shared/services/sync/cleanup-job.ts', { ...f.common,
    '@/shared/services/offline-map': { cleanupOfflineMapForTrip: async () => {} } });
  await cleanup.processPendingCleanups();
  assert.equal(f.rows.tripActivations[0].isActivated, true);
  assert.ok(f.rows.schedules[0].deletedAt);
  report('defer-cleanup-reactivate-drain-cleanup', { activation: f.rows.tripActivations[0], schedule: f.rows.schedules[0] });

  const g = fixture({ trips: [trip], tripActivations: [{ tripId: 'A', userId: 'U', isActivated: false, mapDownloaded: true, cleanupPending: false }] });
  await activationHooks(g, { failMap: true }).activate('A');
  const metadata = load('apps/client/src/shared/services/offline-prep/metadata.ts', g.common);
  assert.equal(await metadata.getTripActivationStatusDetail('A'), 'ready');
  report('reactivation-map-fails-but-old-ready-retained', { status: await metadata.getTripActivationStatusDetail('A'), activation: g.rows.tripActivations[0] });

  const fail = fixture({ trips: [trip] });
  await assert.rejects(activationHooks(fail, { failServer: true }).activate('A'));
  assert.equal(fail.rows.tripActivations.length, 0);
  report('first-activation-server-failure-control', { activations: 0, schedules: fail.rows.schedules.length }, 'control');
}
async function dataScenarios() {
  const f = fixture({ trips: [trip], schedules: [schedule], tripActivations: [{ tripId: 'A', userId: 'U', isActivated: true }] });
  const localTrip = load('apps/client/src/entities/trip/lib/trip-local.ts', f.common);
  await localTrip.updateTripLocal('A', { endDate: '2026-10-05T00:00:00.000Z' });
  assert.equal(f.rows.trips[0].latitude, null);
  assert.equal(f.rows.trips[0].longitude, null);
  report('edit-trip-dates-clears-local-coordinates', { trip: f.rows.trips[0], payload: f.rows.syncQueue[0].payload });
  const localSchedule = load('apps/client/src/entities/schedule/lib/schedule-local.ts', f.common);
  await localSchedule.updateScheduleLocal('S', { title: 'renamed' });
  assert.equal(f.rows.schedules[0].latitude, '35');
  report('schedule-title-edit-preserves-coordinates-control', f.rows.schedules[0], 'control');

  const localExpense = load('apps/client/src/entities/expense/lib/expense-local.ts', f.common);
  await localExpense.createExpenseLocal({ id: 'E', userId: 'U', tripId: 'A', scheduleId: 'S', title: 'Lunch', amount: '1000', currency: 'JPY', category: '식사', date: trip.startDate });
  await localExpense.updateExpenseLocal('E', { amount: '1200' });
  assert.equal((await localExpense.getExpensesByScheduleIdLocal('S'))[0].amount, '1200');
  await localExpense.deleteExpenseLocal('E');
  assert.equal((await localExpense.getExpensesByTripIdLocal('A')).length, 0);
  await localSchedule.deleteScheduleLocal('S');
  assert.equal((await localSchedule.getSchedulesLocal('A')).length, 0);
  report('local-expense-crud-schedule-delete-control', { queue: f.rows.syncQueue.map(q => ({ table: q.tableName, action: q.action, payload: q.payload })) }, 'control');

  await localTrip.deleteTripLocal('A');
  const metadata = load('apps/client/src/shared/services/offline-prep/metadata.ts', f.common);
  assert.equal((await localTrip.getTripsLocal()).length, 0);
  assert.equal(await metadata.hasAnyActivatedTrip(), true);
  report('delete-last-active-trip-leaves-activation', { visibleTrips: 0, hasAnyActivatedTrip: true, activation: f.rows.tripActivations[0] });

  const net = { status: 'online' };
  const router = load('apps/client/src/shared/services/offline-prep/router.ts', { './metadata': metadata,
    './errors': { OfflineError: class extends Error {} }, '@/shared/store/network': { networkStore: net } });
  const calls = [];
  const ops = { local: async () => { calls.push('local'); }, remote: async () => { calls.push('remote'); } };
  await router.routeChildMutation('A', ops); await router.routeChildMutation('B', ops);
  net.status = 'offline';
  await router.routeChildMutation('A', ops); await assert.rejects(router.routeChildMutation('B', ops));
  assert.deepEqual(calls, ['local', 'remote', 'local']);
  report('child-router-online-offline-active-inactive-control', { calls, offlineInactive: 'blocked' }, 'control');
}
async function routeScenarios() {
  const f = fixture(); let calls = 0, fail = false;
  const subject = load('apps/client/src/shared/services/directions/route-downloader.ts', { ...f.common,
    './mapbox': { getDirections: async () => { calls++; if (fail) throw new Error('fixture directions failed'); return { geometry: 'fixture', distance: 10, duration: 20 }; } } });
  const pair = [{ id: 'S1', latitude: 1, longitude: 10 }, { id: 'S2', latitude: 2, longitude: 20 }];
  const normal = await subject.downloadRoutesForSchedules({ tripId: 'A', schedules: pair });
  assert.equal(normal.downloaded, 3);
  report('route-three-profiles-control', { calls, normal }, 'control');
  calls = 0;
  const moved = await subject.downloadRoutesForSchedules({ tripId: 'A', schedules: [pair[0], { ...pair[1], latitude: 3 }] });
  assert.equal(calls, 0);
  report('route-existing-ids-changed-coordinates-skipped', { calls, moved });
  f.rows.routes = []; calls = 0;
  const zero = await subject.downloadRoutesForSchedules({ tripId: 'A', schedules: [{ ...pair[0], latitude: 0 }, pair[1]] });
  assert.equal(calls, 0);
  report('route-equator-coordinate-zero-omitted', { calls, zero });
  fail = true;
  const failed = await subject.downloadRoutesForSchedules({ tripId: 'A', schedules: pair });
  assert.equal(calls, 3); assert.equal(failed.downloaded, 0);
  report('all-directions-fail-resolves-zero', { calls, failed });
}
async function syncScenarios() {
  const f = fixture({ trips: [trip], schedules: [{ ...schedule, title: 'unsent edit', version: 2 }],
    tripActivations: [{ tripId: 'A', isActivated: true }] });
  await f.queue.addToSyncQueue('schedules', 'S', 'UPDATE', { title: 'unsent edit' });
  let pushes = 0;
  const utils = load('apps/client/src/shared/db/utils.ts', { './index': { db: f.db, ...f.tables } });
  const engine = load('apps/client/src/shared/services/sync/engine.ts', { ...f.common,
    './api': { post: async () => { pushes++; throw new Error('fixture offline'); },
      put: async () => { pushes++; throw new Error('fixture offline'); },
      get: async () => ({ data: { data: { trips: [], schedules: [schedule], expenses: [], serverTime: '2026-09-13T09:00:00Z' } } }) },
    './storage': { getLastSyncedAt: async () => null, setLastSyncedAt: async () => {} },
    '@/shared/db/utils': utils, './cleanup-job': { processPendingCleanups: async () => 0 },
    '@/shared/services/auth': { AuthRequiredError: class extends Error {} },
  });
  await engine.pushChanges();
  assert.equal(f.rows.syncQueue[0].status, 'FAILED');
  await engine.pushChanges();
  assert.equal(pushes, 1);
  report('failed-write-not-retried-next-push', { pushesAfterTwoRuns: pushes, queue: f.rows.syncQueue });
  await engine.pullChanges();
  assert.equal(f.rows.schedules[0].title, 'saved');
  report('failed-unsent-edit-overwritten-by-pull', { local: f.rows.schedules[0], retainedQueue: f.rows.syncQueue });
  f.rows.syncQueue[0].status = 'IN_PROGRESS';
  await engine.pushChanges();
  assert.equal(pushes, 1);
  report('restart-with-in-progress-is-not-picked-up', { additionalPushes: pushes - 1, status: f.rows.syncQueue[0].status });
}
async function mapScenarios() {
  const f = fixture({ trips: [trip], tripActivations: [{ tripId: 'A', isActivated: true, mapDownloaded: false, syncProgress: 0 }] });
  let packs = [], percentage = 0, progressListener, nativeReads = 0;
  const manager = {
    getPacks: async () => { nativeReads++; return packs; },
    createPack: async (options, progress) => {
      progressListener = progress;
      packs = [{ name: options.name, status: async () => ({ percentage }) }];
      // 설치된 iOS RNMBXOfflineModule.createPack처럼 다운로드 시작 후 resolve.
    },
    deletePack: async name => { packs = packs.filter(p => p.name !== name); },
  };
  const deps = { ...f.common, '@rnmapbox/maps': { offlineManager: manager },
    '@/entities/offline-city/data/keys': { offlineCityKeys: { all: () => ['offline-city'] } } };
  const download = load('apps/client/src/shared/services/offline-map/download.ts', deps).downloadOfflineMapInBackground;
  await download('A');
  assert.equal(percentage, 0); assert.equal(f.rows.tripActivations[0].mapDownloaded, true);
  report('map-ready-before-native-download-completion', { percentage, mapDownloaded: f.rows.tripActivations[0].mapDownloaded });
  percentage = 10; await progressListener(packs[0], { percentage, completedTileCount: 1 });
  assert.equal(f.rows.tripActivations[0].mapDownloaded, true);
  report('map-progress-ten-percent-still-ready', f.rows.tripActivations[0]);
  const cleanup = load('apps/client/src/shared/services/offline-map/cleanup.ts', deps).cleanupOfflineMapForTrip;
  await cleanup('A');
  assert.equal(packs.length, 0); assert.equal(f.rows.offlineCities.length, 0);
  assert.equal(f.rows.tripActivations[0].mapDownloaded, true);
  report('map-cleanup-leaves-ready-flag', { nativePacks: packs.length, offlineCities: f.rows.offlineCities.length, mapDownloaded: true });
  f.rows.offlineCities = [{ cityId: 1, referenceCount: 1 }];
  const before = nativeReads;
  await download('A');
  assert.equal(nativeReads, before);
  report('cached-city-reused-without-checking-native-pack', { nativeReadCalls: nativeReads - before, nativePacks: packs.length, mapDownloaded: true });
  // 사용한 SDK 계약의 근거도 hash에 포함한다. native 구현 자체 실행을 뜻하지 않는다.
  source('node_modules/@rnmapbox/maps/src/modules/offline/offlineManager.ts');
  source('node_modules/@rnmapbox/maps/ios/RNMBX/Offline/RNMBXOfflineModule.swift');
}
async function uiScenarios() {
  const native = { View: 'View', Text: 'Text', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator', Platform: { OS: 'ios' } };
  const icons = new Proxy({}, { get: (_t, key) => key });
  const ui = { Drawer: 'Drawer', Pressable: 'Pressable', Card: 'Card', Separator: 'Separator', cn: (...args) => args.filter(Boolean).join(' ') };
  const shared = { Container: 'Container', Stack: 'Stack', MobileHeader: 'MobileHeader' };
  const dt = load('apps/client/src/shared/lib/datetime.ts');
  const currency = load('apps/client/src/shared/lib/currency.ts');
  const routes = [], logs = [];
  const Detail = load('apps/client/src/screens/ScheduleDetailScreen.tsx', {
    'react-native': native, 'lucide-react-native': icons, '@repo/ui': ui, '@/shared/components': shared,
    '@/features/schedule/schedule-expense-list': { ScheduleExpenseList: 'ScheduleExpenseList' },
    '@/shared/lib/datetime': dt, '@/shared/lib/currency': currency,
    'expo-router': { useRouter: () => ({ push: p => routes.push(p) }) },
    '@/entities/schedule/data': { useGetScheduleById: () => ({ data: schedule, isLoading: false }) },
    '@/entities/expense': { useGetScheduleExpenses: () => ({ data: [], isLoading: false }) },
  }, { console: { ...quiet, log: (...args) => logs.push(args) } }).default;
  let tree;
  await renderer.act(async () => { tree = renderer.create(React.createElement(Detail, { scheduleId: 'S', tripId: 'A', scheduledAt: schedule.scheduledAt, onBack() {} })); });
  const buttons = tree.root.findAllByType('Pressable');
  await renderer.act(async () => { buttons[0].props.onPress(); });
  assert.equal(routes.length, 0); assert.equal(logs.length, 1);
  report('schedule-detail-show-on-map-button', { routeCalls: routes.length, logs });
  await renderer.act(async () => { buttons[1].props.onPress(); });
  assert.match(routes[0], /tripId=A&scheduleId=S&date=/);
  report('schedule-detail-add-expense-link-control', { route: routes[0] }, 'control');
  await renderer.act(async () => tree.unmount());

  const Drawer = load('apps/client/src/entities/trip/ui/ActivationProgressDrawer.tsx', { react: React, 'react-native': native, 'lucide-react-native': icons, '@repo/ui': ui }).ActivationProgressDrawer;
  await renderer.act(async () => { tree = renderer.create(React.createElement(Drawer, { isOpen: true, onClose() {}, title: 'A', items: [
    { id: 'data', status: 'success', label: 'data' }, { id: 'map', status: 'error', label: 'map', error: 'failed' },
  ] })); });
  const text = tree.root.findAllByType('Text').map(n => n.children.filter(x => typeof x === 'string').join('')).filter(Boolean);
  assert.ok(text.includes('오프라인 준비 중...')); assert.ok(text.includes('잠시만 기다려주세요...'));
  assert.equal(tree.root.findAllByType('Pressable').length, 0);
  report('activation-error-drawer-still-says-wait', { text, footerButtons: 0, note: 'native Drawer close gesture is not tested' });
  await renderer.act(async () => tree.unmount());

  let oauthResult = { success: false, error: 'CANCELLED' }, logins = 0, serverCalls = 0;
  const Login = load('apps/client/src/screens/LoginScreen.tsx', {
    react: React, 'react-native': { ...native, Alert: { alert() {} } },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' }, 'lucide-react-native': icons, '@repo/ui': ui,
    '@/shared/services/auth': {
      useGoogleAuth: () => ({ signIn: async () => oauthResult, isLoading: false }),
      isGoogleAuthConfigured: () => true, isAppleAuthAvailable: () => false,
      loginWithGoogle: async () => { serverCalls++; return { accessToken: 'test', refreshToken: 'test', user: { id: 'U', name: 'Fixture', email: 'fixture@example.invalid' } }; },
    },
    '@/shared/store/auth': { useAuthStore: () => ({ login: async () => logins++, userId: null, isSessionExpired: false }) },
    '@/shared/db': { resetDatabase: async () => { throw new Error('unexpected cleanup'); } },
    '@/shared/services/sync/queue': { clearSyncQueue: async () => { throw new Error('unexpected cleanup'); } },
    '@/shared/lib/queryClient': { queryClient: { clear() {} } },
  }).default;
  await renderer.act(async () => { tree = renderer.create(React.createElement(Login)); });
  await renderer.act(async () => { await tree.root.findByType('Pressable').props.onPress(); });
  assert.equal(serverCalls, 0); assert.equal(logins, 0); assert.equal(tree.root.findByType('Pressable').props.disabled, false);
  report('google-login-cancel-returns-idle-control', { serverCalls, logins, disabled: false }, 'control');
  oauthResult = { success: true, idToken: 'fixture' };
  await renderer.act(async () => { await tree.root.findByType('Pressable').props.onPress(); });
  assert.equal(serverCalls, 1); assert.equal(logins, 1);
  report('google-login-success-calls-auth-store-control', { serverCalls, logins }, 'control');
  await renderer.act(async () => tree.unmount());
}
async function searchAndStartupScenarios() {
  let failDetails = false;
  const search = load('apps/client/src/features/schedule/create-schedule/useLocationSearch.ts', {
    react: React, '@tanstack/react-query': {}, '@/shared/hooks/useDebounce': {},
    '@/shared/api/fetcher': {
      post: async () => ({ success: true, data: { results: [{ id: 'P', placeId: 'P', name: 'Cafe', address: 'Tokyo' }] } }),
      get: async () => { if (failDetails) throw new Error('fixture details timeout');
        return { id: 'P', placeId: 'P', name: 'Cafe', address: 'Tokyo', latitude: 35, longitude: 139 }; },
    },
  }, {}, s => s + '\nexport { searchPlaces };').searchPlaces;
  const normal = await search('Cafe', { cityName: 'Tokyo' });
  assert.equal(normal[0].latitude, 35);
  report('place-search-and-detail-contract-control', normal, 'control');
  failDetails = true;
  const failed = await search('Cafe', { cityName: 'Tokyo' });
  assert.equal(failed[0].latitude, 0); assert.equal(failed[0].longitude, 0);
  report('place-details-failure-returns-selectable-zero-coordinates', failed);

  let authCalls = 0, ready = false;
  const prepareApp = load('apps/client/app/_layout.tsx', {}, {
    networkStore: { init() {} }, initializeDatabase: async () => { throw new Error('fixture database init failed'); },
    initAuth: async () => { authCalls++; }, setIsAppReady: value => { ready = value; },
  }, s => {
    const ast = ts.createSourceFile('layout.tsx', s, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let initializer;
    function visit(n) {
      if (ts.isVariableDeclaration(n) && n.name.getText(ast) === 'prepareApp') initializer = n.initializer;
      ts.forEachChild(n, visit);
    }
    visit(ast); assert.ok(initializer);
    return `export const prepareApp = ${initializer.getText(ast)};`;
  }).prepareApp;
  await prepareApp();
  assert.equal(authCalls, 0); assert.equal(ready, true);
  report('database-init-fails-but-app-ready-auth-not-initialized', { authCalls, ready });
}
async function crossFeatureScenarios() {
  const dt = load('apps/client/src/shared/lib/datetime.ts');
  const groups = load('apps/client/src/screens/ScheduleScreen.tsx', {}, {
    dateRange: ['2026-10-02'], schedules: [schedule], ...dt, useMemo: fn => fn(),
  }, initializerOnly('schedulesByDate')).subject;
  assert.equal(groups.flatMap(g => g.schedules).length, 0);
  report('shorten-trip-range-hides-existing-schedule', { storedSchedule: schedule, renderedGroups: groups });
  const expenseGroups = load('apps/client/src/screens/ExpensesScreen.tsx', {}, {
    dateRange: ['2026-10-02'], expenses: [{ id: 'E', date: '2026-10-01T12:00:00.000Z' }], ...dt, useMemo: fn => fn(),
  }, initializerOnly('expensesByDate')).subject;
  assert.equal(expenseGroups.flatMap(g => g.items).length, 1);
  report('outside-trip-range-expense-remains-visible-control', { groups: expenseGroups }, 'control');
  for (const name of ['schedule', 'expense']) {
    const cap = name[0].toUpperCase() + name.slice(1);
    let remoteCalls = 0;
    const repo = load(`apps/client/src/entities/${name}/repository/${name}-repository.ts`, {
      '@/shared/services/offline-prep/router': { routeChildMutation: async (_id, ops) => ops.remote(), routeChildQuery: async (_id, ops) => ops.remote() },
      [`../lib/${name}-local`]: { [`get${cap}TripIdLocal`]: async () => null, getTripIdByScheduleIdLocal: async () => null },
      [`../api/${name}s`]: { [`fetchDelete${cap}`]: async () => { remoteCalls++; }, fetchExpensesByScheduleId: async () => { remoteCalls++; } },
    })[`${cap}Repository`];
    await assert.rejects(repo.delete('remote-only'));
    if (name === 'expense') await assert.rejects(repo.getByScheduleId('remote-only'));
    assert.equal(remoteCalls, 0);
    report(`inactive-${name}-delete${name === 'expense' ? '-and-linked-query' : ''}-blocked-before-api`, { remoteCalls });
  }
}
function dateScenario() {
  const dt = load('apps/client/src/shared/lib/datetime.ts');
  const requested = '2026-09-13';
  const storedSchedule = dt.combineDateTimeToISO(requested, '09:00');
  const storedDate = dt.dateToISODateTime(requested);
  return { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, requested, storedSchedule,
    shownScheduleDate: dt.formatISOToLocalDate(storedSchedule), storedDate, shownDate: dt.formatISOToLocalDate(storedDate) };
}
async function smallControls() {
  const currency = load('apps/client/src/shared/lib/currency.ts');
  const totals = currency.groupExpensesByCurrency([{ currency: 'JPY', amount: '1000' }, { currency: 'JPY', amount: '2000' }, { currency: 'USD', amount: '5.25' }], 'JPY');
  assert.equal(totals[0].amount, 3000); assert.equal(totals[1].amount, 5.25);
  report('currency-independent-totals-control', { totals, jpy: currency.formatCurrencyDisplay(3000, 'JPY') }, 'control');
  const policy = load('apps/client/src/shared/policy/constants.ts');
  assert.equal(policy.TRIP_POLICIES.create.offline_active.allowed, false);
  assert.equal(policy.SCHEDULE_POLICIES.create.offline_active.mode, 'manual-only');
  assert.equal(policy.EXPENSE_POLICIES.create.offline_inactive.allowed, false);
  report('offline-create-policy-control', { trip: policy.TRIP_POLICIES.create.offline_active, schedule: policy.SCHEDULE_POLICIES.create.offline_active, expense: policy.EXPENSE_POLICIES.create.offline_inactive }, 'control');

  let requested = 0, moved = 0, hook;
  const alerts = [];
  const { useMyLocation } = load('apps/client/src/shared/hooks/map/useMyLocation.ts', { react: React,
    'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
    'expo-location': { requestForegroundPermissionsAsync: async () => ({ status: 'denied' }), getCurrentPositionAsync: async () => { requested++; }, Accuracy: { Balanced: 3 } },
  });
  function Host() { hook = useMyLocation({ mapRef: { current: { animateToRegion: () => moved++ } } }); return null; }
  let tree;
  await renderer.act(async () => { tree = renderer.create(React.createElement(Host)); });
  await renderer.act(async () => { await hook.moveToCurrentLocation(); });
  assert.equal(hook.isLoading, false); assert.equal(requested, 0); assert.equal(moved, 0); assert.equal(alerts.length, 1);
  report('location-permission-denied-control', { requested, moved, alerts, isLoading: hook.isLoading }, 'control');
  await renderer.act(async () => tree.unmount());
}
async function main() {
  if (process.argv.includes('--date-only')) { process.stdout.write(JSON.stringify(dateScenario())); return; }
  for (const fn of [activationScenarios, dataScenarios, routeScenarios, syncScenarios, mapScenarios, uiScenarios, searchAndStartupScenarios, crossFeatureScenarios, smallControls]) await fn();
  source('apps/client/src/shared/lib/datetime.ts');
  for (const zone of ['Asia/Seoul', 'America/Los_Angeles', 'UTC']) {
    const child = spawnSync(process.execPath, [__filename, '--date-only'], { cwd: root, env: { ...process.env, TZ: zone }, encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
    const value = JSON.parse(child.stdout);
    assert.equal(value.shownDate, zone === 'America/Los_Angeles' ? '2026-09-12' : '2026-09-13');
    assert.equal(value.shownScheduleDate, zone === 'America/Los_Angeles' ? '2026-09-12' : '2026-09-13');
    report(`date-roundtrip-${zone}`, value, zone === 'America/Los_Angeles' ? 'defect-observed' : 'control');
  }
  process.stdout.write(JSON.stringify({ executedAt: new Date().toISOString(), node: process.version,
    typescript: ts.version, hashes, limits: ['in-memory DB adapter; no real SQL constraints/transactions', 'no native UI, OAuth, network or user data', 'known-defect assertions are not fixed-behavior acceptance'], results }, null, 2) + '\n');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
