import { getTripActivationStatus, hasAnyActivatedTrip } from './metadata';
import { OfflineError, type OfflineErrorOptions } from './errors';
import { APIError } from '@/shared/api/errors';
import { networkStore } from '@/shared/store/network';
import { requireLocalUserId, requireRemoteSession, useAuthStore } from '@/shared/store/auth';

interface RouteOperations<T> {
  local: () => Promise<T>;
  remote: () => Promise<T>;
}

function assertRemoteAvailable(
  offlineMessage: string,
  tripId?: string,
  action: OfflineErrorOptions['action'] = 'ACTIVATE_PROMPT',
) {
  requireRemoteSession();
  const status = networkStore.realStatus;

  if (status === 'online') {
    return;
  }

  throw new OfflineError(
    status === 'unknown' ? '인터넷 연결을 아직 확인하지 못했어요. 잠시 후 다시 시도해주세요.' : offlineMessage,
    { action: status === 'unknown' ? 'ONLINE_REQUIRED' : action, tripId },
  );
}

function assertWritesAllowed() {
  if (networkStore.override !== null) {
    throw new OfflineError('네트워크 화면 테스트 중에는 저장·삭제할 수 없어요. 강제 설정을 해제해주세요.', {
      action: 'ONLINE_REQUIRED',
    });
  }
}

/** 온라인 목록은 서버에서 갱신하고, 연결·인증이 제한되면 활성 여행의 로컬 목록을 사용한다. */
export async function routeTripQuery<T>(operations: RouteOperations<T>): Promise<T> {
  requireLocalUserId();
  if (networkStore.realStatus === 'online' && useAuthStore.getState().status === 'signed-in') {
    const sessionId = useAuthStore.getState().sessionId;
    try {
      return await operations.remote();
    } catch (error) {
      // 연결 감지는 API 서버의 응답까지 보장하지 않는다. 원격 접근 실패에만 로컬 이용을 유지한다.
      const unavailable =
        error instanceof APIError &&
        ((error.status === 0 && error.code === 'NETWORK_ERROR') || error.status === 408 || error.status >= 500);
      if (!unavailable || !(await hasAnyActivatedTrip()) || !useAuthStore.isCurrentSession(sessionId)) throw error;
      return await operations.local();
    }
  }

  if (await hasAnyActivatedTrip()) return await operations.local();
  assertRemoteAvailable('오프라인에서는 활성화된 여행만 볼 수 있어요');
  return await operations.remote();
}

/** Trip 단건·Schedule·Expense 조회는 대상 여행의 활성 여부로 분기한다. */
export async function routeChildQuery<T>(tripId: string, operations: RouteOperations<T>): Promise<T> {
  requireLocalUserId();
  const isActivated = await getTripActivationStatus(tripId);

  if (isActivated) {
    return await operations.local();
  }

  assertRemoteAvailable('오프라인에서는 활성화된 여행만 볼 수 있어요', tripId);
  return await operations.remote();
}

/** 새 여행은 아직 활성화되지 않았으므로 서버에서 생성한다. */
export async function routeTripCreation<T>(remote: () => Promise<T>): Promise<T> {
  requireLocalUserId();
  assertWritesAllowed();
  assertRemoteAvailable('여행을 만들려면 인터넷 연결이 필요해요', undefined, 'ONLINE_REQUIRED');
  return await remote();
}

/** Trip 수정·삭제와 Schedule·Expense 쓰기는 대상 여행의 활성 여부로 분기한다. */
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
