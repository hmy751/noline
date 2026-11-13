import { eq, and, isNull } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';

import { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import { deleteScheduleResponse, scheduleListResponse, scheduleResponse } from '@repo/schema/responses/schedule';

import { db, schedules } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeSchedule } from '../serializers/schedule.js';
import { createSchedule, updateSchedule, deleteEntity } from '../services/entity-mutations.js';
import { sendInternalError } from '../utils/http-errors.js';

const router = Router();

// POST /api/schedules - 일정 생성
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const request = createScheduleRequest.safeParse(req.body);

    if (!request.success) {
      return res
        .status(400)
        .json({ error: 'Validation error', message: 'Invalid request data', details: request.error.errors });
    }

    const result = await createSchedule(request.data, req.userId!);
    const body = result.status < 300 ? scheduleResponse.parse(result.body) : result.body;

    return res.status(result.status).json(body);
  } catch (error) {
    sendInternalError(res, 'Failed to create schedule', error);
  }
});

// GET /api/schedules - 전체 일정 조회
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    const userId = req.userId!;

    // 조회 쿼리 구성 (소유권 필터링)
    const conditions = [isNull(schedules.deletedAt), eq(schedules.userId, userId)];

    if (tripId) {
      conditions.push(eq(schedules.tripId, tripId as string));
    }

    const allSchedules = await db
      .select()
      .from(schedules)
      .where(and(...conditions))
      .orderBy(schedules.scheduledAt);

    // DB 표현을 API 표현으로 직렬화
    const serializedSchedules = allSchedules.map(serializeSchedule);

    // Entity를 포함한 전체 응답 계약을 한 번에 검증
    const response = { success: true as const, data: serializedSchedules };
    const validatedResponse = scheduleListResponse.safeParse(response);

    if (!validatedResponse.success) {
      console.error('Response validation error:', validatedResponse.error);
      return res.status(500).json({
        error: 'Internal validation error',
        message: 'Response validation failed',
      });
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    sendInternalError(res, 'Failed to fetch schedules', error);
  }
});

// GET /api/schedules/:id - 특정 일정 조회
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // 일정 조회 (Soft Delete 제외, 소유권 확인)
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.userId, userId), isNull(schedules.deletedAt)))
      .limit(1);

    if (!schedule) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Schedule not found',
      });
    }

    // DB 표현을 API 표현으로 직렬화한 뒤 전체 응답 계약을 한 번에 검증
    const response = { success: true as const, data: serializeSchedule(schedule) };
    const validatedResponse = scheduleResponse.safeParse(response);

    if (!validatedResponse.success) {
      console.error('Response validation error:', validatedResponse.error);
      return res.status(500).json({
        error: 'Internal validation error',
        message: 'Response validation failed',
      });
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    sendInternalError(res, 'Failed to fetch schedule', error);
  }
});

// PUT /api/schedules/:id - 일정 수정
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const request = updateScheduleRequest.safeParse(req.body);

    if (!request.success) {
      return res
        .status(400)
        .json({ error: 'Validation error', message: 'Invalid request data', details: request.error.errors });
    }

    const result = await updateSchedule(req.params.id, req.userId!, request.data, req.body);
    const body = result.status < 300 ? scheduleResponse.parse(result.body) : result.body;

    return res.status(result.status).json(body);
  } catch (error) {
    sendInternalError(res, 'Failed to update schedule', error);
  }
});

// DELETE /api/schedules/:id - 일정 삭제 (Soft Delete)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await deleteEntity('schedule', req.params.id, req.userId!);
    const body = result.status < 300 ? deleteScheduleResponse.parse(result.body) : result.body;

    return res.status(result.status).json(body);
  } catch (error) {
    sendInternalError(res, 'Failed to delete schedule', error);
  }
});

export default router;
