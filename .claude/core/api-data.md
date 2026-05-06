---
description: API & 데이터 페칭 아키텍처 - 현재 Noline의 @repo/schema, Entity/Data hook, React Query, Activation Router 기준을 정리합니다.
alwaysApply: true
---

# API 호출 및 데이터 페칭 가이드

- 이건 가이드로서 만약 구현되어 있지 않는다면 무조건적으로 따를 필요는 없다.
- 현재 클라이언트에는 `_libs/error`/`errorService`가 없다. 데이터 훅 예시는 기본 `Error` throw와 React Query error state 처리를 우선한다.

> 문서 상태: active source다. 다만 `MVP/Production` 표현은 구현 깊이 가이드일 뿐, 존재하지 않는 인프라를 기본으로 만들라는 뜻이 아니다. `user`, `interview`, 웹 폼 예시는 패턴 예시로 읽고, 실제 작업에서는 Noline의 Entity/Repository/Data hook과 React Native/Expo 구조로 번역한다.

---

## 0. 구현 깊이 가이드 (레벨별 가이드)

### 📊 구현 레벨 선택 (기본: MVP)

사용자가 명시하지 않으면 **MVP** 레벨 적용  
"production 레벨로" 명시하면 **Production** 레벨 적용

---

### 🟢 MVP Level (기본값)

**목표**: 빠른 구현, 작동하는 코드

**원칙**:

- ✅ 기존 구조가 있으면 → 따른다
- ✅ 기존 구조가 없으면 → 유연하게 구현 (스키마/검증 skip 가능)

**체크리스트**:

```
1. Zod 스키마 확인
   - @repo/schema에 있나?
   - ✅ 있으면 → 사용
   - ⚠️ 없으면 → 타입만 정의 (스키마 skip)

2. API 함수 작성
   - shared/api/ 에 작성
   - 기본 에러 처리 (try-catch)
   - fetch 또는 fetcher 사용

3. React Query hook (선택)
   - 간단하면 → 컴포넌트에서 직접 useQuery
   - 복잡하면 → shared/data/ 에 분리

📌 핵심: "작동하게 만들고, 있는 구조만 따른다"
```

**예시**:

```
사용자: "유저 정보 API 만들어줘"
→ MVP 레벨

AI 실행:
1. @repo/schema/user.ts 있나? → ❌ 없음
2. MVP니까 → 타입만 정의

결과:
// shared/api/user.ts
type UserInfo = { id: number; name: string; email: string };

export const fetchUserInfo = async (): Promise<UserInfo> => {
  const res = await fetch('/api/user');
  if (!res.ok) throw new Error('Failed');
  return res.json();
};

// 컴포넌트에서
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUserInfo,
});
```

---

### 🔴 Production Level

**목표**: 완전한 베스트 프랙티스, 타입 안전성

**원칙**:

- ✅ 기존 구조가 있으면 → 따른다
- ✅ 기존 구조가 없으면 → 만들어서라도 완벽하게

**체크리스트**:

```
1. Zod 스키마
   - @repo/schema에 있나?
   - ✅ 있으면 → 사용
   - ❌ 없으면 → 먼저 정의
     • Request/Response 스키마
     • z.infer로 타입 추론

2. Entity 5단계 레이어 구조 (2025-11)
   - entities/{entity}/model/ - 타입 정의 (z.infer로 추출)
   - entities/{entity}/api/ - Remote API 함수
   - entities/{entity}/lib/ - Local DataSource (SQLite)
   - entities/{entity}/repository/ - Router 패턴 (Local/Remote 분기)
   - entities/{entity}/data/ - Query keys + React Query hooks
   - index.ts - model/data만 public export

3. React Query hook
   - Repository 함수 사용 (직접 DB/API 접근 금지)
   - queryKey Factory 패턴
   - onError, onSuccess
   - staleTime, gcTime 설정

4. 문서화
   - JSDoc 주석
   - 사용 예시

📌 핵심: "완전한 타입 안전성과 5단계 계층 분리"
```

**예시**:

```
사용자: "유저 정보 API production 레벨로 만들어줘"
→ Production 레벨

AI 실행:
1. @repo/schema/user.ts 있나? → ❌ 없음
2. Production이니까 → 스키마부터 정의

결과:
// @repo/schema/user.ts
export const UserInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// shared/api/user.ts 또는 entities/user/api/user.ts
export const fetchUserInfo = async (): Promise<UserInfo> => {
  const response = await fetcher.get<UserInfo>('/api/user');
  const validated = UserInfoSchema.safeParse(response);

  if (!validated.success) {
    throw new Error('Invalid user data');
  }

  return validated.data;
};

// entities/user/data/useGetUserInfo.ts
export const useGetUserInfo = () => {
  return useQuery({
    queryKey: ['user', 'info'],
    queryFn: fetchUserInfo,
    staleTime: 5 * 60 * 1000,
  });
};
```

---

## 🏗️ 5단계 레이어 아키텍처 (2025-11)

```
┌─────────────────┐
│  React 컴포넌트  │ ← useGetUser() 사용
└────────┬────────┘
         │
┌────────▼────────┐
│  data/ (Hooks)  │ ← Query keys + React Query hooks
└────────┬────────┘
         │
┌────────▼────────┐
│  repository/    │ ← Router로 Local/Remote 분기
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌───────┐ ┌───────┐
│ lib/  │ │ api/  │ ← Local DB / Remote Server
└───┬───┘ └───┬───┘
    │         │
    ↓         ↓
┌───────┐ ┌───────┐
│SQLite │ │Server │
└───────┘ └───────┘
```

**타입 흐름:**

```text
@repo/schema (Zod) → model (z.infer) → repository → data hooks → components
```

## ✅ API 함수 작성 (api/)

API 함수는 관련된 비즈니스 도메인에 따라 위치를 결정합니다.

- **`entities/{entity}/api/`**: 특정 비즈니스 엔티티(예: `Trip`, `User`)에 직접적으로 관련된 API 함수가 위치합니다. 이는 높은 응집도를 유지하는 데 도움이 됩니다.
- **`shared/api/`**: 여러 도메인에 걸쳐 사용되거나 특정 엔티티에 속하지 않는 공용 API 함수(예: 파일 업로드)나 `fetcher` 인스턴스 자체가 위치합니다.

### 1. 기본 패턴

```ts
// entities/user/api/user.ts
import fetcher from '@/shared/api/fetcher';
import { LoginRequestSchema, LoginResponseSchema } from '@repo/schema/user';
import { z } from 'zod';

// ✅ DO: Zod로 타입 추론
type LoginRequest = z.infer<typeof LoginRequestSchema>;
type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ✅ DO: 명시적 타입 정의
export const fetchLogin = async (data: LoginRequest): Promise<LoginResponse> => {
  return fetcher.post<LoginResponse>('/api/user/login', data);
};

// ✅ DO: GET 요청
export const fetchUserInfo = async (): Promise<UserInfo> => {
  return fetcher.get<UserInfo>('/api/user/info');
};

// ✅ DO: 경로 파라미터
export const fetchUserById = async (userId: number): Promise<User> => {
  return fetcher.get<User>(`/api/user/${userId}`);
};

// ✅ DO: 쿼리 파라미터
export const fetchUsers = async (params: { page: number; limit: number }) => {
  return fetcher.get<UserList>(`/api/users?page=${params.page}&limit=${params.limit}`);
};

// ✅ DO: FormData 업로드
export const uploadProfileImage = async (formData: FormData): Promise<UploadResponse> => {
  return fetcher.post<UploadResponse>('/api/user/profile-image', formData);
};
```

### 2. 네이밍 규칙

```ts
// ✅ DO: fetch로 시작
export const fetchLogin = async () => {};
export const fetchUserList = async () => {};
export const fetchInterviewById = async (id: number) => {};

// ❌ DON'T: 모호한 네이밍
export const login = async () => {}; // ❌ API 호출인지 비즈니스 로직인지 불명확
export const getUser = async () => {}; // ❌ fetch 접두사 없음
```

## 🎣 엔티티 데이터 훅 작성 (entities/{entity}/data/)

React Query 훅은 API 함수와 강한 결합도를 가지므로, 관련된 엔티티 폴더 내에 API와 함께 위치시키는 것을 원칙으로 합니다. 이를 통해 데이터 로직의 응집도를 높이고 재사용성을 극대화합니다.

- **`entities/{entity}/data/`**: 특정 엔티티와 관련된 React Query 훅 (`useGetTrips`, `useCreateUser` 등)이 위치합니다.
- **`shared/hooks/`**: `useDebounce`, `useStep`과 같이 비즈니스 로직과 무관한 범용 훅이 위치합니다.

### 1. Query 패턴 (GET 요청)

```typescript
// entities/user/data/user.ts
import { useQuery } from '@tanstack/react-query';
import { fetchUserInfo } from '@/entities/user/api/user';
import { UserInfoResponseSchema } from '@repo/schema/user';

// ✅ DO: Query Key 패턴 정의
export const userQueryKeys = {
  base: ['user'] as const,
  info: () => [...userQueryKeys.base, 'info'] as const,
  detail: (id: number) => [...userQueryKeys.base, 'detail', id] as const,
  list: (filters: UserFilters) => [...userQueryKeys.base, 'list', filters] as const,
};

// ✅ DO: useQuery 훅
export const useGetUser = () => {
  return useQuery({
    queryKey: userQueryKeys.info(),
    queryFn: async () => {
      const response = await fetchUserInfo();

      // ✅ DO: Zod로 런타임 검증
      const parsedData = UserInfoResponseSchema.safeParse(response);

      if (parsedData.success) {
        return parsedData.data;
      } else {
        throw new Error(`회원 정보 조회에 실패했습니다: ${parsedData.error.message}`);
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// ✅ DO: 파라미터가 있는 경우
export const useGetUserById = (userId: number) => {
  return useQuery({
    queryKey: userQueryKeys.detail(userId),
    queryFn: async () => {
      const response = await fetchUserById(userId);
      const parsedData = UserSchema.safeParse(response);

      if (!parsedData.success) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      return parsedData.data;
    },
    enabled: userId > 0, // userId가 유효할 때만 실행
  });
};

// ✅ DO: useSuspenseQuery (Suspense 사용 시)
export const useSuspenseGetInterviewerList = () => {
  return useSuspenseQuery({
    queryKey: interviewerQueryKeys.all,
    queryFn: async () => {
      const response = await fetchInterviewerList();
      const parsedData = InterviewerListResponseSchema.safeParse(response);

      if (!parsedData.success) {
        throw new Error(`응답 구조가 일치하지 않습니다: ${parsedData.error.message}`);
      }

      return parsedData.data;
    },
  });
};
```

### 2. Mutation 패턴 (POST, PUT, DELETE)

```typescript
// ✅ DO: useMutation 훅
export const useCreateInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInterviewRequest) => {
      const response = await fetchCreateInterview(data);
      const validated = CreateInterviewResponseSchema.safeParse(response);

      if (!validated.success) {
        throw new Error('Invalid response');
      }

      return validated.data;
    },
    onSuccess: (data) => {
      // ✅ DO: 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: interviewQueryKeys.list(),
      });

      // ✅ DO: 성공 토스트
      addToast({
        title: '인터뷰 생성 완료',
        description: '인터뷰가 성공적으로 생성되었습니다.',
      });
    },
    onError: (error) => {
      // ✅ DO: 화면/호출부에서 React Query error state로 처리
      console.error('인터뷰 생성 실패:', error);
    },
  });
};

// 컴포넌트에서 사용
function CreateInterviewButton() {
  const { mutate, isPending } = useCreateInterview();

  const handleCreate = () => {
    mutate({ title: 'New Interview', category: 'frontend' });
  };

  return (
    <Button onClick={handleCreate} isLoading={isPending}>
      인터뷰 생성
    </Button>
  );
}
```

### 3. 네이밍 규칙

```typescript
// ✅ DO: Query는 useGet으로 시작
export const useGetUser = () => {};
export const useGetInterviewList = () => {};
export const useGetInterviewById = (id: number) => {};

// ✅ DO: Mutation은 동사로 시작
export const useCreateInterview = () => {};
export const useUpdateInterview = () => {};
export const useDeleteInterview = () => {};

// ✅ DO: Suspense는 useSuspense 접두사
export const useSuspenseGetInterviewerList = () => {};

// ❌ DON'T: 모호한 네이밍
export const useUser = () => {}; // ❌ GET인지 불명확
export const useInterview = () => {}; // ❌
```

## 🔒 에러 처리 패턴

```typescript
// ✅ DO: 계층별 에러 처리

// 1️⃣ fetcher에서 기본 에러 처리
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('인증이 필요합니다.');
    }
    throw new Error(errorData.message || `API 요청에 실패했습니다. (${response.status})`);
  }
  return response.json();
};

// 2️⃣ API 함수에서 Zod 검증
export const fetchLogin = async (data: LoginRequest) => {
  const response = await fetcher.post('/api/user/login', data);
  // fetcher에서 이미 기본 에러 처리됨
  return response;
};

// 3️⃣ React Query에서 추가 검증 및 변환
export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await fetchLogin(data);
      const validated = LoginResponseSchema.safeParse(response);

      if (!validated.success) {
        throw new Error(`응답 구조가 일치하지 않습니다: ${validated.error.message}`);
      }

      return validated.data;
    },
    onError: (error) => {
      console.error('로그인 실패:', error);
    },
  });
};

// 4️⃣ 컴포넌트에서 사용
function LoginForm() {
  const { mutate, isPending, error } = useLogin();

  const handleSubmit = (data: LoginRequest) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 에러는 React Query error state로 처리 */}
      <Button type="submit" isLoading={isPending}>
        로그인
      </Button>
    </form>
  );
}
```

## 🚫 절대 금지 사항

```typescript
// ❌ 1. 컴포넌트에서 직접 fetch 사용
function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/user')  // ❌ 절대 금지
      .then(res => res.json())
      .then(setData);
  }, []);
}

// ✅ DO: React Query 훅 사용
function Component() {
  const { data } = useGetUser();
  return <div>{data?.name}</div>;
}

// ❌ 2. 검증 없이 response 사용
export const fetchUser = async () => {
  const response = await fetcher.get('/api/user');
  return response;  // ❌ 검증 없음
};

// ✅ DO: Zod로 검증
export const fetchUser = async () => {
  const response = await fetcher.get('/api/user');
  const validated = UserSchema.safeParse(response);
  if (!validated.success) throw new Error('Invalid user data');
  return validated.data;
};

// ❌ 3. Query Key 하드코딩
useQuery({
  queryKey: ['user', 'info'],  // ❌ 하드코딩
  // ...
});

// ✅ DO: Query Key Factory 사용
useQuery({
  queryKey: userQueryKeys.info(),  // ✅
  // ...
});

// ❌ 4. mutate 직접 await (비추천)
const { mutateAsync } = useMutation({ /* ... */ });
await mutateAsync(data);  // ❌ 동기적 처리 필요한 경우만

// ✅ DO: mutate + onSuccess 사용 (권장)
const { mutate } = useMutation({
  mutationFn: createUser,
  onSuccess: (data) => {
    router.push(`/user/${data.id}`);
  },
});
mutate(userData);
```

## 📋 Query Key 관리 패턴

```typescript
// ✅ DO: 계층적 Query Key 구조
export const queryKeys = {
  // 사용자 관련
  user: {
    base: ['user'] as const,
    info: () => [...queryKeys.user.base, 'info'] as const,
    detail: (id: number) => [...queryKeys.user.base, 'detail', id] as const,
  },

  // 인터뷰 관련
  interview: {
    base: ['interview'] as const,
    list: (filters?: InterviewFilters) => [...queryKeys.interview.base, 'list', filters] as const,
    detail: (id: number) => [...queryKeys.interview.base, 'detail', id] as const,
    contents: (id: number) => [...queryKeys.interview.base, 'detail', id, 'contents'] as const,
  },
};

// 사용 예시
useQuery({
  queryKey: queryKeys.interview.detail(interviewId),
  queryFn: () => fetchInterview(interviewId),
});

// 캐시 무효화
queryClient.invalidateQueries({
  queryKey: queryKeys.interview.list(), // 모든 리스트 무효화
});
```

## 🎯 최적화 패턴

```typescript
// ✅ DO: Prefetching
export const usePrefetchUser = () => {
  const queryClient = useQueryClient();

  return (userId: number) => {
    queryClient.prefetchQuery({
      queryKey: userQueryKeys.detail(userId),
      queryFn: () => fetchUserById(userId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// 사용
function UserListItem({ userId }: Props) {
  const prefetchUser = usePrefetchUser();

  return (
    <div onMouseEnter={() => prefetchUser(userId)}>
      {/* User Item */}
    </div>
  );
}

// ✅ DO: Optimistic Update
export const useUpdateInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInterview,
    onMutate: async (newData) => {
      // 이전 데이터 백업
      await queryClient.cancelQueries({
        queryKey: interviewQueryKeys.detail(newData.id),
      });

      const previousData = queryClient.getQueryData(
        interviewQueryKeys.detail(newData.id)
      );

      // Optimistic Update
      queryClient.setQueryData(
        interviewQueryKeys.detail(newData.id),
        newData
      );

      return { previousData };
    },
    onError: (err, newData, context) => {
      // 롤백
      queryClient.setQueryData(
        interviewQueryKeys.detail(newData.id),
        context?.previousData
      );
    },
  });
};
```

## 🔄 재시도 전략

```typescript
// ✅ DO: 재시도 설정
export const useGetUser = () => {
  return useQuery({
    queryKey: userQueryKeys.info(),
    queryFn: fetchUserInfo,
    retry: (failureCount, error) => {
      // 인증 실패는 재시도하지 않음
      if (error instanceof Error && error.message.includes('인증')) return false;
      // 최대 3번까지 재시도
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```
