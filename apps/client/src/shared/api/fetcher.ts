import axiosStatic, { type AxiosInstance, type AxiosResponse } from 'axios';
import { apiAxios, baseURL } from './axios-instances';
import { setupAuthInterceptors } from '@/shared/services/auth/auth-interceptor';
import { AuthRequiredError } from '@/shared/store/auth';

export { baseURL };

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

function isAxiosResponse(value: unknown): value is AxiosResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'config' in value &&
      'status' in value &&
      'headers' in value &&
      'data' in value,
  );
}

const unwrapResponseData = (response: unknown) => {
  // 재전송된 요청은 내부 response interceptor를 이미 통과했을 수 있다.
  if (isAxiosResponse(response)) {
    return response.data;
  }
  return response;
};

const handleError = (error: unknown) => {
  if (axiosStatic.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new APIError('요청 시간이 초과되었습니다', 408, 'REQUEST_TIMEOUT');
    }

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || '서버 에러가 발생했습니다.';
      const code = data?.code || 'SERVER_ERROR';
      throw new APIError(message, status, code, data);
    }

    throw new APIError('네트워크 에러가 발생했습니다', 0, 'NETWORK_ERROR', error);
  }

  if (error instanceof APIError) {
    throw error;
  }

  if (error instanceof AuthRequiredError) {
    throw error;
  }

  throw new APIError('알 수 없는 에러가 발생했습니다', 0, 'UNKNOWN_ERROR', error);
};

export const configureApiClient = (client: AxiosInstance) => {
  setupAuthInterceptors(client);
  client.interceptors.response.use(unwrapResponseData, handleError);

  return client;
};

const apiClient = configureApiClient(apiAxios);

export default apiClient;
