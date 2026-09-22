import { authAxios } from '@/shared/api/axios-instances';
import { refreshTokenResponse } from '@repo/schema/responses/auth';
import { z } from 'zod';

export type RefreshResponse = z.infer<typeof refreshTokenResponse>['data'];

/** 인증 인터셉터를 거치지 않고 현재 세션의 refresh token을 교환한다. */
export async function refreshTokens(refreshToken: string, deviceInfo?: string): Promise<RefreshResponse> {
  if (!refreshToken) {
    throw new Error('Refresh Token이 없습니다');
  }

  const response = await authAxios.post('/api/auth/refresh', { refreshToken, deviceInfo });
  return refreshTokenResponse.parse(response.data).data;
}
