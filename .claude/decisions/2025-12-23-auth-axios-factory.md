# Auth Axios Factory 패턴

## 상태

**채택** (2025-12-23)

## 맥락

Google/Apple OAuth 인증 시스템 구현 중 Auth Interceptor에서 순환 참조 발생:

```
fetcher.ts → auth-interceptor.ts → auth-api.ts → fetcher.ts
     ↑__________________________________________________|
```

**문제 상황**:

- `fetcher.ts`: apiClient 생성 + auth interceptor 설정
- `auth-interceptor.ts`: 401 에러 시 토큰 갱신 필요
- `auth-api.ts`: 토큰 갱신 API 호출 (apiClient 필요)
- 결과: 순환 참조로 런타임 에러

## 결정

**Axios Instance Factory 패턴** 채택

### 해결 방법

1. `axios-instances.ts` 생성 (`shared/api/`)
2. 두 개의 독립적 인스턴스:
   - `authAxios`: 인터셉터 없음 (auth 전용)
   - `apiAxios`: 인터셉터 적용 대상

### 파일 구조

```
shared/api/
  axios-instances.ts  # 인스턴스 생성 (인터셉터 없음)
  fetcher.ts          # apiAxios + 인터셉터 설정

shared/services/auth/
  auth-api.ts         # authAxios 사용 (순환 참조 방지)
  auth-interceptor.ts # 인터셉터 로직 (refreshTokens import 가능)
```

### 코드 예시

```typescript
// shared/api/axios-instances.ts
export const authAxios = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const apiAxios = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
```

```typescript
// shared/services/auth/auth-api.ts
import { authAxios } from '@/shared/api/axios-instances';

export async function refreshTokens(): Promise<RefreshResponse> {
  const response = await authAxios.post('/api/auth/refresh', { refreshToken });
  return response.data;
}
```

```typescript
// shared/api/fetcher.ts
import { apiAxios } from './axios-instances';
import { setupAuthInterceptors } from '@/shared/services/auth/auth-interceptor';

setupAuthInterceptors(apiAxios); // 순환 참조 없음
```

## 대안

### 1. 지연 import (Dynamic Import)

```typescript
// auth-interceptor.ts
const { refreshTokens } = await import('./auth-api');
```

- ❌ 복잡도 증가
- ❌ 비동기 처리 필요
- ❌ 타입 추론 어려움

### 2. 전역 axios 인스턴스

```typescript
// 모든 곳에서 axios 직접 사용
axios.defaults.baseURL = EXPO_PUBLIC_API_URL;
```

- ❌ 인터셉터 분리 어려움
- ❌ 테스트 어려움
- ❌ 설정 충돌 가능

### 3. 의존성 주입

```typescript
// auth-api.ts
export function createAuthApi(axiosInstance: AxiosInstance) { ... }
```

- ❌ 과도한 추상화
- ❌ 모든 호출 지점에서 인스턴스 전달 필요

## 결과

- ✅ 순환 참조 해결
- ✅ 명확한 책임 분리 (`authAxios` vs `apiAxios`)
- ✅ 테스트 용이성 향상 (인스턴스 모킹 가능)
- ✅ 코드 변경 최소화 (기존 구조 유지)

## 관련 파일

- `apps/client/src/shared/api/axios-instances.ts` (신규)
- `apps/client/src/shared/api/fetcher.ts` (수정)
- `apps/client/src/shared/services/auth/auth-api.ts` (수정)
- `apps/client/src/shared/services/auth/auth-interceptor.ts` (수정)

## 추가 고려사항

### syncApiClient는 분리 유지

`sync/api.ts`의 `syncApiClient`는 별도 유지:

- 15초 타임아웃 (일반 API는 10초)
- 5xx 에러 시 자동 재시도 (최대 3회, Exponential Backoff)
- 401 에러 시 토큰 갱신 없이 `AuthRequiredError` throw (sync_queue PENDING 유지)

```typescript
// sync/api.ts - 별도 인스턴스 유지
const syncApiClient = axios.create({
  baseURL: EXPO_PUBLIC_API_URL,
  timeout: 15000, // 15초
});
```
