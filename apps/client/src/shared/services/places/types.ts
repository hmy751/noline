import type { z } from 'zod';
import type { placesSearchRequest } from '@repo/schema/requests/places';
import type { placeDetailsResponse, placesSearchResponse } from '@repo/schema/responses/places';

export type PlaceCandidate = z.infer<typeof placesSearchResponse>['data']['results'][number];
export type ResolvedPlace = z.infer<typeof placeDetailsResponse>;
export type PlaceSearchContext = Pick<z.infer<typeof placesSearchRequest>, 'cityName' | 'latitude' | 'longitude'>;

/** 상세 실패는 좌표가 확인된 장소와 다른 결과다. 좌표 대체 정책은 소비 feature가 정한다. */
export type PlaceResolution =
  | { status: 'resolved'; place: ResolvedPlace }
  | { status: 'unresolved-detail'; candidate: PlaceCandidate; error: unknown };
