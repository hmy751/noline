// API
export { fetchAllTrips, fetchCreateTrip, fetchUpdateTrip, fetchDeleteTrip } from './api';

// Data (React Query Hooks)
export { useGetTrips, useCreateTrip, useUpdateTrip, useDeleteTrip, tripQueryKeys } from './data';

// Model (Types)
export type {
  TripData,
  GetAllTripsResponse,
  CreateTripRequest,
  CreateTripResponse,
  UpdateTripRequest,
  UpdateTripResponse,
  DeleteTripResponse,
} from './model';

// UI Components
export { TripCard, TripSelector } from './ui';

// Utils
export { selectMainTrip } from './utils';
