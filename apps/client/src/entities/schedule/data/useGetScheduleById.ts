import { useQuery } from '@tanstack/react-query';
import { ScheduleRepository } from '../repository/schedule-repository';
import { scheduleQueryKeys } from './keys';

/**
 * 특정 일정 상세 정보 조회 Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 *
 * @param scheduleId - 조회할 일정 ID
 * @param tripId - 여행 ID (라우팅 판단용)
 *
 * @example
 * ```tsx
 * const { data: schedule, isLoading } = useGetScheduleById('schedule-id', 'trip-id');
 * ```
 */
export const useGetScheduleById = (scheduleId: string, tripId: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.detail(scheduleId),
    queryFn: () => ScheduleRepository.getById(scheduleId, tripId),
    enabled: !!scheduleId && !!tripId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
