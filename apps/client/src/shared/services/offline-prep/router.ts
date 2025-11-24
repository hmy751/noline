import { getTripActivationStatus, hasAnyActivatedTrip } from './metadata';
import { OfflineError } from './errors';
import { networkStore } from '@/shared/store/network';

/**
 * 라우팅 레이어 - Trip 자체 Query 작업
 * - 활성화된 여행이 하나라도 있으면: 로컬 DB 조회
 * - 비활성 상태: 서버 API 조회 (온라인 필수)
 *
 * @param operations 로컬/원격 조회 함수
 * @returns 조회 결과
 * @throws OfflineError 오프라인 상태에서 서버 조회 시도 시
 */
export async function routeTripQuery<T>(operations: { local: () => Promise<T>; remote: () => Promise<T> }): Promise<T> {
  const hasActivated = await hasAnyActivatedTrip();

  if (hasActivated) {
    // 활성화된 Trip 있음 → 로컬 DB 조회
    return await operations.local();
  } else {
    // 비활성 상태 → 서버 조회 (온라인 필수)
    const networkStatus = networkStore.status;

    if (networkStatus === 'offline') {
      throw new OfflineError('오프라인에서는 활성화된 여행만 볼 수 있어요', {
        action: 'ACTIVATE_PROMPT',
      });
    }

    return await operations.remote();
  }
}

/**
 * 라우팅 레이어 - Schedule/Expense Query 작업
 * - 해당 Trip이 활성화되어 있으면: 로컬 DB 조회
 * - 비활성 Trip: 서버 API 조회 (온라인 필수)
 *
 * @param tripId 해당 Schedule/Expense가 속한 여행 ID
 * @param operations 로컬/원격 조회 함수
 * @returns 조회 결과
 * @throws OfflineError 비활성 여행을 오프라인에서 조회 시
 */
export async function routeChildQuery<T>(
  tripId: string,
  operations: {
    local: () => Promise<T>;
    remote: () => Promise<T>;
  },
): Promise<T> {
  const isActivated = await getTripActivationStatus(tripId);

  if (isActivated) {
    // 활성화된 Trip → 로컬 DB 조회
    return await operations.local();
  } else {
    // 비활성 Trip → 서버 조회 (온라인 필수)
    const networkStatus = networkStore.status;

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
 * 라우팅 레이어 - Trip 자체 Mutation 작업
 * - 활성화된 여행이 하나라도 있으면: 로컬 DB + sync_queue
 * - 비활성 상태: 서버 API 직접 호출 (온라인 필수)
 *
 * @param operations 로컬/원격 수정 함수
 * @returns 수정 결과
 * @throws OfflineError 오프라인 상태에서 서버 호출 시도 시
 */
export async function routeTripMutation<T>(operations: {
  local: () => Promise<T>;
  remote: () => Promise<T>;
}): Promise<T> {
  const hasActivated = await hasAnyActivatedTrip();

  if (hasActivated) {
    // 활성화된 Trip 있음 → 로컬 DB + sync_queue
    return await operations.local();
  } else {
    // 비활성 상태 → 서버 직접 호출 (온라인 필수)
    const networkStatus = networkStore.status;

    if (networkStatus === 'offline') {
      throw new OfflineError('오프라인에서는 활성화된 여행만 수정할 수 있어요', {
        action: 'ACTIVATE_PROMPT',
      });
    }

    return await operations.remote();
  }
}

/**
 * 라우팅 레이어 - Schedule/Expense Mutation 작업
 * - 해당 Trip이 활성화되어 있으면: 로컬 DB + sync_queue
 * - 비활성 Trip: 서버 API 직접 호출 (온라인 필수)
 *
 * @param tripId 해당 Schedule/Expense가 속한 여행 ID
 * @param operations 로컬/원격 수정 함수
 * @returns 수정 결과
 * @throws OfflineError 비활성 여행을 오프라인에서 수정 시
 */
export async function routeChildMutation<T>(
  tripId: string,
  operations: {
    local: () => Promise<T>;
    remote: () => Promise<T>;
  },
): Promise<T> {
  const isActivated = await getTripActivationStatus(tripId);

  if (isActivated) {
    // 활성화된 Trip → 로컬 DB + sync_queue
    return await operations.local();
  } else {
    // 비활성 Trip → 서버 직접 호출 (온라인 필수)
    const networkStatus = networkStore.status;

    if (networkStatus === 'offline') {
      throw new OfflineError('오프라인에서는 활성화된 여행만 수정할 수 있어요', {
        action: 'ACTIVATE_PROMPT',
        tripId,
      });
    }

    return await operations.remote();
  }
}
