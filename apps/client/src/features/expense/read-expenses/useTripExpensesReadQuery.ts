import { useGetTripExpenses } from '@/entities/expense';
import { usePolicyReadQuery, useTripReadAccess, type TripReadOptions } from '@/shared/services/policy-query';

export function useTripExpensesReadQuery(tripId: string | null | undefined, options: TripReadOptions = {}) {
  const access = useTripReadAccess(tripId, 'expense', options);
  const query = useGetTripExpenses(tripId ?? '', { enabled: access.canFetch });
  return usePolicyReadQuery(query, access);
}
