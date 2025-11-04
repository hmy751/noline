/**
 * Expense Query Key Factory
 *
 * React Query 캐시 키 관리를 위한 중앙화된 키 팩토리
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */
export const expenseQueryKeys = {
  base: ['expense'] as const,
  all: () => [...expenseQueryKeys.base, 'all'] as const,
  byTrip: (tripId: string) => [...expenseQueryKeys.base, 'trip', tripId] as const,
  bySchedule: (scheduleId: string) => [...expenseQueryKeys.base, 'schedule', scheduleId] as const,
};
