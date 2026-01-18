import * as SecureStore from 'expo-secure-store';

// ========================================
// Storage Keys
// ========================================

const KEYS = {
  ACCESS_TOKEN: 'noline_access_token',
  REFRESH_TOKEN: 'noline_refresh_token',
  USER_ID: 'noline_user_id',
  USER_NAME: 'noline_user_name',
  USER_EMAIL: 'noline_user_email',
  USER_PROFILE_IMAGE: 'noline_user_profile_image',
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
// User Info (name, email, profileImageUrl)
// ========================================

export interface UserInfo {
  name: string;
  email: string;
  profileImageUrl: string | null;
}

/**
 * User Info 저장
 */
export async function setUserInfo(info: UserInfo): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.USER_NAME, info.name, SECURE_STORE_OPTIONS),
    SecureStore.setItemAsync(KEYS.USER_EMAIL, info.email, SECURE_STORE_OPTIONS),
    info.profileImageUrl
      ? SecureStore.setItemAsync(KEYS.USER_PROFILE_IMAGE, info.profileImageUrl, SECURE_STORE_OPTIONS)
      : SecureStore.deleteItemAsync(KEYS.USER_PROFILE_IMAGE),
  ]);
}

/**
 * User Info 조회
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  const [name, email, profileImageUrl] = await Promise.all([
    SecureStore.getItemAsync(KEYS.USER_NAME),
    SecureStore.getItemAsync(KEYS.USER_EMAIL),
    SecureStore.getItemAsync(KEYS.USER_PROFILE_IMAGE),
  ]);

  if (!name || !email) return null;
  return { name, email, profileImageUrl };
}

/**
 * User Info 삭제
 */
export async function deleteUserInfo(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.USER_NAME),
    SecureStore.deleteItemAsync(KEYS.USER_EMAIL),
    SecureStore.deleteItemAsync(KEYS.USER_PROFILE_IMAGE),
  ]);
}

// ========================================
// Batch Operations
// ========================================

/**
 * 토큰 + userId + userInfo 한번에 저장 (로그인 성공 시)
 */
export async function saveAuthData(data: {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userInfo?: UserInfo;
}): Promise<void> {
  const promises: Promise<void>[] = [
    setAccessToken(data.accessToken),
    setRefreshToken(data.refreshToken),
    setUserId(data.userId),
  ];

  if (data.userInfo) {
    promises.push(setUserInfo(data.userInfo));
  }

  await Promise.all(promises);
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
  await Promise.all([deleteAccessToken(), deleteRefreshToken(), deleteUserId(), deleteUserInfo()]);
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
  userInfo: UserInfo | null;
}> {
  const [accessToken, refreshToken, userId, userInfo] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
    getUserId(),
    getUserInfo(),
  ]);

  return { accessToken, refreshToken, userId, userInfo };
}
