import { useQuery } from '@tanstack/react-query';
import { ScheduleRepository } from '../repository/schedule-repository';
import { scheduleQueryKeys } from './keys';

/**
 * 여행의 일정 목록 조회 Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - scheduledAt 기준 오름차순 정렬 (시간순)
 * - 비활성+오프라인 시 OfflineError 발생 → UI에서 "활성화하기" 안내
 *
 * @param tripId - 여행 ID (필수)
 *
 * @example
 * ```tsx
 * const { data: schedules, isLoading } = useGetSchedules('trip-id');
 * ```
 */
export const useGetSchedules = (tripId: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.list(tripId),
    queryFn: () => ScheduleRepository.getByTripId(tripId),
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
