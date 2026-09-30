import { useGetScheduleById } from '@/entities/schedule';
import { usePolicyReadQuery, useTripReadAccess, type TripReadOptions } from '@/shared/services/policy-query';

export function useScheduleReadQuery(scheduleId: string, tripId: string, options: TripReadOptions = {}) {
  const access = useTripReadAccess(tripId, 'schedule', { enabled: !!scheduleId && (options.enabled ?? true) });
  const query = useGetScheduleById(scheduleId, tripId, { enabled: access.canFetch });
  return usePolicyReadQuery(query, access);
}
