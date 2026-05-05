import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';

// ========================================
// Types
// ========================================

interface AppleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
}

interface AppleJWK {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface AppleKeysResponse {
  keys: AppleJWK[];
}

interface AppleIdentityTokenPayload {
  sub: string;
  email?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

// ========================================
// Apple Public Key Verification
// ========================================

// Apple 공개키 캐시 (재시작 시 리셋)
let cachedAppleKeys: AppleJWK[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

/**
 * Apple 공개키 가져오기 (캐시 적용)
 * @see https://developer.apple.com/documentation/sign_in_with_apple/fetch_apple_s_public_key_for_verifying_token_signature
 */
async function getApplePublicKeys(): Promise<AppleJWK[]> {
  if (cachedAppleKeys && Date.now() < cacheExpiresAt) {
    return cachedAppleKeys;
  }

  const response = await fetch('https://appleid.apple.com/auth/keys');
  if (!response.ok) {
    throw new Error(`Failed to fetch Apple public keys: ${response.status}`);
  }

  const data = (await response.json()) as AppleKeysResponse;
  cachedAppleKeys = data.keys;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;

  return data.keys;
}

/**
 * JWK → PEM 변환 (Node.js crypto 사용)
 */
function jwkToPem(jwk: AppleJWK): string {
  const keyObject = crypto.createPublicKey({
    key: {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
    },
    format: 'jwk',
  });

  return keyObject.export({ type: 'spki', format: 'pem' }) as string;
}

/**
 * Apple Identity Token 서명 검증
 *
 * 1. JWT 헤더에서 kid 추출
 * 2. Apple 공개키에서 해당 kid 매칭
 * 3. 서명 검증 + issuer/audience 확인
 *
 * @param identityToken - Apple Sign In에서 받은 identity_token (JWT)
 * @returns 검증된 payload
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentityTokenPayload> {
  const { clientId } = config.appleOAuth;
  if (!clientId) {
    throw new Error('Apple OAuth client ID is not configured');
  }

  // JWT 헤더에서 kid 추출
  const [headerBase64] = identityToken.split('.');
  const header = JSON.parse(Buffer.from(headerBase64, 'base64').toString());

  if (!header.kid) {
    throw new Error('Apple identity token missing kid in header');
  }

  // Apple 공개키 가져오기
  const appleKeys = await getApplePublicKeys();
  const matchingKey = appleKeys.find((key) => key.kid === header.kid);

  if (!matchingKey) {
    // 캐시가 오래됐을 수 있으므로 강제 갱신
    cachedAppleKeys = null;
    const refreshedKeys = await getApplePublicKeys();
    const retryKey = refreshedKeys.find((key) => key.kid === header.kid);

    if (!retryKey) {
      throw new Error(`No matching Apple public key found for kid: ${header.kid}`);
    }

    const pem = jwkToPem(retryKey);
    return jwt.verify(identityToken, pem, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: clientId,
    }) as AppleIdentityTokenPayload;
  }

  const pem = jwkToPem(matchingKey);
  return jwt.verify(identityToken, pem, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: clientId,
  }) as AppleIdentityTokenPayload;
}

// ========================================
// Helper Functions
// ========================================

/**
 * Apple Client Secret 생성 (JWT)
 * Apple REST API 호출 시 필요한 client_secret
 *
 * @see https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 */
function generateAppleClientSecret(): string {
  const { clientId, teamId, keyId, privateKey } = config.appleOAuth;

  if (!clientId || !teamId || !keyId || !privateKey) {
    throw new Error('Apple OAuth configuration is incomplete');
  }

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 15777000, // 6개월 (최대 허용)
    aud: 'https://appleid.apple.com',
    sub: clientId,
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    keyid: keyId,
  });
}

// ========================================
// Token Exchange
// ========================================

/**
 * Authorization Code로 Apple Refresh Token 발급
 *
 * @param authorizationCode - Apple Sign In에서 받은 authorization_code
 * @returns Apple refresh_token (계정 삭제 시 revoke에 사용)
 *
 * @see https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 */
export async function exchangeAppleAuthCode(authorizationCode: string): Promise<string | null> {
  try {
    const clientSecret = generateAppleClientSecret();
    const { clientId } = config.appleOAuth;

    if (!clientId) {
      console.warn('⚠️ [Apple OAuth] Client ID not configured, skipping token exchange');
      return null;
    }

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Apple OAuth] Token exchange failed:', response.status, errorText);
      return null;
    }

    const data = (await response.json()) as AppleTokenResponse;
    console.log('✅ [Apple OAuth] Token exchange successful');

    return data.refresh_token;
  } catch (error) {
    console.error('❌ [Apple OAuth] Token exchange error:', error);
    return null;
  }
}

// ========================================
// Token Revoke
// ========================================

/**
 * Apple Refresh Token 취소 (회원 탈퇴 시 호출)
 *
 * Apple App Store 가이드라인 5.1.1(v) 준수:
 * Sign in with Apple 사용자의 계정 삭제 시 Apple 토큰도 revoke 필요
 *
 * @param refreshToken - 저장된 Apple refresh_token
 * @returns 성공 여부
 *
 * @see https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens
 */
export async function revokeAppleToken(refreshToken: string): Promise<boolean> {
  try {
    const clientSecret = generateAppleClientSecret();
    const { clientId } = config.appleOAuth;

    if (!clientId) {
      console.warn('⚠️ [Apple OAuth] Client ID not configured, skipping token revoke');
      return false;
    }

    const response = await fetch('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Apple OAuth] Token revoke failed:', response.status, errorText);
      return false;
    }

    console.log('✅ [Apple OAuth] Token revoke successful');
    return true;
  } catch (error) {
    console.error('❌ [Apple OAuth] Token revoke error:', error);
    return false;
  }
}

/**
 * Apple OAuth 설정 여부 확인
 */
export function isAppleOAuthConfigured(): boolean {
  const { clientId, teamId, keyId, privateKey } = config.appleOAuth;
  return !!(clientId && teamId && keyId && privateKey);
}
