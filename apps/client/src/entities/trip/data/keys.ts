/**
 * Trip Query Key Factory
 *
 * React Query 캐시 키 관리를 위한 중앙화된 키 팩토리
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */
export const tripQueryKeys = {
  base: ['trip'] as const,
  all: () => [...tripQueryKeys.base, 'all'] as const,
  activation: (tripId: string) => [...tripQueryKeys.base, 'activation', tripId] as const,
  activeTrip: () => [...tripQueryKeys.base, 'active'] as const,
};
