import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, schedules, trips } from '../db/index.js';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import { deleteScheduleResponse, scheduleListResponse, scheduleResponse } from '@repo/schema/responses/schedule';
import { requireAuth } from '../middleware/auth.js';
import { serializeSchedule } from '../serializers/schedule.js';
import { sendInternalError } from '../utils/http-errors.js';

const router = Router();

// POST /api/schedules - 일정 생성
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Zod로 요청 데이터 검증
    const validationResult = createScheduleRequest.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { id, tripId, title, location, address, scheduledAt, latitude, longitude } = validationResult.data;
    const userId = req.userId!;

    const [parentTrip] = await db
      .select({ id: trips.id })
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId), isNull(trips.deletedAt)))
      .limit(1);

    if (!parentTrip) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Trip not found or you do not have permission to add schedules to it',
      });
    }

    // 일정 생성 (Client-Side ID: 클라이언트가 생성한 ID 사용)
    const [newSchedule] = await db
      .insert(schedules)
      .values({
        id, // ✅ 클라이언트가 생성한 ID 사용
        userId, // 인증된 사용자 ID 사용
        tripId,
        title,
        location,
        address: address || null,
        scheduledAt: new Date(scheduledAt), // ISO string → Date 객체
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
      })
      .returning();

    // Zod로 응답 데이터 검증
    const validatedSchedule = scheduleResponse.safeParse({
      success: true,
      data: serializeSchedule(newSchedule),
    });

    if (!validatedSchedule.success) {
      console.error('Schedule response validation error:', validatedSchedule.error);
      throw new Error('Invalid schedule response data');
    }

    res.status(201).json(validatedSchedule.data);
  } catch (error) {
    console.error('Error creating schedule:', error);
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
    const scheduleId = req.params.id;
    const userId = req.userId!;

    // Zod 검증
    const validationResult = updateScheduleRequest.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { title, location, address, scheduledAt, latitude, longitude } = validationResult.data;

    // 업데이트할 필드 준비
    const updateData: any = {
      updatedAt: new Date(),
      version: sql`${schedules.version} + 1`, // ✅ version 증가 (Selective Local-First sync)
    };

    // id는 무시 (클라이언트에서 전송되더라도 변경 불가)
    if (title !== undefined) updateData.title = title;
    if (location !== undefined) updateData.location = location;
    if (address !== undefined) updateData.address = address;

    if (scheduledAt !== undefined) {
      const scheduled = new Date(scheduledAt);
      if (isNaN(scheduled.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'scheduledAt must be a valid ISO 8601 datetime',
        });
      }
      updateData.scheduledAt = scheduled;
    }

    if (latitude !== undefined) updateData.latitude = latitude ? String(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? String(longitude) : null;

    // 일정 업데이트
    const [updatedSchedule] = await db
      .update(schedules)
      .set(updateData)
      .where(and(eq(schedules.id, scheduleId), eq(schedules.userId, userId), isNull(schedules.deletedAt)))
      .returning();

    if (!updatedSchedule) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Schedule not found or you do not have permission to edit it',
      });
    }

    // Zod로 응답 데이터 검증
    const validatedSchedule = scheduleResponse.safeParse({
      success: true,
      data: serializeSchedule(updatedSchedule),
    });

    if (!validatedSchedule.success) {
      console.error('Schedule response validation error:', validatedSchedule.error);
      throw new Error('Invalid schedule response data');
    }

    res.status(200).json(validatedSchedule.data);
  } catch (error) {
    console.error('Error updating schedule:', error);
    sendInternalError(res, 'Failed to update schedule', error);
  }
});

// DELETE /api/schedules/:id - 일정 삭제 (Soft Delete)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const scheduleId = req.params.id;
    const userId = req.userId!;

    // ✅ Soft Delete: deletedAt 설정 (Selective Local-First sync)
    const [deletedSchedule] = await db
      .update(schedules)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: sql`${schedules.version} + 1`, // ✅ version 증가
      })
      .where(and(eq(schedules.id, scheduleId), eq(schedules.userId, userId), isNull(schedules.deletedAt)))
      .returning();

    if (!deletedSchedule) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Schedule not found or you do not have permission to delete it',
      });
    }

    const response = {
      success: true,
      data: {
        id: deletedSchedule.id,
        deletedAt: deletedSchedule.deletedAt?.toISOString(),
      },
    };
    const validatedResponse = deleteScheduleResponse.safeParse(response);

    if (!validatedResponse.success) {
      console.error('Schedule delete response validation error:', validatedResponse.error);
      throw new Error('Invalid schedule delete response data');
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    console.error('Error deleting schedule:', error);
    sendInternalError(res, 'Failed to delete schedule', error);
  }
});

export default router;
