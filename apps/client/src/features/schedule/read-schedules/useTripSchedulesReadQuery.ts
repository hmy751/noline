import { useGetSchedules } from '@/entities/schedule';
import { usePolicyReadQuery, useTripReadAccess, type TripReadOptions } from '@/shared/services/policy-query';

export function useTripSchedulesReadQuery(tripId: string | null | undefined, options: TripReadOptions = {}) {
  const access = useTripReadAccess(tripId, 'schedule', options);
  const query = useGetSchedules(tripId ?? '', { enabled: access.canFetch });
  return usePolicyReadQuery(query, access);
}
