/**
 * 오프라인 활성화 시스템 에러 클래스
 * - 비활성 여행을 오프라인에서 접근할 때 발생
 * - 사용자에게 활성화를 유도하는 메시지 전달
 */

export interface OfflineErrorOptions {
  /**
   * 사용자 액션 제안
   * - ACTIVATE_PROMPT: "활성화하기" 버튼 표시
   * - ONLINE_REQUIRED: "온라인 연결 필요" 메시지만
   */
  action?: 'ACTIVATE_PROMPT' | 'ONLINE_REQUIRED';

  /**
   * 관련 여행 ID (활성화 유도시 사용)
   */
  tripId?: string;
}

export class OfflineError extends Error {
  public readonly action?: string;
  public readonly tripId?: string;

  constructor(message: string, options?: OfflineErrorOptions) {
    super(message);
    this.name = 'OfflineError';
    this.action = options?.action;
    this.tripId = options?.tripId;

    // 프로토타입 체인 유지 (TypeScript 이슈 대응)
    Object.setPrototypeOf(this, OfflineError.prototype);
  }
}

/**
 * 에러가 OfflineError인지 확인하는 타입 가드
 */
export function isOfflineError(error: unknown): error is OfflineError {
  return error instanceof OfflineError;
}
