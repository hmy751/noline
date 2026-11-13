import { Router, type Request, type Response } from 'express';

import authRouter from './auth.js';
import expensesRouter from './expenses.js';
import legacyHoldsRouter from './legacy-holds.js';
import placesRouter from './places.js';
import schedulesRouter from './schedules.js';
import syncRouter from './sync.js';
import tripsRouter from './trips.js';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Noline API',
    version: '1.0.0',
    description: 'Travel expense tracking API',
  });
});

// Auth routes
router.use('/auth', authRouter);

// Trip routes
router.use('/trips', tripsRouter);

// Schedule routes
router.use('/schedules', schedulesRouter);

// Expense routes
router.use('/expenses', expensesRouter);

// Places routes (Google Maps)
router.use('/places', placesRouter);

// Sync routes (Pull/Push)
router.use('/sync/legacy-holds', legacyHoldsRouter);
router.use('/sync', syncRouter);

export default router;
