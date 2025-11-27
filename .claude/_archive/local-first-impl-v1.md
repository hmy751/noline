# Noline - Echo 아키텍처 구현 가이드

> ⚠️ **아카이브 문서 (v1.0)**
>
> 이 문서는 **v1.0 Pure Local-First** 시대(2025-10 ~ 2025-11-05)의 구현 가이드입니다.
> **현재 아키텍처(v2.0 Selective Activation)**와 맞지 않습니다.
>
> **현재 가이드 참조:**
>
> - [selective-activation-architecture.md](../core/selective-activation-architecture.md) - v2.0 아키텍처
> - [policy-architecture.md](../core/policy-architecture.md) - v3.0 Policy Layer
> - [CHANGELOG.md](../CHANGELOG.md) - 정책 변경 히스토리
>
> **아카이브 사유:** Router 패턴 미반영, Repository 레이어 없음, 활성화 시스템 미반영

---

## 📌 개요

이 문서는 Noline 앱의 Echo 아키텍처(Local-First 동기화 시스템)를 실제로 구현하기 위한 상세 가이드입니다.

**기술 스택:**

- **ORM**: Drizzle (PostgreSQL, SQLite 모두 지원)
- **서버 DB**: PostgreSQL (Neon) - `apps/server`에 위치
- **로컬 DB**: SQLite (expo-sqlite)
- **ID 생성**: ULID (클라이언트 생성)
- **동기화**: Echo Outbox Pattern (sync_queue)
- **충돌 해결**: LWW (Last-Write-Wins) - 초기 구현, 고도화 시 version 필드 활용

---

## 📊 데이터베이스 스키마

### Drizzle 스키마 정의 (`shared/schema.ts`)

```typescript
import { pgTable, text, varchar, timestamp, integer, decimal } from 'drizzle-orm/pg-core';

// ============================================
// Echo Protocol (공통 필드)
// ============================================
// - id: ULID (클라이언트 생성)
// - updatedAt: Pull 동기화 기준, LWW 충돌 해결 기준
// - deletedAt: Soft Delete
// - version: 낙관적 잠금, 향후 고도화된 충돌 해결에 활용

// ============================================
// Trips 테이블
// ============================================
export const trips = pgTable('trips', {
  // Echo Protocol 필드
  id: text('id').primaryKey(),
  updatedAt: timestamp('updated_at').notNull(),
  deletedAt: timestamp('deleted_at'),
  version: integer('version').notNull().default(1),

  // 비즈니스 필드
  userId: varchar('user_id').notNull(),
  destination: text('destination').notNull(),
  country: text('country').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),

  // 레거시 필드 (제거 예정)
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// Schedules 테이블
// ============================================
export const schedules = pgTable('schedules', {
  id: text('id').primaryKey(),
  updatedAt: timestamp('updated_at').notNull(),
  deletedAt: timestamp('deleted_at'),
  version: integer('version').notNull().default(1),

  userId: varchar('user_id').notNull(),
  tripId: text('trip_id').notNull(),
  title: text('title').notNull(),
  location: text('location').notNull(),
  address: text('address'),
  date: text('date').notNull(),
  time: text('time').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// Expenses 테이블
// ============================================
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  updatedAt: timestamp('updated_at').notNull(),
  deletedAt: timestamp('deleted_at'),
  version: integer('version').notNull().default(1),

  userId: varchar('user_id').notNull(),
  tripId: text('trip_id').notNull(), // 경비-여행 직접 연결
  scheduleId: text('schedule_id'), // 일정 연결 (선택)
  title: text('title').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  category: text('category').notNull(),
  date: text('date').notNull(),
  hasReceipt: integer('has_receipt').notNull().default(0), // SQLite 호환
  receiptUrl: text('receipt_url'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// sync_queue 테이블 (Outbox Pattern)
// ============================================
export const syncQueue = pgTable('sync_queue', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  payload: text('payload'), // JSON 문자열
  status: text('status').notNull(), // 'PENDING', 'IN_PROGRESS', 'FAILED'
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  dependencies: text('dependencies'), // JSON: [id1, id2] (Phase 2용)
});
```

### ERD (Entity Relationship Diagram)

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─── 1:N ───┐
     │           ↓
     │      ┌─────────┐
     │      │  Trip   │
     │      └────┬────┘
     │           │
     ├─── 1:N ───┼─── 1:N ───┐
     │           │           ↓
     │           │      ┌──────────┐
     │           └────→ │ Schedule │
     │                  └─────┬────┘
     │                        │
     └─── 1:N ─────────── 1:N (optional)
                              ↓
                         ┌─────────┐
                         │ Expense │
                         └─────────┘
```

---

## 🔄 스키마 마이그레이션 전략

### ULID 혼합 모드 (점진적 마이그레이션)

**전략**: 기존 UUID 데이터와 새로운 ULID 데이터를 동시에 지원

```typescript
// 서버: 클라이언트가 ID 보내면 사용, 없으면 UUID 생성
import { randomUUID } from 'crypto';

async createTrip(insertTrip: InsertTrip): Promise<Trip> {
  const id = insertTrip.id || randomUUID(); // ULID 혼합 모드
  const now = new Date();
  const trip: Trip = {
    ...insertTrip,
    id,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    createdAt: now,
  };
  // ... 저장
}
```

**장점**:

- 기존 데이터 마이그레이션 불필요
- 클라이언트 점진적 업데이트 가능
- TEXT 컬럼이므로 ULID, UUID 모두 저장 가능

### Soft Delete 적용

**Hard Delete (기존):**

```typescript
// ❌ 데이터 영구 삭제
await db.delete(trips).where(eq(trips.id, id));
```

**Soft Delete (변경 후):**

```typescript
// ✅ deletedAt 타임스탬프만 설정
await db
  .update(trips)
  .set({
    deletedAt: new Date(),
    updatedAt: new Date(),
    version: sql`${trips.version} + 1`,
  })
  .where(eq(trips.id, id));
```

**조회 쿼리에 필터 추가:**

```typescript
// 모든 SELECT 쿼리
const activeTrips = await db
  .select()
  .from(trips)
  .where(
    and(
      eq(trips.userId, userId),
      isNull(trips.deletedAt), // 삭제되지 않은 항목만
    ),
  );
```

---

## 🏗️ 프로젝트 디렉토리 구조 및 아키텍처 원칙

### 계층 구조 (Layered Architecture)

```
@repo/ui → shared → features → screens → app
```

**의존성 규칙**: 상위 계층은 하위 계층에 의존할 수 있지만, 그 반대는 불가능합니다.

- ✅ `screens`는 `features`를 사용 가능
- ❌ `features`는 `screens`를 알 수 없음

### 각 계층의 역할

| 계층              | 역할               | 비유                 | 예시                   |
| ----------------- | ------------------ | -------------------- | ---------------------- |
| **app/**          | 라우팅 연결        | 초인종과 주소패 🚪   | `app/(tabs)/index.tsx` |
| **src/screens/**  | 화면 조립          | 인테리어 디자이너 🧑‍🎨 | `HomeScreen.tsx`       |
| **src/features/** | 기능 구현          | 가전제품 📺          | `create-trip-form/`    |
| **src/shared/**   | 앱 공용 라이브러리 | 미리 조립된 부품 ⚙️  | `components/TripCard`  |
| **packages/ui/**  | 디자인 시스템      | 레고 블록 🧱         | `Button`, `Input`      |

---

### 전체 디렉토리 구조

```
noline/
├── apps/
│   ├── client/                              # React Native (Expo) 앱
│   │   │
│   │   ├── app/                             # 🔵 1. 라우팅 연결 (초인종과 주소패 🚪)
│   │   │   │                                #    - URL 경로와 실제 화면을 연결하는 진입점
│   │   │   │                                #    - 파일 내 코드는 최소화, screens를 import하여 return만 수행
│   │   │   │
│   │   │   ├── _layout.tsx                  # 루트 레이아웃 (SyncProvider 래핑)
│   │   │   │
│   │   │   ├── (tabs)/                      # 탭 네비게이션 그룹
│   │   │   │   ├── _layout.tsx              # 탭 바 레이아웃
│   │   │   │   ├── index.tsx                # → HomeScreen
│   │   │   │   ├── schedules.tsx            # → SchedulesScreen
│   │   │   │   ├── expenses.tsx             # → ExpensesScreen
│   │   │   │   └── profile.tsx              # → ProfileScreen
│   │   │   │
│   │   │   ├── trip/
│   │   │   │   └── [id].tsx                 # → TripDetailScreen
│   │   │   │
│   │   │   ├── add-trip.tsx                 # → AddTripScreen (모달)
│   │   │   ├── add-schedule.tsx             # → AddScheduleScreen (모달)
│   │   │   └── add-expense.tsx              # → AddExpenseScreen (모달)
│   │   │
│   │   └── src/
│   │       │
│   │       ├── screens/                     # 🔵 2. 화면 조립 (인테리어 디자이너 🧑‍🎨)
│   │       │   │                            #    - features와 shared를 조합하여 완전한 화면 구성
│   │       │   │                            #    - 비즈니스 로직은 features에 위임
│   │       │   │
│   │       │   ├── HomeScreen.tsx           # 여행 목록 화면
│   │       │   ├── SchedulesScreen.tsx      # 일정 목록 화면
│   │       │   ├── ExpensesScreen.tsx       # 경비 목록 화면
│   │       │   ├── ProfileScreen.tsx        # 프로필 화면
│   │       │   ├── TripDetailScreen.tsx     # 여행 상세 화면
│   │       │   ├── AddTripScreen.tsx        # 여행 추가 화면
│   │       │   ├── AddScheduleScreen.tsx    # 일정 추가 화면
│   │       │   └── AddExpenseScreen.tsx     # 경비 추가 화면
│   │       │
│   │       ├── features/                    # 🔵 3. 기능 구현 (가전제품 📺)
│   │       │   │                            #    - 비즈니스 로직이 포함된 독립적인 기능 단위
│   │       │   │                            #    - 액션(Action) 중심으로 구성
│   │       │   │
│   │       │   ├── create-trip-form/        # 여행 생성 폼
│   │       │   │   ├── index.tsx            # 메인 컴포넌트 (Form UI)
│   │       │   │   ├── useCreateTrip.ts     # useMutation: DB 저장 + sync_queue
│   │       │   │   └── schema.ts            # Zod 유효성 검사
│   │       │   │
│   │       │   ├── edit-trip-form/          # 여행 수정 폼
│   │       │   │   ├── index.tsx
│   │       │   │   ├── useUpdateTrip.ts
│   │       │   │   └── schema.ts
│   │       │   │
│   │       │   ├── delete-trip-button/      # 여행 삭제 버튼
│   │       │   │   ├── index.tsx
│   │       │   │   └── useDeleteTrip.ts
│   │       │   │
│   │       │   ├── create-schedule-form/    # 일정 생성 폼
│   │       │   │   ├── index.tsx
│   │       │   │   ├── useCreateSchedule.ts
│   │       │   │   └── schema.ts
│   │       │   │
│   │       │   ├── create-expense-form/     # 경비 생성 폼
│   │       │   │   ├── index.tsx
│   │       │   │   ├── useCreateExpense.ts
│   │       │   │   ├── schema.ts
│   │       │   │   └── OCRScanner.tsx       # OCR 기능 포함
│   │       │   │
│   │       │   └── user-login-form/         # 로그인 폼
│   │       │       ├── index.tsx
│   │       │       ├── useLogin.ts
│   │       │       └── schema.ts
│   │       │
│   │       └── shared/                      # 🔵 4. 앱 공용 라이브러리 (미리 조립된 부품 ⚙️)
│   │           │                            #    - 여러 화면과 기능에서 재사용되는 요소
│   │           │                            #    - packages/ui의 컴포넌트를 조합하여 앱 특화 컴포넌트 생성
│   │           │
│   │           ├── components/              # 공통 UI 컴포넌트
│   │           │   ├── MobileHeader.tsx     # 헤더 (뒤로가기 + 제목)
│   │           │   ├── TripCard.tsx         # 여행 카드 (재사용)
│   │           │   ├── TripSelector.tsx     # 여행 선택 드롭다운
│   │           │   ├── ScheduleCard.tsx     # 일정 카드
│   │           │   ├── ExpenseCard.tsx      # 경비 카드
│   │           │   ├── CategoryBadge.tsx    # 카테고리 배지
│   │           │   └── NetworkStatusBanner.tsx  # 네트워크 상태 표시
│   │           │
│   │           ├── hooks/                   # 공통 훅
│   │           │   ├── useNetworkStatus.ts  # 네트워크 상태 감지
│   │           │   ├── useTrips.ts          # useQuery: 여행 목록 조회
│   │           │   ├── useSchedules.ts      # useQuery: 일정 목록 조회
│   │           │   └── useExpenses.ts       # useQuery: 경비 목록 조회
│   │           │
│   │           ├── db/                      # ✨ 로컬 DB 레이어
│   │           │   ├── index.ts             # Drizzle 클라이언트 초기화
│   │           │   ├── schema.ts            # SQLite 테이블 스키마 정의
│   │           │   ├── migrations/          # DB 마이그레이션
│   │           │   │   ├── 0001_initial.sql
│   │           │   │   └── meta/
│   │           │   └── utils.ts             # 트랜잭션 헬퍼
│   │           │
│   │           ├── services/                # ✨ 핵심 비즈니스 로직
│   │           │   │
│   │           │   ├── sync/                # 동기화 엔진
│   │           │   │   ├── engine.ts        # Sync Engine 메인 로직
│   │           │   │   ├── queue.ts         # sync_queue 조작 (Outbox Pattern)
│   │           │   │   ├── api.ts           # 동기화 전용 API 클라이언트
│   │           │   │   ├── provider.tsx     # SyncProvider (전역 동기화 관리)
│   │           │   │   └── types.ts         # 동기화 관련 타입
│   │           │   │
│   │           │   ├── trips/               # 여행 CRUD 서비스
│   │           │   │   └── tripService.ts   # 로컬 DB CRUD 함수
│   │           │   │
│   │           │   ├── schedules/           # 일정 CRUD 서비스
│   │           │   │   └── scheduleService.ts
│   │           │   │
│   │           │   ├── expenses/            # 경비 CRUD 서비스
│   │           │   │   └── expenseService.ts
│   │           │   │
│   │           │   └── id/                  # ID 생성
│   │           │       └── ulid.ts          # ULID 생성 헬퍼
│   │           │
│   │           ├── constants/
│   │           │   ├── categories.ts        # 경비 카테고리
│   │           │   └── sync.ts              # 동기화 설정
│   │           │
│   │           ├── types/
│   │           │   └── index.ts             # 공통 타입
│   │           │
│   │           └── utils/
│   │               ├── date.ts              # 날짜 포맷팅
│   │               └── currency.ts          # 통화 포맷팅
│   │
│   └── server/                              # Express.js API 서버
│       ├── src/
│       │   ├── routes/
│       │   │   ├── trips.ts
│       │   │   ├── schedules.ts
│       │   │   ├── expenses.ts
│       │   │   └── sync.ts                  # ✨ /sync/push, /sync/pull
│       │   ├── services/
│       │   │   └── sync/
│       │   │       ├── push.ts              # Push 요청 처리
│       │   │       └── pull.ts              # Pull 요청 처리
│       │   └── index.ts
│       └── package.json
│
└── packages/                                # 🔵 5. 디자인 시스템 (레고 블록 🧱)
    │                                        #    - 모든 프로젝트에서 재사용 가능한 순수 UI 컴포넌트
    │
    ├── ui/                                  # 디자인 시스템
    │   ├── src/
    │   │   ├── Button.tsx                   # 순수 Button (스타일링만)
    │   │   ├── Input.tsx
    │   │   ├── Card.tsx
    │   │   ├── Avatar.tsx
    │   │   └── ImageBox.tsx
    │   └── package.json
    │
    ├── schema/                              # ✨ Zod 스키마 (클라이언트 ↔ 서버 공유)
    │   ├── src/
    │   │   ├── trip.ts                      # tripSchema, insertTripSchema
    │   │   ├── schedule.ts
    │   │   ├── expense.ts
    │   │   └── sync.ts                      # syncQueueSchema
    │   └── package.json
    │
    └── db/                                  # Drizzle 설정 (서버 PostgreSQL)
        └── ...
```

---

### 📖 Walkthrough: '프로필 수정' 기능 추가하기

새로운 기능을 추가할 때는 다음 순서로 작업합니다:

**1. Feature 생성 (비즈니스 로직)**

```bash
src/features/edit-profile-form/
├── index.tsx              # 프로필 수정 폼 UI
├── useUpdateProfile.ts    # useMutation: DB 업데이트 + sync_queue
└── schema.ts              # Zod 유효성 검사
```

**2. Screen 생성 (화면 조립)**

```typescript
// src/screens/EditProfileScreen.tsx
import { MobileHeader } from '@/shared/components/MobileHeader';
import EditProfileForm from '@/features/edit-profile-form';

export default function EditProfileScreen() {
  return (
    <>
      <MobileHeader title="프로필 수정" />
      <EditProfileForm />
    </>
  );
}
```

**3. Route 생성 (라우팅 연결)**

```typescript
// app/profile/edit.tsx
import EditProfileScreen from '@/screens/EditProfileScreen';

export default function EditProfileRoute() {
  return <EditProfileScreen />;
}
```

---

## 🎯 1단계: 로컬 DB 레이어 구축

### 1.1 Drizzle 설정 (`src/shared/db/index.ts`)

```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite/next';
import * as schema from './schema';

const expoDb = openDatabaseSync('noline.db');

export const db = drizzle(expoDb, { schema });

// DB 초기화 함수
export async function initializeDatabase() {
  try {
    // 마이그레이션 실행
    await runMigrations();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
```

### 1.2 스키마 정의 (`src/shared/db/schema.ts`)

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ========================================
// Trips 테이블
// ========================================
export const trips = sqliteTable('trips', {
  // 공통 필드
  id: text('id').primaryKey(), // ULID
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  version: integer('version').default(1).notNull(),

  // 비즈니스 필드
  userId: text('user_id').notNull(),
  destination: text('destination').notNull(),
  country: text('country').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
});

// ========================================
// Schedules 테이블
// ========================================
export const schedules = sqliteTable('schedules', {
  // 공통 필드
  id: text('id').primaryKey(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  version: integer('version').default(1).notNull(),

  // 비즈니스 필드
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id),
  title: text('title').notNull(),
  location: text('location'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  order: integer('order').notNull(),
});

// ========================================
// Expenses 테이블
// ========================================
export const expenses = sqliteTable('expenses', {
  // 공통 필드
  id: text('id').primaryKey(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
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
  spentAt: integer('spent_at', { mode: 'timestamp' }).notNull(),
  memo: text('memo'),
});

// ========================================
// sync_queue 테이블 (Outbox Pattern)
// ========================================
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(), // 작업 고유 ID (ULID)
  tableName: text('table_name').notNull(), // 'trips', 'schedules', 'expenses'
  recordId: text('record_id').notNull(), // 변경된 레코드의 ID
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  payload: text('payload', { mode: 'json' }), // JSON 데이터
  status: text('status').notNull(), // 'PENDING', 'IN_PROGRESS', 'FAILED'
  retryCount: integer('retry_count').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  dependencies: text('dependencies', { mode: 'json' }), // Phase 2용
});

// ========================================
// 타입 추출
// ========================================
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;
```

### 1.3 트랜잭션 헬퍼 (`src/shared/db/utils.ts`)

```typescript
import { db } from './index';

/**
 * 원자적 트랜잭션 헬퍼
 * 데이터 변경 + sync_queue 기록을 하나의 트랜잭션으로 묶음
 */
export async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    return await callback();
  });
}
```

---

## 🔄 2단계: sync_queue 조작 로직 (Outbox Pattern)

### `src/shared/services/sync/queue.ts`

```typescript
import { ulid } from 'ulid';
import { db } from '@/shared/db';
import { syncQueue, type NewSyncQueueItem } from '@/shared/db/schema';

/**
 * sync_queue에 작업 추가
 */
export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  payload?: any,
) {
  const queueItem: NewSyncQueueItem = {
    id: ulid(),
    tableName,
    recordId,
    action,
    payload: payload ? JSON.stringify(payload) : null,
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date(),
  };

  await db.insert(syncQueue).values(queueItem);
}

/**
 * PENDING 상태의 작업 조회
 */
export async function getPendingTasks() {
  return db.select().from(syncQueue).where(eq(syncQueue.status, 'PENDING')).orderBy(syncQueue.createdAt);
}

/**
 * 작업 상태 업데이트
 */
export async function updateTaskStatus(taskId: string, status: 'IN_PROGRESS' | 'FAILED', retryCount?: number) {
  await db
    .update(syncQueue)
    .set({
      status,
      retryCount,
    })
    .where(eq(syncQueue.id, taskId));
}

/**
 * 작업 삭제 (동기화 성공 시)
 */
export async function deleteTask(taskId: string) {
  await db.delete(syncQueue).where(eq(syncQueue.id, taskId));
}
```

---

## 🪝 3단계: React Query 훅 구현 예시

### `src/features/expenses/hooks/useCreateExpense.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ulid } from 'ulid';
import { insertExpenseSchema } from '@noline/schema';
import { db } from '@/shared/db';
import { expenses } from '@/shared/db/schema';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { withTransaction } from '@/shared/db/utils';

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertExpense) => {
      // 1. ULID 생성
      const id = ulid();

      // 2. Zod 검증
      const validated = insertExpenseSchema.parse(data);

      // 3. 원자적 트랜잭션: 데이터 저장 + sync_queue 기록
      await withTransaction(async () => {
        // 3-1. expenses 테이블에 저장
        await db.insert(expenses).values({
          id,
          ...validated,
          updatedAt: new Date(),
          version: 1,
        });

        // 3-2. sync_queue에 기록
        await addToSyncQueue('expenses', id, 'CREATE', validated);
      });

      return { id, ...validated };
    },

    onSuccess: () => {
      // 4. React Query 캐시 무효화 → UI 즉시 갱신
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },

    onError: (error) => {
      console.error('Failed to create expense:', error);
      // 에러 처리 (토스트 메시지 등)
    },
  });
}
```

### `src/features/expenses/hooks/useExpenses.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { db } from '@/shared/db';
import { expenses } from '@/shared/db/schema';
import { eq, isNull } from 'drizzle-orm';

export function useExpenses(tripId?: string) {
  return useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      // 로컬 DB에서 조회 (소프트 삭제된 항목 제외)
      let query = db.select().from(expenses).where(isNull(expenses.deletedAt));

      if (tripId) {
        query = query.where(eq(expenses.tripId, tripId));
      }

      return await query;
    },
  });
}
```

---

## 🔁 4단계: 동기화 엔진 구현

### `src/shared/services/sync/api.ts`

```typescript
import axios from 'axios';

const syncApiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

// Request Interceptor: 인증 토큰 추가
syncApiClient.interceptors.request.use((config) => {
  const token = getAuthToken(); // AsyncStorage에서 가져오기
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: 자동 재시도
// 참고: 전역 상태(setSyncStatus)를 업데이트하지 않음
// 네트워크 상태는 useNetworkStatus 훅이 NetInfo + Heartbeat로 관리
syncApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 재시도 가능한 에러인지 확인
    if (shouldRetry(error) && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        // Exponential Backoff
        const delay = 2000 * Math.pow(2, originalRequest._retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        console.log(`🔄 Retrying request (${originalRequest._retryCount}/3)`);
        return syncApiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

function shouldRetry(error: any): boolean {
  // 네트워크 완전 끊김은 재시도 안 함
  if (error.code === 'ERR_NETWORK') return false;

  // 타임아웃, 5xx 에러는 재시도
  return error.code === 'ECONNABORTED' || (error.response?.status >= 500 && error.response?.status < 600);
}

export default syncApiClient;
```

### `src/shared/services/sync/engine.ts`

```typescript
import syncApiClient from './api';
import { getPendingTasks, deleteTask, updateTaskStatus } from './queue';
import { db } from '@/shared/db';
import { trips, schedules, expenses } from '@/shared/db/schema';

/**
 * Push: 로컬 변경사항을 서버로 전송
 */
export async function pushChanges() {
  const tasks = await getPendingTasks();

  console.log(`📤 Pushing ${tasks.length} tasks...`);

  for (const task of tasks) {
    try {
      // 상태를 IN_PROGRESS로 변경
      await updateTaskStatus(task.id, 'IN_PROGRESS');

      // 서버로 Push
      await syncApiClient.post('/sync/push', {
        tableName: task.tableName,
        recordId: task.recordId,
        action: task.action,
        payload: task.payload,
      });

      // 성공 시 큐에서 삭제
      await deleteTask(task.id);
      console.log(`✅ Task ${task.id} completed`);
    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error);

      // 실패 시 상태 업데이트
      await updateTaskStatus(task.id, 'FAILED', task.retryCount + 1);
    }
  }
}

/**
 * Pull: 서버에서 최신 데이터 가져오기
 */
export async function pullChanges(lastSyncedAt: Date | null) {
  try {
    console.log('📥 Pulling changes from server...');

    const response = await syncApiClient.get('/sync/pull', {
      params: {
        lastSyncedAt: lastSyncedAt?.toISOString(),
      },
    });

    const { trips: newTrips, schedules: newSchedules, expenses: newExpenses } = response.data;

    // Upsert: 로컬 DB 업데이트
    if (newTrips?.length > 0) {
      for (const trip of newTrips) {
        await db.insert(trips).values(trip).onConflictDoUpdate({
          target: trips.id,
          set: trip,
        });
      }
    }

    if (newSchedules?.length > 0) {
      for (const schedule of newSchedules) {
        await db.insert(schedules).values(schedule).onConflictDoUpdate({
          target: schedules.id,
          set: schedule,
        });
      }
    }

    if (newExpenses?.length > 0) {
      for (const expense of newExpenses) {
        await db.insert(expenses).values(expense).onConflictDoUpdate({
          target: expenses.id,
          set: expense,
        });
      }
    }

    console.log('✅ Pull completed');

    // 마지막 동기화 시간 저장
    await saveLastSyncedAt(new Date());
  } catch (error) {
    console.error('❌ Pull failed:', error);
  }
}
```

### `src/shared/services/sync/provider.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { pushChanges, pullChanges } from './engine';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const networkStatus = useNetworkStatus();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // 네트워크 상태 변경 시 동기화
  useEffect(() => {
    if (networkStatus === 'online') {
      syncData();
    }
  }, [networkStatus]);

  // 앱이 포그라운드로 돌아올 때 동기화
  useEffect(() => {
    const activation = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && networkStatus === 'online') {
        syncData();
      }
    });

    return () => activation.remove();
  }, [networkStatus]);

  // 주기적 동기화 (5분마다)
  useEffect(() => {
    if (networkStatus !== 'online') return;

    const interval = setInterval(() => {
      syncData();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [networkStatus]);

  const syncData = async () => {
    console.log('🔄 Starting sync...');
    await pushChanges();
    await pullChanges(lastSyncedAt);
    setLastSyncedAt(new Date());
  };

  return <>{children}</>;
}
```

---

## 🌐 5단계: 네트워크 상태 감지

### `src/shared/hooks/useNetworkStatus.ts`

**네트워크 상태 관리 전략:**

- **NetInfo**: 디바이스 네트워크 연결 감지
- **Heartbeat**: 서버 실제 연결 확인 (30초마다)
- **상태**: `'online' | 'offline' | 'unstable'`
- **UI 반영**: `NetworkStatusBanner` 컴포넌트가 이 훅을 사용

```typescript
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

type NetworkStatus = 'online' | 'offline' | 'unstable';

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>('online');

  useEffect(() => {
    // NetInfo 리스너: 디바이스 네트워크 상태 감지
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        setStatus('offline');
      } else if (state.isInternetReachable === false) {
        setStatus('unstable');
      } else {
        setStatus('online');
      }
    });

    return () => unsubscribe();
  }, []);

  // Heartbeat: 서버 실제 연결 확인 (30초마다)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`, {
          method: 'HEAD',
          timeout: 5000,
        });

        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('unstable');
        }
      } catch {
        setStatus('offline');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
```

---

## 📱 6단계: 앱 초기화

### `app/_layout.tsx`

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/hooks/useQueryClient';
import { SyncProvider } from '@/shared/services/sync/provider';
import { initializeDatabase } from '@/shared/db';

export default function RootLayout() {
  useEffect(() => {
    // 앱 시작 시 DB 초기화
    initializeDatabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SyncProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-trip" options={{ title: '여행 추가' }} />
          <Stack.Screen name="add-schedule" options={{ title: '일정 추가' }} />
          <Stack.Screen name="add-expense" options={{ title: '경비 추가' }} />
        </Stack>
      </SyncProvider>
    </QueryClientProvider>
  );
}
```

---

## 🎯 핵심 구현 포인트

### 1. **모든 데이터 작업은 React Query를 통해**

```typescript
// ❌ 잘못된 예시: 직접 서비스 호출
const handleCreate = async () => {
  await createExpense(data); // UI가 즉시 갱신되지 않음
};

// ✅ 올바른 예시: React Query 사용
const { mutate } = useCreateExpense();
const handleCreate = () => {
  mutate(data); // 낙관적 업데이트, 에러 처리 자동
};
```

### 2. **트랜잭션으로 데이터 안전성 보장**

```typescript
// 데이터 저장 + sync_queue 기록을 하나의 트랜잭션으로
await withTransaction(async () => {
  await db.insert(expenses).values(newExpense);
  await addToSyncQueue('expenses', id, 'CREATE', newExpense);
});
```

**💡 Phase 1에서 배우는 것:**

- 트랜잭션 없이 구현하면 어떤 일이 발생하는가?
  - `expenses` 저장 성공 → `sync_queue` 저장 실패 시, UI에는 데이터가 보이지만 동기화 목록에는 없음
  - 반대의 경우도 마찬가지로 데이터 정합성 깨짐

### 3. **Axios Interceptor로 네트워크 안정성 확보**

- 타임아웃, 5xx 에러 시 자동 재시도
- Exponential Backoff (2초, 4초, 8초)
- 최대 3회 재시도

**💡 Phase 2에서 배우는 것:**

- FIFO 순서 보장이 왜 중요한가?
  - 오프라인에서 "여행 생성 → 경비 생성" 순서가 깨지면 서버에서 외래키 에러 발생
  - `sync_queue`는 반드시 `createdAt` 기준 오름차순으로 처리 필요

### 4. **활성화 시스템 (Phase 3에서 구현)**

```typescript
// sync_queue 추가 시 활성화 여부 확인
if (!isSubscribed(tripId) && queueCount >= 10) {
  showActivationPrompt();
  return; // 더 이상 큐에 추가하지 않음
}
```

---

## 🚨 예상 이슈 및 학습 포인트 (포트폴리오용)

### Phase 1: 기반 구축

**겪게 될 문제:**

1. ❌ "UI는 즉각적인데, 데이터는 어디에 쌓이고 있지?"
   - `sync_queue` 테이블에 작업이 계속 쌓이기만 함
   - 해결: 동기화 엔진의 필요성 자연스럽게 체감

2. ❌ "트랜잭션 없이 하면 어떻게 되지?"
   - 중간에 실패하면 데이터 정합성 깨짐
   - 해결: `withTransaction` 헬퍼로 원자성 보장

3. ❌ "React Query 캐시가 갱신이 안 돼요!"
   - `queryKey` 무효화 타이밍 실수
   - 해결: `onSuccess`에서 정확한 `queryKey` 무효화

---

### Phase 2: 동기화 엔진

**겪게 될 문제:**

1. ❌ "서버 동기화 실패했는데 UI는 성공한 것처럼 보여요"
   - 낙관적 업데이트의 배신
   - 해결: 실패 시 사용자 알림 + 롤백 로직 또는 `sync_queue` 상태 표시

2. ❌ "여행 생성 전에 경비가 먼저 동기화돼서 서버 에러 나요"
   - FIFO 순서 미보장
   - 해결: `sync_queue`를 `createdAt` 기준 오름차순 처리

3. ❌ "사용자가 매번 '동기화' 버튼을 눌러야 해요"
   - 수동 동기화의 불편함
   - 해결: Phase 3에서 자동화

---

### Phase 3: 고도화

**겪게 될 문제:**

1. ❌ "앱이 꺼져있을 때도 동기화하고 싶은데..."
   - React Native 환경의 제약
   - 해결: 네이티브 백그라운드 작업 필요 (제약 인정하고 현실적 대안 선택)

2. ❌ "상태가 너무 많아서 관리가 힘들어요"
   - 데이터 상태 + 캐시 상태 + 동기화 상태 + 네트워크 상태
   - 해결: Zustand 같은 전역 상태 관리 도입

3. ❌ "오프라인 시나리오 테스트를 어떻게 하죠?"
   - 테스트 전략의 어려움
   - 해결: Mock 서버, 네트워크 시뮬레이터, 통합 테스트

---

## 🚀 다음 단계

1. **Phase 2 마이그레이션 실행**: 스키마 변경 적용
2. **테스트 작성**: 트랜잭션, sync_queue 로직 검증
3. **React Native 프로젝트 생성**: Expo 초기 설정
4. **점진적 마이그레이션**: Feature 단위로 웹 → 모바일 이식

---

**작성일**: 2025-10-19  
**참고 문서**: [PRD.md](./PRD.md), [Local-First 아키텍처](./attached_assets/Pasted--1-Core-Policies-Local-First-UI-DB-SQLite--1760889948065_1760889948066.txt)
