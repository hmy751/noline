import { and, count, eq } from 'drizzle-orm';

import { getDatabase, tripActivations, trips } from '@/shared/db';

// 같은 도시의 파일 등록·마지막 삭제는 Mapbox 호출이 끝날 때까지 서로 기다린다.
const pendingByCity = new Map<number, Promise<unknown>>();

export async function withCityMapOperation<T>(cityId: number, operation: () => Promise<T>): Promise<T> {
  const previous = pendingByCity.get(cityId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);

  pendingByCity.set(cityId, current);

  try {
    return await current;
  } finally {
    if (pendingByCity.get(cityId) === current) pendingByCity.delete(cityId);
  }
}

// 비활성 여행도 미전송 입력이나 사본 보관 선택 때문에 지도를 계속 보유할 수 있다.
export function countCityMapHolders(cityId: number): number {
  const row = getDatabase()
    .select({ total: count() })
    .from(tripActivations)
    .innerJoin(trips, eq(trips.id, tripActivations.tripId))
    .where(and(eq(trips.cityId, cityId), eq(tripActivations.mapDownloaded, true)))
    .get();
  return row?.total ?? 0;
}
