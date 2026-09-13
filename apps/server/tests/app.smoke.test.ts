import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestApp } from './support/test-app.js';

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

describe('서버 앱 기본 연결', () => {
  it('Express 앱을 불러와 health 응답을 반환한다', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      message: 'Server is running',
    });
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});
