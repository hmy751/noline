import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getPlaceSearchPolicy, usePlaceSearchPolicy } from '@/shared/policy/place-search';
import { searchPlaceResolutions, searchResolvedPlaces } from './api';
import type { PlaceSearchContext } from './types';

export const placeQueryKeys = {
  search: (query: string, context: PlaceSearchContext | undefined, contract: 'resolved' | 'resolution') =>
    ['places', 'search', query, context, contract] as const,
};

/** 검색 입력·Query 캐시·Places 정책을 연결한다. draft·지도 선택은 저장하지 않는다. */
function usePlaceSearchQuery<T>(
  context: PlaceSearchContext | undefined,
  enabled: boolean,
  contract: 'resolved' | 'resolution',
  request: (query: string, context?: PlaceSearchContext) => Promise<T[]>,
) {
  const policy = usePlaceSearchPolicy();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500);
  const query = useQuery({
    queryKey: placeQueryKeys.search(debouncedQuery, context, contract),
    queryFn: () => request(debouncedQuery, context),
    enabled: enabled && policy.allowed && !!debouncedQuery.trim(),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  return {
    policy,
    searchQuery,
    results: debouncedQuery.trim() ? (query.data ?? []) : [],
    isSearching: query.isFetching,
    isError: query.isError,
    isPlaceholderData: query.isPlaceholderData,
    retry: () => {
      if (!enabled || !getPlaceSearchPolicy().allowed) return;
      return query.refetch();
    },
    handleSearch: setSearchQuery,
    clearSearch: () => setSearchQuery(''),
  };
}

/** 정상 결과는 옵션과 관계없이 항상 상세 검증을 통과한 장소다. */
export function useResolvedPlaceSearch(context?: PlaceSearchContext, enabled = true) {
  return usePlaceSearchQuery(context, enabled, 'resolved', searchResolvedPlaces);
}

export function usePlaceResolutionSearch(context?: PlaceSearchContext, enabled = true) {
  return usePlaceSearchQuery(context, enabled, 'resolution', searchPlaceResolutions);
}
