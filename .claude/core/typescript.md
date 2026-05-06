---
globs: '*.ts,*.tsx'
description: TypeScript 코드 스타일 & 모범 사례 - interface와 type 사용법, 타입 안전성 패턴, 에러 처리 타입, 일관된 TypeScript 개발을 위한 DO/DON'T 가이드라인을 정의합니다.
---

# TypeScript 코드 스타일 가이드

> 문서 상태: active source다. TypeScript/Zod 스타일의 현재 기준으로 읽되, 예시는 React Native/Expo 프로젝트 구조에 맞춰 번역한다.

## ✅ 타입 정의 규칙 (DO)

### 1. interface vs type 사용 기준

**기본 선택: `type` 사용**

`type`을 사용하는 경우:

- ✅ 모든 컴포넌트 props: `type ButtonProps = {...}`
- ✅ Union 타입: `type Status = 'idle' | 'loading' | 'success'`
- ✅ Utility 타입 조합: `type PartialUser = Partial<User>`
- ✅ 함수 시그니처: `type Handler = (id: number) => void`

`interface`를 사용하는 경우:

- ⚠️ 외부 라이브러리 확장이 필요한 경우만 (Declaration Merging)
- ⚠️ 객체 지향 패턴에서 클래스 구현이 필요한 경우

**판단 규칙**: 특별한 이유가 없으면 `type` 사용.

### 2. 명시적 타입 정의

```typescript
// ✅ DO: 함수 파라미터는 명시적 타입
function processUser(user: UserData): ProcessedUser {
  return { ...user, processed: true };
}

// ✅ DO: 복잡한 반환값은 명시적 타입
const fetchUser = async (id: number): Promise<User> => {
  const response = await fetcher.get(`/api/user/${id}`);
  return UserSchema.parse(response);
};

// ❌ DON'T: any 사용 (불가피한 경우 unknown을 활용하며 그래도 안될 경우는 반드시 주석 필수)
function processData(data: any) {
  // ❌
  return data.value;
}
```

### 3. 선택적 프로퍼티

```typescript
// ✅ DO: 선택적 프로퍼티는 ? 사용
interface ButtonProps {
  variant?: 'primary' | 'secondary'; // 기본값 있음
  size?: 'sm' | 'md' | 'lg'; // 기본값 있음
  children: React.ReactNode; // 필수
}

// ✅ DO: 기본값 설정
function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  // ...
}
```

## 💡 타입 안전성 보장 방법

### ✅ 권장: 안전한 타입 검증

```typescript
// ✅ DO: Optional chaining으로 안전하게 접근
if (data?.value?.nested) {
  const value = data.value.nested; // 타입 안전
}

// ✅ DO: Zod로 런타임 검증
const validatedData = UserSchema.safeParse(response);
if (validatedData.success) {
  const user = validatedData.data; // 검증된 타입
}

// ✅ DO: 타입 가드 함수 사용
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

if (isUser(data)) {
  console.log(data.email); // 타입 안전
}
```

## 📦 @repo/schema 타입 사용 규칙

### ✅ Schema Import & z.infer 패턴 (필수)

**@repo/schema에서는 schema만 export하며, 타입은 export하지 않습니다.**

```typescript
// ✅ DO: schema를 import하고 z.infer로 타입 추론
import { userEntity } from '@repo/schema/entities/user';
import { z } from 'zod';

type User = z.infer<typeof userEntity>;

// 사용
const user: User = {
  id: '01HXXX...',
  username: 'john',
  // ...
};
```

```typescript
// ❌ DON'T: 타입을 직접 import (불가능)
import { type User } from '@repo/schema/entities/user'; // ❌ export되지 않음
```

### 이유

- **Single Source of Truth**: Schema가 유일한 타입의 출처
- **타입 불일치 방지**: Schema와 타입이 항상 동기화됨
- **런타임 검증 보장**: z.infer는 런타임 검증과 타입이 완전히 일치함을 보장

### 실전 예시

```typescript
// ✅ Entity 타입 사용
import { tripEntity, scheduleEntity, expenseEntity } from '@repo/schema/entities';
import { z } from 'zod';

type Trip = z.infer<typeof tripEntity>;
type Schedule = z.infer<typeof scheduleEntity>;
type Expense = z.infer<typeof expenseEntity>;

// ✅ Request 타입 사용
import { createTripRequest, updateTripRequest } from '@repo/schema/requests/trip';

type CreateTripRequest = z.infer<typeof createTripRequest>;
type UpdateTripRequest = z.infer<typeof updateTripRequest>;

// ✅ Response 타입 사용
import { tripListResponse } from '@repo/schema/responses/trip';

type TripListResponse = z.infer<typeof tripListResponse>;
```

### ❌ 피해야 할 패턴

```typescript
// ❌ DON'T: any 타입 남용 (타입 안전성 상실)
const data: any = fetchData();

// ❌ DON'T: 타입 단언 남용 (검증 없이 단언)
const user = response as User;

// ❌ DON'T: non-null assertion 남용 (null 체크 생략)
const value = data!.value!.nested!;
```

**판단 기준**: any, as, ! 사용 전에 위의 안전한 방법을 먼저 검토하세요.

## 📦 Import 순서 (필수)

```typescript
// 1️⃣ React, React Native, Expo
import { useState, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

// 2️⃣ 외부 라이브러리 (알파벳 순)
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { z } from 'zod';

// 3️⃣ @repo/* 패키지 (알파벳 순)
import { Pressable, Input } from '@repo/ui';
import { createTripRequestSchema } from '@repo/schema';

// 4️⃣ 앱 내부 절대 경로 (@/*) (알파벳 순)
import { useGetTrips } from '@/entities/trip';
import { formatDate } from '@/shared/lib/datetime';
import { useNetworkStatus } from '@/shared/store/network';

// 5️⃣ 상대 경로 (가까운 순서)
import styles from './Component.module.css';
import { helper } from './utils';
import { CONSTANTS } from './constants';

// ❌ DON'T: 무작위 순서
import styles from './Component.module.css';
import { useState } from 'react';
import Button from '@repo/ui/Button';
```

## 🎯 변수 및 함수 네이밍

```typescript
// ✅ DO: camelCase for variables, functions
const userName = 'John';
const fetchUserData = async () => {};
const handleSubmit = () => {};

// ✅ DO: PascalCase for components, classes, types
const UserProfile = () => {};
class UserService {}
interface UserData {}
type UserStatus = 'active' | 'inactive';

// ✅ DO: UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;

// ✅ DO: Boolean은 is, has, should로 시작
const isLoading = false;
const hasError = true;
const shouldRetry = false;

// ✅ DO: 이벤트 핸들러는 handle로 시작
const handleClick = () => {};
const handleSubmit = () => {};
const handleChange = () => {};

// ❌ DON'T: 모호한 네이밍
const data = fetchUser(); // ❌ 무엇의 data?
const temp = process(); // ❌ temp는 피하기
const flag = true; // ❌ 무엇의 flag?

// ✅ DO: 명확한 네이밍
const userData = fetchUser();
const processedResult = process();
const isSubmitting = true;
```

## 🔧 함수 작성 규칙

```typescript
// ✅ DO: 화살표 함수 사용 (React 컴포넌트 제외)
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ DO: async/await 사용 (Promise 체이닝 지양)
const fetchAndProcessData = async () => {
  try {
    const response = await fetchData();
    const validated = DataSchema.safeParse(response);
    if (!validated.success) throw new Error('Invalid data');
    return processData(validated.data);
  } catch (error) {
    console.error('Failed to fetch and process data:', error);
    throw error;
  }
};

// ❌ DON'T: Promise 체이닝
const fetchAndProcessData = () => {
  return fetchData()
    .then((response) => DataSchema.parse(response))
    .then((data) => processData(data))
    .catch((error) => console.error(error));
};

// ✅ DO: 단일 책임 원칙
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// ❌ DON'T: 여러 책임
const handleEmail = (email: string) => {
  // 검증 + 포맷 + 저장 + 전송 (너무 많은 책임)
};
```

## 🛡️ 타입 가드 사용

```typescript
// ✅ DO: 타입 가드로 안전하게 체크
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

if (isUser(data)) {
  console.log(data.email); // 안전
}

// ✅ DO: Zod를 활용한 런타임 검증
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data.email); // 타입 안전
}

// ❌ DON'T: 검증 없이 사용
console.log(data.email); // data가 User인지 알 수 없음
```

## 🔄 비동기 처리

```typescript
// ✅ DO: 에러 처리 포함
const fetchUser = async (id: number): Promise<User | null> => {
  try {
    const response = await fetcher.get<UserResponse>(`/api/user/${id}`);
    const validated = UserSchema.safeParse(response);

    if (!validated.success) {
      throw new Error('Invalid user data');
    }

    return validated.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

// ❌ DON'T: 에러 처리 없음
const fetchUser = async (id: number) => {
  const response = await fetcher.get(`/api/user/${id}`);
  return response; // 에러 발생 시?
};
```

## 📋 JSDoc 주석 (복잡한 로직)

````typescript
/**
 * 사용자 인증 토큰을 검증하고 사용자 정보를 반환합니다.
 *
 * @param token - JWT 인증 토큰
 * @returns 검증된 사용자 정보 또는 null
 * @throws {Error} 토큰이 만료되었거나 유효하지 않은 경우
 *
 * @example
 * ```typescript
 * const user = await verifyToken('eyJhbGciOi...');
 * if (user) {
 *   console.log(user.email);
 * }
 * ```
 */
async function verifyToken(token: string): Promise<User | null> {
  // 구현
}
````

## 🚫 절대 금지 사항

```typescript
// ❌ 1. 중괄호 생략 금지
if (condition) doSomething(); // ❌
if (condition) {
  // ✅
  doSomething();
}

// ❌ 2. console.log 남기지 않기 (warn, error는 허용)
console.log('Debug message'); // ❌ 개발 중 사용 후 제거
console.error('Error occurred'); // ✅

// ❌ 3. 사용하지 않는 변수 (lint warning)
const unusedVariable = 'test'; // ❌
const _ignoredVariable = 'test'; // ✅ _ prefix로 의도 표시
```

## 🎓 고급 패턴

```typescript
// ✅ DO: Generic 활용
function createStore<T>(initialState: T) {
  let state = initialState;
  return {
    getState: () => state,
    setState: (newState: T) => {
      state = newState;
    },
  };
}

// ✅ DO: Discriminated Union
type Result<T> = { success: true; data: T } | { success: false; error: string };

function processResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data); // 타입 자동 추론
  } else {
    console.error(result.error); // 타입 자동 추론
  }
}

// ✅ DO: Utility Types 활용
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type UserWithoutId = Omit<User, 'id'>;
type UserIdAndEmail = Pick<User, 'id' | 'email'>;
```
