import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Unknown error
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};
