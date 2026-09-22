import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const SESSION_KEY = 'noline_session';
const LEGACY_KEYS = [
  'noline_user_id',
  'noline_access_token',
  'noline_refresh_token',
  'noline_user_name',
  'noline_user_email',
  'noline_user_profile_image',
];
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

const userInfoSchema = z.object({
  name: z.string(),
  email: z.string(),
  profileImageUrl: z.string().nullable(),
});
const sessionSchema = z.object({
  version: z.literal(1),
  userId: z.string().min(1),
  accessToken: z.string().min(1).nullable(),
  refreshToken: z.string().min(1).nullable(),
  userInfo: userInfoSchema.nullable(),
});

export type UserInfo = z.infer<typeof userInfoSchema>;
export type DeviceSession = z.infer<typeof sessionSchema>;
export type LoginData = Pick<DeviceSession, 'userId'> & {
  accessToken: string;
  refreshToken: string;
  userInfo?: UserInfo;
};
export type Tokens = Pick<LoginData, 'accessToken' | 'refreshToken'>;

/** 로그인 성공으로 만들어진 계정 기록과 자격 증명을 하나의 값으로 저장한다. */
export async function saveAuthData(session: DeviceSession): Promise<void> {
  const validated = sessionSchema.parse(session);
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(validated), OPTIONS);
}

export async function getAuthData(): Promise<DeviceSession | null> {
  const stored = await SecureStore.getItemAsync(SESSION_KEY);
  if (stored !== null) {
    return sessionSchema.parse(JSON.parse(stored));
  }

  // 이전 버전의 사용자+토큰 쌍만 복원한다. 부분 기록에서 계정을 추정하지 않는다.
  const [userId, accessToken, refreshToken, name, email, profileImageUrl] = await Promise.all(
    LEGACY_KEYS.map((key) => SecureStore.getItemAsync(key)),
  );
  if ([userId, accessToken, refreshToken, name, email, profileImageUrl].every((value) => value === null)) {
    return null;
  }
  if (!userId || (!accessToken && !refreshToken)) {
    throw new Error('저장된 인증 정보가 불완전합니다');
  }

  return sessionSchema.parse({
    version: 1,
    userId,
    accessToken,
    refreshToken,
    userInfo: name && email ? { name, email, profileImageUrl } : null,
  });
}

export async function clearAuthData(): Promise<void> {
  // 새 레코드를 먼저 지우면 남아 있던 이전 버전의 토큰이 복원될 수 있다.
  await Promise.all(LEGACY_KEYS.map((key) => SecureStore.deleteItemAsync(key)));
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
