import * as SecureStore from 'expo-secure-store';

// ========================================
// Storage Keys
// ========================================

const KEYS = {
  ACCESS_TOKEN: 'noline_access_token',
  REFRESH_TOKEN: 'noline_refresh_token',
  USER_ID: 'noline_user_id',
} as const;

// ========================================
// SecureStore Options
// ========================================

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// ========================================
// Access Token
// ========================================

/**
 * Access Token 저장
 */
export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token, SECURE_STORE_OPTIONS);
}

/**
 * Access Token 조회
 * @returns token 또는 null (없을 경우)
 */
export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

/**
 * Access Token 삭제
 */
export async function deleteAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
}

// ========================================
// Refresh Token
// ========================================

/**
 * Refresh Token 저장
 */
export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token, SECURE_STORE_OPTIONS);
}

/**
 * Refresh Token 조회
 * @returns token 또는 null (없을 경우)
 */
export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

/**
 * Refresh Token 삭제
 */
export async function deleteRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
}

// ========================================
// User ID
// ========================================

/**
 * User ID 저장
 */
export async function setUserId(userId: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.USER_ID, userId, SECURE_STORE_OPTIONS);
}

/**
 * User ID 조회
 * @returns userId 또는 null (없을 경우)
 */
export async function getUserId(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEYS.USER_ID);
}

/**
 * User ID 삭제
 */
export async function deleteUserId(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.USER_ID);
}

// ========================================
// Batch Operations
// ========================================

/**
 * 토큰 + userId 한번에 저장 (로그인 성공 시)
 */
export async function saveAuthData(data: { accessToken: string; refreshToken: string; userId: string }): Promise<void> {
  await Promise.all([setAccessToken(data.accessToken), setRefreshToken(data.refreshToken), setUserId(data.userId)]);
}

/**
 * 토큰만 갱신 (refresh 성공 시)
 */
export async function updateTokens(data: { accessToken: string; refreshToken: string }): Promise<void> {
  await Promise.all([setAccessToken(data.accessToken), setRefreshToken(data.refreshToken)]);
}

/**
 * 모든 인증 데이터 삭제 (로그아웃 시)
 */
export async function clearAuthData(): Promise<void> {
  await Promise.all([deleteAccessToken(), deleteRefreshToken(), deleteUserId()]);
}

/**
 * 인증 상태 확인 (토큰 존재 여부)
 * - 오프라인에서는 토큰 존재만 확인 (만료 무시)
 */
export async function hasAuthData(): Promise<boolean> {
  const [accessToken, userId] = await Promise.all([getAccessToken(), getUserId()]);
  return accessToken !== null && userId !== null;
}

/**
 * 모든 인증 데이터 조회
 */
export async function getAuthData(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
}> {
  const [accessToken, refreshToken, userId] = await Promise.all([getAccessToken(), getRefreshToken(), getUserId()]);

  return { accessToken, refreshToken, userId };
}
