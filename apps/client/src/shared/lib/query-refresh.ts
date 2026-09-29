import type { QueryClient, QueryFilters } from '@tanstack/react-query';

/** 이전 조회 결과를 버린 뒤 갱신을 요청한다. 새 조회의 완료는 기다리지 않는다. */
export async function cancelAndInvalidateQueries(client: QueryClient, filters: QueryFilters): Promise<void> {
  // 데이터 없는 최초 조회도 invalidate만으로는 기존 요청을 공유하므로 먼저 취소한다.
  await client.cancelQueries(filters);
  // 데이터 변경 작업의 완료를 화면 조회의 성공·실패에 묶지 않는다.
  client.invalidateQueries(filters).catch((error) => console.error('[Query] cache refresh failed', error));
}
