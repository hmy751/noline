import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, schedules } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { createScheduleRequestSchema, scheduleSchema } from '@repo/schema';

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

    const { userId, tripId, title, location, address, date, time, latitude, longitude } = validationResult.data;

    // 일정 생성
    const [newSchedule] = await db
      .insert(schedules)
      .values({
        userId: userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9', // TODO: 실제 인증 구현 후 userId 사용
        tripId,
        title,
        location,
        address: address || null,
        date,
        time,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
      })
      .returning();

    // Zod로 응답 데이터 검증
    const validated = scheduleSchema.safeParse({
      ...newSchedule,
      createdAt: newSchedule.createdAt.toISOString(),
      updatedAt: newSchedule.updatedAt.toISOString(),
    });

    if (!validated.success) {
      console.error('Schedule validation error:', validated.error);
      throw new Error('Invalid schedule data');
    }

    res.status(201).json({
      success: true,
      data: validated.data,
    });
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
