# Noline - Selective Activation 아키텍처 실전 가이드

> ⚠️ **중요**: 이 문서는 **Data Layer**에만 적용됩니다.
> Service Layer(Map/Search)는 [Policy Architecture](./policy-architecture.md)를 참조하세요.
>
> 문서 상태: active source다. 여기서 `Local-First`는 활성화된 여행의 Data Entity 경로를 뜻한다. Service Layer나 비활성 여행까지 일괄 적용하지 않는다.

## 📌 v3.0 Update (2025-11)

### Data/Service Layer 분리

- **Data Layer** (Trip/Schedule/Expense): 이 문서의 Router 패턴 적용
- **Service Layer** (Map/Search/Directions): Policy Layer로 제어, Router 불필요
- **상세**: [Decision - Data/Service 분리](../decisions/2025-11-20-data-service-separation.md)

## 📖 목차

1. [아키텍처 개요](#-아키텍처-개요)
2. [데이터 흐름 상세](#-데이터-흐름-상세)
3. [계층별 역할과 책임](#-계층별-역할과-책임)
4. [실전 구현 체크리스트](#-실전-구현-체크리스트)
5. [반복되는 이슈 패턴과 해결책](#-반복되는-이슈-패턴과-해결책)
6. [디버깅 가이드](#-디버깅-가이드)

---

## 🏗 아키텍처 개요

### Selective Activation Model

**핵심 원칙**: "활성화 = 오프라인 보험, 비활성 = 온라인 전용"

- **활성화된 여행**: Local-First (로컬 SQLite가 진실의 원천)
- **비활성 여행**: Server-First (서버 API가 진실의 원천)
- **Router**: 활성화 상태를 자동 판단하여 Local/Remote 분기

> 📌 **Router vs Policy 책임 구분**:
>
> - Router: 데이터를 **어디에** 저장할지 결정 (WHERE)
> - Policy: 기능을 **사용할 수 있는지** 결정 (CAN)

### Client-Side ID Generation (활성화된 여행 전용)

```
┌─────────────────────────────────────────────────────┐
│  Client-Side ID Generation - 클라이언트 주도 ID 생성   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. 클라이언트가 ULID 생성                            │
│  2. 로컬 DB 즉시 저장 (SQLite)                       │
│  3. sync_queue 기록 (트랜잭션으로 묶음)               │
│  4. UI 즉시 업데이트 (React Query)                   │
│  5. 백그라운드 Push (네트워크 가능 시)                │
│  6. 서버는 클라이언트 ID 그대로 사용                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 기술 스택

| 계층      | 기술                        | 역할                       |
| --------- | --------------------------- | -------------------------- |
| Client DB | SQLite + Drizzle ORM        | 로컬 데이터 저장소         |
| Server DB | PostgreSQL (Neon) + Drizzle | 중앙 데이터 저장소         |
| State     | React Query                 | 데이터 상태 관리           |
| Sync      | Outbox Pattern (sync_queue) | 동기화 큐                  |
| ID        | ULID                        | 클라이언트 생성 고유 ID    |
| Schema    | Zod                         | 타입 안전성 + 런타임 검증  |
| Conflict  | LWW (Last-Write-Wins)       | 충돌 해결 (updatedAt 기준) |

### 다중 사용자 환경 지원 (userId 필터링)

> ⚠️ **중요**: 모든 활성화 관련 함수는 반드시 `userId` 필터링을 적용해야 합니다.

**배경**: 로컬 SQLite는 기기에 저장되므로, 다른 사용자가 같은 기기에서 로그인하면 이전 사용자의 `tripActivations` 레코드가 남아있을 수 있습니다.

**문제 시나리오 (userId 필터 없이)**:

1. 사용자 A가 여행 활성화 → `tripActivations`에 레코드 생성
2. 로그아웃 → 사용자 B 로그인
3. 오프라인 상태에서 앱 재시작
4. `hasAnyActivatedTrip()` → 사용자 A의 레코드 발견 → true 반환
5. `getTripsLocal()` → 사용자 B의 userId로 필터 → 빈 배열!
6. **결과**: 활성화는 있다고 하는데 Trip 데이터가 없음

**해결**: 모든 활성화 조회 함수에 `userId` 필터 적용

```typescript
// ✅ 올바른 패턴 - userId 필터 포함
export async function hasAnyActivatedTrip(): Promise<boolean> {
  const userId = authStore.userId;
  if (!userId) return false; // 인증 안됨 → false

  const activation = await db
    .select()
    .from(tripActivations)
    .where(
      and(
        eq(tripActivations.isActivated, true),
        eq(tripActivations.userId, userId), // ✅ userId 필터
      ),
    )
    .limit(1)
    .all();
  return activation.length > 0;
}

// ❌ 잘못된 패턴 - userId 필터 없음
export async function hasAnyActivatedTrip(): Promise<boolean> {
  const activation = await db
    .select()
    .from(tripActivations)
    .where(eq(tripActivations.isActivated, true)) // ❌ 다른 사용자 데이터도 조회됨
    .limit(1)
    .all();
  return activation.length > 0;
}
```

**userId 필터가 필요한 함수들**:

| 파일                      | 함수                     | 설명                              |
| ------------------------- | ------------------------ | --------------------------------- |
| `metadata.ts`             | `hasAnyActivatedTrip()`  | Router에서 Local/Remote 분기 결정 |
| `metadata.ts`             | `getActivatedTripInfo()` | UI에서 활성화 뱃지 표시           |
| `useGetTripActivation.ts` | `useGetActiveTrip()`     | TripSelector에서 활성화 상태 표시 |
| `trip-local.ts`           | `getTripsLocal()`        | 로컬 Trip 조회                    |

---

## 🔄 데이터 흐름 상세

### 전체 흐름도

```
┌──────────────┐
│ 1. User Action│  사용자가 "경비 추가" 버튼 클릭
└───────┬──────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ 2. Feature Layer (useMutation)                       │
│    - src/features/create-expense-form/               │
│    - useCreateExpense.ts                             │
│    - Zod 검증 (insertExpenseSchema)                  │
│    - ULID 생성: id = ulid()                          │
└───────┬──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ 3. DB Transaction (원자적 작업)                       │
│    - withTransaction() 시작                          │
│    │                                                 │
│    ├─► a) 로컬 DB 저장                               │
│    │    await db.insert(expenses).values({           │
│    │      id,                    ← 클라이언트 생성 ID │
│    │      ...data,                                   │
│    │      updatedAt: new Date(),                     │
│    │      version: 1                                 │
│    │    })                                           │
│    │                                                 │
│    └─► b) sync_queue 기록                           │
│         await addToSyncQueue(                        │
│           'expenses',                                │
│           id,                   ← 동일한 ID          │
│           'CREATE',                                  │
│           data                                       │
│         )                                            │
│                                                     │
│    - withTransaction() 종료                          │
│      → 둘 다 성공 or 둘 다 롤백                       │
└───────┬──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ 4. React Query (캐시 무효화)                         │
│    queryClient.invalidateQueries({                  │
│      queryKey: ['expenses']                          │
│    })                                               │
│    → UI 즉시 갱신 (로컬 DB에서 다시 조회)             │
└───────┬──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ 5. Sync Engine (백그라운드)                          │
│    - SyncProvider가 주기적으로 실행                   │
│    - 네트워크 상태 확인 (useNetworkStatus)            │
│    - PENDING 작업 조회                               │
│    - 순차적 Push (FIFO)                              │
└───────┬──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ 6. Server API (Express)                              │
│    POST /api/expenses                                │
│                                                     │
│    const { id, ...data } = req.body;                 │
│         ↑                                           │
│         └─ 클라이언트가 생성한 ID 그대로 수용          │
│                                                     │
│    await db.insert(expenses).values({                │
│      id,              ← 클라이언트 ID 그대로         │
│      ...data,                                       │
│      updatedAt: new Date()                          │
│    })                                               │
│                                                     │
│    res.json({                                       │
│      success: true,                                 │
│      data: { id, ...data }                          │
│    })                                               │
└───────┬──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ 7. Client Sync Completion                           │
│    - Push 성공 → sync_queue에서 삭제                 │
│    - Push 실패 → status: 'FAILED', retryCount++     │
│    - 다음 동기화 시 재시도                            │
└──────────────────────────────────────────────────────┘
```

### Pull 동기화 (다른 기기 변경사항)

```
┌──────────────────────────────────────────────────────┐
│ Sync Engine: Pull                                    │
│    GET /api/sync/pull?lastSyncedAt=2025-10-26T...   │
└───────┬──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ Server: updatedAt > lastSyncedAt인 레코드 반환        │
│    - deletedAt IS NULL인 활성 레코드                 │
│    - deletedAt IS NOT NULL인 삭제 레코드             │
└───────┬──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│ Client: Upsert                                       │
│    await db.insert(expenses).values(data)            │
│      .onConflictDoUpdate({                           │
│        target: expenses.id,                          │
│        set: data                                     │
│      })                                              │
│                                                     │
│    - LWW 충돌 해결: 서버 데이터가 최신이면 덮어쓰기    │
│    - queryClient.invalidateQueries() → UI 갱신       │
└──────────────────────────────────────────────────────┘
```

---

## 📚 계층별 역할과 책임

### 1. @repo/schema - 타입 계약 (Single Source of Truth)

**위치:** `packages/schema/src/`

**역할:**

- 클라이언트와 서버 간 데이터 구조 계약
- Zod 스키마를 통한 런타임 검증
- TypeScript 타입 추론
- 3가지 카테고리로 구성: Entity (강제), Request (확장 가능), Response (확장 가능)

**파일 구조:**

```typescript
packages/schema/src/
├── entities/       # Entity Category (강제 계약)
│   ├── expense.ts
│   ├── schedule.ts
│   ├── trip.ts
│   └── user.ts
├── requests/       # Request Category (확장 가능)
│   ├── expense.ts
│   ├── schedule.ts
│   ├── trip.ts
│   └── user.ts
├── responses/      # Response Category (확장 가능)
│   ├── expense.ts
│   ├── schedule.ts
│   ├── trip.ts
│   └── user.ts
├── sync/           # 동기화 관련 스키마
│   ├── sync-queue.ts  # sync_queue 구조 (payload는 Request 타입)
│   └── sync.ts        # Push/Pull API 계약
└── index.ts        # 통합 export
```

**계약 레벨:**

| 레벨     | 카테고리 | 자유도       | 역할                        | 사용처                       |
| -------- | -------- | ------------ | --------------------------- | ---------------------------- |
| **필수** | Entity   | ❌ 변경 불가 | DB와 1:1 매핑된 도메인 모델 | 클라이언트/서버 DB           |
| **기본** | Request  | ✅ 확장 가능 | API 요청 구조               | sync_queue.payload, API 요청 |
| **기본** | Response | ✅ 확장 가능 | API 응답 구조               | API 응답                     |

**3가지 카테고리 정의 예시:**

```typescript
// ✅ Entity Category (강제 계약) - entities/expense.ts
import { z } from 'zod';

// DB와 1:1 매핑되는 완전한 스키마
export const expenseEntity = z.object({
  // Client-Side ID 필드 (모든 Entity 공통)
  id: z.string().ulid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable(),
  version: z.number().int().default(1),

  // 비즈니스 필드
  tripId: z.string().ulid(),
  scheduleId: z.string().ulid().nullable(),
  title: z.string().min(1),
  amount: z.number(),
  currency: z.string().default('EUR'),
  category: z.string(),
  date: z.string().datetime({ offset: true }),
  memo: z.string().nullable(),
});

export type ExpenseEntity = z.infer<typeof expenseEntity>;

// ✅ Request Category (확장 가능) - requests/expense.ts
import { expenseEntity } from '../entities/expense';

// CREATE 요청: 필요한 필드만 선택
export const createExpenseRequest = expenseEntity.pick({
  id: true, // Client-Side ID: 클라이언트가 생성
  tripId: true,
  scheduleId: true,
  title: true,
  amount: true,
  currency: true,
  category: true,
  date: true,
  memo: true,
});

// UPDATE 요청: 수정 가능한 필드만, 모두 optional
export const updateExpenseRequest = expenseEntity
  .pick({
    title: true,
    amount: true,
    currency: true,
    category: true,
    date: true,
    memo: true,
    scheduleId: true,
  })
  .partial();

export type CreateExpenseRequest = z.infer<typeof createExpenseRequest>;
export type UpdateExpenseRequest = z.infer<typeof updateExpenseRequest>;

// ✅ Response Category (확장 가능) - responses/expense.ts
import { expenseEntity } from '../entities/expense';

// 단일 경비 응답
export const expenseResponse = z.object({
  success: z.literal(true),
  data: expenseEntity,
});

// 경비 목록 응답
export const expenseListResponse = z.object({
  success: z.literal(true),
  data: z.array(expenseEntity),
});

export type ExpenseResponse = z.infer<typeof expenseResponse>;
export type ExpenseListResponse = z.infer<typeof expenseListResponse>;
```

**sync_queue와 Request 타입의 관계:**

```typescript
// sync_queue.payload는 Request 카테고리의 타입과 1:1 매핑

| sync_queue.action | payload 타입 | 서버 검증 스키마 |
|-------------------|-------------|-----------------|
| CREATE | CreateExpenseRequest | createExpenseRequest.parse() |
| UPDATE | UpdateExpenseRequest | updateExpenseRequest.parse() |
| DELETE | { id: string } | 단순 ID만 필요 |

// 예시: sync_queue에 추가 시
await addToSyncQueue('expenses', id, 'CREATE', {
  // 이 payload는 CreateExpenseRequest 타입
  id,
  tripId,
  title,
  amount,
  // ...
});
```

**체크리스트:**

```typescript
# Entity Category (강제 계약)
□ xxxEntity: Client-Side ID 필드 포함 (id, createdAt, updatedAt, deletedAt, version)
□ 날짜 필드는 z.string().datetime({ offset: true })
□ DB 스키마와 1:1 매핑 확인

# Request Category (확장 가능)
□ createXxxRequest: id 포함 (Client-Side ID)
□ updateXxxRequest: partial() 사용
□ sync_queue.payload 타입과 일치 확인

# Response Category (확장 가능)
□ xxxResponse: { success: true, data: xxxEntity }
□ xxxListResponse: { success: true, data: z.array(xxxEntity) }

# 공통
□ 스키마 변경 후 pnpm build 실행
□ 타입 export 확인
```

---

### 2. Client DB Schema - 로컬 저장소

**위치:** `apps/client/src/shared/db/schema.ts`

**역할:**

- SQLite 테이블 정의 (Drizzle ORM)
- 로컬 데이터 저장
- Selective Local-First 지원

**예시:**

```typescript
// apps/client/src/shared/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable('expenses', {
  // Client-Side ID 필드
  id: text('id').primaryKey(),
  updatedAt: text('updated_at').notNull(), // ISO string
  deletedAt: text('deleted_at'), // Soft Delete
  version: integer('version').default(1).notNull(),

  // 비즈니스 필드
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id),
  scheduleId: text('schedule_id').references(() => schedules.id),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  category: text('category').notNull(),
  spentAt: text('spent_at').notNull(), // ISO string
  memo: text('memo'),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
```

**SQLite vs PostgreSQL 타입 매핑:**

| Zod Schema          | SQLite (Client)   | PostgreSQL (Server)      |
| ------------------- | ----------------- | ------------------------ |
| z.string().ulid()   | text              | text                     |
| z.boolean()         | integer (0/1)     | boolean                  |
| z.number()          | real              | numeric / decimal        |
| z.date()            | text (ISO string) | timestamp with time zone |
| z.string().nullable | text (NULL)       | text (NULL)              |

**체크리스트:**

```typescript
□ Client-Side ID 필드 포함 (id, updatedAt, deletedAt, version)
□ id: text('id').primaryKey()
□ deletedAt 필드 존재 (Soft Delete)
□ Foreign Key 설정
□ 날짜는 text로 저장 (ISO 8601 string)
□ Boolean은 integer로 저장
```

---

### 3. Entity Layer - 5단계 레이어 구조 (2025-11 리팩토링)

**위치:** `apps/client/src/entities/xxx/`

**레이어 구조:**

```text
entities/expense/
├── model/          # 타입 정의 (z.infer로 @repo/schema에서 추출)
├── api/            # Remote API 호출 함수
├── lib/            # Local DataSource (SQLite, withTransaction)
├── repository/     # Router 패턴 (Local/Remote 분기)
├── data/           # Query keys, React Query hooks (Repository 사용)
└── index.ts        # Public API (model/data만 export)
```

**레이어별 역할:**

| 레이어     | 역할                                    | 예시                                 |
| ---------- | --------------------------------------- | ------------------------------------ |
| model      | 타입 정의 (z.infer로 추출)              | `type Expense = z.infer<...>`        |
| api        | Remote Server 통신                      | `fetchExpenses(tripId)`              |
| lib        | Local SQLite 접근, withTransaction 사용 | `getLocalExpenses(tripId)`           |
| repository | Router로 활성화 상태 기반 분기          | `routeChildQuery({ local, remote })` |
| data       | Query keys, React Query hooks           | `useGetExpenses(tripId)`             |

**타입 흐름:**

```text
@repo/schema (Zod) → model (z.infer) → repository → data hooks → components
```

**올바른 구현 (5단계 레이어 구조):**

```typescript
// ✅ Step 1: model/index.ts - 타입 정의
import { expenseEntity } from '@repo/schema';
import { z } from 'zod';

export type Expense = z.infer<typeof expenseEntity>;

// ✅ Step 2: lib/expense.ts - Local DataSource
import { db } from '@/shared/db';
import { expenses } from '@/shared/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

export async function getLocalExpenses(tripId: string) {
  return db
    .select()
    .from(expenses)
    .where(and(isNull(expenses.deletedAt), eq(expenses.tripId, tripId)))
    .orderBy(expenses.spentAt)
    .all();
}

// ✅ Step 3: api/expense.ts - Remote API
import { fetcher } from '@/shared/api';

export async function fetchExpenses(tripId: string) {
  return fetcher.get<Expense[]>(`/api/trips/${tripId}/expenses`);
}

// ✅ Step 4: repository/expense.ts - Router 패턴
import { routeChildQuery } from '@/shared/services/offline-prep/router';
import { getLocalExpenses } from '../lib/expense';
import { fetchExpenses } from '../api/expense';

export function getExpenses(tripId: string) {
  return routeChildQuery({
    tripId,
    local: () => getLocalExpenses(tripId),
    remote: () => fetchExpenses(tripId),
  });
}

// ✅ Step 5: data/useGetExpenses.ts - React Query Hook
import { useQuery } from '@tanstack/react-query';
import { expenseQueryKeys } from './keys';
import { getExpenses } from '../repository/expense';

export function useGetExpenses(tripId: string) {
  return useQuery({
    queryKey: expenseQueryKeys.byTrip(tripId),
    queryFn: () => getExpenses(tripId),
    staleTime: Infinity,
  });
}

// Query Key Factory (data/keys.ts)
export const expenseQueryKeys = {
  base: ['expenses'] as const,
  all: () => [...expenseQueryKeys.base, 'all'] as const,
  byTrip: (tripId: string) => [...expenseQueryKeys.base, 'trip', tripId] as const,
  bySchedule: (scheduleId: string) => [...expenseQueryKeys.base, 'schedule', scheduleId] as const,
};
```

**잘못된 구현 (Server-First):**

```typescript
// ❌ 절대 금지!
export function useGetExpenses(tripId: string) {
  return useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      // ❌ API 호출 - 오프라인에서 작동 안 함!
      const response = await fetchExpenses(tripId);
      return response.data;
    },
  });
}
```

**체크리스트:**

```typescript
# 5단계 레이어 구조 체크리스트
□ model/ - @repo/schema에서 z.infer로 타입 추출
□ api/ - Remote API 함수 (fetcher 사용)
□ lib/ - Local DB 함수 (isNull(deletedAt) 필터 적용)
□ repository/ - routeChildQuery/routeChildMutation 사용
□ data/ - Query Key Factory + React Query hooks
□ index.ts - model/data만 export (내부 레이어 캡슐화)

# Data Hook 체크리스트
□ Repository 함수 사용 (직접 DB/API 접근 금지)
□ Query Key Factory 사용
□ staleTime 설정
```

---

### 4. Feature Layer - 비즈니스 로직 (Mutation)

**위치:** `apps/client/src/features/xxx/`

**역할:**

- 데이터 생성/수정/삭제 로직
- useMutation 구현
- Zod 검증
- ULID 생성
- 트랜잭션 + sync_queue

> ⚠️ **중요**: 아래 예시는 **활성화된 여행**의 로컬 저장 로직만을 보여줍니다.
>
> 실제 구현에서는 **Router 패턴**을 사용하여 활성화 상태에 따라 Local/Remote를 자동 분기해야 합니다.
>
> **Router 패턴 구현 예시**는 [Manual Input 가이드](../features/manual-input.md#4-데이터-저장-with-sync_queue) 참조

**로컬 저장 패턴 (활성화된 여행 전용):**

```typescript
// ✅ apps/client/src/features/create-expense-form/useCreateExpense.ts
// 📌 이 예시는 "활성화된 여행"의 로컬 저장 부분만 표현 (Router의 local 콜백 내부)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ulid } from 'ulid';
import { insertExpenseSchema } from '@repo/schema';
import { db } from '@/shared/db';
import { expenses } from '@/shared/db/schema';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { withTransaction } from '@/shared/db/utils';
import { getCurrentISOString } from '@/shared/lib/date';

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertExpense) => {
      // 1. ULID 생성
      const id = ulid();

      // 2. Zod 검증
      const validated = insertExpenseSchema.parse({
        id,
        ...data,
      });

      // 3. 원자적 트랜잭션 (핵심!)
      // 📌 실제로는 routeChildMutation의 local 콜백 내부에서 실행됨
      await withTransaction(async () => {
        // 3-1. 로컬 DB 저장
        await db.insert(expenses).values({
          ...validated,
          updatedAt: getCurrentISOString(),
          deletedAt: null,
          version: 1,
        });

        // 3-2. sync_queue 기록
        await addToSyncQueue('expenses', id, 'CREATE', validated);
      });

      return { id, ...validated };
    },

    // 4. 성공 시 캐시 무효화 → UI 즉시 갱신
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['expenses'],
      });
    },

    onError: (error) => {
      console.error('Failed to create expense:', error);
      // 에러 처리 (Toast 등)
    },
  });
}
```

**수정/삭제 패턴 (활성화된 여행 전용):**

```typescript
// ✅ Update
// 📌 실제로는 routeChildMutation의 local 콜백 내부
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateExpense) => {
      const validated = updateExpenseSchema.parse(data);

      // ... Router 패턴 생략 (실제로는 routeChildMutation 사용)
      await withTransaction(async () => {
        // version 증가 + updatedAt 갱신
        await db
          .update(expenses)
          .set({
            ...validated,
            updatedAt: getCurrentISOString(),
            version: sql`${expenses.version} + 1`,
          })
          .where(eq(expenses.id, id));

        await addToSyncQueue('expenses', id, 'UPDATE', validated);
      });
      // ...

      return { id, ...validated };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// ✅ Delete (Soft Delete)
// 📌 실제로는 routeChildMutation의 local 콜백 내부
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // ... Router 패턴 생략 (실제로는 routeChildMutation 사용)
      await withTransaction(async () => {
        // deletedAt 설정 (Soft Delete)
        await db
          .update(expenses)
          .set({
            deletedAt: getCurrentISOString(),
            updatedAt: getCurrentISOString(),
            version: sql`${expenses.version} + 1`,
          })
          .where(eq(expenses.id, id));

        await addToSyncQueue('expenses', id, 'DELETE', null);
      });
      // ...
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
```

**체크리스트:**

```typescript
□ ULID 생성: ulid()
□ Zod 검증: insertXxxSchema.parse()
□ withTransaction() 사용
□ addToSyncQueue() 호출 (트랜잭션 내부)
□ onSuccess에서 invalidateQueries
□ getCurrentISOString() 사용 (타임스탬프)
□ Soft Delete: deletedAt 설정
```

---

### 5. Sync Engine - 동기화 핵심

**위치:** `apps/client/src/shared/services/sync/`

**구조:**

```
sync/
├── engine.ts       # Push/Pull 로직
├── queue.ts        # sync_queue 조작
├── api.ts          # Axios 클라이언트 (재시도 로직)
├── provider.tsx    # SyncProvider (전역 관리)
└── types.ts        # 타입 정의
```

**Push 동기화 (queue.ts + engine.ts):**

```typescript
// ✅ apps/client/src/shared/services/sync/queue.ts

import { ulid } from 'ulid';
import { db } from '@/shared/db';
import { syncQueue } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';

export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  payload?: any, // 📌 이 payload는 @repo/schema의 Request 타입!
  // CREATE → CreateXxxRequest
  // UPDATE → UpdateXxxRequest
  // DELETE → null
) {
  await db.insert(syncQueue).values({
    id: ulid(),
    tableName,
    recordId,
    action,
    payload: payload ? JSON.stringify(payload) : null,
    status: 'PENDING',
    retryCount: 0,
    createdAt: getCurrentISOString(),
  });
}

export async function getPendingTasks() {
  return db
    .select()
    .from(syncQueue)
    .where(eq(syncQueue.status, 'PENDING'))
    .orderBy(syncQueue.createdAt) // FIFO 순서 보장!
    .all();
}

export async function deleteTask(taskId: string) {
  await db.delete(syncQueue).where(eq(syncQueue.id, taskId));
}

export async function updateTaskStatus(taskId: string, status: 'IN_PROGRESS' | 'FAILED', retryCount?: number) {
  await db.update(syncQueue).set({ status, retryCount }).where(eq(syncQueue.id, taskId));
}
```

```typescript
// ✅ apps/client/src/shared/services/sync/engine.ts

import syncApiClient from './api';
import { getPendingTasks, deleteTask, updateTaskStatus } from './queue';

export async function pushChanges() {
  const tasks = await getPendingTasks();

  console.log(`📤 Pushing ${tasks.length} tasks...`);

  for (const task of tasks) {
    try {
      await updateTaskStatus(task.id, 'IN_PROGRESS');

      // 테이블별 endpoint 매핑
      const endpoint = getEndpoint(task.tableName);

      await syncApiClient.post(endpoint, {
        id: task.recordId,
        action: task.action,
        ...JSON.parse(task.payload || '{}'),
      });

      // 성공 시 큐에서 삭제
      await deleteTask(task.id);
      console.log(`✅ Task ${task.id} completed`);
    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error);
      await updateTaskStatus(task.id, 'FAILED', task.retryCount + 1);
    }
  }
}

function getEndpoint(tableName: string): string {
  const endpoints: Record<string, string> = {
    trips: '/api/trips',
    schedules: '/api/schedules',
    expenses: '/api/expenses',
  };
  return endpoints[tableName] || '/api/sync/push';
}
```

**Pull 동기화:**

```typescript
// ✅ apps/client/src/shared/services/sync/engine.ts

export async function pullChanges(lastSyncedAt: string | null) {
  try {
    console.log('📥 Pulling changes from server...');

    const response = await syncApiClient.get('/api/sync/pull', {
      params: { lastSyncedAt },
    });

    const { trips, schedules, expenses } = response.data.data;

    // Upsert: 로컬 DB 업데이트
    await upsertTrips(trips);
    await upsertSchedules(schedules);
    await upsertExpenses(expenses);

    console.log('✅ Pull completed');

    // 마지막 동기화 시간 저장
    await saveLastSyncedAt(getCurrentISOString());
  } catch (error) {
    console.error('❌ Pull failed:', error);
  }
}

async function upsertExpenses(expenses: Expense[]) {
  if (!expenses?.length) return;

  for (const expense of expenses) {
    await db.insert(expensesTable).values(expense).onConflictDoUpdate({
      target: expensesTable.id,
      set: expense, // LWW: 서버 데이터가 최신
    });
  }
}
```

**SyncProvider (자동 동기화):**

```typescript
// ✅ apps/client/src/shared/services/sync/provider.tsx

import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useNetworkStatus } from '@/shared/store/network';
import { pushChanges, pullChanges } from './engine';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const networkStatus = useNetworkStatus();
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // 1. 네트워크 상태 변경 시 동기화
  useEffect(() => {
    if (networkStatus === 'online') {
      syncData();
    }
  }, [networkStatus]);

  // 2. 앱 포그라운드 시 동기화
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && networkStatus === 'online') {
        syncData();
      }
    });

    return () => subscription.remove();
  }, [networkStatus]);

  // 3. 주기적 동기화 (5분)
  useEffect(() => {
    if (networkStatus !== 'online') return;

    const interval = setInterval(() => {
      syncData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [networkStatus]);

  const syncData = async () => {
    console.log('🔄 Starting sync...');
    await pushChanges();
    await pullChanges(lastSyncedAt);
    setLastSyncedAt(getCurrentISOString());
  };

  return <>{children}</>;
}
```

**체크리스트:**

```typescript
□ FIFO 순서 보장 (createdAt 오름차순)
□ Exponential Backoff 재시도
□ 성공 시 큐에서 삭제
□ 실패 시 retryCount 증가
□ Pull 시 Upsert (onConflictDoUpdate)
□ SyncProvider를 app/_layout.tsx에 래핑
```

---

### 6. Server API - Express Routes

**위치:** `apps/server/src/routes/xxx.ts`

**역할:**

- 클라이언트 요청 처리
- **클라이언트 ID 그대로 사용** (Client-Side ID)
- PostgreSQL 저장
- Zod 검증
- 응답 구조화

**올바른 구현:**

```typescript
// ✅ apps/server/src/routes/expenses.ts

import { Router } from 'express';
import { db } from '../db';
import { expenses } from '../db/schema';
import { createExpenseRequestSchema, expenseResponseSchema } from '@repo/schema';

const router = Router();

// POST /api/expenses
router.post('/', async (req, res, next) => {
  try {
    // 1. 요청 검증
    const validated = createExpenseRequestSchema.parse(req.body);

    // 2. 클라이언트 ID 추출 (Client-Side ID)
    const { id, ...data } = validated;
    //      ↑
    //      클라이언트가 생성한 ID를 그대로 사용!

    // 3. DB 저장
    const newExpense = await db
      .insert(expenses)
      .values({
        id, // ← 클라이언트 ID 그대로
        ...data,
        updatedAt: new Date(),
        deletedAt: null,
        version: 1,
      })
      .returning()
      .then((rows) => rows[0]);

    // 4. 응답 구조화 (중요!)
    const response = {
      success: true,
      data: {
        ...newExpense,
        // PostgreSQL Date → ISO String 변환
        spentAt: newExpense.spentAt.toISOString(),
        updatedAt: newExpense.updatedAt.toISOString(),
        deletedAt: newExpense.deletedAt?.toISOString() || null,
      },
    };

    // 5. Zod 검증 (응답)
    const validatedResponse = expenseResponseSchema.parse(response);

    res.status(201).json(validatedResponse);
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses?tripId=xxx
router.get('/', async (req, res, next) => {
  try {
    const { tripId } = req.query;

    let query = db.select().from(expenses).where(isNull(expenses.deletedAt));

    if (tripId) {
      query = query.where(eq(expenses.tripId, tripId as string));
    }

    const expenseList = await query.orderBy(expenses.spentAt);

    // 응답 구조화
    const response = {
      success: true,
      data: expenseList.map((expense) => ({
        ...expense,
        spentAt: expense.spentAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
        deletedAt: expense.deletedAt?.toISOString() || null,
      })),
    };

    const validatedResponse = expenseListResponseSchema.parse(response);

    res.json(validatedResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = updateExpenseRequestSchema.parse(req.body);

    const updatedExpense = await db
      .update(expenses)
      .set({
        ...validated,
        updatedAt: new Date(),
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.id, id))
      .returning()
      .then((rows) => rows[0]);

    if (!updatedExpense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }

    const response = {
      success: true,
      data: {
        ...updatedExpense,
        spentAt: updatedExpense.spentAt.toISOString(),
        updatedAt: updatedExpense.updatedAt.toISOString(),
        deletedAt: updatedExpense.deletedAt?.toISOString() || null,
      },
    };

    const validatedResponse = expenseResponseSchema.parse(response);

    res.json(validatedResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id (Soft Delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedExpense = await db
      .update(expenses)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.id, id))
      .returning()
      .then((rows) => rows[0]);

    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Pull Endpoint:**

```typescript
// ✅ apps/server/src/routes/sync.ts

router.get('/pull', async (req, res, next) => {
  try {
    const { lastSyncedAt } = req.query;

    // lastSyncedAt 이후 변경된 레코드 조회
    const trips = await db
      .select()
      .from(tripsTable)
      .where(lastSyncedAt ? gt(tripsTable.updatedAt, new Date(lastSyncedAt as string)) : undefined);

    const schedules = await db
      .select()
      .from(schedulesTable)
      .where(lastSyncedAt ? gt(schedulesTable.updatedAt, new Date(lastSyncedAt as string)) : undefined);

    const expenses = await db
      .select()
      .from(expensesTable)
      .where(lastSyncedAt ? gt(expensesTable.updatedAt, new Date(lastSyncedAt as string)) : undefined);

    // ISO String 변환
    const response = {
      success: true,
      data: {
        trips: trips.map(convertToISO),
        schedules: schedules.map(convertToISO),
        expenses: expenses.map(convertToISO),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

function convertToISO(record: any) {
  return {
    ...record,
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt?.toISOString() || null,
    // 기타 날짜 필드 변환...
  };
}
```

**체크리스트:**

```typescript
□ const { id, ...data } = req.body (클라이언트 ID 사용)
□ db.insert().values({ id, ...data })
□ 응답 구조: { success: true, data: {...} }
□ Date → ISO String 변환
□ xxxResponseSchema.parse() 검증
□ Soft Delete: deletedAt 설정
□ version 증가: sql`${table.version} + 1`
```

---

## ✅ 실전 구현 체크리스트

### 새 엔티티 추가 시 (예: Expense)

#### 1단계: Schema 정의 (@repo/schema) - 3가지 카테고리

```typescript
# Entity Category (entities/expense.ts)
□ expenseEntity 정의
  □ Client-Side ID 필드 포함 (id, createdAt, updatedAt, deletedAt, version)
  □ 날짜 필드는 z.string().datetime({ offset: true })
  □ DB 스키마와 1:1 매핑
□ ExpenseEntity 타입 export

# Request Category (requests/expense.ts)
□ createExpenseRequest 정의 (Entity.pick() + id 포함!)
□ updateExpenseRequest 정의 (Entity.pick().partial())
□ CreateExpenseRequest, UpdateExpenseRequest 타입 export

# Response Category (responses/expense.ts)
□ expenseResponse = { success: true, data: expenseEntity }
□ expenseListResponse = { success: true, data: z.array(expenseEntity) }
□ ExpenseResponse, ExpenseListResponse 타입 export

# 통합
□ packages/schema/src/index.ts에 export 추가
□ pnpm build 실행
```

#### 2단계: Client DB Schema

```typescript
□ apps/client/src/shared/db/schema.ts에 테이블 추가
□ Client-Side ID 필드 포함 (id, updatedAt, deletedAt, version)
□ Foreign Key 설정
□ 타입 export
□ 마이그레이션 생성/실행
```

#### 3단계: Entity Data Layer

```typescript
□ apps/client/src/entities/expense/ 디렉토리 생성
□ data/useGetExpenses.ts (로컬 DB 조회)
□ data/queryKeys.ts (Query Key Factory)
□ API 호출 없음 확인!
□ isNull(deletedAt) 필터 적용
```

#### 4단계: Feature Layer

```typescript
□ apps/client/src/features/create-expense-form/ 생성
□ index.tsx (폼 UI)
□ useCreateExpense.ts (useMutation)
  □ ulid() 생성
  □ insertExpenseSchema.parse()
  □ withTransaction()
  □ addToSyncQueue()
  □ invalidateQueries()
□ schema.ts (Zod 폼 검증)
```

#### 5단계: Server DB Schema

```typescript
□ apps/server/src/db/schema.ts에 테이블 추가
□ Client-Side ID 필드 포함
□ timestamp with time zone 사용
□ Foreign Key cascade 설정
□ Drizzle 마이그레이션 생성/실행
```

#### 6단계: Server API Routes

```typescript
□ apps/server/src/routes/expenses.ts 생성
□ POST / (Create)
  □ const { id, ...data } = req.body
  □ db.insert().values({ id, ...data })
  □ { success: true, data: {...} } 응답
  □ Date → ISO String 변환
  □ expenseResponseSchema.parse()
□ GET / (List)
□ PUT /:id (Update)
□ DELETE /:id (Soft Delete)
□ apps/server/src/index.ts에 라우터 등록
```

#### 7단계: Sync Engine 업데이트

```typescript
□ getEndpoint() 함수에 'expenses' 매핑 추가
□ upsertExpenses() 함수 추가
□ Pull 시 expenses 포함
```

#### 8단계: Screen 구현

```typescript
□ src/screens/CreateExpenseScreen.tsx
□ MobileHeader + CreateExpenseForm 조합
□ app/create-expense.tsx 라우트 연결
```

---

## 🚨 반복되는 이슈 패턴과 해결책

### 패턴 1: Schema ID 필드 누락 (Client-Side ID 위반)

#### 증상

```typescript
// ❌ 문제
export const createScheduleRequestSchema = z.object({
  // id 없음!
  tripId: z.string(),
  title: z.string(),
});

// 결과: 클라이언트와 서버의 ID가 달라짐
Client: 01ABC123
Server: 01XYZ789  ❌
```

#### 해결

```typescript
// ✅ 수정
export const createScheduleRequestSchema = z.object({
  id: z.string().ulid(), // Client-Side ID 필수!
  tripId: z.string(),
  title: z.string(),
});
```

#### 근본 원인

- Server-First 사고방식 잔재
- "서버가 ID를 생성한다"는 고정관념

#### 예방

```typescript
// 모든 createXxxRequestSchema 확인
□ id: z.string().ulid() 포함
□ 서버에서 const { id, ...data } = req.body
□ 서버 insert 시 id 포함
```

---

### 패턴 2: 응답 검증 구조 불일치

#### 증상

```typescript
// ❌ 잘못된 검증
const validated = scheduleSchema.safeParse(newSchedule);
res.json(validated.data);

// Zod 에러:
// {
//   code: 'invalid_type',
//   expected: 'boolean',
//   received: 'undefined',
//   path: ['success']
// }
```

#### 원인

```typescript
// scheduleResponseSchema는 전체 응답 구조를 기대
export const scheduleResponseSchema = z.object({
  success: z.boolean(), // ← 필요
  data: scheduleSchema, // ← 필요
});

// 하지만 단일 객체만 전달
const validated = scheduleSchema.safeParse(newSchedule); // ❌
```

#### 해결

```typescript
// ✅ 올바른 검증
const response = {
  success: true,
  data: {
    ...newSchedule,
    scheduledAt: newSchedule.scheduledAt.toISOString(),
    updatedAt: newSchedule.updatedAt.toISOString(),
    deletedAt: newSchedule.deletedAt?.toISOString() || null,
  },
};

const validated = scheduleResponseSchema.safeParse(response);
res.status(201).json(validated.data);
```

#### 규칙

```typescript
단일 조회:   xxxResponseSchema      → { success, data: {...} }
리스트 조회: xxxListResponseSchema  → { success, data: [...] }
생성/수정:   createXxxResponseSchema → { success, data: {...} }

// 항상 전체 응답 구조를 생성한 후 검증!
```

---

### 패턴 3: 타입 변환 불일치

#### 케이스 A: Boolean ↔ Integer

**문제:**

```typescript
// Client (SQLite)
hasReceipt: true  (boolean)

// Server (PostgreSQL)
hasReceipt: integer 컬럼

// Schema
hasReceipt: z.boolean()

// 결과: 타입 불일치 에러
```

**해결:**

```typescript
// ✅ Client → Server (요청)
await db.insert(expenses).values({
  hasReceipt: data.hasReceipt ? 1 : 0, // boolean → integer
});

// ✅ Server → Client (응답)
const response = {
  ...expense,
  hasReceipt: Boolean(expense.hasReceipt), // integer → boolean
};
```

#### 케이스 B: Date ↔ ISO String

**문제:**

```typescript
// Client
spentAt: "2025-10-26T10:30:00.000Z"  (ISO string)

// Server
spentAt: Date object

// Schema
spentAt: z.string().datetime({ offset: true })
```

**해결:**

```typescript
// ✅ Client → Server
await db.insert(expenses).values({
  spentAt: new Date(data.spentAt), // ISO string → Date
});

// ✅ Server → Client
const response = {
  ...expense,
  spentAt: expense.spentAt.toISOString(), // Date → ISO string
};
```

#### 타입 변환 매트릭스

| Schema Type | SQLite (Client) | PostgreSQL (Server) | Client→Server | Server→Client    |
| ----------- | --------------- | ------------------- | ------------- | ---------------- |
| z.boolean() | integer (0/1)   | boolean             | `? 1 : 0`     | `Boolean()`      |
| z.date()    | text (ISO)      | timestamp           | `new Date()`  | `.toISOString()` |
| z.number()  | real            | numeric             | as-is         | as-is            |
| z.string()  | text            | text                | as-is         | as-is            |

---

### 패턴 4: 아키텍처 혼재 (Server-First 잔재)

#### 문제

```typescript
// ❌ Schedule만 Server-First로 구현됨
Trip:     ✅ Local-First  (db.select())
Expense:  ✅ Local-First  (db.select())
Schedule: ❌ Server-First (fetchSchedules())  ← 불일치!
```

**결과:**

- ❌ 오프라인에서 일정 조회 불가
- ❌ 네트워크 지연 발생
- ❌ 일관성 없는 UX

#### 해결

```typescript
// ✅ Schedule - Local-First로 변경
export const useGetSchedules = (tripId: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.list(tripId),
    queryFn: async () => {
      // ✅ 로컬 DB 조회
      return db
        .select()
        .from(schedules)
        .where(and(isNull(schedules.deletedAt), eq(schedules.tripId, tripId)))
        .orderBy(schedules.scheduledAt)
        .all();
    },
  });
};
```

#### 확인 방법

```typescript
// 모든 useGetXxx 훅 검사
1. grep "fetchXxx" src/entities/**/data/
2. ❌ fetchXxx API 호출 → Server-First (수정 필요)
3. ✅ db.select() → Local-First (올바름)
```

---

### 패턴 5: Props 전달 누락

#### 문제

```typescript
// ❌ 필요한 데이터 없음
<ScheduleDetailScreen
  scheduleId={scheduleId}
  // tripId 없음!
  onBack={() => router.back()}
/>

// 결과: 경비 추가 시 tripId undefined
const handleAddExpense = () => {
  router.push(`/create-expense?tripId=${tripId}`);  // ❌
};
```

#### 해결 A: URL 파라미터로 전달 (권장)

```typescript
// ✅ 리스트에서 모든 필요한 데이터 전달
router.push(
  `/schedules/${schedule.id}?tripId=${schedule.tripId}&scheduledAt=${encodeURIComponent(schedule.scheduledAt)}`,
);

// ✅ 라우트에서 파라미터 추출
const params = useLocalSearchParams<{
  id: string;
  tripId: string;
  scheduledAt: string;
}>();
```

#### 해결 B: 로컬 DB 조회 (비추천)

```typescript
// ⚠️ 가능하지만 불필요한 조회
const { data: schedule } = useGetScheduleById(scheduleId);

// 문제점:
// - 이미 가진 데이터를 다시 조회
// - 로딩 시간 추가
// - 불필요한 DB 접근
```

#### 원칙

```typescript
✅ 리스트 → 상세: 필요한 데이터 모두 전달
❌ 상세 화면에서 다시 조회하지 말 것
```

---

### 패턴 6: 트랜잭션 누락

#### 문제

```typescript
// ❌ 트랜잭션 없음
await db.insert(expenses).values(newExpense); // 성공
await addToSyncQueue('expenses', id, 'CREATE', data); // 실패!

// 결과:
// - UI에는 경비가 보임
// - sync_queue에는 없음
// - 서버로 동기화 안 됨
// - 데이터 불일치!
```

#### 해결

```typescript
// ✅ 트랜잭션으로 원자성 보장
await withTransaction(async () => {
  await db.insert(expenses).values(newExpense);
  await addToSyncQueue('expenses', id, 'CREATE', data);
});

// 둘 다 성공하거나, 둘 다 실패
```

#### 트랜잭션이 필요한 경우

```typescript
□ 데이터 저장 + sync_queue 기록
□ 다중 테이블 업데이트 (외래키 관계)
□ version 증가 + 데이터 변경
```

---

### 패턴 6: 비활성화 시 sync_queue 무시로 인한 데이터 손실

#### 증상

```typescript
// ❌ 문제 시나리오
1. 오프라인에서 expense 생성 → sync_queue에 PENDING
2. 네트워크 없음 (서버 미전송)
3. 사용자가 여행 비활성화 + cleanup 실행
4. Hard delete 즉시 실행 → expense 로컬 DB에서 삭제
5. 네트워크 복구 → sync engine이 sync_queue 처리 시도
6. ❌ 로컬 DB에 데이터 없음 → payload 못 읽음 → 404
7. 결과: 데이터 영구 손실 💀
```

#### 원인

- 비활성화 시 sync_queue 상태 확인 누락
- Hard delete로 즉시 삭제하여 복구 불가
- 원자성 보장 부재 (withTransaction 미사용)

#### 해결: 3단계 삭제 시스템

##### Phase 1: 비활성화 (즉시, 사용자 대기 없음)

```typescript
// 1. sync_queue 체크
const hasPending = await hasPendingTasksForTrip(tripId);

// 2. 트랜잭션으로 원자성 보장
await withTransaction(async () => {
  // 비활성화 설정
  await db.update(tripActivations).set({
    isActivated: false,
    deactivatedAt: now,
    cleanupPending: hasPending, // ← 지연 플래그
  });

  // PENDING 없으면 즉시 Soft delete
  if (!hasPending) {
    await db.update(schedules).set({ deletedAt: now });
    await db.update(expenses).set({ deletedAt: now });
  }
});

// 3. 오프라인 지도 삭제 (cleanup 즉시 실행된 경우만)
if (!hasPending) {
  await cleanupOfflineMapForTrip(tripId);
}
```

##### Phase 2: Soft Delete (Background, Sync 완료 후)

```typescript
// Background Sync (pushChanges) 완료 후 자동 실행
export async function processPendingCleanups(): Promise<number> {
  // 1. cleanupPending = true인 여행 조회
  const pendingCleanups = await db.select().from(tripActivations).where(eq(tripActivations.cleanupPending, true));

  // 2. 각 여행에 대해 cleanup 시도
  for (const activation of pendingCleanups) {
    const hasPending = await hasPendingTasksForTrip(activation.tripId);

    if (!hasPending) {
      // sync_queue 비었음 → Soft delete 실행
      await withTransaction(async () => {
        await db.update(schedules).set({ deletedAt: now });
        await db.update(expenses).set({ deletedAt: now });
        await db.update(tripActivations).set({ cleanupPending: false });
      });

      // 오프라인 지도 삭제
      await cleanupOfflineMapForTrip(activation.tripId);
    }
  }

  return processedCount;
}
```

##### Phase 3: Hard Delete (Vacuum, 7일 후)

```typescript
// 7일 지난 Soft delete 레코드 Hard delete
export async function vacuumDeletedRecords(): Promise<{ schedules: number; expenses: number }> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);

  await withTransaction(async () => {
    // deletedAt < 7일 전인 레코드 Hard delete
    await db
      .delete(schedules)
      .where(and(isNotNull(schedules.deletedAt), lt(schedules.deletedAt, thresholdDate.toISOString())));

    await db
      .delete(expenses)
      .where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, thresholdDate.toISOString())));
  });

  return { schedules: deletedCount, expenses: deletedCount };
}
```

#### 핵심 패턴

```typescript
// ✅ 필수 Helper 함수
import { hasPendingTasksForTrip, getPendingTasksForTrip } from '@/shared/services/sync/queue';

// ✅ cleanupPending 플래그로 지연 제어
cleanupPending: hasPending; // PENDING 있으면 true

// ✅ Background Job에서 자동 처리
// - pushChanges() 완료 후
// - 앱 시작 시 (PendingCleanupTrigger)

// ✅ Soft Delete 패턴 (withTransaction 필수!)
await withTransaction(async () => {
  await db.update(table).set({
    deletedAt: now,
    version: sql`${table.version} + 1`,
  });
});

// ✅ Vacuum으로 저장 공간 회수
// 7일 후 자동 Hard delete
```

#### 실행 시점

```typescript
1. processPendingCleanups() 자동 실행
   - Background Sync 완료 후 (pushChanges)
   - 앱 시작 시 (PendingCleanupTrigger, 2초 지연)

2. vacuumDeletedRecords() 자동 실행
   - processPendingCleanups() 완료 후 매번
   - 7일 지난 레코드만 Hard delete

3. forceCleanupTrip() 수동 실행
   - 디버깅/긴급 상황용
   - ⚠️ 주의: sync_queue 무시, 데이터 손실 가능
```

#### 트레이드오프

- **복잡도 증가**: +428 lines (5 files)
- **vs 안전성 확보**: 데이터 손실 방지, sync 완료 보장
- **결론**: 복잡도는 수용 가능. **안전성이 더 중요**.

#### 관련 문서

- Decision: `.claude/decisions/2025-11-20-deactivation-sync-queue-safety.md`
- Commit: f0b5039 (2025-11-20)

---

### 패턴 7: 비활성+오프라인 시나리오와 React Query 캐시

#### 상황

4가지 정책 상태 중 **"비활성 + 오프라인"** 시나리오에서 발생할 수 있는 UX 문제:

```
| 상태                | Router 선택 | 결과                                    |
|---------------------|------------|----------------------------------------|
| 온라인 + 활성화      | local()    | ✅ SQLite 조회                          |
| 온라인 + 비활성      | remote()   | ✅ 서버 API 호출                         |
| 오프라인 + 활성화    | local()    | ✅ SQLite 조회                          |
| 오프라인 + 비활성    | remote()   | ❌ 서버 실패 → OfflineError → 에러 UI   |
```

#### 핵심 동작 (정책대로)

**비활성 + 오프라인** 상태에서:

1. Router는 정책에 따라 `remote()` 선택 (비활성이므로 로컬 데이터 없음)
2. 서버 API 호출 시도 → 오프라인이라 실패
3. `OfflineError` throw → UI에서 "활성화하기" 안내 표시

```typescript
// Router에서 OfflineError 발생
if (networkStatus === 'offline') {
  throw new OfflineError('오프라인에서는 활성화된 여행만 볼 수 있어요', {
    action: 'ACTIVATE_PROMPT', // UI에서 활성화 버튼 표시 유도
    tripId,
  });
}
```

#### 개선 가능성: React Query 캐시 폴백

React Query는 기본적으로 캐시를 유지합니다 (`gcTime` 동안). 이론적으로 "비활성+오프라인" 시 이전에 조회했던 캐시 데이터를 활용할 수 있습니다:

```typescript
// ⚠️ 현재 미적용 - 참고용 패턴
export const useGetTrips = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryFn: async () => {
      try {
        return await TripRepository.getAll();
      } catch (error) {
        // 오프라인 에러 시 캐시 데이터가 있으면 반환
        if (isOfflineError(error)) {
          const cachedData = queryClient.getQueryData<Trip[]>(tripQueryKeys.all());
          if (cachedData) {
            console.log('📋 Using cached trips data (offline)');
            return cachedData;
          }
        }
        throw error; // 캐시 없으면 에러 유지
      }
    },
  });
};
```

#### 왜 현재 미적용인가?

1. **정책 일관성**: 4가지 상태별 동작이 명확해야 예측 가능
2. **중복 코드**: 모든 Query Hook에 동일 패턴 적용 필요 (5개 이상)
3. **캐시 만료**: `gcTime` 이후 캐시 없으면 어차피 에러
4. **근본 해결 아님**: 활성화해야 완전한 오프라인 지원

#### 미래 개선 고려사항

필요시 다음 방향으로 개선 가능:

1. **Router 레벨에서 캐시 폴백**: Hook 중복 없이 한 곳에서 처리
2. **UI 안내 개선**: "이전에 봤던 데이터입니다 (오프라인)" 표시
3. **캐시 영속화**: AsyncStorage로 더 오래 유지

#### 현재 권장 사항

- **정책대로 동작**: 비활성+오프라인 → OfflineError → "활성화하기" 안내
- **사용자 행동 유도**: 여행을 활성화하면 완전한 오프라인 지원
- **UX 문서화**: 사용자에게 활성화의 의미 설명

---

## 🔍 디버깅 가이드

### 증상별 진단 플로우

#### "UI는 업데이트되는데 동기화 안 됨"

```
1. sync_queue 테이블 확인
   SELECT * FROM sync_queue WHERE status = 'PENDING';

2. 작업이 있는가?
   ├─ YES → Sync Engine 문제
   │  ├─ 네트워크 상태 확인
   │  ├─ syncApiClient 로그 확인
   │  └─ 서버 endpoint 확인
   │
   └─ NO → addToSyncQueue 호출 안 됨
      ├─ withTransaction 사용 여부 확인
      ├─ addToSyncQueue 호출 위치 확인
      └─ 트랜잭션 에러 로그 확인
```

#### "클라이언트-서버 데이터 불일치"

```
1. 두 ID가 다른가?
   Client: 01ABC123
   Server: 01XYZ789

   ├─ YES → Client-Side ID 위반!
   │  ├─ createXxxRequestSchema에 id 있는가?
   │  ├─ 서버에서 const { id } = req.body 하는가?
   │  └─ 서버 insert에 id 포함하는가?
   │
   └─ NO → 다른 원인
      ├─ 타입 변환 문제? (boolean, date)
      ├─ Soft Delete 필터 누락?
      └─ Pull 동기화 안 됨?
```

#### "Zod validation error: success/data required"

```
1. 어느 Schema로 검증하는가?

   ├─ xxxSchema (단일 객체)
   │  → ❌ 잘못됨! xxxResponseSchema 사용해야 함
   │
   └─ xxxResponseSchema
      ├─ 응답 구조가 { success, data }인가?
      │  ├─ YES → Date 변환 확인
      │  └─ NO → 응답 구조 수정
      │
      └─ data 필드가 올바른가?
         ├─ 단일: data: { ... }
         └─ 리스트: data: [...]
```

#### "오프라인에서 조회 안 됨"

```
1. useGetXxx 훅 확인

   ├─ fetchXxx() API 호출하는가?
   │  → ❌ Server-First! 로컬 DB 조회로 변경
   │
   └─ db.select() 사용하는가?
      ├─ YES → 네트워크 감지 문제
      │  ├─ useNetworkStatus 확인
      │  └─ NetworkStatusBanner 표시 확인
      │
      └─ NO → 로컬 DB에 데이터 없음
         ├─ 초기 Pull 실행했는가?
         └─ 마이그레이션 실행했는가?
```

#### "TypeError: Cannot read property 'xxx' of undefined"

```
1. Props 전달 확인

   ├─ URL 파라미터로 전달했는가?
   │  ├─ router.push에 포함?
   │  └─ useLocalSearchParams로 추출?
   │
   └─ 로컬 DB 조회하는가?
      ├─ useGetXxxById 사용?
      ├─ Loading 상태 처리?
      └─ data?.xxx 옵셔널 체이닝?
```

---

## 📐 아키텍처 다이어그램

### Client-Side ID 데이터 흐름

```
┌────────────────────────────────────────────────────────────┐
│                       USER ACTION                          │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│ Feature Layer (useMutation)                                │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 1. ULID 생성:    id = ulid()                           │ │
│ │ 2. Zod 검증:     insertExpenseSchema.parse(data)       │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│ withTransaction START                                      │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 3a. 로컬 DB 저장                                        │ │
│ │     await db.insert(expenses).values({                 │ │
│ │       id,              ← 클라이언트 생성 ID            │ │
│ │       ...data,                                         │ │
│ │       updatedAt,                                       │ │
│ │       version: 1                                       │ │
│ │     })                                                 │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 3b. sync_queue 기록                                    │ │
│ │     await addToSyncQueue(                              │ │
│ │       'expenses',                                      │ │
│ │       id,              ← 동일한 ID                     │ │
│ │       'CREATE',                                        │ │
│ │       data                                             │ │
│ │     )                                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│ withTransaction COMMIT (둘 다 성공 or 둘 다 롤백)          │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│ React Query Cache Invalidation                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ queryClient.invalidateQueries({ queryKey: ['expenses']})│ │
│ │ → useGetExpenses 자동 refetch (로컬 DB 조회)           │ │
│ │ → UI 즉시 갱신 ✨                                       │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│ Sync Engine (Background)                                   │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 4. PENDING 작업 조회                                    │ │
│ │    SELECT * FROM sync_queue                            │ │
│ │    WHERE status = 'PENDING'                            │ │
│ │    ORDER BY createdAt  ← FIFO!                         │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 5. 네트워크 확인                                        │ │
│ │    if (networkStatus !== 'online') skip                │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 6. 순차 Push                                           │ │
│ │    for (const task of tasks) {                         │ │
│ │      await syncApiClient.post(endpoint, task)          │ │
│ │    }                                                   │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│ Server API                                                 │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 7. 요청 수신                                            │ │
│ │    POST /api/expenses                                  │ │
│ │    { id, ...data }     ← 클라이언트 ID                 │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 8. PostgreSQL 저장                                     │ │
│ │    await db.insert(expenses).values({                  │ │
│ │      id,               ← 클라이언트 ID 그대로 사용!    │ │
│ │      ...data,                                          │ │
│ │      updatedAt: new Date()                             │ │
│ │    })                                                  │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 9. 응답                                                │ │
│ │    res.json({ success: true, data: {...} })            │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│ Client: Push 완료 처리                                     │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 10. 성공 시                                            │ │
│ │     await deleteTask(task.id)                          │ │
│ │     → sync_queue에서 삭제                              │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 11. 실패 시                                            │ │
│ │     await updateTaskStatus(                            │ │
│ │       task.id,                                         │ │
│ │       'FAILED',                                        │ │
│ │       retryCount + 1                                   │ │
│ │     )                                                  │ │
│ │     → 다음 동기화 시 재시도                             │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 결과: 클라이언트와 서버가 동일한 ID로 데이터 공유 ✅         │
│                                                            │
│ Client DB:  { id: "01ABC123", title: "Lunch", ... }       │
│ Server DB:  { id: "01ABC123", title: "Lunch", ... }       │
│                 ↑                                          │
│                 동일한 ID!                                  │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 핵심 원칙 요약

### DO ✅

```typescript
1. ✅ 클라이언트가 ULID로 ID 생성
   const id = ulid();

2. ✅ 로컬 DB + sync_queue를 트랜잭션으로 묶기
   await withTransaction(async () => {
     await db.insert(...);
     await addToSyncQueue(...);
   });

3. ✅ 활성화 대상 Data Entity는 Activation Router/로컬 DB 정책을 일관되게 적용
   queryFn: () => repository.getByTrip(tripId)  // 훅에서 직접 API 호출 ❌

4. ✅ 서버는 클라이언트 ID를 그대로 사용
   const { id, ...data } = req.body;
   await db.insert(table).values({ id, ...data });

5. ✅ 응답 구조 검증은 { success, data } 전체를 대상으로
   xxxResponseSchema.parse(response)

6. ✅ @repo/schema는 3가지 카테고리로 구성
   - Entity: 강제 계약 (DB와 1:1)
   - Request: 확장 가능 (API 요청, sync_queue.payload)
   - Response: 확장 가능 (API 응답)

7. ✅ sync_queue.payload는 Request 타입 사용
   await addToSyncQueue('expenses', id, 'CREATE', createExpenseRequest)
   const response = { success: true, data: {...} };
   xxxResponseSchema.parse(response);

6. ✅ 타입 변환 (boolean ↔ integer, Date ↔ ISO string)
   hasReceipt: data.hasReceipt ? 1 : 0
   spentAt: expense.spentAt.toISOString()

7. ✅ Soft Delete: deletedAt 설정
   await db.update(table).set({ deletedAt: new Date() })

8. ✅ FIFO 순서 보장
   SELECT * FROM sync_queue ORDER BY createdAt
```

### DON'T ❌

```typescript
1. ❌ 서버가 ID를 새로 생성하면 안 됨
   const id = randomUUID();  // 클라이언트 ID 무시

2. ❌ useGetXxx에서 API 호출하면 안 됨
   queryFn: () => fetchExpenses(tripId)  // 오프라인 불가!

3. ❌ 트랜잭션 없이 DB + sync_queue 작업하면 안 됨
   await db.insert(...);  // 성공
   await addToSyncQueue(...);  // 실패 → 데이터 불일치!

4. ❌ 단일 객체만 검증하면 안 됨
   xxxSchema.parse(expense)  // success, data 필드 없음

5. ❌ 상세 화면에서 불필요하게 다시 조회하면 안 됨
   const { data } = useGetScheduleById(id);  // 이미 가진 데이터

6. ❌ Hard Delete 하면 안 됨
   await db.delete(table).where(...)  // 동기화 불가!

7. ❌ createXxxRequestSchema에서 id 빠뜨리면 안 됨
   z.object({ title, amount })  // id 없음 → Client-Side ID 위반!
```

---

## 🚀 빠른 참조

### 자주 사용하는 헬퍼 함수

```typescript
// ✅ ULID 생성
import { ulid } from 'ulid';
const id = ulid();

// ✅ 현재 시간 (ISO String)
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

// ✅ 트랜잭션
import { withTransaction } from '@/shared/db/utils';
await withTransaction(async () => {
  // 원자적 작업
});

// ✅ sync_queue 추가
import { addToSyncQueue } from '@/shared/services/sync/queue';
await addToSyncQueue('expenses', id, 'CREATE', data);

// ✅ Query Key Factory
export const expenseQueryKeys = {
  base: ['expenses'] as const,
  all: () => [...expenseQueryKeys.base, 'all'] as const,
  byTrip: (tripId: string) => [...expenseQueryKeys.base, 'trip', tripId] as const,
};

// ✅ Soft Delete 필터
import { isNull } from 'drizzle-orm';
.where(isNull(table.deletedAt))
```

### 타입 변환 치트시트

```typescript
// Boolean → Integer (Client)
hasReceipt: data.hasReceipt ? 1 : 0;

// Integer → Boolean (Server)
hasReceipt: Boolean(expense.hasReceipt);

// ISO String → Date (Server)
spentAt: new Date(data.spentAt);

// Date → ISO String (Server)
spentAt: expense.spentAt.toISOString();

// Null 처리
deletedAt: expense.deletedAt?.toISOString() || null;
```

---

## 📚 추가 자료

- [Activation System](../features/activation-system.md) - 활성화 시스템 완전 가이드
- [Drizzle ORM 공식 문서](https://orm.drizzle.team/)
- [React Query 공식 문서](https://tanstack.com/query/latest)
- [Zod 공식 문서](https://zod.dev/)

---

**작성일:** 2025-10-26  
**버전:** 1.0.0  
**작성자:** Cursor AI Assistant
