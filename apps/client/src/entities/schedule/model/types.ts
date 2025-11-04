// ========================================
// Schedule Types - Client-side types inferred from @repo/schema
// ========================================

import { z } from 'zod';
import { scheduleEntity } from '@repo/schema/entities/schedule';
import { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import { scheduleResponse, scheduleListResponse, deleteScheduleResponse } from '@repo/schema/responses/schedule';

// ========================================
// Entity Type (DB)
// ========================================
export type Schedule = z.infer<typeof scheduleEntity>;

// ========================================
// Request Types (클라이언트 → 서버)
// ========================================
export type CreateScheduleRequest = z.infer<typeof createScheduleRequest>;
export type UpdateScheduleRequest = z.infer<typeof updateScheduleRequest>;

// ========================================
// Response Types (서버 → 클라이언트)
// ========================================
export type ScheduleResponse = z.infer<typeof scheduleResponse>['data'];
export type GetAllSchedulesResponse = z.infer<typeof scheduleListResponse>;
export type CreateScheduleResponse = z.infer<typeof scheduleResponse>;
export type UpdateScheduleResponse = z.infer<typeof scheduleResponse>;
export type DeleteScheduleResponse = z.infer<typeof deleteScheduleResponse>;

// ========================================
// Alias (backward compatibility)
// ========================================
export type ScheduleData = ScheduleResponse;
