import { useGetScheduleExpenses } from '@/entities/expense';
import { usePolicyReadQuery, useTripReadAccess, type TripReadOptions } from '@/shared/services/policy-query';

export function useScheduleExpensesReadQuery(scheduleId: string, tripId: string, options: TripReadOptions = {}) {
  const access = useTripReadAccess(tripId, 'expense', { enabled: !!scheduleId && (options.enabled ?? true) });
  const query = useGetScheduleExpenses(scheduleId, tripId, { enabled: access.canFetch });
  return usePolicyReadQuery(query, access);
}
