import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, schedules } from '../db/index.js';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/schedules - 일정 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const { tripId, title, location, startTime, order, memo } = req.body;

    // 기본 검증
    if (!tripId || !title || !startTime || order === undefined) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'tripId, title, startTime, and order are required',
      });
    }

    // 일정 생성
    const [newSchedule] = await db
      .insert(schedules)
      .values({
        tripId,
        title,
        location: location || null,
        startTime: new Date(startTime),
        endTime: null,
        order,
        memo: memo || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newSchedule,
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
