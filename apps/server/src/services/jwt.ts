import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';

// ========================================
// JWT Token Types
// ========================================

interface AccessTokenPayload {
  userId: string;
  type: 'access';
}

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

type TokenPayload = AccessTokenPayload | RefreshTokenPayload;

// ========================================
// Token Generation
// ========================================

/**
 * Access Token + Refresh Token 쌍 생성
 * - accessToken: 1시간 (API 요청 인증)
 * - refreshToken: 30일 (accessToken 갱신, Rolling Refresh)
 */
export function generateTokens(userId: string): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign({ userId, type: 'access' } satisfies AccessTokenPayload, config.jwt.secret!, {
    expiresIn: config.jwt.accessTokenExpiresIn,
    issuer: config.jwt.issuer,
  });

  const refreshToken = jwt.sign({ userId, type: 'refresh' } satisfies RefreshTokenPayload, config.jwt.secret!, {
    expiresIn: config.jwt.refreshTokenExpiresIn,
    issuer: config.jwt.issuer,
  });

  return { accessToken, refreshToken };
}

// ========================================
// Token Verification
// ========================================

/**
 * 토큰 검증 결과 타입
 */
type VerifyResult =
  | { success: true; payload: TokenPayload }
  | { success: false; error: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' };

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): VerifyResult {
  try {
    const payload = jwt.verify(token, config.jwt.secret!, {
      issuer: config.jwt.issuer,
    }) as TokenPayload;

    return { success: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }
    return { success: false, error: 'TOKEN_INVALID' };
  }
}

/**
 * Access Token 검증 (type: 'access' 확인)
 */
export function verifyAccessToken(token: string): VerifyResult & { payload?: AccessTokenPayload } {
  const result = verifyToken(token);

  if (!result.success) {
    return result;
  }

  if (result.payload.type !== 'access') {
    return { success: false, error: 'TOKEN_INVALID' };
  }

  return { success: true, payload: result.payload as AccessTokenPayload };
}

/**
 * Refresh Token 검증 (type: 'refresh' 확인)
 */
export function verifyRefreshToken(token: string): VerifyResult & { payload?: RefreshTokenPayload } {
  const result = verifyToken(token);

  if (!result.success) {
    return result;
  }

  if (result.payload.type !== 'refresh') {
    return { success: false, error: 'TOKEN_INVALID' };
  }

  return { success: true, payload: result.payload as RefreshTokenPayload };
}

// ========================================
// Token Hashing (DB 저장용)
// ========================================

/**
 * Refresh Token 해시 (DB 저장용)
 * - DB에는 원본이 아닌 해시값 저장
 * - DB 유출 시에도 원본 토큰 알 수 없음
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ========================================
// Refresh Token 만료 시간 계산
// ========================================

/**
 * Refresh Token 만료 시간 계산 (DB 저장용)
 * - 현재 시간 + 30일
 */
export function getRefreshTokenExpiresAt(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 30);
  return now;
}
