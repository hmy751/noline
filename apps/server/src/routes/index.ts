import { Router } from 'express';
import type { Request, Response } from 'express';

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

// Trip routes
router.use('/trips', tripsRouter);

export default router;
