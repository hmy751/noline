# @repo/schema - Shared Type Contract

> Zod 스키마 기반 클라이언트-서버 타입 계약

## 📌 Package Purpose

**Single Source of Truth for all types**

- 클라이언트와 서버가 동일한 타입 사용
- 런타임 검증 (Zod) + 타입 안전성 (TypeScript)
- 컴파일 타임 에러 방지
- API 경계에서 데이터 검증

## 🎯 Core Policy: Schema-First

### Rule: "Export schemas, NOT types"

```typescript
// ❌ DON'T: Export types
export type Trip = { id: string; name: string };

// ✅ DO: Export schemas, infer types
export const tripEntity = z.object({
  id: z.string().ulid(),
  name: z.string(),
});

// ✅ DO: Use z.infer
import { tripEntity } from '@repo/schema';
type Trip = z.infer<typeof tripEntity>;
```

**Why?**

- Schema는 타입의 유일한 출처 (Single Source of Truth)
- 런타임 검증과 타입이 항상 일치
- Schema 변경 시 타입 자동 업데이트

## 📁 Directory Structure

```
packages/schema/src/
├── entities/          # Entity Category (강제 계약)
│   ├── trip.ts       # Trip entity schema
│   ├── expense.ts    # Expense entity schema
│   ├── schedule.ts   # Schedule entity schema
│   └── user.ts       # User entity schema
│
├── requests/          # Request Category (확장 가능)
│   ├── trip.ts       # createTripRequest, updateTripRequest
│   ├── expense.ts    # Expense requests
│   └── schedule.ts   # Schedule requests
│
├── responses/         # Response Category (확장 가능)
│   ├── trip.ts       # tripResponse, tripListResponse
│   ├── expense.ts    # Expense responses
│   └── common.ts     # Common response wrappers
│
├── sync/              # Sync-related schemas
│   ├── sync-queue.ts # sync_queue structure
│   └── sync.ts       # Push/Pull API contract
│
├── shared/            # Common utilities
│   ├── fields.ts     # Common fields (id, updatedAt, etc.)
│   ├── enums.ts      # Status, ActionType enums
│   └── utils.ts      # Schema helpers
│
└── index.ts           # Main export
```

## 🔐 3가지 Schema 카테고리

### 1. Entity Category (강제 계약)

**목적:** DB 테이블과 1:1 매핑, 클라이언트-서버 계약

**특징:**

- ❌ 변경 금지 (양쪽 다 계약 준수)
- ✅ DB 스키마와 완전 일치
- ✅ Client-Side ID 필드 포함 (id, updatedAt, deletedAt, version)

```typescript
// entities/trip.ts
import { z } from 'zod';

export const tripEntity = z.object({
  // Client-Side ID 필수 필드 (모든 Entity 공통)
  id: z.string().ulid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable(),
  version: z.number().int().default(1),

  // 비즈니스 필드
  name: z.string(),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),

  // Foreign Keys
  userId: z.string().ulid(),
});

// Type 추론
export type Trip = z.infer<typeof tripEntity>;
```

**규칙:**

- 모든 Entity는 Client-Side ID 필드 포함:
  - `id`: z.string().ulid()
  - `createdAt`: z.string().datetime({ offset: true })
  - `updatedAt`: z.string().datetime({ offset: true })
  - `deletedAt`: z.string().datetime({ offset: true }).nullable()
  - `version`: z.number().int().default(1)
- 날짜는 `z.string().datetime({ offset: true })` (ISO 8601)
- DB 테이블과 1:1 매핑

---

### 2. Request Category (확장 가능)

**목적:** API 요청 검증, Entity 기반 확장

**특징:**

- ✅ Entity 기반으로 확장 가능
- ✅ 앱별로 필드 추가 가능 (`.extend()`)
- ✅ pick, omit, partial 자유롭게 사용
- ✅ sync_queue.payload에도 사용

```typescript
// requests/trip.ts
import { tripEntity } from '../entities/trip';

// 생성 요청 (Client-Side ID: id 포함!)
export const createTripRequest = tripEntity.pick({
  id: true, // Client-Side ID 필수!
  name: true,
  startDate: true,
  endDate: true,
  userId: true,
});

// 업데이트 요청 (모든 필드 optional)
export const updateTripRequest = tripEntity
  .pick({
    name: true,
    startDate: true,
    endDate: true,
  })
  .partial();

// Type 추론
export type CreateTripRequest = z.infer<typeof createTripRequest>;
export type UpdateTripRequest = z.infer<typeof updateTripRequest>;
```

**규칙:**

- `createXxxRequest`는 반드시 `id` 포함 (Client-Side ID)
- `updateXxxRequest`는 partial (선택적 업데이트)
- 앱별 확장 가능: `.extend({ localField: z.string() })`

**sync_queue와의 관계:**

```typescript
// sync_queue.payload는 Request 타입 사용
await addToSyncQueue(
  'trips',
  id,
  'CREATE',
  createTripRequest, // ← Request 타입
);
```

---

### 3. Response Category (확장 가능)

**목적:** API 응답 검증

**특징:**

- ✅ 공통 래퍼 사용 (`{ success, data }`)
- ✅ 앱별로 메타데이터 추가 가능

```typescript
// responses/trip.ts
import { tripEntity } from '../entities/trip';

// 단일 응답
export const tripResponse = z.object({
  success: z.literal(true), // z.literal(true)로 더 엄격하게
  data: tripEntity,
});

// 리스트 응답
export const tripListResponse = z.object({
  success: z.literal(true),
  data: z.array(tripEntity),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
    })
    .optional(),
});

// Type 추론
export type TripResponse = z.infer<typeof tripResponse>;
export type TripListResponse = z.infer<typeof tripListResponse>;
```

**규칙:**

- 항상 `{ success, data }` 구조
- `success`는 `z.literal(true)` (z.boolean()보다 엄격)
- 단일: `xxxResponse`
- 리스트: `xxxListResponse`
- 서버에서 전체 구조 생성 후 검증

---

## 📝 사용 예제

### 예제 1: 클라이언트에서 사용

```typescript
// apps/client/src/entities/trip/api/createTrip.ts
import { createTripRequest } from '@repo/schema';
import { z } from 'zod';

type CreateTripInput = z.infer<typeof createTripRequest>;

export async function createTrip(data: CreateTripInput) {
  // 1. Zod 검증
  const validated = createTripRequest.parse(data);

  // 2. 로컬 DB 저장
  await db.insert(trips).values(validated);

  // 3. sync_queue 기록
  await addToSyncQueue('trips', validated.id, 'CREATE', validated);
}
```

### 예제 2: 서버에서 사용

```typescript
// apps/server/src/routes/trips.ts
import { createTripRequest, tripResponse } from '@repo/schema';

app.post('/api/trips', async (req, res) => {
  // 1. 요청 검증
  const validated = createTripRequest.parse(req.body);

  // 2. Client-Side ID: 클라이언트 ID 수용
  const { id, ...data } = validated;

  // 3. DB 저장
  const newTrip = await db.insert(trips).values({ id, ...data });

  // 4. 응답 생성 (전체 구조)
  const response = {
    success: true,
    data: newTrip,
  };

  // 5. 응답 검증
  const validatedResponse = tripResponse.parse(response);

  res.status(201).json(validatedResponse);
});
```

### 예제 3: 새 Entity 추가 시

```typescript
// 1. entities/schedule.ts
export const scheduleEntity = z.object({
  id: z.string().ulid(),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable(),
  version: z.number(),

  tripId: z.string().ulid(),
  title: z.string(),
  startTime: z.string().datetime({ offset: true }),
  location: z.string().optional(),
});

// 2. requests/schedule.ts
export const createScheduleRequest = scheduleEntity.pick({
  id: true, // Client-Side ID 필수!
  tripId: true,
  title: true,
  startTime: true,
  location: true,
});

export const updateScheduleRequest = scheduleEntity
  .pick({
    title: true,
    startTime: true,
    location: true,
  })
  .partial();

// 3. responses/schedule.ts
export const scheduleResponse = z.object({
  success: z.boolean(),
  data: scheduleEntity,
});

export const scheduleListResponse = z.object({
  success: z.boolean(),
  data: z.array(scheduleEntity),
});

// 4. index.ts에 export 추가
export * from './entities/schedule';
export * from './requests/schedule';
export * from './responses/schedule';
```

## 🔧 Common Patterns

### Pattern 1: Optional 필드

```typescript
z.string().optional(); // string | undefined
z.string().nullable(); // string | null
z.string().nullish(); // string | null | undefined
```

### Pattern 2: Timestamps (ISO 8601)

```typescript
// 모든 날짜/시간은 ISO 8601 with timezone
z.string().datetime({ offset: true }); // "2024-03-15T14:30:00.000Z"
```

### Pattern 3: ULID validation

```typescript
z.string().ulid(); // ULID 형식 검증
```

### Pattern 4: Enum

```typescript
// shared/enums.ts
export const expenseStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// entities/expense.ts
import { expenseStatusEnum } from '../shared/enums';

export const expenseEntity = z.object({
  // ...
  status: expenseStatusEnum,
});
```

### Pattern 5: 확장 (앱별 필드 추가)

```typescript
// @repo/schema (base)
export const baseTripRequest = tripEntity.pick({
  id: true,
  name: true,
  startDate: true,
  endDate: true,
});

// apps/client (확장)
import { baseTripRequest } from '@repo/schema';

export const clientTripRequest = baseTripRequest.extend({
  localMetadata: z.string().optional(), // 클라이언트 전용 필드
  syncStatus: z.enum(['pending', 'synced']).optional(),
});
```

## ⚠️ Common Mistakes

### ❌ Mistake 1: ID 없이 createRequest 정의

```typescript
// ❌ 잘못됨: Client-Side ID 규칙 위반
export const createTripRequest = z.object({
  name: z.string(),
  startDate: z.string(),
  // id 없음!
});

// ✅ 올바름: id 포함
export const createTripRequest = tripEntity.pick({
  id: true, // Client-Side ID 필수
  name: true,
  startDate: true,
});
```

### ❌ Mistake 2: 타입 export

```typescript
// ❌ 잘못됨: 타입 직접 export
export type Trip = {
  id: string;
  name: string;
};

// ✅ 올바름: Schema export + z.infer
export const tripEntity = z.object({
  id: z.string().ulid(),
  name: z.string(),
});

export type Trip = z.infer<typeof tripEntity>;
```

### ❌ Mistake 3: 응답 구조 검증 실수

```typescript
// ❌ 잘못됨: 단일 객체만 검증
const newTrip = await db.insert(trips).values(data);
const validated = tripEntity.parse(newTrip); // success, data 없음!
res.json(validated);

// ✅ 올바름: 전체 응답 구조 검증
const newTrip = await db.insert(trips).values(data);
const response = { success: true, data: newTrip };
const validated = tripResponse.parse(response);
res.json(validated);
```

## 🗺️ Related Guides

**Context (빠른 참조):**

- [Root CLAUDE.md](../../CLAUDE.md) - @repo/schema 전체 정책
- [Client CLAUDE.md](../../apps/client/CLAUDE.md) - 클라이언트 사용법
- [Server CLAUDE.md](../../apps/server/CLAUDE.md) - 서버 사용법

**Detail (상세 가이드):**

- [TypeScript Guide](../../.claude/core/typescript.md) - TypeScript + Zod 패턴
- [Selective Activation Architecture](../../.claude/core/selective-activation-architecture.md) - Client-Side ID + sync_queue
- [API/Data Guide](../../.claude/core/api-data.md) - API 레이어 패턴

## ✅ Checklist: 새 Entity 추가시

```
Entity Schema:
□ Client-Side ID 필드 포함 (id, updatedAt, deletedAt, version)
□ 날짜 필드는 z.string().datetime({ offset: true })
□ DB 스키마와 1:1 매핑 확인

Request Schema:
□ createXxxRequest에 id 포함 (Client-Side ID 필수!)
□ updateXxxRequest는 partial
□ sync_queue.payload 타입으로 사용 확인

Response Schema:
□ { success, data } 구조
□ 단일: xxxResponse
□ 리스트: xxxListResponse

Export:
□ index.ts에 export 추가
□ pnpm build 실행
```
