// ========================================
// Trip Types - Client-side types inferred from @repo/schema
// ========================================

import { z } from 'zod';
import {
  tripSchema,
  tripResponseSchema,
  createTripRequestSchema,
  updateTripRequestSchema,
  getAllTripsResponseSchema,
  createTripResponseSchema,
  updateTripResponseSchema,
  deleteTripResponseSchema,
} from '@repo/schema';

// ========================================
// Entity Type (DB)
// ========================================
export type Trip = z.infer<typeof tripSchema>;

// ========================================
// Request Types (클라이언트 → 서버)
// ========================================
export type CreateTripRequest = z.infer<typeof createTripRequestSchema>;
export type UpdateTripRequest = z.infer<typeof updateTripRequestSchema>;

// ========================================
// Response Types (서버 → 클라이언트)
// ========================================
export type TripResponse = z.infer<typeof tripResponseSchema>;
export type GetAllTripsResponse = z.infer<typeof getAllTripsResponseSchema>;
export type CreateTripResponse = z.infer<typeof createTripResponseSchema>;
export type UpdateTripResponse = z.infer<typeof updateTripResponseSchema>;
export type DeleteTripResponse = z.infer<typeof deleteTripResponseSchema>;

// ========================================
// Alias (backward compatibility)
// ========================================
export type TripData = TripResponse;
