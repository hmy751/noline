import { useQuery } from '@tanstack/react-query';
import { useAppPolicy } from '@/shared/policy';
import { resolveCityTimeZone, type City } from './geonames.api';

/** 선택한 도시의 시간대를 한 번 조회한다. 재시도는 초안을 건드리지 않는다. */
export function useCityTimeZone(city: Pick<City, 'id' | 'latitude' | 'longitude'>, enabled: boolean) {
  const policy = useAppPolicy(undefined, { network: 'real' });
  const canResolveTimeZone = policy.service.searchMode === 'api';

  const query = useQuery({
    queryKey: ['city-time-zone', city.id, city.latitude, city.longitude],
    queryFn: () => resolveCityTimeZone(city),
    enabled: enabled && canResolveTimeZone,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return { ...query, canResolveTimeZone };
}
