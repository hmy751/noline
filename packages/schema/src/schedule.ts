import { z } from 'zod';

export const scheduleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tripId: z.string().uuid(),
  title: z.string(),
  location: z.string(),
  address: z.string().nullable(),
  date: z.string(),
  time: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  synced: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createScheduleSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID'),
  title: z.string().min(1, 'Title is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const updateScheduleSchema = z.object({
  tripId: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  date: z.string().min(1).optional(),
  time: z.string().min(1).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  synced: z.boolean().optional(),
});

export type Schedule = z.infer<typeof scheduleSchema>;
export type CreateSchedule = z.infer<typeof createScheduleSchema>;
export type UpdateSchedule = z.infer<typeof updateScheduleSchema>;
