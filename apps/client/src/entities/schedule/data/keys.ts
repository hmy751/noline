/**
 * Schedule Query Key Factory
 *
 * React Query 캐시 키 관리를 위한 중앙화된 키 팩토리
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */
export const scheduleQueryKeys = {
  base: ['schedule'] as const,
  list: (tripId: string) => [...scheduleQueryKeys.base, 'list', tripId] as const,
  detail: (id: string) => [...scheduleQueryKeys.base, 'detail', id] as const,
  all: () => [...scheduleQueryKeys.base, 'all'] as const,
};
