/**
 * Route Query Key Factory
 *
 * React Query 캐시 키 관리를 위한 중앙화된 키 팩토리
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */
export const routeQueryKeys = {
  base: ['routes'] as const,
  byTrip: (tripId: string) => [...routeQueryKeys.base, 'trip', tripId] as const,
  toSchedule: (scheduleId: string) => [...routeQueryKeys.base, 'to', scheduleId] as const,
};
