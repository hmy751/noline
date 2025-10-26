import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, trips, schedules } from '../db/index.js';
import { desc, sql, eq, and } from 'drizzle-orm';
import { createTripRequestSchema, updateTripRequestSchema, tripResponseSchema } from '@repo/schema';

const router = Router();

// GET /api/trips - 전체 여행 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    // TODO: 실제 인증 구현 후 userId 사용
    const userId = '01HZQ8K9X7M2N3P4Q5R6S7T8V9'; // 테스트용 ULID

    // 모든 여행 조회
    const allTrips = await db
      .select({
        id: trips.id,
        userId: trips.userId,
        name: trips.name,
        destination: trips.destination,
        country: trips.country,
        latitude: trips.latitude,
        longitude: trips.longitude,
        cityId: trips.cityId,
        startDate: trips.startDate,
        endDate: trips.endDate,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt,
      })
      .from(trips)
      .where(sql`${trips.userId} = ${userId}`)
      .orderBy(desc(trips.createdAt));

    if (!allTrips || allTrips.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No trips found',
      });
    }

    // Zod로 응답 데이터 검증
    const validatedTrips = allTrips.map((trip) => {
      const validated = tripResponseSchema.safeParse({
        ...trip,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
      });

      if (!validated.success) {
        console.error('Trip validation error:', validated.error);
        throw new Error('Invalid trip data');
      }

      return validated.data;
    });

    res.status(200).json({
      success: true,
      data: validatedTrips,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch trips',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch trips',
        details: 'Unknown error occurred',
      });
    }
  }
});

// POST /api/trips - 여행 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    // Zod로 요청 데이터 검증
    const validationResult = createTripRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { id, userId, name, destination, country, latitude, longitude, cityId, startDate, endDate } =
      validationResult.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'startDate and endDate must be valid dates',
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before endDate',
      });
    }

    // ✨ Echo 아키텍처: 클라이언트가 생성한 ID 사용 (Local-First)
    // 여행 생성 (도시 정보 포함)
    const [newTrip] = await db
      .insert(trips)
      .values({
        id: id,
        userId: userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9', // 테스트용 ULID
        name,
        destination,
        country: country || null,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        cityId: cityId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
      .returning();

    // Zod로 응답 데이터 검증
    const validatedTrip = tripResponseSchema.safeParse({
      ...newTrip,
      startDate: newTrip.startDate.toISOString(),
      endDate: newTrip.endDate.toISOString(),
      createdAt: newTrip.createdAt.toISOString(),
      updatedAt: newTrip.updatedAt.toISOString(),
    });

    if (!validatedTrip.success) {
      console.error('Trip validation error:', JSON.stringify(validatedTrip.error.errors, null, 2));
      console.error('Data received from DB:', JSON.stringify(newTrip, null, 2));
      return res.status(500).json({
        error: 'Validation error',
        message: 'Invalid trip data from database',
        details: validatedTrip.error.errors,
        dbData: newTrip,
      });
    }

    res.status(201).json({
      success: true,
      data: validatedTrip.data,
    });
  } catch (error) {
    console.error('Error creating trip:', error);

    // TypeScript safe error handling
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create trip',
        details: error.message,
      });
    } else {
      console.error('Unknown error type:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create trip',
        details: 'Unknown error occurred',
      });
    }
  }
});

// PUT /api/trips/:id - 여행 수정
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const userId = '01HZQ8K9X7M2N3P4Q5R6S7T8V9'; // 테스트용 ULID

    const validationResult = updateTripRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { name, destination, country, startDate, endDate } = validationResult.data;

    // 여행 존재 여부 및 소유권 확인
    const [existingTrip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));

    if (!existingTrip) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Trip not found or you do not have permission to edit it',
      });
    }

    // 업데이트할 필드 준비
    const updateData: any = {
      updatedAt: new Date(),
      version: sql`${trips.version} + 1`, // ✅ version 증가 (Local-First)
    };

    if (name !== undefined) updateData.name = name;
    if (destination !== undefined) updateData.destination = destination;
    if (country !== undefined) updateData.country = country;

    if (startDate !== undefined) {
      if (startDate === null) {
        updateData.startDate = null;
      } else {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            error: 'Invalid date format',
            message: 'startDate must be a valid date',
          });
        }
        updateData.startDate = start;
      }
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.endDate = null;
      } else {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            error: 'Invalid date format',
            message: 'endDate must be a valid date',
          });
        }
        updateData.endDate = end;
      }
    }

    // 날짜 범위 검증
    if (updateData.startDate || updateData.endDate) {
      const finalStart = updateData.startDate || existingTrip.startDate;
      const finalEnd = updateData.endDate || existingTrip.endDate;

      if (finalStart && finalEnd && new Date(finalStart) > new Date(finalEnd)) {
        return res.status(400).json({
          error: 'Invalid date range',
          message: 'startDate must be before endDate',
        });
      }
    }

    // 여행 업데이트
    const [updatedTrip] = await db.update(trips).set(updateData).where(eq(trips.id, tripId)).returning();

    // Zod로 응답 데이터 검증
    const validatedTrip = tripResponseSchema.safeParse({
      ...updatedTrip,
      startDate: updatedTrip.startDate.toISOString(),
      endDate: updatedTrip.endDate.toISOString(),
      createdAt: updatedTrip.createdAt.toISOString(),
      updatedAt: updatedTrip.updatedAt.toISOString(),
    });

    if (!validatedTrip.success) {
      console.error('Trip validation error:', validatedTrip.error);
      throw new Error('Invalid trip data');
    }

    res.status(200).json({
      success: true,
      data: validatedTrip.data,
    });
  } catch (error) {
    console.error('Error updating trip:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update trip',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update trip',
        details: 'Unknown error occurred',
      });
    }
  }
});

// DELETE /api/trips/:id - 여행 삭제
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id; // ULID는 문자열
    const userId = '01HZQ8K9X7M2N3P4Q5R6S7T8V9'; // 테스트용 ULID

    // 여행 존재 여부 및 소유권 확인
    const [existingTrip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));

    if (!existingTrip) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Trip not found or you do not have permission to delete it',
      });
    }

    // ✅ Soft Delete: deletedAt 설정 (Local-First)
    // 다른 기기에 삭제가 전파되도록 함
    const [deletedTrip] = await db
      .update(trips)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: sql`${trips.version} + 1`, // ✅ version 증가
      })
      .where(eq(trips.id, tripId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
      data: {
        id: deletedTrip.id,
        deletedAt: deletedTrip.deletedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error deleting trip:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete trip',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete trip',
        details: 'Unknown error occurred',
      });
    }
  }
});

// GET /api/trips/:tripId/schedules - 여행의 일정 목록 조회
router.get('/:tripId/schedules', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    // 여행에 속한 모든 일정 조회 (scheduledAt 순으로 정렬)
    const allSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.tripId, tripId))
      .orderBy(schedules.scheduledAt);

    // ISO string으로 변환
    const validatedSchedules = allSchedules.map((schedule) => ({
      ...schedule,
      scheduledAt: schedule.scheduledAt.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      deletedAt: schedule.deletedAt?.toISOString() || null,
    }));

    res.status(200).json({
      success: true,
      data: validatedSchedules,
    });
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

export default router;
