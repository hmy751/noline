import type { Response } from 'express';

/**
 * route 내부 try-catch 에서 사용하던 동일한 envelope 를 헬퍼로 통일.
 *
 * 응답 shape는 기존과 같다:
 *   { error: string, message: string, details: string }
 *
 * 새 envelope를 도입하는 것이 아니라, 흩어진 동일 코드 16개를 한 곳으로
 * 모으는 것이 목적이다. 표준 envelope 통일은 별도 결정에서 다룬다.
 */
export function sendInternalError(res: Response, message: string, error: unknown): void {
  if (error instanceof Error) {
    res.status(500).json({
      error: 'Internal server error',
      message,
      details: error.message,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    message,
    details: 'Unknown error occurred',
  });
}
