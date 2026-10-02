import { getPlaceSearchPolicy } from '@/shared/policy/place-search';
import { useResolvedPlaceSearch, type PlaceSearchContext, type ResolvedPlace } from '@/shared/services/places';

/** 작성 단계의 사용 여부와 Public Places 정책을 검색 요청·결과에 연결한다. */
export function useCreateScheduleSearch(cityContext: PlaceSearchContext | undefined, enabled: boolean) {
  const search = useResolvedPlaceSearch(cityContext, enabled);
  const selectablePlaces = search.policy.allowed && !search.isPlaceholderData ? search.results : [];
  const { results, ...inputAndStatus } = search;

  return {
    ...inputAndStatus,
    // 지도 표현용 위치와 지금 선택할 수 있는 결과는 구분한다. 캐시는 복제하지 않는다.
    mapLocations: results,
    selectablePlaces,
    canSelectPlace: (place: ResolvedPlace) =>
      enabled && getPlaceSearchPolicy().allowed && selectablePlaces.includes(place),
  };
}
