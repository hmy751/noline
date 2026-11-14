import { AuthRequiredError, requireLocalUserId, useAuthStore } from '@/shared/store/auth';

const pendingTripOperations = new Map<string, Promise<unknown>>();

/** 같은 여행의 활성화·비활성화·사본 정리·저장을 순서대로 실행한다. 대기 뒤 Router가 출처를 다시 고른다. */
export const withTripOperation = async <T>(tripId: string, operation: () => Promise<T>): Promise<T> => {
  const userId = requireLocalUserId();
  const sessionId = useAuthStore.getState().sessionId;
  const key = `${userId}:${tripId}`;
  const previousOperation = pendingTripOperations.get(key) ?? Promise.resolve();
  const assertSameSession = () => {
    if (requireLocalUserId() !== userId || useAuthStore.getState().sessionId !== sessionId) {
      throw new AuthRequiredError();
    }
  };

  const currentOperation = previousOperation
    .catch(() => undefined)
    .then(async () => {
      assertSameSession();
      const result = await operation();
      assertSameSession();
      return result;
    });
  pendingTripOperations.set(key, currentOperation);
  try {
    return await currentOperation;
  } finally {
    if (pendingTripOperations.get(key) === currentOperation) {
      pendingTripOperations.delete(key);
    }
  }
};
