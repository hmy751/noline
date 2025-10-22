// ========================================
// Trip Types - Re-exported from @repo/schema
// ========================================

export type {
  Trip,
  ApiTrip,
  InsertTrip,
  UpdateTrip,
  GetAllTripsResponse,
  CreateTripResponse,
  UpdateTripResponse,
  DeleteTripResponse,
} from '@repo/schema';

// Alias for backward compatibility
export type { ApiTrip as TripData } from '@repo/schema';
export type { InsertTrip as CreateTripRequest } from '@repo/schema';
export type { UpdateTrip as UpdateTripRequest } from '@repo/schema';
