import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, schedules } from '../db/index.js';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import { scheduleResponse, scheduleListResponse } from '@repo/schema/responses/schedule';
import { scheduleEntity } from '@repo/schema/entities/schedule';

const router = Router();

// POST /api/schedules - 일정 생성
router.post('/', async (req: Request, res: Response) => {
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

    // Zod로 응답 데이터 검증
    const validatedSchedule = scheduleResponse.safeParse({
      success: true,
      data: {
        ...newSchedule,
        scheduledAt: newSchedule.scheduledAt.toISOString(),
        createdAt: newSchedule.createdAt.toISOString(),
        updatedAt: newSchedule.updatedAt.toISOString(),
        deletedAt: newSchedule.deletedAt?.toISOString() || null,
      },
    });

    if (!validatedSchedule.success) {
      console.error('Schedule response validation error:', validatedSchedule.error);
      throw new Error('Invalid schedule response data');
    }

    res.status(201).json(validatedSchedule.data);
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

// GET /api/schedules - 전체 일정 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;

    // 조회 쿼리 구성
    const allSchedules = tripId
      ? await db
          .select()
          .from(schedules)
          .where(and(isNull(schedules.deletedAt), eq(schedules.tripId, tripId as string)))
          .orderBy(schedules.scheduledAt)
      : await db.select().from(schedules).where(isNull(schedules.deletedAt)).orderBy(schedules.scheduledAt);

    // ISO string으로 변환 및 Entity 검증
    const validatedSchedules = allSchedules.map((schedule) => {
      const validated = scheduleEntity.safeParse({
        ...schedule,
        scheduledAt: schedule.scheduledAt.toISOString(),
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString(),
        deletedAt: schedule.deletedAt?.toISOString() || null,
      });

      if (!validated.success) {
        console.error('Schedule validation error:', validated.error);
        throw new Error('Invalid schedule data');
      }

      return validated.data;
    });

    // 정책: 전체 응답 구조 검증
    const response = { success: true as const, data: validatedSchedules };
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

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch schedules',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch schedules',
        details: 'Unknown error occurred',
      });
    }
  }
});

// GET /api/schedules/:id - 특정 일정 조회
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 일정 조회 (Soft Delete 제외)
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), isNull(schedules.deletedAt)))
      .limit(1);

    if (!schedule) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Schedule not found',
      });
    }

    // ISO string으로 변환 및 Entity 검증
    const validated = scheduleEntity.safeParse({
      ...schedule,
      scheduledAt: schedule.scheduledAt.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      deletedAt: schedule.deletedAt?.toISOString() || null,
    });

    if (!validated.success) {
      console.error('Schedule validation error:', validated.error);
      throw new Error('Invalid schedule data');
    }

    // 정책: 전체 응답 구조 검증
    const response = { success: true as const, data: validated.data };
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

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch schedule',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch schedule',
        details: 'Unknown error occurred',
      });
    }
  }
});

// PUT /api/schedules/:id - 일정 수정
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const scheduleId = req.params.id;
    const userId = '01HZQ8K9X7M2N3P4Q5R6S7T8V9'; // TODO: 실제 인증 구현 후 userId 사용

    // Zod 검증
    const validationResult = updateScheduleRequest.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { id, title, location, address, scheduledAt, latitude, longitude } = validationResult.data;

    // 일정 존재 여부 확인 (soft delete 체크)
    const [existingSchedule] = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, scheduleId), isNull(schedules.deletedAt)));

    if (!existingSchedule) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Schedule not found or has been deleted',
      });
    }

    // 업데이트할 필드 준비
    const updateData: any = {
      updatedAt: new Date(),
      version: sql`${schedules.version} + 1`, // ✅ version 증가 (Local-First)
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
      .where(eq(schedules.id, scheduleId))
      .returning();

    // Zod로 응답 데이터 검증
    const validatedSchedule = scheduleResponse.safeParse({
      success: true,
      data: {
        ...updatedSchedule,
        scheduledAt: updatedSchedule.scheduledAt.toISOString(),
        createdAt: updatedSchedule.createdAt.toISOString(),
        updatedAt: updatedSchedule.updatedAt.toISOString(),
        deletedAt: updatedSchedule.deletedAt?.toISOString() || null,
      },
    });

    if (!validatedSchedule.success) {
      console.error('Schedule response validation error:', validatedSchedule.error);
      throw new Error('Invalid schedule response data');
    }

    res.status(200).json(validatedSchedule.data);
  } catch (error) {
    console.error('Error updating schedule:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update schedule',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update schedule',
        details: 'Unknown error occurred',
      });
    }
  }
});

// DELETE /api/schedules/:id - 일정 삭제 (Soft Delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const scheduleId = req.params.id;
    const userId = '01HZQ8K9X7M2N3P4Q5R6S7T8V9'; // TODO: 실제 인증 구현 후 userId 사용

    // 일정 존재 여부 확인
    const [existingSchedule] = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, scheduleId), isNull(schedules.deletedAt)));

    if (!existingSchedule) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Schedule not found or has been deleted',
      });
    }

    // ✅ Soft Delete: deletedAt 설정 (Local-First)
    const [deletedSchedule] = await db
      .update(schedules)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: sql`${schedules.version} + 1`, // ✅ version 증가
      })
      .where(eq(schedules.id, scheduleId))
      .returning();

    // 정책: 모든 API 응답은 { success, data } 구조를 따른다
    res.status(200).json({
      success: true,
      data: {
        id: deletedSchedule.id,
        deletedAt: deletedSchedule.deletedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete schedule',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete schedule',
        details: 'Unknown error occurred',
      });
    }
  }
});

export default router;
