---
description: 에러 처리 상세 가이드 - 현재 Noline의 서버 AppError/errorHandler, 클라이언트 React Query/PolicyErrorDisplay 기준과 확장 후보를 구분합니다.
alwaysApply: false
---

# 에러 처리 상세 가이드

> 현재 기준:
>
> - 서버 에러 인프라: `apps/server/src/middleware/errorHandler.ts`의 `AppError`와 `errorHandler`.
> - 클라이언트 정책/권한 에러 UI: `apps/client/src/shared/components/ErrorBoundary/PolicyErrorDisplay.tsx`.
> - 클라이언트에는 현재 `_libs/error/`, 중앙 `errorService`, 클래스형 `ErrorBoundary` 인프라가 없다.
>
> 아래의 `_libs/error`, `errorService`, 커스텀 클라이언트 에러 클래스 예시는 **확장 후보/설계 블루프린트**다. 명시 요청 없이 현재 구현 기준으로 새 인프라를 만들지 않는다.

---

## 0. 구현 깊이 가이드 (현재 구현 우선)

### 📊 구현 레벨 선택 (기본: MVP)

사용자가 명시하지 않으면 **현재 구현 레벨**을 적용한다.  
"production 레벨로", "중앙 에러 인프라까지"처럼 명시하면 아래 확장 후보를 검토한다.

---

### 🟢 현재 구현 Level (기본값)

**목표**: 빠른 구현, 기본 에러 처리

**원칙**:

- ✅ 서버에서는 기존 `AppError`/`errorHandler`를 따른다
- ✅ 클라이언트에서는 React Query error state, `throw new Error(...)`, 정책 UI(`PolicyErrorDisplay`)를 우선한다
- ✅ 존재하지 않는 `_libs/error`/`errorService`를 기본 작업에서 새로 만들지 않는다

**체크리스트**:

```
1. 위치 확인
   - 서버 라우터/미들웨어인가? → AppError/errorHandler 사용
   - 클라이언트 정책 위반인가? → PolicyErrorDisplay 사용
   - React Query 데이터 훅인가? → queryFn에서 Error throw, 화면에서 error state 처리

2. 기본 패턴
   - try-catch가 필요한 경계에서만 사용
   - console.error는 개발/진단용으로 제한
   - 기본 Error 객체 또는 기존 도메인 에러 사용
   - 사용자 메시지는 화면/정책 컴포넌트에서 결정

📌 핵심: "현재 존재하는 인프라를 따르고, 새 중앙 에러 계층은 별도 작업으로 둔다"
```

**예시**:

```
사용자: "유저 API에 에러 처리 추가해줘"
→ MVP 레벨

AI 실행:
1. 서버/클라이언트 위치 확인
2. 현재 구현 레벨이므로 기본 Error + React Query 상태 사용

결과:
export const fetchUser = async (id: number) => {
  try {
    const res = await fetch(`/api/user/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  } catch (error) {
    console.error('User fetch error:', error);
    throw error;
  }
};

// React Query
const { data, error } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
});

if (error) {
  return <Text>에러가 발생했습니다</Text>;
}
```

---

### 🔴 확장 후보 Level (명시 요청 시)

**목표**: 완전한 에러 처리 시스템

**원칙**:

- ✅ 기존 에러 인프라가 있으면 → 따른다
- ✅ 클라이언트 중앙 에러 계층이 실제로 필요하면 → 별도 설계/결정 기록 후 구축

**체크리스트**:

```
1. 에러 인프라 확인
   - _libs/error/ 있나?

   ✅ 있으면 → 사용
   ❌ 없으면 → 바로 만들지 말고 필요성과 범위를 먼저 확인
     • AppError 기본 클래스
     • APIError, AuthError, ValidationError 등
     • errorService (중앙 처리)

2. 커스텀 에러 클래스
   - 계층별 에러 클래스 사용
   - 상세한 에러 정보 (code, data, reset)

3. errorService
   - 중앙 에러 처리
   - 사용자 친화적 메시지 변환
   - 에러 로깅/트래킹

4. UI 에러 처리
   - ErrorBoundary
   - toast 알림
   - 재시도 로직

📌 핵심: "완전한 에러 처리 시스템은 기본값이 아니라 명시적 확장 작업"
```

**예시**:

```
사용자: "유저 API에 production 레벨 에러 처리 추가해줘"
→ Production 레벨

AI 실행:
1. errorService 있나? → ❌ 없음
2. 명시 요청이 있으므로 → 설계/결정 기록 후 인프라 구축 검토

결과:
// 1. _libs/error/errors/AppError.ts 생성
// 2. _libs/error/errors/APIError.ts 생성
// 3. _libs/error/service.ts 생성

// shared/api/user.ts
export const fetchUser = async (id: number) => {
  try {
    const response = await fetcher.get(`/api/user/${id}`);
    const validated = UserSchema.safeParse(response);

    if (!validated.success) {
      throw new ValidationError({
        message: '사용자 정보가 올바르지 않습니다.',
        data: validated.error,
      });
    }

    return validated.data;
  } catch (error) {
    if (error instanceof NetworkError) {
      throw error;
    }

    throw new APIError({
      message: '사용자 정보를 불러올 수 없습니다.',
      code: 'USER_FETCH_FAILED',
    });
  }
};

// React Query
const { data } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
  onError: (error) => {
    errorService.handle(error, {
      type: 'toast',
      title: '오류',
    });
  },
});
```

---

## 🎯 에러 처리 원칙

1. **계층별 역할 분담**: 각 계층은 자신의 역할에 맞는 에러만 처리합니다.
2. **타입 안전한 에러**: 커스텀 에러 클래스 사용
3. **사용자 친화적 메시지**: 기술적 에러를 사용자가 이해할 수 있는 메시지로 변환
4. **일관된 에러 형식**: 프로젝트 전체에서 동일한 에러 구조 사용

## 📁 에러 파일 구조

```
src/libs/error/
├── errors/
│   ├── AppError.ts                   # 기본 에러 클래스
│   ├── APIError.ts                   # API 에러
│   ├── AuthError.ts                  # 인증 에러
│   ├── NetworkError.ts               # 네트워크 에러
│   ├── ValidationError.ts            # 검증 에러
│   ├── ClientServerMismatchedError.ts # 응답 불일치 에러
│   └── index.ts                      # Export
├── service.ts                         # 에러 서비스 (중앙 처리)
└── types.ts                          # 에러 타입
```

## ✅ 커스텀 에러 클래스 (DO)

### 1. 기본 AppError

```typescript
// _libs/error/errors/AppError.ts
export type AppErrorParams<TData = unknown> = {
  message: string;
  code?: string;
  data?: TData;
  reset?: () => void;
};

export class AppError<TData = unknown> extends Error {
  public code?: string;
  public data?: TData;
  public reset?: () => void;

  constructor({ message, code, data, reset }: AppErrorParams<TData>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.data = data;
    this.reset = reset;

    // Stack trace 유지
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

### 2. API 에러

```typescript
// _libs/error/errors/APIError.ts
import { AppError, AppErrorParams } from './AppError';

export interface APIErrorParams<TData = unknown> extends AppErrorParams<TData> {
  status?: number;
}

export class APIError<TData = unknown> extends AppError<TData> {
  public status?: number;

  constructor({ message, status, code, data, reset }: APIErrorParams<TData>) {
    super({ message, code, data, reset });
    this.name = 'APIError';
    this.status = status;
  }
}
```

### 3. 인증 에러

```typescript
// _libs/error/errors/AuthError.ts
import { APIError, APIErrorParams } from './APIError';

export class AuthError<TData = unknown> extends APIError<TData> {
  constructor({ message = '인증이 필요합니다.', code = 'UNAUTHORIZED', data, reset }: AppErrorParams<TData>) {
    super({ message, status: 401, code, data, reset });
    this.name = 'AuthError';
  }
}
```

### 4. 네트워크 에러

```typescript
// _libs/error/errors/NetworkError.ts
import { AppError, AppErrorParams } from './AppError';

export class NetworkError<TData = unknown> extends AppError<TData> {
  constructor({
    message = '네트워크 연결을 확인해주세요.',
    code = 'NETWORK_ERROR',
    data,
    reset,
  }: AppErrorParams<TData>) {
    super({ message, code, data, reset });
    this.name = 'NetworkError';
  }
}
```

### 5. 검증 에러

```typescript
// _libs/error/errors/ValidationError.ts
import { APIError, APIErrorParams } from './APIError';

export class ValidationError<TData = unknown> extends APIError<TData> {
  constructor({
    message = '입력값이 올바르지 않습니다.',
    code = 'VALIDATION_ERROR',
    data,
    reset,
  }: AppErrorParams<TData>) {
    super({ message, status: 400, code, data, reset });
    this.name = 'ValidationError';
  }
}
```

### 6. 클라이언트-서버 불일치 에러

```typescript
// _libs/error/errors/ClientServerMismatchedError.ts
import { AppError, AppErrorParams } from './AppError';

export class ClientServerMismatchedError<TData = unknown> extends AppError<TData> {
  constructor({
    message = '서버 응답 형식이 올바르지 않습니다.',
    code = 'RESPONSE_MISMATCH',
    data,
    reset,
  }: AppErrorParams<TData>) {
    super({ message, code, data, reset });
    this.name = 'ClientServerMismatchedError';
  }
}
```

## 🛠️ 에러 서비스 (중앙 처리)

```typescript
// _libs/error/service.ts
import { useToastStore } from '@repo/store/useToastStore';
import { useAlertDialogStore } from '@repo/store/useAlertDialogStore';
import { AppError } from './errors';

type ErrorHandlerType = 'toast' | 'alert' | 'console';

interface ErrorHandlerOptions {
  type: ErrorHandlerType;
  title?: string;
  description?: string;
}

class ErrorService {
  /**
   * 에러를 처리하고 사용자에게 표시합니다.
   */
  handle(error: unknown, options: ErrorHandlerOptions) {
    const { type, title, description } = options;

    // 에러 메시지 추출
    const errorMessage = this.extractMessage(error);
    const finalDescription = description || errorMessage;

    // 타입별 처리
    switch (type) {
      case 'toast':
        useToastStore.getState().addToast({
          title: title || '오류',
          description: finalDescription,
          duration: 5000,
        });
        break;

      case 'alert':
        useAlertDialogStore.getState().open({
          title: title || '오류',
          description: finalDescription,
        });
        break;

      case 'console':
        console.error(title || 'Error:', finalDescription);
        break;
    }

    // 로깅 (프로덕션 환경에서는 외부 로깅 서비스로)
    if (process.env.NODE_ENV === 'production') {
      this.logError(error);
    } else {
      console.error('Error details:', error);
    }
  }

  /**
   * 에러에서 사용자 친화적 메시지 추출
   */
  private extractMessage(error: unknown): string {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return '알 수 없는 오류가 발생했습니다.';
  }

  /**
   * 에러 로깅 (프로덕션 환경)
   */
  private logError(error: unknown) {
    // TODO: 외부 로깅 서비스 (Sentry, LogRocket 등)
    console.error('Production error:', error);
  }
}

export const errorService = new ErrorService();
```

## 📦 계층별 에러 처리

### 1. Fetcher (HTTP 클라이언트)

```typescript
// _apis/fetcher.ts
import { APIError, AuthError, NetworkError } from '@/_libs/error/errors';

const handleResponse = async (response: Response) => {
  const isJSON = response.headers.get('content-type')?.includes('application/json');

  // ✅ DO: 상태 코드별 에러 처리
  if (!response.ok) {
    const errorData = isJSON ? await response.json() : { message: await response.text() };

    // 인증 에러
    if (response.status === 401) {
      throw new AuthError({
        data: errorData,
        message: errorData.message || '인증이 필요합니다.',
      });
    }

    // 권한 에러
    if (response.status === 403) {
      throw new APIError({
        message: errorData.message || '접근 권한이 없습니다.',
        status: 403,
        code: 'FORBIDDEN',
        data: errorData,
      });
    }

    // 404 에러
    if (response.status === 404) {
      throw new APIError({
        message: errorData.message || '리소스를 찾을 수 없습니다.',
        status: 404,
        code: 'NOT_FOUND',
        data: errorData,
      });
    }

    // 일반 API 에러
    throw new APIError({
      message: errorData.message || 'API 요청에 실패했습니다.',
      status: response.status,
      data: errorData,
    });
  }

  return isJSON ? await response.json() : response.text();
};

const request = async <T>(url: string, options: RequestConfig = {}): Promise<T> => {
  try {
    const controller = createAbortController(options.timeout || 10000);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return handleResponse(response);
  } catch (error) {
    // ✅ DO: 이미 변환된 에러는 그대로 던지기
    if (error instanceof APIError) {
      throw error;
    }

    // ✅ DO: AbortError 처리
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError({
        message: '요청 시간이 초과되었습니다.',
        status: 408,
        code: 'REQUEST_TIMEOUT',
        data: error,
      });
    }

    // ✅ DO: 네트워크 에러
    if (error instanceof Error) {
      throw new NetworkError({
        message: '네트워크 연결을 확인해주세요.',
        data: error,
      });
    }

    // 알 수 없는 에러
    throw new APIError({
      message: '알 수 없는 에러가 발생했습니다.',
      status: 0,
      data: error,
    });
  }
};
```

### 2. React Query (데이터 계층)

```typescript
// _data/user.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchLogin } from '@/_apis/user';
import { LoginResponseSchema } from '@repo/schema/user';
import { ClientServerMismatchedError } from '@/_libs/error/errors';
import { errorService } from '@/_libs/error/service';

// ✅ DO: Query에서 추가 검증
export const useGetUser = () => {
  return useQuery({
    queryKey: ['user', 'info'],
    queryFn: async () => {
      try {
        const response = await fetchUserInfo();

        // Zod 검증
        const result = UserInfoResponseSchema.safeParse(response);

        if (result.success) {
          return result.data;
        } else {
          throw new ClientServerMismatchedError({
            data: result.error,
            message: '서버 응답 형식이 올바르지 않습니다.',
          });
        }
      } catch (error) {
        // 에러 로깅
        console.error('User fetch error:', error);
        throw error; // React Query가 처리
      }
    },
    retry: (failureCount, error) => {
      // AuthError는 재시도하지 않음
      if (error instanceof AuthError) return false;
      return failureCount < 3;
    },
  });
};

// ✅ DO: Mutation에서 onError 처리
export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await fetchLogin(data);
      const validated = LoginResponseSchema.safeParse(response);

      if (!validated.success) {
        throw new ClientServerMismatchedError({
          data: validated.error,
        });
      }

      return validated.data;
    },
    onSuccess: (data) => {
      router.push('/dashboard');
    },
    onError: (error) => {
      // ✅ errorService로 중앙 처리
      errorService.handle(error, {
        type: 'toast',
        title: '로그인 실패',
      });
    },
  });
};
```

### 3. 컴포넌트 (UI 계층)

```typescript
// ✅ DO: try-catch로 동기 에러 처리
export default function LoginForm() {
  const { mutate, isPending } = useLogin();

  const handleSubmit = async (data: LoginRequest) => {
    try {
      mutate(data);  // onError에서 처리됨
    } catch (error) {
      // 동기 에러 처리 (거의 발생하지 않음)
      errorService.handle(error, {
        type: 'toast',
        title: '로그인 실패',
        description: '예상치 못한 오류가 발생했습니다.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" isLoading={isPending}>
        로그인
      </Button>
    </form>
  );
}

// ✅ DO: Error Boundary로 런타임 에러 캐치
export default function RootLayout({ children }: Props) {
  return (
    <ErrorBoundary
      fallback={<ErrorPage />}
      onError={(error) => {
        errorService.handle(error, {
          type: 'console',
          title: 'Runtime Error',
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 🚫 절대 금지 사항 (DON'T)

```typescript
// ❌ 1. 에러 무시하기 (빈 catch 블록)
try {
  await riskyOperation();
} catch (error) {
  // ❌ 에러를 무시하면 디버깅이 불가능해집니다.
}

// ✅ DO: 최소한 로깅
try {
  await fetchData();
} catch (error) {
  console.error('Data fetch failed:', error);
  throw error;  // 또는 적절한 처리
}

// ❌ 2. 문자열 throw
if (!user) {
  throw '사용자를 찾을 수 없습니다.';  // ❌
}

// ✅ DO: Error 객체 throw
if (!user) {
  throw new APIError({
    message: '사용자를 찾을 수 없습니다.',
    status: 404,
  });
}

// ❌ 3. 기술적 에러 메시지 그대로 표시
catch (error) {
  alert(error.stack);  // ❌ 사용자에게 stack trace 표시
}

// ✅ DO: 사용자 친화적 메시지
catch (error) {
  errorService.handle(error, {
    type: 'toast',
    title: '오류',
    description: '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  });
}

// ❌ 4. 에러 타입 체크 없이 처리
catch (error) {
  console.log(error.message);  // ❌ error가 Error 인스턴스인지 불명확
}

// ✅ DO: 타입 가드 사용
catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log('Unknown error:', error);
  }
}

// ❌ 5. 비동기 에러 처리 누락
const fetchData = async () => {
  const response = await fetch('/api/data');  // ❌ 에러 처리 없음
  return response.json();
};

// ✅ DO: try-catch 추가
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new APIError({ status: response.status });
    return response.json();
  } catch (error) {
    errorService.handle(error, { type: 'console' });
    throw error;
  }
};
```

## 🎯 에러 경계 (Error Boundary)

```typescript
// _components/layout/error/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

## ✅ 체크리스트

- [ ] 모든 async 함수에 try-catch 또는 .catch() 사용
- [ ] 커스텀 에러 클래스 사용 (문자열 throw 금지)
- [ ] 에러는 errorService로 중앙 처리
- [ ] 사용자 친화적 에러 메시지 제공
- [ ] React Query onError에서 에러 처리
- [ ] Error Boundary로 런타임 에러 캐치
- [ ] 프로덕션 환경에서 에러 로깅
- [ ] 민감 정보는 에러 메시지에 포함하지 않기
