import axiosStatic, { type AxiosInstance, type AxiosResponse } from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

export const baseURL = EXPO_PUBLIC_API_URL;

/**
 * Custom Error class for API related errors.
 * @param message - The error message.
 * @param status - The HTTP status code of the response.
 * @param code - A custom error code string.
 * @param data - The data associated with the error response.
 */
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

const handleResponse = (response: AxiosResponse) => {
  return response.data;
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

  throw new APIError('알 수 없는 에러가 발생했습니다', 0, 'UNKNOWN_ERROR', error);
};

const createAxiosInstance = (): AxiosInstance => {
  const instance = axiosStatic.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.response.use(handleResponse, handleError);

  return instance;
};

const apiClient = createAxiosInstance();

export default apiClient;
