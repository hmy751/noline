import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, schedules } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { createScheduleRequestSchema, createScheduleResponseSchema } from '@repo/schema';

const router = Router();

// POST /api/schedules - 일정 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    // Zod로 요청 데이터 검증
    const validationResult = createScheduleRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { id, userId, tripId, title, location, address, scheduledAt, latitude, longitude } = validationResult.data;

    // 일정 생성 (Echo 아키텍처: 클라이언트가 생성한 ID 사용)
    const [newSchedule] = await db
      .insert(schedules)
      .values({
        id, // ✅ 클라이언트가 생성한 ID 사용
        userId: userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9', // TODO: 실제 인증 구현 후 userId 사용
        tripId,
        title,
        location,
        address: address || null,
        scheduledAt: new Date(scheduledAt), // ISO string → Date 객체
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
      })
      .returning();

    // Zod로 응답 전체 검증 (createScheduleResponseSchema 사용)
    const responseData = {
      success: true,
      data: {
        ...newSchedule,
        scheduledAt: newSchedule.scheduledAt.toISOString(),
        createdAt: newSchedule.createdAt.toISOString(),
        updatedAt: newSchedule.updatedAt.toISOString(),
        deletedAt: newSchedule.deletedAt?.toISOString() || null,
      },
    };

    const validated = createScheduleResponseSchema.safeParse(responseData);

    if (!validated.success) {
      console.error('Schedule response validation error:', validated.error);
      throw new Error('Invalid schedule response data');
    }

    res.status(201).json(validated.data);
  } catch (error) {
    console.error('Error creating schedule:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create schedule',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create schedule',
        details: 'Unknown error occurred',
      });
    }
  }
});

export default router;
