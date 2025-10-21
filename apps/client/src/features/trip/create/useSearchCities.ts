import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { City, searchCities } from '@/features/trip/create/geonames.api';

export const cityQueryKeys = {
  base: ['cities'] as const,
  search: (query: string) => [...cityQueryKeys.base, 'search', query] as const,
};

export const useSearchCities = (searchQuery: string) => {
  return useQuery<City[], Error>({
    queryKey: cityQueryKeys.search(searchQuery),
    queryFn: () => searchCities(searchQuery),
    enabled: !!searchQuery,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
};
