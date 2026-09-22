import { getTripActivationStatus, hasAnyActivatedTrip } from './metadata';
import { OfflineError } from './errors';
import { networkStore } from '@/shared/store/network';
import { requireLocalUserId, requireRemoteSession } from '@/shared/store/auth';

interface RouteOperations<T> {
  local: () => Promise<T>;
  remote: () => Promise<T>;
}

function assertRemoteAvailable(offlineMessage: string, tripId?: string) {
  requireRemoteSession();
  const status = networkStore.realStatus;

  if (status === 'online') {
    return;
  }

  throw new OfflineError(
    status === 'unknown' ? '인터넷 연결을 아직 확인하지 못했어요. 잠시 후 다시 시도해주세요.' : offlineMessage,
    { action: status === 'unknown' ? 'ONLINE_REQUIRED' : 'ACTIVATE_PROMPT', tripId },
  );
}

function assertWritesAllowed() {
  if (networkStore.override !== null) {
    throw new OfflineError('네트워크 화면 테스트 중에는 저장·삭제할 수 없어요. 강제 설정을 해제해주세요.', {
      action: 'ONLINE_REQUIRED',
    });
  }
}

/** Trip 조회의 기존 분기는 전역 활성 여행 존재 여부를 사용한다. */
export async function routeTripQuery<T>(operations: RouteOperations<T>): Promise<T> {
  requireLocalUserId();
  const hasActivated = await hasAnyActivatedTrip();

  if (hasActivated) {
    return await operations.local();
  }

  assertRemoteAvailable('오프라인에서는 활성화된 여행만 볼 수 있어요');
  return await operations.remote();
}

/** Schedule·Expense 조회는 소속 여행의 활성 여부로 분기한다. */
export async function routeChildQuery<T>(tripId: string, operations: RouteOperations<T>): Promise<T> {
  requireLocalUserId();
  const isActivated = await getTripActivationStatus(tripId);

  if (isActivated) {
    return await operations.local();
  }

  assertRemoteAvailable('오프라인에서는 활성화된 여행만 볼 수 있어요', tripId);
  return await operations.remote();
}

/** Trip 쓰기의 기존 분기는 전역 활성 여행 존재 여부를 사용한다. */
export async function routeTripMutation<T>(operations: RouteOperations<T>): Promise<T> {
  requireLocalUserId();
  const hasActivated = await hasAnyActivatedTrip();

  assertWritesAllowed();

  if (hasActivated) {
    return await operations.local();
  }

  assertRemoteAvailable('오프라인에서는 활성화된 여행만 수정할 수 있어요');
  return await operations.remote();
}

/** Schedule·Expense 쓰기는 소속 여행의 활성 여부로 분기한다. */
export async function routeChildMutation<T>(tripId: string, operations: RouteOperations<T>): Promise<T> {
  requireLocalUserId();
  const isActivated = await getTripActivationStatus(tripId);

  assertWritesAllowed();

  if (isActivated) {
    return await operations.local();
  }

  assertRemoteAvailable('오프라인에서는 활성화된 여행만 수정할 수 있어요', tripId);
  return await operations.remote();
}
