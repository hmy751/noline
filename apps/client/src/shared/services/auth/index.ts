// Token Storage (SecureStore wrapper)
export {
  getAccessToken,
  setAccessToken,
  deleteAccessToken,
  getRefreshToken,
  setRefreshToken,
  deleteRefreshToken,
  getUserId,
  setUserId,
  deleteUserId,
  saveAuthData,
  updateTokens,
  clearAuthData,
  hasAuthData,
  getAuthData,
} from './token-storage';

// Auth API
export {
  loginWithGoogle,
  loginWithApple,
  refreshTokens,
  logout,
  getCurrentUser,
  deleteAccount,
  type AuthResponse,
  type RefreshResponse,
  type UserResponse,
} from './auth-api';

// Google OAuth
export {
  useGoogleAuth,
  isGoogleAuthConfigured,
  type GoogleAuthResponse,
  type GoogleAuthResult,
  type GoogleAuthError,
} from './google-auth';

// Apple OAuth
export {
  signInWithApple,
  isAppleAuthAvailable,
  AppleAuthenticationButton,
  AppleAuthenticationButtonType,
  AppleAuthenticationButtonStyle,
  type AppleAuthResponse,
  type AppleAuthResult,
  type AppleAuthError,
} from './apple-auth';

// Auth Interceptor
export { AuthRequiredError, setupAuthInterceptors, setupSyncAuthInterceptors } from './auth-interceptor';
