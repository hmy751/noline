import * as Sentry from '@sentry/node';
import type { Application } from 'express';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import request from 'supertest';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';

import { dbSelectMock, loadTestApp, resetDbMock } from './support/test-app.js';
import { initializeServerDiagnostics, reportStartupFailure, sanitizeServerError } from '../src/services/sentry.js';

const envelopes: string[] = [];
const receiver = createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    envelopes.push((req.headers['content-encoding'] === 'gzip' ? gunzipSync(body) : body).toString());
    res.writeHead(200).end('{}');
  });
});
let app: Application;

beforeAll(async () => {
  await new Promise<void>((resolve) => receiver.listen(0, '127.0.0.1', resolve));
  const port = (receiver.address() as AddressInfo).port;
  vi.stubEnv('SENTRY_DSN', `http://public@127.0.0.1:${port}/1`);
  vi.stubEnv('SENTRY_RELEASE', 'test-release-42');
  vi.stubEnv('SENTRY_ENVIRONMENT', 'staging');
  initializeServerDiagnostics();
  app = await loadTestApp();
});
afterAll(async () => {
  await Sentry.close(2000);
  await new Promise<void>((resolve) => receiver.close(() => resolve()));
  vi.unstubAllEnvs();
});

it('격리된 수신기에 서버 500은 오류로, 계정·원본을 구별할 수 없는 404는 로그로 한 번씩 전송한다', async () => {
  envelopes.length = 0;
  resetDbMock();
  Sentry.getGlobalScope().setAttributes({
    'private.context': 'PRIVATE_SCOPE_VALUE',
    area: 'PRIVATE_AREA',
    method: 'PRIVATE_METHOD',
    status: 'PRIVATE_STATUS',
    reason: 'PRIVATE_REASON',
    'sentry.release': 'PRIVATE_TAG_RELEASE',
    'sentry.environment': 'PRIVATE_TAG_ENVIRONMENT',
  });
  dbSelectMock.mockImplementationOnce(() => {
    throw new Error('PRIVATE_SQL_TEST');
  });
  await request(app)
    .put('/api/schedules/PRIVATE_RECORD_ID')
    .set('Authorization', 'Bearer PRIVATE_TOKEN_TEST')
    .send({ title: 'PRIVATE_SCHEDULE_TITLE' })
    .expect(500);
  await request(app)
    .put('/api/schedules/PRIVATE_RECORD_ID')
    .set('Authorization', 'Bearer PRIVATE_TOKEN_TEST')
    .send({ title: 'PRIVATE_SCHEDULE_TITLE' })
    .expect(404);

  await Sentry.flush(3000);
  const output = envelopes.join('\n');
  const logEnvelope = envelopes.find((envelope) => envelope.includes('"body":"api.request.rejected"'));
  expect(logEnvelope).toBeDefined();

  const {
    items: [log],
  } = JSON.parse(logEnvelope!.split('\n')[2]);
  expect(log.attributes).toMatchObject({
    'sentry.environment': { value: 'staging' },
    'sentry.release': { value: 'test-release-42' },
    reason: { value: 'target_unavailable' },
    area: { value: 'schedules' },
    method: { value: 'PUT' },
    status: { value: '404' },
  });
  expect(output).not.toContain('PRIVATE');
  expect(output.match(/"type":"event"/g)).toHaveLength(1);
  expect(output.match(/"body":"api.request.rejected"/g)).toHaveLength(1);
  expect(output).toContain('target_unavailable');
  expect(output).toContain('"status":"500"');
  expect(output).not.toContain('"user":');
});

it('진단에 우연히 들어온 요청, 사용자, SQL 메시지와 소스 문맥을 제거한다', () => {
  const event = sanitizeServerError({
    type: undefined,
    request: { url: '/PRIVATE' },
    user: { id: 'PRIVATE' },
    tags: { recordId: 'PRIVATE', method: 'PUT' },
    extra: { payload: 'PRIVATE' },
    exception: {
      values: [
        {
          type: 'PRIVATE',
          value: 'PRIVATE',
          mechanism: { type: 'PRIVATE', handled: false, data: { detail: 'PRIVATE' } },
          stacktrace: {
            frames: [
              {
                filename: new URL('../src/routes/schedules.ts', import.meta.url).href,
                function: 'PRIVATE',
                context_line: 'PRIVATE',
                lineno: 41,
              },
              { filename: 'https://api.example.com/trips/PRIVATE_ID.js' },
              { filename: '/tmp/PRIVATE_PATH.js' },
            ],
          },
        },
      ],
    },
    breadcrumbs: [{ message: 'PRIVATE' }],
  });
  expect(JSON.stringify(event)).not.toContain('PRIVATE');
  expect(event.exception?.values?.[0]?.mechanism).toEqual({ type: 'generic', handled: false });
  expect(event.exception?.values?.[0]?.stacktrace?.frames?.[0]).toMatchObject({
    filename: 'routes/schedules.ts',
    lineno: 41,
  });
});

it('시작 실패를 종료 전에 전송하되 연결 문자열과 예외 원문은 내보내지 않는다', async () => {
  envelopes.length = 0;
  await reportStartupFailure(new Error('PRIVATE_DATABASE_URL'));
  const output = envelopes.join('\n');
  expect(output).toContain('"area":"startup"');
  expect(output).not.toContain('PRIVATE_DATABASE_URL');
});

it('필수 환경값 검증 실패도 실제 진입점에서 시작 오류로 한 번 전송하고 종료한다', async () => {
  envelopes.length = 0;
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, JWT_SECRET: '' },
    stdio: 'ignore',
    timeout: 5000,
  });
  const [exitCode] = await once(child, 'exit');
  expect(exitCode).toBe(1);
  expect(envelopes.join('\n').match(/"type":"event"/g)).toHaveLength(1);
  expect(envelopes.join('\n')).toContain('"area":"startup"');
});
