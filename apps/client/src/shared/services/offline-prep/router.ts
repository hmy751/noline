import { APIError } from '@/shared/api/errors';
import { AuthRequiredError, requireLocalUserId, requireRemoteSession, useAuthStore } from '@/shared/store/auth';
import { networkStore } from '@/shared/store/network';

import { OfflineError, type OfflineErrorOptions } from './errors';
import { getTripActivationStatus, hasAnyActivatedTrip } from './metadata';
import { withTripOperation } from './trip-operation';

type RouteOperations<T, Input = void> = {
  local: (input: Input) => Promise<T>;
  remote: (input: Input) => Promise<T>;
};

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

      if (!unavailable || !(await hasAnyActivatedTrip()) || !useAuthStore.isCurrentSession(sessionId)) {
        throw error;
      }

      return await operations.local();
    }
  }

  if (await hasAnyActivatedTrip()) {
    return await operations.local();
  }

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
export function routeChildMutation<T>(tripId: string, operations: RouteOperations<T>): Promise<T>;
export function routeChildMutation<T, Input>(
  tripId: string,
  operations: RouteOperations<T, Input>,
  preparation: Promise<Input>,
): Promise<T>;
export async function routeChildMutation<T, Input>(
  tripId: string,
  operations: RouteOperations<T, Input>,
  preparation?: Promise<Input>,
): Promise<T> {
  // 먼저 여행 작업 순서를 확보하고, 앞선 작업을 기다리는 동안 발생한 준비 실패도 전달한다.
  const prepared = preparation?.then(
    (input) => ({ success: true as const, input }),
    (error: unknown) => ({ success: false as const, error }),
  );

  return await withTripOperation(tripId, async () => {
    const userId = requireLocalUserId();
    const sessionId = useAuthStore.getState().sessionId;
    const result = await prepared;

    if (result && !result.success) {
      throw result.error;
    }

    if (requireLocalUserId() !== userId || useAuthStore.getState().sessionId !== sessionId) {
      throw new AuthRequiredError();
    }

    const isActivated = await getTripActivationStatus(tripId);

    if (requireLocalUserId() !== userId || useAuthStore.getState().sessionId !== sessionId) {
      throw new AuthRequiredError();
    }

    assertWritesAllowed();

    // 입력을 받는 callback은 공개 overload에서 preparation 전달을 요구한다.
    const input = result?.input as Input;

    if (isActivated) {
      return await operations.local(input);
    }

    assertRemoteAvailable('오프라인에서는 활성화된 여행만 수정할 수 있어요', tripId);

    return await operations.remote(input);
  });
}
