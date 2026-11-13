import { sanitizeSentryEvent, syncFingerprint } from './sanitize-sentry-event';

import type { SyncReason } from '@/shared/services/sync/lifecycle';

type SentrySDK = Pick<typeof import('@sentry/react-native'), 'init' | 'captureEvent'>;
export interface SyncRun {
  traceId: string;
  reason: SyncReason;
  startedAt: number;
}
type SyncFailure =
  | 'local-before-send'
  | 'response-unconfirmed'
  | 'server-rejected'
  | 'local-after-response'
  | 'auth-blocked'
  | 'auth-refresh-failed';

interface DiagnosticsClient {
  sdk: SentrySDK;
  randomUUID: () => string;
}

let client: DiagnosticsClient | undefined;
const syncTables = new Set(['trips', 'schedules', 'expenses']);
const syncActions = new Set(['CREATE', 'UPDATE', 'DELETE']);

export function initializeDiagnostics(
  sentry: SentrySDK,
  randomUUID: () => string,
  dsn = process.env.EXPO_PUBLIC_SENTRY_DSN,
): void {
  if (!dsn || client) {
    return;
  }

  try {
    sentry.init({
      dsn,
      environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production'),
      maxBreadcrumbs: 0,
      beforeBreadcrumb: () => null,
      sendDefaultPii: false,
      // native crash는 JS 필터를 우회한다. 오프라인 전송은 사용하되 native crash 수집을 끈다.
      enableNativeCrashHandling: false,
      enableNdk: false,
      enableAppHangTracking: false,
      enableWatchdogTerminationTracking: false,
      enableAutoSessionTracking: false,
      attachThreads: false,
      attachScreenshot: false,
      attachViewHierarchy: false,
      enableCaptureFailedRequests: false,
      // 수동으로 만든 sync trace만 보낸다.
      enableAutoPerformanceTracing: false,
      enableAppStartTracking: false,
      enableNativeFramesTracking: false,
      enableStallTracking: false,
      enableUserInteractionTracing: false,
      enableNativeNagger: false,
      // Replay 비율을 0으로 설정해도 SDK 6은 화면 수집 통합을 설치하므로 값을 주지 않는다.
      // SDK Dedupe는 내용이 같은 별개의 격리 전환까지 누락시킬 수 있다.
      integrations: (defaults) => defaults.filter((integration) => integration.name !== 'Dedupe'),
      tracesSampleRate: 1,
      beforeSend: (event) => ({ ...sanitizeSentryEvent(event), type: undefined }),
      beforeSendTransaction: (event) => {
        if (event.transaction !== 'sync.started' && event.transaction !== 'sync.finished') {
          return null;
        }

        return {
          ...sanitizeSentryEvent(event),
          type: 'transaction',
          transaction: event.transaction,
          start_timestamp: event.start_timestamp,
          spans: [],
        };
      },
    });

    client = { sdk: sentry, randomUUID };
  } catch {
    // 진단 초기화가 실패해도 앱의 로그인·저장·동기화는 계속한다.
  }
}

export function startSyncDiagnostics(reason: SyncReason): SyncRun | undefined {
  if (!client) {
    return;
  }

  try {
    const run = { traceId: client.randomUUID().replace(/-/g, ''), reason, startedAt: Date.now() / 1000 };

    captureRunTransaction(client, run, 'sync.started');
    return run;
  } catch {
    return undefined;
  }
}

export function finishSyncDiagnostics(run: SyncRun | undefined, result: 'completed' | 'failed'): void {
  if (!client || !run) {
    return;
  }

  try {
    captureRunTransaction(client, run, 'sync.finished', result);
  } catch {
    // 결과 기록 실패로 이미 끝난 동기화의 상태를 바꾸지 않는다.
  }
}

type TaskFields = { tableName: string; action: string; retryCount: number };
type Signal =
  | { kind: 'sync.login.blocked'; task: TaskFields; stage: 'invalid-ownership' }
  | { kind: 'sync.quarantined'; task: TaskFields; source: 'login' | 'push' }
  | {
      kind: 'sync.push.resolved';
      task: TaskFields;
      stage: 'legacy-held' | 'entity-deleted' | 'trip-deleted';
      hasWaiting?: boolean;
    }
  | {
      kind: 'sync.push.blocked' | 'sync.pull.blocked';
      stage: SyncFailure;
      task?: TaskFields;
      hasWaiting?: boolean;
      httpStatus?: number;
    };

export function reportSyncSignal(signal: Signal, run?: SyncRun): void {
  if (!client) {
    return;
  }

  try {
    const task = signal.task;
    const tags: Record<string, string> = {};

    if (task) {
      tags['sync.table'] = syncTables.has(task.tableName) ? task.tableName : 'unknown';
      tags['sync.action'] = syncActions.has(task.action) ? task.action : 'unknown';
      tags['sync.previous_failures'] = String(task.retryCount);
    }
    if (run) {
      tags['sync.reason'] = run.reason;
    }

    if ('source' in signal) {
      tags['sync.source'] = signal.source;
    } else {
      tags['sync.stage'] = signal.stage;
      if (signal.kind === 'sync.push.blocked' && task) {
        tags['sync.repeated'] = String(task.retryCount > 0);
      }

      if ('hasWaiting' in signal && signal.hasWaiting !== undefined) {
        tags['sync.has_waiting'] = String(signal.hasWaiting);
      }

      if ('httpStatus' in signal && signal.httpStatus !== undefined) {
        tags['sync.http_status'] = String(signal.httpStatus);
      }
    }

    client.sdk.captureEvent({
      message: signal.kind,
      level: signal.kind === 'sync.quarantined' || signal.kind === 'sync.push.resolved' ? 'info' : 'warning',
      tags,
      contexts: run ? traceContext(client, run) : undefined,
      fingerprint: syncFingerprint(signal.kind, tags),
    });
  } catch {
    // Sentry 전송 결과는 큐 처리의 결과에 관여하지 않는다.
  }
}

function traceContext(diagnostics: DiagnosticsClient, run: SyncRun) {
  const spanId = diagnostics.randomUUID().replace(/-/g, '').slice(0, 16);
  return { trace: { trace_id: run.traceId, span_id: spanId, op: 'sync' } };
}

function captureRunTransaction(
  diagnostics: DiagnosticsClient,
  run: SyncRun,
  name: 'sync.started' | 'sync.finished',
  result?: 'completed' | 'failed',
) {
  const now = Date.now() / 1000;

  diagnostics.sdk.captureEvent({
    type: 'transaction',
    transaction: name,
    timestamp: now,
    start_timestamp: name === 'sync.started' ? now : run.startedAt,
    contexts: traceContext(diagnostics, run),
    tags: { 'sync.reason': run.reason, ...(result && { 'sync.result': result }) },
  });
}
