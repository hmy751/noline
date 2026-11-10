import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Sentry from '@sentry/node';
import type { ErrorEvent, Log } from '@sentry/node';
import type { RequestHandler } from 'express';

const HTTP_AREAS = new Set(['trips', 'schedules', 'expenses', 'sync', 'auth', 'places', 'startup']);
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
const DATA_API_AREAS = new Set(['trips', 'schedules', 'expenses', 'sync']);
const ERROR_TYPES = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'ZodError']);
const REFUSAL_REASON_BY_STATUS: Partial<Record<number, string>> = {
  400: 'invalid_request',
  401: 'authentication_required',
  403: 'forbidden',
  404: 'target_unavailable',
  409: 'conflict',
};
const REFUSAL_MESSAGE = 'api.request.rejected';
const LOG_ATTRIBUTES = new Set(['area', 'method', 'status', 'reason', 'sentry.environment', 'sentry.release']);
const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const STARTUP_REPORT_TIMEOUT_MS = 1000;

export function initializeServerDiagnostics(): void {
  const dsn = process.env.SENTRY_DSN?.trim();

  if (!dsn) {
    return;
  }

  const environment = process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || 'development';
  const release = process.env.SENTRY_RELEASE?.trim() || undefined;

  try {
    const client = Sentry.init({
      dsn,
      environment,
      release,
      sendDefaultPii: false,
      defaultIntegrations: false,
      integrations: [
        Sentry.onUncaughtExceptionIntegration(),
        Sentry.onUnhandledRejectionIntegration({ mode: 'strict' }),
      ],
      skipOpenTelemetrySetup: true,
      enableLogs: true,
      maxBreadcrumbs: 0,
      beforeSend: sanitizeServerError,
      beforeSendLog: (log) => sanitizeRefusalLog(log, environment, release),
    });

    // SDK는 beforeSendLog 이후 scope attributes를 병합한다. 최종 전송 직전에도 허용한 필드만 남긴다.
    client?.on('beforeEnvelope', (envelope) => {
      for (const [header, payload] of envelope[1]) {
        if (header.type !== 'log' || typeof payload !== 'object' || !('items' in payload)) {
          continue;
        }

        for (const log of payload.items) {
          for (const key of Object.keys(log.attributes ?? {})) {
            if (!LOG_ATTRIBUTES.has(key) || (key === 'sentry.release' && !release)) {
              delete log.attributes?.[key];
            }
          }
        }
      }
    });
  } catch {
    console.warn('[Diagnostics] Sentry initialization failed');
  }
}

// Entity mutation은 online API와 sync가 공유하므로 서버 관측만으로 sync 횟수를 세지 않는다.
export const observeServerResponse: RequestHandler = (req, res, next) => {
  if (!Sentry.isEnabled()) {
    next();
    return;
  }

  const [, prefix, area] = req.path.split('/', 3);
  const tags = { area: prefix === 'api' && area && HTTP_AREAS.has(area) ? area : 'other', method: req.method };

  res.once('finish', () => {
    const status = res.statusCode;

    try {
      if (status >= 500) {
        Sentry.captureException(res.locals.diagnosticError ?? new Error('Unexpected server response'), {
          tags: { ...tags, status },
        });
      } else if (REFUSAL_REASON_BY_STATUS[status] && req.route && DATA_API_AREAS.has(tags.area)) {
        Sentry.logger.info(REFUSAL_MESSAGE, { ...tags, status });
      }
    } catch {
      // SDK 실패는 완료한 요청의 응답이나 이후 서버 요청 처리에 영향을 주지 않는다.
    }
  });

  next();
};

export async function reportStartupFailure(error: unknown): Promise<void> {
  if (!Sentry.isEnabled()) {
    return;
  }

  try {
    Sentry.captureException(error, { tags: { area: 'startup' } });
    await Sentry.flush(STARTUP_REPORT_TIMEOUT_MS);
  } catch {
    // 진단 서버가 응답하지 않아도 원래 실패 코드로 종료한다.
  }
}

function httpTags(tags: Record<string, unknown> = {}) {
  const { area, method, status } = tags;

  return {
    area: typeof area === 'string' && HTTP_AREAS.has(area) ? area : 'other',
    method: typeof method === 'string' && HTTP_METHODS.has(method) ? method : 'other',
    status:
      (typeof status === 'number' || typeof status === 'string') && /^[1-5]\d{2}$/.test(String(status))
        ? String(status)
        : 'unknown',
  };
}

// 소스 실행 시 서버 소스 트리, 배포 시 이 모듈이 위치한 tsup 번들의 코드 위치만 보고한다.
function serverFrameFilename(filename?: string): string | undefined {
  if (!filename || /[?#]/.test(filename)) {
    return undefined;
  }

  const path = filename.startsWith('file:///') ? filename.slice('file://'.length) : filename;

  if (!path.startsWith('/')) {
    return undefined;
  }

  if (moduleDirectory.endsWith('/src/services')) {
    const sourcePath = relative(resolve(moduleDirectory, '..'), path);

    if (/^(?:[a-z][\w-]*\/)*[a-z][\w-]*\.ts$/.test(sourcePath)) {
      return sourcePath;
    }
  } else {
    const bundleName = relative(moduleDirectory, path);

    if (/^(?:index|(?:chunk|start-server)-[A-Z0-9]{8})\.js$/.test(bundleName)) {
      return bundleName;
    }
  }

  return undefined;
}

// DB 오류 메시지에는 SQL·인자가, request와 breadcrumbs에는 실제 URL이 들어갈 수 있다.
export function sanitizeServerError(event: ErrorEvent): ErrorEvent {
  const exceptions = event.exception?.values ?? [{}];

  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: 'node',
    level: event.level,
    release: event.release,
    environment: event.environment,
    tags: httpTags(event.tags),
    exception: {
      values: exceptions.map((exception) => ({
        type: exception.type && ERROR_TYPES.has(exception.type) ? exception.type : 'ServerError',
        value: 'Unexpected server error',
        mechanism: exception.mechanism && { type: 'generic', handled: exception.mechanism.handled },
        stacktrace: {
          frames: exception.stacktrace?.frames?.map((frame) => ({
            filename: serverFrameFilename(frame.filename),
            lineno: frame.lineno,
            colno: frame.colno,
            in_app: frame.in_app,
          })),
        },
      })),
    },
  };
}

function sanitizeRefusalLog(log: Log, environment: string, release: string | undefined): Log | null {
  if (log.message !== REFUSAL_MESSAGE) {
    return null;
  }

  const tags = httpTags(log.attributes);
  const reason = REFUSAL_REASON_BY_STATUS[Number(tags.status)];

  if (!reason) {
    return null;
  }

  return {
    level: 'info',
    message: REFUSAL_MESSAGE,
    attributes: {
      ...tags,
      reason,
      'sentry.environment': environment,
      ...(release && { 'sentry.release': release }),
    },
  };
}
