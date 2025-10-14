import { z } from 'zod';

export const tripSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  destination: z.string(),
  country: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  synced: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTripSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  country: z.string().min(1, 'Country is required'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const updateTripSchema = z.object({
  destination: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  synced: z.boolean().optional(),
});

export type Trip = z.infer<typeof tripSchema>;
export type CreateTrip = z.infer<typeof createTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
