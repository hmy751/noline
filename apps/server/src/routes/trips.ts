import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, trips, schedules, expenses } from '../db/index.js';
import { desc, sql, eq, and, isNull } from 'drizzle-orm';
import { legacyCreateTripRequest, updateTripRequest, isTripDateRangeValid } from '@repo/schema/requests/trip';
import { tripEntity } from '@repo/schema/entities/trip';
import { activateTripResponse, tripListResponse, tripResponse } from '@repo/schema/responses/trip';
import { scheduleListResponse } from '@repo/schema/responses/schedule';
import { requireAuth } from '../middleware/auth.js';
import { serializeExpense } from '../serializers/expense.js';
import { serializeSchedule } from '../serializers/schedule.js';
import { serializeTrip } from '../serializers/trip.js';
import { sendInternalError } from '../utils/http-errors.js';

const router = Router();

// GET /api/trips - 전체 여행 조회
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // 모든 여행 조회
    const allTrips = await db
      .select({
        id: trips.id,
        userId: trips.userId,
        name: trips.name,
        destination: trips.destination,
        country: trips.country,
        baseCurrency: trips.baseCurrency,
        latitude: trips.latitude,
        longitude: trips.longitude,
        cityId: trips.cityId,
        timeZone: trips.timeZone,
        startDate: trips.startDate,
        endDate: trips.endDate,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt,
      })
      .from(trips)
      .where(and(eq(trips.userId, userId), isNull(trips.deletedAt)))
      .orderBy(desc(trips.createdAt));

    // Zod로 응답 데이터 검증
    const validatedTrips = allTrips.map((trip) => {
      const validated = tripEntity.safeParse(serializeTrip(trip));

      if (!validated.success) {
        console.error('Trip validation error:', validated.error);
        throw new Error('Invalid trip data');
      }

      return validated.data;
    });

    // 정책: 전체 응답 구조 검증
    const response = { success: true as const, data: validatedTrips };
    const validatedResponse = tripListResponse.safeParse(response);

    if (!validatedResponse.success) {
      console.error('Response validation error:', validatedResponse.error);
      return res.status(500).json({
        error: 'Internal validation error',
        message: 'Response validation failed',
      });
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    console.error('Error fetching trips:', error);
    sendInternalError(res, 'Failed to fetch trips', error);
  }
});

// POST /api/trips - 여행 생성
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Zod로 요청 데이터 검증
    const validationResult = legacyCreateTripRequest.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const {
      id,
      userId,
      name,
      destination,
      country,
      baseCurrency,
      latitude,
      longitude,
      cityId,
      timeZone,
      startDate,
      endDate,
    } = validationResult.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'startDate and endDate must be valid dates',
      });
    }

    if (!isTripDateRangeValid(startDate, endDate, timeZone)) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before endDate',
      });
    }

    // ✨ Client-Side ID: 클라이언트가 생성한 ID 사용 (Selective Local-First)
    // 여행 생성 (도시 정보 포함)
    const [newTrip] = await db
      .insert(trips)
      .values({
        id: id,
        userId: req.userId!, // 인증된 사용자 ID 사용
        name,
        destination,
        country: country || null,
        baseCurrency: baseCurrency || 'USD', // 기본값: USD
        latitude: latitude != null ? latitude.toString() : null,
        longitude: longitude != null ? longitude.toString() : null,
        cityId: cityId || null,
        timeZone,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
      .returning();

    // Zod로 응답 데이터 검증
    const validatedTrip = tripResponse.safeParse({
      success: true,
      data: serializeTrip(newTrip),
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

    res.status(201).json(validatedTrip.data);
  } catch (error) {
    console.error('Error creating trip:', error);
    sendInternalError(res, 'Failed to create trip', error);
  }
});

// PUT /api/trips/:id - 여행 수정
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const userId = req.userId!;

    const validationResult = updateTripRequest.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { name, destination, country, baseCurrency, timeZone, startDate, endDate } = validationResult.data;

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
      version: sql`${trips.version} + 1`, // ✅ version 증가 (Selective Local-First sync)
    };

    if (name !== undefined) updateData.name = name;
    if (destination !== undefined) updateData.destination = destination;
    if (country !== undefined) updateData.country = country;
    if (baseCurrency !== undefined) updateData.baseCurrency = baseCurrency;
    if (timeZone !== undefined) updateData.timeZone = timeZone;

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
    if (startDate !== undefined || endDate !== undefined || timeZone !== undefined) {
      const finalStart = updateData.startDate || existingTrip.startDate;
      const finalEnd = updateData.endDate || existingTrip.endDate;

      if (
        !isTripDateRangeValid(
          finalStart.toISOString(),
          finalEnd.toISOString(),
          timeZone ?? existingTrip.timeZone ?? null,
        )
      ) {
        return res.status(400).json({
          error: 'Invalid date range',
          message: 'startDate must be before endDate',
        });
      }
    }

    // 여행 업데이트
    const [updatedTrip] = await db.update(trips).set(updateData).where(eq(trips.id, tripId)).returning();

    // Zod로 응답 데이터 검증
    const validatedTrip = tripResponse.safeParse({
      success: true,
      data: serializeTrip(updatedTrip),
    });

    if (!validatedTrip.success) {
      console.error('Trip validation error:', validatedTrip.error);
      throw new Error('Invalid trip data');
    }

    res.status(200).json(validatedTrip.data);
  } catch (error) {
    console.error('Error updating trip:', error);
    sendInternalError(res, 'Failed to update trip', error);
  }
});

// DELETE /api/trips/:id - 여행 삭제
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id; // ULID는 문자열
    const userId = req.userId!;

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

    // ✅ Soft Delete: deletedAt 설정 (Selective Local-First sync)
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

    // 정책: 모든 API 응답은 { success, data } 구조를 따른다
    res.status(200).json({
      success: true,
      data: {
        id: deletedTrip.id,
        deletedAt: deletedTrip.deletedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    sendInternalError(res, 'Failed to delete trip', error);
  }
});

// GET /api/trips/:tripId/schedules - 여행의 일정 목록 조회
router.get('/:tripId/schedules', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.userId!;

    const [trip] = await db
      .select({ id: trips.id })
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId), isNull(trips.deletedAt)))
      .limit(1);

    if (!trip) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Trip not found or you do not have permission to access it',
      });
    }

    // 여행에 속한 모든 일정 조회 (scheduledAt 순으로 정렬)
    const allSchedules = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.tripId, tripId), eq(schedules.userId, userId), isNull(schedules.deletedAt)))
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

// POST /api/trips/:id/activate - 여행 활성화 (Pull 동기화)
router.post('/:id/activate', requireAuth, async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const userId = req.userId!;

    // 여행 존재 여부 및 소유권 확인 (soft delete 제외)
    const [trip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId), isNull(trips.deletedAt)));

    if (!trip) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Trip not found or you do not have permission to access it',
      });
    }

    // 모든 Trip 조회 (활성화 시 모든 Trip 메타데이터 전송, soft delete 제외)
    const allTrips = await db
      .select()
      .from(trips)
      .where(and(eq(trips.userId, userId), isNull(trips.deletedAt)));

    // 여행의 모든 일정 조회 (Soft Delete 제외)
    const tripSchedules = await db
      .select({
        id: schedules.id,
        userId: schedules.userId,
        tripId: schedules.tripId,
        title: schedules.title,
        location: schedules.location,
        address: schedules.address,
        scheduledAt: schedules.scheduledAt,
        latitude: schedules.latitude,
        longitude: schedules.longitude,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
        deletedAt: schedules.deletedAt,
        version: schedules.version,
      })
      .from(schedules)
      .where(and(eq(schedules.tripId, tripId), eq(schedules.userId, userId), isNull(schedules.deletedAt)));

    // 여행의 모든 경비 조회 (Soft Delete 제외)
    const tripExpenses = await db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        tripId: expenses.tripId,
        scheduleId: expenses.scheduleId,
        title: expenses.title,
        amount: expenses.amount,
        currency: expenses.currency,
        category: expenses.category,
        date: expenses.date,
        hasReceipt: expenses.hasReceipt,
        receiptUrl: expenses.receiptUrl,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        deletedAt: expenses.deletedAt,
        version: expenses.version,
      })
      .from(expenses)
      .where(and(eq(expenses.tripId, tripId), eq(expenses.userId, userId), isNull(expenses.deletedAt)));

    // DB 표현을 API 표현으로 직렬화
    const serializedTrips = allTrips.map(serializeTrip);

    const serializedSchedules = tripSchedules.map(serializeSchedule);

    const serializedExpenses = tripExpenses.map(serializeExpense);

    const response = {
      success: true,
      data: {
        trips: serializedTrips,
        schedules: serializedSchedules,
        expenses: serializedExpenses,
      },
      message: `Trip activated successfully (${serializedTrips.length} trips, ${serializedSchedules.length} schedules, ${serializedExpenses.length} expenses)`,
    };
    const validatedResponse = activateTripResponse.safeParse(response);

    if (!validatedResponse.success) {
      console.error('Trip activation response validation error:', validatedResponse.error);
      throw new Error('Invalid trip activation response data');
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    console.error('Error activating trip:', error);
    sendInternalError(res, 'Failed to activate trip', error);
  }
});

// POST /api/trips/:id/deactivate - 여행 비활성화
router.post('/:id/deactivate', requireAuth, async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const userId = req.userId!;

    // 여행 존재 여부 및 소유권 확인
    const [trip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));

    if (!trip) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Trip not found or you do not have permission to access it',
      });
    }

    // 비활성화는 클라이언트에서 처리 (로컬 DB 정리)
    // 서버는 단순히 알림만 받음

    res.status(200).json({
      success: true,
      data: {
        tripId,
        deactivatedAt: new Date().toISOString(),
      },
      message: 'Trip deactivation acknowledged',
    });
  } catch (error) {
    console.error('Error deactivating trip:', error);
    sendInternalError(res, 'Failed to deactivate trip', error);
  }
});

export default router;
