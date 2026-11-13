import type { Event } from '@sentry/react-native';

const SYNC_MESSAGES = new Set([
  'sync.quarantined',
  'sync.push.blocked',
  'sync.pull.blocked',
  'sync.login.blocked',
  'sync.push.resolved',
]);

// SDK scope에 다른 값이 붙었더라도 허용한 진단 어휘만 기기 밖으로 보낸다.
const TAG_VALUES: Record<string, RegExp> = {
  'sync.reason': /^(app-startup|conditions-ready|manual|periodic)$/,
  'sync.stage':
    /^(local-before-send|response-unconfirmed|server-rejected|local-after-response|auth-blocked|auth-refresh-failed|invalid-ownership|legacy-held|entity-deleted|trip-deleted)$/,
  'sync.table': /^(trips|schedules|expenses|unknown)$/,
  'sync.action': /^(CREATE|UPDATE|DELETE|unknown)$/,
  'sync.http_status': /^[1-5][0-9]{2}$/,
  'sync.result': /^(completed|failed)$/,
  'sync.previous_failures': /^[0-9]{1,10}$/,
  'sync.repeated': /^(true|false)$/,
  'sync.has_waiting': /^(true|false)$/,
  'sync.source': /^(login|push)$/,
};

function syncFingerprint(message: string, tags: Record<string, string>): string[] {
  return [
    message,
    tags['sync.stage'] ?? '',
    tags['sync.table'] ?? '',
    tags['sync.action'] ?? '',
    tags['sync.http_status'] ?? '',
  ];
}

export function sanitizeSentryEvent(event: Event): Event {
  const message = event.message && SYNC_MESSAGES.has(event.message) ? event.message : undefined;
  const isSync = Boolean(message) || event.transaction === 'sync.started' || event.transaction === 'sync.finished';
  const tags: Record<string, string> = {};

  if (isSync) {
    for (const [key, value] of Object.entries(event.tags ?? {})) {
      if (
        Object.prototype.hasOwnProperty.call(TAG_VALUES, key) &&
        typeof value === 'string' &&
        TAG_VALUES[key].test(value)
      ) {
        tags[key] = value;
      }
    }
  }

  const trace = event.contexts?.trace;
  const traceContext =
    isSync && trace && /^[a-f0-9]{32}$/.test(trace.trace_id) && /^[a-f0-9]{16}$/.test(trace.span_id)
      ? { trace: { trace_id: trace.trace_id, span_id: trace.span_id, op: 'sync' } }
      : undefined;

  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    release: event.release,
    dist: event.dist,
    environment: event.environment,
    platform: event.platform,
    level: event.level,
    debug_meta: event.debug_meta && {
      images: event.debug_meta.images?.flatMap((image) => {
        if (image.type !== 'sourcemap' || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(image.debug_id)) {
          return [];
        }

        const codeFile = bundleName(image.code_file);
        return codeFile ? [{ type: 'sourcemap' as const, code_file: codeFile, debug_id: image.debug_id }] : [];
      }),
    },
    message,
    fingerprint: message ? syncFingerprint(message, tags) : undefined,
    tags,
    contexts: traceContext,
    exception: event.exception && {
      values: event.exception.values?.map((value) => ({
        type: ['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError'].includes(value.type ?? '')
          ? value.type
          : 'Error',
        value: 'Application exception',
        mechanism: value.mechanism && { type: 'generic', handled: value.mechanism.handled },
        stacktrace: value.stacktrace && {
          frames: value.stacktrace.frames?.map((frame) => ({
            filename: bundleName(frame.filename),
            lineno: frame.lineno,
            colno: frame.colno,
            in_app: frame.in_app,
          })),
        },
      })),
    },
  };
}

// 스택은 소스맵 위치를 찾는 데 쓴다. URL 끝부분도 임의 경로나 사용자 입력일 수 있다.
function bundleName(filename?: string): string | undefined {
  const name = filename?.split(/[?#]/)[0].split('/').pop();

  if (
    name &&
    /^(main\.jsbundle|index(\.(ios|android))?\.bundle|InternalBytecode\.js|(index|entry)-[a-f0-9]{16,64}\.(js|hbc(\.map)?))$/.test(
      name,
    )
  ) {
    return `app:///${name}`;
  }

  return undefined;
}
