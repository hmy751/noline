import { useQuery } from '@tanstack/react-query';
import { fetchSchedules } from '../api';

export const scheduleQueryKeys = {
  base: ['schedule'] as const,
  list: (tripId: string) => [...scheduleQueryKeys.base, 'list', tripId] as const,
};

/**
 * 여행의 일정 목록 조회
 */
export const useGetSchedules = (tripId: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.list(tripId),
    queryFn: () => fetchSchedules(tripId),
    enabled: !!tripId,
  });
};
