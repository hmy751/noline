import { useQuery } from '@tanstack/react-query';
import { TripRepository } from '../repository/trip-repository';
import { tripQueryKeys } from './keys';

/** 여행 목록을 조회하며 실제 Local/Remote 출처를 함께 제공한다. */
export const useGetTrips = () => {
  const query = useQuery({
    queryKey: tripQueryKeys.all(),
    queryFn: ({ signal }) => TripRepository.getAllWithSource(signal),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });

  // 데이터와 실제 조회 출처를 함께 보존한다. 현재 네트워크 상태로 출처를 추정하지 않는다.
  return { ...query, data: query.data?.trips, dataSource: query.data?.source };
};
