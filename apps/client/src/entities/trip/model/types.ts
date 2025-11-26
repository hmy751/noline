// ========================================
// Trip Types - Client-side types inferred from @repo/schema
// ========================================

import { z } from 'zod';
import { tripEntity } from '@repo/schema/entities/trip';
import { createTripRequest, updateTripRequest } from '@repo/schema/requests/trip';
import { tripResponse, tripListResponse, deleteTripResponse } from '@repo/schema/responses/trip';

// ========================================
// Entity Type (DB)
// ========================================
export type Trip = z.infer<typeof tripEntity>;

// ========================================
// Request Types (클라이언트 → 서버)
// ========================================
export type CreateTripRequest = z.infer<typeof createTripRequest>;
export type UpdateTripRequest = z.infer<typeof updateTripRequest>;

// ========================================
// Response Types (서버 → 클라이언트)
// - wrapper({ success, data })에서 data만 추출하여 순수 Entity 타입으로 사용
// ========================================
export type TripResponse = z.infer<typeof tripResponse>['data'];
export type GetAllTripsResponse = z.infer<typeof tripListResponse>;
export type CreateTripResponse = z.infer<typeof tripResponse>['data'];
export type UpdateTripResponse = z.infer<typeof tripResponse>['data'];
export type DeleteTripResponse = z.infer<typeof deleteTripResponse>['data'];

// ========================================
// Alias (backward compatibility)
// ========================================
// TripData는 로컬 DB에서 사용하는 tripEntity 타입
export type TripData = Trip;
