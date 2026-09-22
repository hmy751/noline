export { type UserInfo } from './token-storage';

// Auth API
export {
  loginWithGoogle,
  loginWithApple,
  refreshTokens,
  logout,
  revokeRefreshToken,
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
export { setupAuthInterceptors, setupSyncAuthInterceptors } from './auth-interceptor';
export { AuthRequiredError } from '@/shared/store/auth';

// Logout Service
export {
  performLogout,
  forceLogout,
  performDeleteAccount,
  forceDeleteAccount,
  checkPendingSync,
  type LogoutOptions,
  type LogoutResult,
} from './logout-service';
