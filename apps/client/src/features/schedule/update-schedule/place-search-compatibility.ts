import type { PlaceCandidate, PlaceResolution, ResolvedPlace } from '@/shared/services/places';

/** 기존 수정 화면의 0/0 선택·저장을 유지한다. 상세 실패 UX를 바꿀 때 이 경계를 제거한다. */
type LegacyUnresolvedLocation = Pick<PlaceCandidate, 'id' | 'name' | 'address'> & {
  source: 'legacy-unresolved-detail';
  latitude: 0;
  longitude: 0;
};
export type UpdateLocationSelection = ResolvedPlace | LegacyUnresolvedLocation;

export function toUpdateLocationSelection(resolution: PlaceResolution): UpdateLocationSelection {
  if (resolution.status === 'resolved') return resolution.place;
  return {
    source: 'legacy-unresolved-detail',
    id: resolution.candidate.id,
    name: resolution.candidate.name,
    address: resolution.candidate.address,
    latitude: 0,
    longitude: 0,
  };
}
