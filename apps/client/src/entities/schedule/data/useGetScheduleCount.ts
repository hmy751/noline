import { useQuery } from '@tanstack/react-query';
import { ScheduleRepository } from '../repository/schedule-repository';
import { scheduleQueryKeys } from './keys';

/**
 * Trip의 Schedule 개수 조회 Hook
 *
 * - Soft delete된 항목은 제외
 * - 오프라인 지도 다운로드 트리거 판단에 사용
 *
 * @param tripId - 여행 ID
 */
export function useGetScheduleCount(tripId: string | null) {
  return useQuery({
    queryKey: scheduleQueryKeys.count(tripId ?? ''),
    queryFn: () => (tripId ? ScheduleRepository.getCount(tripId) : 0),
    enabled: !!tripId,
    staleTime: 0, // 항상 최신 카운트 조회
  });
}
