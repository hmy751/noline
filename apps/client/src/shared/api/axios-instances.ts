import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

export const baseURL = EXPO_PUBLIC_API_URL;

// ========================================
// Auth Axios (인터셉터 없음)
// ========================================

/**
 * Auth 전용 Axios 인스턴스
 * - 인터셉터 없음 (순환 참조 방지)
 * - /auth/login, /auth/refresh 등에서 사용
 */
export const authAxios = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ========================================
// API Axios (인터셉터 적용 대상)
// ========================================

/**
 * 일반 API용 Axios 인스턴스
 * - Auth 인터셉터 적용 (fetcher.ts에서 설정)
 * - trips, schedules, expenses 등에서 사용
 */
export const apiAxios = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
