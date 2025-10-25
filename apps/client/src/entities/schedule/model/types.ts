// ========================================
// Schedule Types - Client-side types inferred from @repo/schema
// ========================================

import { z } from 'zod';
import {
  scheduleSchema,
  scheduleResponseSchema,
  createScheduleRequestSchema,
  getAllSchedulesResponseSchema,
  createScheduleResponseSchema,
} from '@repo/schema';

// ========================================
// Entity Type (DB)
// ========================================
export type Schedule = z.infer<typeof scheduleSchema>;

// ========================================
// Request Types (클라이언트 → 서버)
// ========================================
export type CreateScheduleRequest = z.infer<typeof createScheduleRequestSchema>;

// ========================================
// Response Types (서버 → 클라이언트)
// ========================================
export type ScheduleResponse = z.infer<typeof scheduleResponseSchema>;
export type GetAllSchedulesResponse = z.infer<typeof getAllSchedulesResponseSchema>;
export type CreateScheduleResponse = z.infer<typeof createScheduleResponseSchema>;

// ========================================
// Alias (backward compatibility)
// ========================================
export type ScheduleData = ScheduleResponse;
