import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { loadTestApp, resetDbMock, setSelectResults } from '../support/test-app.js';
let app: Application;
beforeAll(async () => {
  app = await loadTestApp();
});
beforeEach(() => resetDbMock());
it('마지막 여행이 삭제된 목록도 성공한 빈 배열로 반환한다', async () => {
  setSelectResults([]);
  const response = await request(app).get('/api/trips');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ success: true, data: [] });
});
