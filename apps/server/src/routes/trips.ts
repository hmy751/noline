import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, trips } from '../db/index.js';
import { desc, sql } from 'drizzle-orm';

const router = Router();

// GET /api/trips - 전체 여행 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    // TODO: 실제 인증 구현 후 userId 사용
    const userId = 1; // 테스트용 userId

    // 모든 여행 조회
    const allTrips = await db
      .select({
        id: trips.id,
        name: trips.name,
        destination: trips.destination,
        country: trips.country,
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

    res.status(200).json({
      success: true,
      data: allTrips,
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
    const { userId, name, destination, country, latitude, longitude, cityId, startDate, endDate } = req.body;

    if (!name || !destination || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, destination, startDate, and endDate are required',
      });
    }

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

    // 여행 생성 (도시 정보 포함)
    const [newTrip] = await db
      .insert(trips)
      .values({
        userId: userId ? parseInt(userId) : 1, // 테스트용 userId=1 사용 (인증 추가 전)
        name,
        destination,
        country: country || null,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        cityId: cityId || null,
        startDate: start,
        endDate: end,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newTrip,
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

export default router;
