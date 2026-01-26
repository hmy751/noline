import { Router } from 'express';
import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { eq, and } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema.js';
import config from '../config/index.js';
import { generateTokens, verifyRefreshToken, hashToken, getRefreshTokenExpiresAt } from '../services/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { exchangeAppleAuthCode, revokeAppleToken, isAppleOAuthConfigured } from '../services/apple-oauth.js';

const router = Router();

// Google OAuth Client
const googleClient = new OAuth2Client();

// ========================================
// Types
// ========================================

interface GoogleUserInfo {
  sub: string; // Google 고유 ID
  email: string;
  name: string;
  picture?: string;
}

interface AppleUserInfo {
  sub: string; // Apple 고유 ID
  email?: string;
  name?: string;
}

// ========================================
// Helper Functions
// ========================================

/**
 * 사용자 찾기 또는 생성
 */
async function findOrCreateUser(
  provider: 'google' | 'apple',
  providerId: string,
  email: string,
  name: string,
  profileImageUrl?: string | null,
) {
  // 기존 사용자 찾기
  const existingUser = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.providerId, providerId)))
    .limit(1);

  if (existingUser.length > 0) {
    // 기존 사용자 - 정보 업데이트
    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        name,
        profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser[0].id))
      .returning();

    return updatedUser;
  }

  // 새 사용자 생성
  const [newUser] = await db
    .insert(users)
    .values({
      provider,
      providerId,
      email,
      name,
      profileImageUrl,
    })
    .returning();

  return newUser;
}

/**
 * Refresh Token DB에 저장
 */
async function saveRefreshToken(userId: string, refreshToken: string, deviceInfo?: string) {
  const hashedToken = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiresAt();

  await db.insert(refreshTokens).values({
    userId,
    token: hashedToken,
    expiresAt,
    deviceInfo,
  });
}

/**
 * Refresh Token DB에서 삭제
 */
async function deleteRefreshToken(hashedToken: string) {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, hashedToken));
}

/**
 * 사용자의 모든 Refresh Token 삭제
 */
async function deleteAllRefreshTokens(userId: string) {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

// ========================================
// POST /auth/google - Google 로그인
// ========================================

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken, deviceInfo } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'idToken이 필요합니다' },
      });
    }

    // Google ID Token 검증
    let googleUser: GoogleUserInfo;
    try {
      // 허용된 Client ID 목록 (Web + iOS)
      const allowedAudiences = [config.googleOAuth.webClientId, config.googleOAuth.iosClientId].filter(
        Boolean,
      ) as string[];

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: allowedAudiences,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new Error('Invalid payload');
      }

      googleUser = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
      };

      console.log('✅ Google token verified for user:', googleUser.email);
    } catch (error) {
      console.error('Google token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_ID_TOKEN', message: 'Google 토큰 검증에 실패했습니다' },
      });
    }

    // 사용자 찾기 또는 생성
    console.log('🔐 [Google Auth] Finding or creating user...');
    const user = await findOrCreateUser(
      'google',
      googleUser.sub,
      googleUser.email,
      googleUser.name,
      googleUser.picture,
    );
    console.log('🔐 [Google Auth] User found/created:', user.id);

    // JWT 토큰 발급
    console.log('🔐 [Google Auth] Generating tokens...');
    const tokens = generateTokens(user.id);
    console.log('🔐 [Google Auth] Tokens generated');

    // Refresh Token DB 저장
    console.log('🔐 [Google Auth] Saving refresh token...');
    await saveRefreshToken(user.id, tokens.refreshToken, deviceInfo);
    console.log('🔐 [Google Auth] Refresh token saved');

    console.log('🔐 [Google Auth] Login successful for:', googleUser.email);
    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImageUrl: user.profileImageUrl,
          provider: user.provider,
        },
      },
    });
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '로그인 처리 중 오류가 발생했습니다' },
    });
  }
});

// ========================================
// POST /auth/apple - Apple 로그인
// ========================================

router.post('/apple', async (req: Request, res: Response) => {
  try {
    const { identityToken, authorizationCode, user: appleUser, deviceInfo } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'identityToken이 필요합니다' },
      });
    }

    // Apple Identity Token 검증
    // Note: 실제 구현에서는 apple-signin-auth 라이브러리 또는 직접 JWT 검증 필요
    // 여기서는 간단한 JWT 디코딩으로 처리 (production에서는 서명 검증 필수!)
    let appleUserInfo: AppleUserInfo;
    try {
      // JWT 디코딩 (서명 검증 없이 - production에서는 검증 필요!)
      const [, payloadBase64] = identityToken.split('.');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

      if (!payload.sub) {
        throw new Error('Invalid payload');
      }

      appleUserInfo = {
        sub: payload.sub,
        email: payload.email || appleUser?.email,
        name: appleUser?.name?.firstName
          ? `${appleUser.name.firstName} ${appleUser.name.lastName || ''}`.trim()
          : undefined,
      };
    } catch (error) {
      console.error('Apple token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_ID_TOKEN', message: 'Apple 토큰 검증에 실패했습니다' },
      });
    }

    // Apple Authorization Code로 Refresh Token 발급 (Token Revoke용)
    let appleRefreshToken: string | null = null;
    if (authorizationCode && isAppleOAuthConfigured()) {
      console.log('🔐 [Apple Auth] Exchanging authorization code for refresh token...');
      appleRefreshToken = await exchangeAppleAuthCode(authorizationCode);
    }

    // 사용자 찾기 또는 생성
    // Apple은 첫 로그인 시에만 email/name 제공, 이후에는 sub만 제공
    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.provider, 'apple'), eq(users.providerId, appleUserInfo.sub)))
      .limit(1);

    let user;
    if (existingUser.length > 0) {
      // 기존 사용자 - Apple Refresh Token 업데이트 (있는 경우만)
      if (appleRefreshToken) {
        const [updatedUser] = await db
          .update(users)
          .set({
            appleRefreshToken,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser[0].id))
          .returning();
        user = updatedUser;
      } else {
        user = existingUser[0];
      }
    } else {
      // 새 사용자 - email/name 필수
      if (!appleUserInfo.email) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: '첫 로그인 시 이메일 정보가 필요합니다' },
        });
      }

      const [newUser] = await db
        .insert(users)
        .values({
          provider: 'apple',
          providerId: appleUserInfo.sub,
          email: appleUserInfo.email,
          name: appleUserInfo.name || appleUserInfo.email.split('@')[0],
          profileImageUrl: null, // Apple은 프로필 사진 미제공
          appleRefreshToken, // Token Revoke용 (null일 수 있음)
        })
        .returning();

      user = newUser;
    }

    // JWT 토큰 발급
    const tokens = generateTokens(user.id);

    // Refresh Token DB 저장
    await saveRefreshToken(user.id, tokens.refreshToken, deviceInfo);

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImageUrl: user.profileImageUrl,
          provider: user.provider,
        },
      },
    });
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '로그인 처리 중 오류가 발생했습니다' },
    });
  }
});

// ========================================
// POST /auth/refresh - 토큰 갱신 (Rolling Refresh)
// ========================================

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken, deviceInfo } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'refreshToken이 필요합니다' },
      });
    }

    // Refresh Token JWT 검증
    const verifyResult = verifyRefreshToken(refreshToken);
    if (!verifyResult.success) {
      return res.status(401).json({
        success: false,
        error: {
          code: verifyResult.error === 'TOKEN_EXPIRED' ? 'REFRESH_TOKEN_EXPIRED' : 'TOKEN_INVALID',
          message:
            verifyResult.error === 'TOKEN_EXPIRED'
              ? 'Refresh 토큰이 만료되었습니다. 다시 로그인해주세요'
              : '유효하지 않은 토큰입니다',
        },
      });
    }

    // DB에서 해시된 토큰 확인
    const hashedToken = hashToken(refreshToken);
    const storedToken = await db.select().from(refreshTokens).where(eq(refreshTokens.token, hashedToken)).limit(1);

    if (storedToken.length === 0) {
      // 토큰이 DB에 없음 (이미 사용됨 또는 무효화됨)
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_INVALID', message: '유효하지 않은 토큰입니다' },
      });
    }

    // 만료 시간 체크
    if (new Date() > storedToken[0].expiresAt) {
      await deleteRefreshToken(hashedToken);
      return res.status(401).json({
        success: false,
        error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh 토큰이 만료되었습니다' },
      });
    }

    const userId = verifyResult.payload!.userId;

    // Rolling Refresh: 기존 토큰 삭제 + 새 토큰 발급
    await deleteRefreshToken(hashedToken);

    const newTokens = generateTokens(userId);
    await saveRefreshToken(userId, newTokens.refreshToken, deviceInfo);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '토큰 갱신 중 오류가 발생했습니다' },
    });
  }
});

// ========================================
// POST /auth/logout - 로그아웃
// ========================================

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // 특정 토큰만 삭제
      const hashedToken = hashToken(refreshToken);
      await deleteRefreshToken(hashedToken);
    }

    res.status(200).json({
      success: true,
      data: { message: '로그아웃되었습니다' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '로그아웃 처리 중 오류가 발생했습니다' },
    });
  }
});

// ========================================
// GET /auth/me - 현재 사용자 정보
// ========================================

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다' },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        profileImageUrl: user[0].profileImageUrl,
        provider: user[0].provider,
        createdAt: user[0].createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '사용자 정보 조회 중 오류가 발생했습니다' },
    });
  }
});

// ========================================
// DELETE /auth/account - 회원 탈퇴
// ========================================

router.delete('/account', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // 사용자 정보 조회 (Apple 사용자인 경우 token revoke 필요)
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다' },
      });
    }

    const user = userResult[0];

    // Apple 사용자인 경우 Token Revoke (App Store Guideline 5.1.1(v) 준수)
    if (user.provider === 'apple' && user.appleRefreshToken && isAppleOAuthConfigured()) {
      console.log('🔐 [Delete Account] Revoking Apple token...');
      const revokeSuccess = await revokeAppleToken(user.appleRefreshToken);
      if (!revokeSuccess) {
        console.warn('⚠️ [Delete Account] Apple token revoke failed, continuing with account deletion');
      }
    }

    // 모든 Refresh Token 삭제
    await deleteAllRefreshTokens(userId);

    // 사용자 삭제 (CASCADE로 관련 데이터도 삭제됨)
    await db.delete(users).where(eq(users.id, userId));

    res.status(200).json({
      success: true,
      data: { message: '계정이 삭제되었습니다' },
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '계정 삭제 중 오류가 발생했습니다' },
    });
  }
});

export default router;
