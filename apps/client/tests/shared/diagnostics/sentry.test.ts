import { expect, it, jest } from '@jest/globals';
import { sanitizeSentryEvent } from '@/shared/diagnostics/sanitize-sentry-event';
import type { ReactNativeOptions } from '@sentry/react-native';
import {
  initializeDiagnostics,
  startSyncDiagnostics,
  finishSyncDiagnostics,
  reportSyncSignal,
} from '@/shared/diagnostics/sentry';

it('DSN이 있을 때만 수집하고 시작·종료를 연결하며 원본·자격증명을 보내지 않는다', () => {
  const sentry = {
    init: jest.fn<typeof import('@sentry/react-native').init>(),
    captureEvent: jest.fn<typeof import('@sentry/react-native').captureEvent>(),
  };
  const randomUUID = () => '550e8400-e29b-41d4-a716-446655440000';
  initializeDiagnostics(sentry, randomUUID, '');
  expect(startSyncDiagnostics('manual')).toBeUndefined();
  expect(sentry.init).not.toHaveBeenCalled();
  initializeDiagnostics(sentry, randomUUID, 'https://test@localhost/1');
  expect(sentry.init).toHaveBeenCalledTimes(1);
  const opts = sentry.init.mock.calls[0]?.[0] as ReactNativeOptions;
  expect(opts).toMatchObject({
    enableNativeCrashHandling: false,
    enableNdk: false,
    maxBreadcrumbs: 0,
    sendDefaultPii: false,
    attachViewHierarchy: false,
    attachScreenshot: false,
    enableAppStartTracking: false,
    enableNativeFramesTracking: false,
    enableStallTracking: false,
  });
  expect(opts).not.toHaveProperty('replaysSessionSampleRate');
  expect(opts).not.toHaveProperty('replaysOnErrorSampleRate');
  const run = startSyncDiagnostics('manual');
  finishSyncDiagnostics(run, 'completed');
  expect(sentry.captureEvent.mock.calls[0][0]).toMatchObject({
    transaction: 'sync.started',
    contexts: { trace: { trace_id: run?.traceId } },
  });
  expect(sentry.captureEvent.mock.calls[1][0]).toMatchObject({
    transaction: 'sync.finished',
    tags: { 'sync.result': 'completed' },
    contexts: { trace: { trace_id: run?.traceId } },
  });
  reportSyncSignal({
    kind: 'sync.quarantined',
    task: { tableName: 'secret-title', action: 'DELETE', retryCount: 2 },
    source: 'login',
  });
  expect(sentry.captureEvent.mock.calls[2][0]).toMatchObject({
    tags: { 'sync.table': 'unknown', 'sync.action': 'DELETE', 'sync.source': 'login', 'sync.previous_failures': '2' },
  });
  const filtered = opts.beforeSend?.(
    {
      type: undefined,
      user: { id: 'private' },
      breadcrumbs: [{ message: 'private' }],
      request: { url: 'private' },
      extra: { payload: 'private' },
      exception: { values: [{ value: 'private', type: 'TypeError' }] },
    },
    {},
  );
  expect(JSON.stringify(filtered)).not.toContain('private');
  sentry.captureEvent.mockImplementation(() => {
    throw new Error('SDK failed');
  });
  expect(() => reportSyncSignal({ kind: 'sync.pull.blocked', stage: 'response-unconfirmed' })).not.toThrow();
});

it('전송 직전 이름까지 맞는 민감한 tag·fingerprint·프레임 경로도 제거하고 번들 좌표만 유지한다', () => {
  const filtered = sanitizeSentryEvent({
    message: 'sync.push.blocked',
    fingerprint: ['private'],
    tags: {
      'sync.reason': 'private',
      'sync.stage': 'auth-refresh-failed',
      'sync.previous_failures': 'private',
      'sync.table': 'private',
      unknown: 'private',
    },
    debug_meta: {
      images: [{ type: 'sourcemap', code_file: 'https://example.org/trips/private', debug_id: 'private' }],
    },
    exception: {
      values: [
        {
          value: 'private',
          mechanism: { type: 'private', handled: true },
          stacktrace: {
            frames: [
              { filename: 'https://example.org/trips/private', function: 'private', vars: { id: 'private' } },
              { filename: 'app:///main.jsbundle?secret=private', function: 'private', lineno: 1, colno: 314 },
            ],
          },
        },
      ],
    },
  });
  expect(JSON.stringify(filtered)).not.toContain('private');
  expect(filtered.tags).toEqual({ 'sync.stage': 'auth-refresh-failed' });
  expect(filtered.exception?.values?.[0].stacktrace?.frames?.[1]).toMatchObject({
    filename: 'app:///main.jsbundle',
    lineno: 1,
    colno: 314,
  });
});

it.each(['hbc', 'hbc.map'])('Expo가 생성한 Hermes 번들의 프레임과 debug image 경로가 일치한다: %s', (extension) => {
  const bundle = `index-${'a'.repeat(32)}.${extension}`;
  const frame = `file:///private/test/Staging.app/${bundle}`;
  const image = `app:///${bundle}`;
  const debugId = '11111111-1111-4444-8888-111111111111';

  const filtered = sanitizeSentryEvent({
    debug_meta: { images: [{ type: 'sourcemap', code_file: image, debug_id: debugId }] },
    exception: { values: [{ stacktrace: { frames: [{ filename: frame, lineno: 1, colno: 300 }] } }] },
  });

  expect(filtered.debug_meta?.images?.[0]).toMatchObject({ code_file: image, debug_id: debugId });
  expect(filtered.exception?.values?.[0].stacktrace?.frames?.[0]).toMatchObject({ filename: image, colno: 300 });
});
