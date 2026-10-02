import { placesSearchRequest } from '@repo/schema/requests/places';
import { placeDetailsResponse, placesSearchResponse } from '@repo/schema/responses/places';
import { authAxios } from '@/shared/api/axios-instances';
import { getPlaceSearchPolicy } from '@/shared/policy/place-search';
import { OfflineError } from '@/shared/services/offline-prep/errors';
import type { PlaceCandidate, PlaceResolution, PlaceSearchContext, ResolvedPlace } from './types';

function assertSearchAllowed() {
  if (!getPlaceSearchPolicy().allowed) throw new OfflineError('연결이 변경되어 장소 검색을 완료하지 못했어요.');
}

async function searchCandidates(query: string, context?: PlaceSearchContext): Promise<PlaceCandidate[]> {
  assertSearchAllowed();
  const request = placesSearchRequest.parse({ query: query.trim(), ...context, language: 'en' });
  const response = await authAxios.post('/api/places/search', request);
  return placesSearchResponse.parse(response.data).data.results;
}

async function resolveCandidate(candidate: PlaceCandidate): Promise<ResolvedPlace> {
  assertSearchAllowed();
  const response = await authAxios.get(`/api/places/${candidate.placeId}?language=en`);
  return placeDetailsResponse.parse(response.data);
}

/** 상세 하나라도 실패하면 검색 전체가 실패한다. 반환된 장소의 좌표는 모두 검증됐다. */
export async function searchResolvedPlaces(query: string, context?: PlaceSearchContext): Promise<ResolvedPlace[]> {
  const candidates = await searchCandidates(query, context);
  const places = await Promise.all(candidates.map(resolveCandidate));
  assertSearchAllowed();
  return places;
}

/** 부분 실패를 소비자가 처리할 때 사용한다. 정책 중단은 상세 실패 대체로 흡수하지 않는다. */
export async function searchPlaceResolutions(query: string, context?: PlaceSearchContext): Promise<PlaceResolution[]> {
  const candidates = await searchCandidates(query, context);
  const resolutions = await Promise.all(
    candidates.map(async (candidate): Promise<PlaceResolution> => {
      assertSearchAllowed();
      try {
        return { status: 'resolved', place: await resolveCandidate(candidate) };
      } catch (error) {
        return { status: 'unresolved-detail', candidate, error };
      }
    }),
  );
  assertSearchAllowed();
  return resolutions;
}
