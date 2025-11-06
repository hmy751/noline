/**
 * Offline City Query Keys
 * React Query 캐시 키 관리
 */

export const offlineCityKeys = {
  all: () => ['offline-city'] as const,
  byCity: (cityId: number) => ['offline-city', 'cityId', cityId] as const,
  byTrip: (tripId: string) => ['offline-city', 'tripId', tripId] as const,
};
