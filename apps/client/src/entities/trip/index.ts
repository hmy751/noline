// API
export { fetchAllTrips, fetchCreateTrip, fetchUpdateTrip, fetchDeleteTrip } from './api';

// Data (React Query Hooks)
export {
  useGetTrips,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useActivateTrip,
  useDeactivateTrip,
  tripQueryKeys,
} from './data';

// Model (Types)
export type {
  TripData,
  TripResponse,
  GetAllTripsResponse,
  CreateTripRequest,
  CreateTripResponse,
  UpdateTripRequest,
  UpdateTripResponse,
  DeleteTripResponse,
} from './model';

// UI Components
export { TripCard, TripSelector, ActivationBadge, ActivationProgressDrawer } from './ui';
export type { ActivationStatus, ProgressItem } from './ui';

// Utils
export { selectMainTrip } from './utils';
