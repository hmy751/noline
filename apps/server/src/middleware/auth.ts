import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt';

// ========================================
// Express Request 타입 확장
// ========================================

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// ========================================
// Auth Error Codes
// ========================================

export const AUTH_ERROR_CODES = {
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
} as const;

type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

// ========================================
// Auth Error Response
// ========================================

function sendAuthError(res: Response, code: AuthErrorCode, message: string) {
  res.status(401).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

// ========================================
// Auth Middleware
// ========================================

/**
 * 인증 필수 미들웨어
 * - Authorization: Bearer {token} 헤더 필수
 * - 검증 성공 시 req.userId 설정
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // 1. Authorization 헤더 체크
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendAuthError(res, AUTH_ERROR_CODES.TOKEN_MISSING, '인증이 필요합니다');
  }

  // 2. 토큰 추출
  const token = authHeader.slice(7); // "Bearer " 제거

  // 3. 토큰 검증
  const result = verifyAccessToken(token);

  if (!result.success) {
    if (result.error === 'TOKEN_EXPIRED') {
      return sendAuthError(res, AUTH_ERROR_CODES.TOKEN_EXPIRED, '토큰이 만료되었습니다');
    }
    return sendAuthError(res, AUTH_ERROR_CODES.TOKEN_INVALID, '유효하지 않은 토큰입니다');
  }

  // 4. userId 설정
  req.userId = result.payload!.userId;

  next();
}

/**
 * 인증 선택 미들웨어
 * - 토큰이 있으면 검증하고 req.userId 설정
 * - 토큰이 없어도 통과 (req.userId는 undefined)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 토큰 없으면 그냥 통과
    return next();
  }

  const token = authHeader.slice(7);
  const result = verifyAccessToken(token);

  if (result.success) {
    req.userId = result.payload!.userId;
  }
  // 검증 실패해도 에러 안 냄 (optional)

  next();
}
