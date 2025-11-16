import { getTripActivationStatus } from './metadata';
import { OfflineError } from './errors';
import { getNetworkStatus } from '@/shared/hooks/useNetworkStatus';

/**
 * 라우팅 레이어 - Query 작업
 * - 활성화된 여행: 로컬 DB 조회
 * - 비활성 여행: 서버 API 조회 (온라인 필수)
 *
 * @param tripId 여행 ID
 * @param operations 로컬/원격 조회 함수
 * @returns 조회 결과
 * @throws OfflineError 비활성 여행을 오프라인에서 조회 시
 */
export async function routeQuery<T>(
  tripId: string,
  operations: {
    local: () => Promise<T>;
    remote: () => Promise<T>;
  },
): Promise<T> {
  const isActivated = await getTripActivationStatus(tripId);

  if (isActivated) {
    // 활성화: 로컬 DB 조회
    return await operations.local();
  } else {
    // 비활성: 서버 조회 (온라인 필수)
    const networkStatus = await getNetworkStatus();

    if (networkStatus === 'offline') {
      throw new OfflineError('오프라인에서는 활성화된 여행만 볼 수 있어요', {
        action: 'ACTIVATE_PROMPT',
        tripId,
      });
    }

    return await operations.remote();
  }
}

/**
 * 라우팅 레이어 - Mutation 작업
 * - 활성화된 여행: 로컬 DB + sync_queue
 * - 비활성 여행: 서버 API 직접 호출 (온라인 필수)
 *
 * @param tripId 여행 ID
 * @param operations 로컬/원격 수정 함수
 * @returns 수정 결과
 * @throws OfflineError 비활성 여행을 오프라인에서 수정 시
 */
export async function routeMutation<T>(
  tripId: string,
  operations: {
    local: () => Promise<T>;
    remote: () => Promise<T>;
  },
): Promise<T> {
  const isActivated = await getTripActivationStatus(tripId);

  if (isActivated) {
    // 활성화: 로컬 DB + sync_queue
    return await operations.local();
  } else {
    // 비활성: 서버 직접 호출 (온라인 필수)
    const networkStatus = await getNetworkStatus();

    if (networkStatus === 'offline') {
      throw new OfflineError('오프라인에서는 활성화된 여행만 수정할 수 있어요', {
        action: 'ACTIVATE_PROMPT',
        tripId,
      });
    }

    return await operations.remote();
  }
}
