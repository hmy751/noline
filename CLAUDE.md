# 🧭 Noline Project Guide

> **Noline**: 네트워크가 없어도 여행은 계속된다 - Local-First 여행 관리 앱

---

## 🎯 AI & Developer Navigation Hub

> **빠른 시작**: 하려는 작업을 찾아 바로 이동하세요

### ⚡ Most Common Tasks

| 하려는 작업         | 바로 가기                             | 예상 시간 |
| ------------------- | ------------------------------------- | --------- |
| 🔧 동기화 버그 수정 | [→ Sync Debugging](#sync-debug)       | 2분       |
| ➕ 새 Entity 추가   | [→ Add Entity](#add-entity)           | 5분       |
| 🕐 날짜/시간 처리   | [→ DateTime Utils](#datetime-utils)   | 1분       |
| 💰 통화 표시        | [→ Currency Utils](#currency-utils)   | 1분       |
| 📝 Form 구현        | [→ Form Pattern](#form-pattern)       | 3분       |
| 🎨 UI 컴포넌트      | [→ Component Guide](#component-guide) | 3분       |
| 🌐 API 추가         | [→ API Endpoint](#api-endpoint)       | 5분       |

### 📚 Deep Dive Documentation

**핵심 가이드** (반드시 읽기):

| 문서                                                            | 깊이   | 라인수 | 언제          | 내용                  |
| --------------------------------------------------------------- | ------ | ------ | ------------- | --------------------- |
| [local-architecture.md](./.claude/core/local-architecture.md)   | 🔥🔥🔥 | ~1,865 | Sync 작업시   | Local-First 전체 흐름 |
| [time.md](./.claude/core/time.md)                               | 🔥🔥   | ~1,005 | 날짜 작업시   | 시간 처리 완전 가이드 |
| [activation-system.md](./.claude/features/activation-system.md) | 🔥🔥   | ~1,497 | 활성화 작업시 | Offline-Prep Router   |

**작업별 가이드** (필요시 읽기):

| 문서                                                  | 깊이 | 언제            | 내용              |
| ----------------------------------------------------- | ---- | --------------- | ----------------- |
| [typescript.md](./.claude/core/typescript.md)         | 🔥   | 타입 작성시     | Schema-First 패턴 |
| [api-data.md](./.claude/core/api-data.md)             | 🔥   | API 작업시      | React Query, Keys |
| [components.md](./.claude/core/components.md)         | 🔥   | 컴포넌트 작성시 | 작성 규칙         |
| [error-handling.md](./.claude/core/error-handling.md) | 🔥   | 에러 처리시     | 에러 패턴         |
| [architecture.md](./.claude/core/architecture.md)     | 🔥   | 파일 위치시     | FSD 구조          |

**Workspace 가이드** (작업 위치별):

| 가이드                                          | 언제          | 내용              |
| ----------------------------------------------- | ------------- | ----------------- |
| [Client CLAUDE.md](./apps/client/CLAUDE.md)     | Client 작업시 | React Native 패턴 |
| [Server CLAUDE.md](./apps/server/CLAUDE.md)     | Server 작업시 | Express API       |
| [Schema CLAUDE.md](./packages/schema/CLAUDE.md) | Entity 추가시 | 타입 계약         |
| [UI CLAUDE.md](./packages/ui/CLAUDE.md)         | UI 작업시     | 컴포넌트 철학     |

---

## 📖 Documentation Philosophy

> **핵심**: 맥락 있는 간략화 - "왜"를 한 문장으로라도

### 문서 구조 원칙

1. **Level 1 (30초)**: 핵심만 빠르게 파악
2. **Level 2 (5분)**: 실제 작업에 필요한 패턴
3. **Level 3 (필요시)**: 상세 문서로 Deep Dive

### 유지보수 원칙

- **Single Source**: Root CLAUDE.md 하나로 충분하도록
- **Code-First**: 추상적 원칙보다 구체적 사용법
- **Task-Oriented**: 목적별로 빠르게 찾을 수 있게
- **Context Preserved**: 간략화해도 맥락은 유지, 상세 링크 제공
- **Always Updated**: 코드 변경 시 문서도 함께 업데이트

---

## 📌 Project Identity

**Noline**은 오프라인 환경에서도 완벽하게 작동하는 여행 관리 모바일 앱입니다.

- **Local-First Architecture**: 모든 데이터는 로컬 SQLite가 진실의 원천
- **Echo Protocol**: 클라이언트가 ID (ULID) 생성하고 서버는 그대로 수용
- **@repo/schema**: 클라이언트-서버 공유 타입 계약 (Source of Truth)
- **Offline Subscription**: 여행 기간 동안 자동 동기화

---

## 📦 @repo/schema 계약 레벨

> **핵심**: Entity는 강제 계약, Request/Response는 확장 가능

### 계약(Contract) 관점

| 레벨     | 스키마 타입       | 자유도       | 역할                          |
| -------- | ----------------- | ------------ | ----------------------------- |
| **필수** | Entity            | ❌ 변경 불가 | 도메인 모델, 모두가 준수      |
| **기본** | Request/Response  | ✅ 확장 가능 | 기본 구조 제공, 필요시 extend |
| **내부** | 각 앱 고유 스키마 | ✅ 완전 자유 | sync_queue 등 앱별 특화       |

### 사용 예시

```typescript
// @repo/schema에서 import
import { tripEntity, baseTripRequest } from '@repo/schema';

// Entity는 그대로 사용 (계약 준수)
export { tripEntity };

// Request는 필요시 확장
export const createTripRequest = baseTripRequest.extend({
  localField: z.string(), // 앱 특화 필드 추가
});
```

### 사용 규칙

**정책: schema만 export, 타입은 z.infer 사용**

```typescript
// ❌ 잘못된 방법
import { type User } from '@repo/schema/entities/user';

// ✅ 올바른 방법
import { userEntity } from '@repo/schema/entities/user';
import { z } from 'zod';

type User = z.infer<typeof userEntity>;
```

**이유**:

- Schema가 Single Source of Truth (유일한 타입의 출처)
- Schema와 타입의 완벽한 동기화 보장
- 런타임 검증과 타입이 항상 일치

**상세**: [Schema CLAUDE.md](./packages/schema/CLAUDE.md)

---

## ⚡ Quick Start (30초 - Level 1)

**What**: Local-First 여행 관리 모바일 앱
**How**: 활성화된 여행은 로컬, 비활성은 서버로 자동 라우팅
**Key**: Offline-Prep Router가 모든 데이터 흐름 제어

**Most Used Functions**:

```typescript
// 1. 데이터 접근 (Router - 31회 사용)
routeTripQuery({ local, remote });
routeTripMutation({ local, remote });
// 💡 Why: 활성화 상태에 따라 로컬/서버 자동 라우팅. 수동으로 하면 매번 if문 필요

// 2. 원자적 트랜잭션 (25회 사용)
withTransaction(async () => {
  await db.insert(...);
  await addToSyncQueue(...);
});
// 💡 Why: 둘 중 하나만 성공하면 동기화 영구 실패. 실제 버그 사례 있음

// 3. 날짜 표시 (Time Utils - 59회 사용)
formatISOToLocalDate(iso);  // "2024-03-15"
formatISOToLocalTime(iso);  // "14:30"
// 💡 Why: new Date().toLocaleDateString() 7개 파일 중복 발견. 일관성 필요

// 4. 통화 표시 (Currency Utils - 59회 사용)
formatCurrencyDisplay(amount, currency);  // "KRW 1,234,567"
// 💡 Why: 통화별 포맷 다름 (KRW는 소수점 없음, USD는 있음)

// 5. ID 생성 (React Native 호환)
generateId();  // ✅ ulid() wrapper
// 💡 Why: ulid 직접 사용 시 React Native 환경 에러 가능
```

---

## 🎯 Task-Oriented Guides (Level 2 - 빠른 가이드)

### <a id="add-entity"></a>➕ Add New Entity (Trip/Schedule/Expense)

<details>
<summary><strong>전체 체크리스트 (5분)</strong></summary>

**읽기 순서**: 처음이면 전체, 익숙하면 Step 3만

#### Step 1: Schema 정의

```typescript
// packages/schema/src/entities/newEntity.ts
export const newEntitySchema = z.object({
  id: z.string(),
  // ... fields
});

// 💡 Why: @repo/schema가 클라이언트-서버 타입 계약의 Single Source of Truth
```

#### Step 2: Query Keys Factory (놓치기 쉬움!)

```typescript
// entities/newEntity/data/keys.ts
export const newEntityQueryKeys = {
  base: ['newEntity'] as const,
  all: () => [...newEntityQueryKeys.base, 'all'] as const,
  byId: (id: string) => [...newEntityQueryKeys.base, id] as const,
};

// 💡 Why: React Query 캐시 무효화에 필수. 없으면 UI 업데이트 안 됨
```

#### Step 3: Router 사용 (가장 중요!)

```typescript
import { routeTripQuery, routeTripMutation } from '@/shared/services/offline-prep/router';

// ✅ 올바른 패턴
await routeTripQuery({
  local: () => db.select().from(newEntity),
  remote: () => api.get('/newEntity'),
});

// ❌ 흔한 실수 - Router 미사용
const data = await db.select().from(newEntity);
// 문제: 활성화 체크 누락 → 활성화된 여행이 오프라인에서 데이터 못 찾음
```

#### Step 4: Mutation with Transaction

```typescript
import { withTransaction } from '@/shared/db/utils';

await routeTripMutation({
  local: () =>
    withTransaction(async () => {
      await db.insert(newEntity).values(data);
      await addToSyncQueue('newEntity', id, 'CREATE', data);
    }),
  remote: () => api.post('/newEntity', data),
});

// 💡 Why: DB와 sync_queue 둘 다 성공 or 둘 다 실패. 원자성 보장
// 실제 버그 사례: DB 성공 + sync_queue 실패 → 서버 동기화 안 됨
```

**디버깅 팁**:

- sync_queue 테이블 확인: `SELECT * FROM sync_queue WHERE status = 'pending'`
- 활성화 상태 확인: `getTripActivationStatusDetail(tripId)`

**상세 가이드**:

- [Schema CLAUDE.md](./packages/schema/CLAUDE.md) - 스키마 정의 상세
- [local-architecture.md](./.claude/core/local-architecture.md) - 전체 아키텍처

</details>

### <a id="sync-debug"></a>🔧 Debug Sync Issues

<details>
<summary><strong>체크리스트 (2분)</strong></summary>

**대부분의 동기화 문제는 이 3가지**:

#### 1. Router 사용 확인

```typescript
// 🔍 찾아볼 안티패턴
await db.select(); // ❌ Router 없이 직접 접근
await api.get(); // ❌ Router 없이 직접 호출

// ✅ 올바른 패턴
await routeTripQuery({
  local: () => db.select().from(trips),
  remote: () => api.get('/trips'),
});

// 💡 놓치면: 활성화된 여행은 로컬에만 있는데 서버 API 호출 → 404 에러
```

#### 2. Transaction 확인

```typescript
// 🔍 찾아볼 안티패턴
await db.insert(trips).values(data);
await addToSyncQueue(...);  // ❌ 따로 실행

// ✅ 올바른 패턴
await withTransaction(async () => {
  await db.insert(trips).values(data);
  await addToSyncQueue(...);
});

// 💡 실제 버그 사례: DB insert 성공 → addToSyncQueue 실패 → 데이터는 있는데 서버 전송 안 됨
```

#### 3. 활성화 상태 확인

```typescript
// 디버깅 코드
import { getTripActivationStatusDetail } from '@/shared/services/offline-prep/metadata';

const status = await getTripActivationStatusDetail(tripId);
console.log(status);
// {
//   isActivated: true,
//   hasLocalData: true,
//   activatedAt: "2024-03-15T10:00:00Z",
//   ...
// }
```

**그래도 안 되면**:

1. [local-architecture.md#debugging](./.claude/core/local-architecture.md#debugging) - 상세 디버깅 가이드
2. sync_queue 테이블 직접 확인
3. withTransaction 사용 여부 재확인

</details>

### <a id="datetime-utils"></a>🕐 Work with Dates/Times

<details>
<summary><strong>Utils 목록 (1분)</strong></summary>

```typescript
import {
  formatISOToLocalDate,
  formatISOToLocalTime,
  formatISOToLocalDateTime,
  combineDateTimeToISO,
} from '@/shared/lib/datetime';

// 표시용 (59회 사용)
formatISOToLocalDate(iso); // "2024-03-15"
formatISOToLocalTime(iso); // "14:30"
formatISOToLocalDateTime(iso); // "2024-03-15 14:30"

// Form 변환용
combineDateTimeToISO(date, time); // Form → ISO
dateToISODateTime(dateString); // "2024-03-15" → ISO

// 비교용
isSameDay(iso1, iso2); // boolean

// ❌ Never (7개 파일 중복 발견)
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ko-KR');
};
// 문제: 일관성 깨짐, 중복 코드
```

**핵심 정책**:

- 모든 시간은 ISO 8601 형식으로 저장
- 표시할 때만 로컬 포맷으로 변환
- SQLite: TEXT 타입, PostgreSQL: TIMESTAMPTZ

**상세**: [time.md](./.claude/core/time.md) - 시간 처리 완전 가이드

</details>

### <a id="currency-utils"></a>💰 Display Currency/Amounts

<details>
<summary><strong>Currency Utils (1분)</strong></summary>

```typescript
import { formatCurrencyDisplay, groupExpensesByCurrency, getPrimaryCurrency } from '@/shared/lib/currency';

// 표시용 (59회 사용)
formatCurrencyDisplay(1234567, 'KRW'); // "KRW 1,234,567"
formatCurrencyDisplay(1234.56, 'USD'); // "USD 1,234.56"

// 그룹화
groupExpensesByCurrency(expenses);
// { KRW: [...], USD: [...] }

// 주 통화 선택
getPrimaryCurrency(expenses); // 가장 많이 사용된 통화 반환
```

**핵심 정책**:

- **KRW/JPY**: 소수점 없음 (정수만)
- **USD/EUR**: 소수점 2자리
- **환율 변환 없음**: 통화별 독립 관리
- **천 단위 구분자**: 모든 통화 적용

**상세**: [currency.md](./.claude/features/currency.md) - 통화 처리 정책

</details>

### <a id="form-pattern"></a>📝 Implement Forms

<details>
<summary><strong>Form Pattern (3분)</strong></summary>

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { combineDateTimeToISO } from '@/shared/lib/datetime';
import { tripSchema } from '@repo/schema';

const form = useForm({
  resolver: zodResolver(tripSchema),
  defaultValues: {
    name: '',
    date: '',
    time: '',
  },
});

const onSubmit = form.handleSubmit(async (data) => {
  // 날짜/시간 결합
  const startDateTime = combineDateTimeToISO(data.date, data.time);

  await createMutation.mutateAsync({
    ...data,
    startDateTime,
  });
});

// 💡 Why: react-hook-form + Zod로 타입 안전성과 검증 동시 해결
```

**상세**: [form.md](./.claude/features/form.md) - 폼 구현 패턴

</details>

### <a id="component-guide"></a>🎨 Build UI Components

<details>
<summary><strong>Component Checklist (3분)</strong></summary>

```typescript
// 1. 컴포넌트 위치
// packages/ui/src/components/      - 공통 컴포넌트
// apps/client/src/entities/{entity}/ui/  - 도메인별 컴포넌트

// 2. Props 타입 정의
type ComponentProps = {
  // Props...
};

// 3. 외부 margin 금지 (재사용성)
// ❌ Bad: style={{ margin: 10 }}
// ✅ Good: 부모가 margin 제어
<View style={{ marginBottom: 16 }}>
  <MyComponent />  {/* 컴포넌트는 margin 없음 */}
</View>

// 4. 날짜/통화 표시는 유틸 사용
import { formatISOToLocalDate } from '@/shared/lib/datetime';
import { formatCurrencyDisplay } from '@/shared/lib/currency';

// 💡 Why: 일관된 포맷, 중복 방지
```

**상세**:

- [UI CLAUDE.md](./packages/ui/CLAUDE.md) - UI 철학
- [components.md](./.claude/core/components.md) - 작성 규칙

</details>

### <a id="api-endpoint"></a>🌐 Add API Endpoint

<details>
<summary><strong>API Endpoint Checklist (5분)</strong></summary>

#### Step 1: Schema 정의 (packages/schema)

```typescript
// packages/schema/src/requests/trip.ts
export const createTripRequest = z.object({
  id: z.string(), // Echo Protocol: 클라이언트 ID
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

// packages/schema/src/responses/trip.ts
export const tripResponse = z.object({
  id: z.string(),
  name: z.string(),
  // ... fields
});

// 💡 Why: 클라이언트-서버 타입 계약
```

#### Step 2: Server Route (apps/server)

```typescript
// apps/server/src/routes/trips.ts
import { createTripRequest } from '@repo/schema';

app.post('/api/trips', async (req, res) => {
  const data = createTripRequest.parse(req.body);

  // ✅ Echo Protocol: 클라이언트 ID 그대로 수용
  await db.insert(trips).values(data);

  res.json({ success: true });
});

// 💡 Why: 클라이언트가 ID 생성 → 오프라인 작동 가능
```

#### Step 3: Client Hook (apps/client)

```typescript
// apps/client/src/entities/trip/data/useCreateTrip.ts
import { generateId } from '@/shared/services/id/ulid';
import { routeTripMutation } from '@/shared/services/offline-prep/router';
import { withTransaction } from '@/shared/db/utils';

export const useCreateTrip = () => {
  return useMutation({
    mutationFn: async (data) => {
      const id = generateId(); // 클라이언트 ID 생성

      await routeTripMutation({
        local: () =>
          withTransaction(async () => {
            await db.insert(trips).values({ id, ...data });
            await addToSyncQueue('trips', id, 'CREATE');
          }),
        remote: () => api.post('/trips', { id, ...data }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.all() });
    },
  });
};

// 💡 Why: Router가 활성화 상태 체크, withTransaction으로 원자성 보장
```

**상세**:

- [Server CLAUDE.md](./apps/server/CLAUDE.md) - API 구조
- [api-data.md](./.claude/core/api-data.md) - API 레이어 패턴

</details>

---

## 🚨 Common Pitfalls (자주 하는 실수)

> **가장 많이 발생하는 버그 Top 3**

### ❌ Pitfall 1: Router 미사용 (치명적!)

```typescript
// ❌ Bad - 50% 버그의 원인
const trips = await db.select().from(trips);
const response = await api.get('/trips');

// ✅ Good
const trips = await routeTripQuery({
  local: () => db.select().from(trips),
  remote: () => api.get('/trips'),
});

// 💡 놓치면: 활성화된 여행은 로컬에만 있는데 서버 호출 → 404 에러
// 또는 비활성 여행은 서버에만 있는데 로컬 조회 → 빈 배열
```

**이유**: Router가 활성화 상태를 자동으로 체크해서 로컬/서버 분기. 이게 **프로젝트의 핵심**!

### ❌ Pitfall 2: withTransaction 없이 sync_queue 추가

```typescript
// ❌ Bad - 원자성 보장 안 됨
await db.insert(trips).values(data);
await addToSyncQueue('trips', id, 'CREATE');
// 문제: DB 실패 시 sync_queue만 남음 → Ghost 데이터
// 문제: DB 성공, sync_queue 실패 → 서버 동기화 안 됨

// ✅ Good
await withTransaction(async () => {
  await db.insert(trips).values(data);
  await addToSyncQueue('trips', id, 'CREATE');
});

// 💡 Why: 둘 중 하나만 성공하면 데이터 불일치. 둘 다 성공 or 둘 다 롤백
```

**실제 버그 사례**:

- 여행 데이터는 로컬에 있는데 서버에 없음
- sync_queue는 있는데 실제 데이터는 없음

### ❌ Pitfall 3: formatDate 중복 정의

```typescript
// ❌ Bad (7개 파일에서 중복 발견됨)
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ko-KR');
};

// ✅ Good
import { formatISOToLocalDate } from '@/shared/lib/datetime';
const displayDate = formatISOToLocalDate(trip.startDate);

// 💡 Why: 공통 유틸이 있는데 중복 구현하면 일관성 깨짐
```

### ❌ Pitfall 4: ulid 직접 사용

```typescript
// ❌ Bad (React Native 호환 문제)
import { ulid } from 'ulid';
const id = ulid();

// ✅ Good
import { generateId } from '@/shared/services/id/ulid';
const id = generateId();

// 💡 Why: React Native 환경에서 ulid 직접 사용 시 에러 가능
```

---

## 🏗 Core Architecture (Level 3 - 아키텍처)

### The Big Picture (2분)

```
사용자 요청
    ↓
Component/Hook
    ↓
🌟 Offline-Prep Router (핵심!)
    ↓
┌────┴────┐
활성화?    비활성?
↓          ↓
Local      Remote
SQLite     API
↓
sync_queue
↓
Background Sync
```

**핵심 컨셉**:

1. **Offline-Prep Router** (가장 중요!)
   - 모든 데이터 접근의 진입점
   - 활성화 상태에 따라 Local/Remote 자동 분기
   - 4개 함수: `routeTripQuery/Mutation`, `routeChildQuery/Mutation`

2. **Activation System**
   - "활성화 = 오프라인 보험, 비활성 = 온라인 전용"
   - 동시에 1개 여행만 활성화 가능 (저장 공간 효율)
   - `tripActivations` 테이블이 Single Source of Truth

3. **Echo Protocol**
   - 클라이언트가 ID 생성 (`generateId()`)
   - 서버는 클라이언트 ID 그대로 수용
   - 오프라인 작동의 핵심

4. **withTransaction Pattern**
   - DB 작업 + sync_queue를 원자적으로
   - 둘 다 성공 or 둘 다 롤백

### Architecture Decisions & Why

| 결정          | 선택                | 이유                       | 버려진 대안                  |
| ------------- | ------------------- | -------------------------- | ---------------------------- |
| **ID 생성**   | Client ULID         | 오프라인 작동, 시간순 정렬 | Server 생성 (네트워크 필요)  |
| **로컬 DB**   | SQLite + Drizzle    | React Native 최적화        | Realm (무거움), WatermelonDB |
| **동기화**    | sync_queue (Outbox) | 트랜잭션 보장, 단순함      | CRDT (복잡), Event Sourcing  |
| **충돌 해결** | Last-Write-Wins     | 초기 버전 단순성           | Vector Clock, CRDT           |
| **활성화**    | 선택적 (1개)        | 200MB/여행, 저장 공간      | 전체 로컬 (용량 부족)        |
| **상태 관리** | React Query         | 서버 상태 최적화           | Zustand (로컬용), Redux      |

**설계 과정**:

- [2025-11-06 Session](./.claude/sessions/2025-11-06-activation-architecture-design.md) - 아키텍처 설계 전체 논의
- 초기 고려: temp_cache 방식 → 복잡도 증가로 폐기
- 최종 결정: 선택적 활성화 (1개 제한)

### Data Flow Pattern

**활성화된 여행 (Offline-First)**:

```
Component → Router (활성화 체크) → Local SQLite
                                      ↓
                                  sync_queue
                                      ↓
                            Background Sync → Server
```

**비활성 여행 (Server-First)**:

```
Component → Router (활성화 체크) → Remote Server API
```

**상세**: [local-architecture.md](./.claude/core/local-architecture.md)

---

## 📋 Development Principles (핵심 철학)

### 핵심 철학 5가지

1. **Local-First, Server-Aware**
   - 오프라인이 기본, 온라인은 보너스
   - 하지만 서버 동기화도 중요하게 다룸
   - 활성화된 여행 = 로컬, 비활성 = 서버

2. **Echo Protocol**
   - Client가 ID 생성 → Server는 수용
   - 충돌 없는 오프라인 작동
   - ULID 사용으로 시간순 정렬 보장

3. **Explicit over Magic**
   - Router 명시적 사용
   - withTransaction 명시적 사용
   - 자동화보다 명확한 의도 표현

4. **Progressive Enhancement**
   - MVP 먼저, Production은 나중에
   - 작동하는 코드 > 완벽한 코드
   - 기존 구조 있으면 따르고, 없으면 유연하게

5. **Type Safety**
   - @repo/schema가 Source of Truth
   - any 금지, z.infer 사용
   - 런타임 검증과 타입이 항상 일치

### 개발 워크플로우

1. **[사고 단계]** 요구사항 받으면 먼저 단계별 의사코드(pseudocode) 작성
2. **[확인 단계]** 수립된 계획에 대해 사용자 확인 요청
3. **[실행 단계]** 확인된 계획에 따라 코드 구현
4. **[유연성]** 기존 패턴과 충돌시 → 이유 설명 → 대안 제시 → 확인 후 진행

### 구현 레벨

#### 🟢 MVP Level (기본값)

- **목표**: 빠른 구현, 작동하는 코드
- **원칙**: 기존 구조 있으면 따르고, 없으면 유연하게

#### 🔴 Production Level

- **목표**: 완전한 베스트 프랙티스
- **원칙**: 없으면 만들어서라도 완벽하게
- **사용시**: "production 레벨로" 명시할 때

### 코드 품질 기준

- **완성도**: TODO 없이 100% 구현
- **가독성**: 명확하고 이해하기 쉬운 코드 (구체적 함수명, 의미 있는 변수명)
- **확장성**: 재사용성과 유지보수성 고려 (DRY 원칙)
- **타입 안전성**: any 사용 금지, 타입 가드 활용, z.infer 사용

### 커뮤니케이션 원칙

- **간결함**: 핵심만 전달 (불필요한 설명 지양)
- **정직함**: 모르는 것은 명확히 표현 (추측하지 않기)
- **유연성**: 더 나은 방법이 있다면 제안 (이유와 함께)

---

## 🗂 Project Structure

```
apps/
  client/                      # React Native App
    src/
      entities/                # FSD Architecture
        trip/
          data/
            keys.ts            # 🔥 Query Key Factory (필수!)
            useGetTrips.ts     # routeTripQuery 사용
            useCreateTrip.ts   # withTransaction 사용
          ui/
            TripCard.tsx       # 컴포넌트
        schedule/
        expense/

      shared/
        services/
          offline-prep/
            router.ts          # 🔥 핵심! Router 4개 함수
            metadata.ts        # 활성화 상태 조회
          sync/
            queue.ts           # sync_queue 관리
          id/
            ulid.ts            # generateId() wrapper

        lib/
          datetime.ts          # 🔥 시간 유틸 (59회 사용)
          currency.ts          # 🔥 통화 유틸 (59회 사용)

        db/
          index.ts             # SQLite 초기화
          utils.ts             # withTransaction
          schema.ts            # Drizzle 스키마

  server/                      # Express API
    src/
      routes/
        trips.ts               # Echo Protocol 준수
      db/
        index.ts               # PostgreSQL

packages/
  schema/                      # 🔥 Source of Truth
    src/
      entities/                # 도메인 모델
      requests/                # API 요청
      responses/               # API 응답
      sync/                    # 동기화 스키마

  ui/                          # UI 컴포넌트
    src/
      components/              # shadcn/ui 기반
```

**파일 구조 철학**: [architecture.md](./.claude/core/architecture.md)

---

## 🛠 Tech Stack

### Frontend (React Native + Expo)

- React Native + Expo (SDK 51)
- TypeScript
- React Query (서버 상태)
- Drizzle ORM + SQLite (로컬 DB)
- React Hook Form + Zod (폼 검증)
- Expo Router (파일 기반 라우팅)

### Backend (Node.js + Express)

- Express + TypeScript
- PostgreSQL (Neon)
- Drizzle ORM
- Zod (검증)

### Shared Packages

- **@repo/schema** - Zod 스키마 (Source of Truth) ⭐
- **@repo/ui** - shadcn/ui 기반 컴포넌트
- **@repo/db** - Prisma 스키마

---

## ✅ 완료된 기능 (Completed Features)

### Offline 준비 시스템 (Offline-Prep)

**상태**: 핵심 구현 완료 (2025-11-16 ~ 2025-11-19, 22개 커밋)

**목적**: 오프라인 지도 통합을 위한 선택적 데이터 동기화

**핵심 철학**:

> "활성화 = 오프라인 보험, 비활성 = 온라인 전용"

**주요 특징**:

- **활성화된 여행**: 완전 오프라인 (Local-First 유지) - 최대 200MB
- **비활성 여행**: 온라인 전용 (Server-First) - 모든 Trip 메타데이터는 로컬
- **저장 공간 효율화**: 동시에 1개 여행만 활성화 가능
- **자동 관리**: 여행 종료 + 7일 후 자동 비활성화 (예정)

**아키텍처**:

```text
Entity Layer → Offline-Prep Router (4개 함수)
                ↓
    ┌───────────┴───────────┐
    │                       │
[활성화된 여행]        [비활성 여행]
    ↓                       ↓
Local SQLite          Remote Server
    ↓
Sync Engine (백그라운드)
```

**완료된 작업**:

- ✅ tripActivations 테이블 생성 (Single Source of Truth)
- ✅ Router 4개 함수 분리 (routeTripQuery/Mutation, routeChildQuery/Mutation)
- ✅ offline-prep 서비스 레이어 (router, metadata, errors)
- ✅ Entity Hooks 통합 (Trip, Schedule, Expense)
- ✅ UI 컴포넌트 (ActivationBadge, ProgressDrawer, TripCard)
- ✅ 활성화/비활성화 기능 (useActivateTrip, useDeactivateTrip)
- ✅ 오프라인 지도 연동
- ✅ 디버그 도구 추가
- ✅ 통화 자동 설정 (ISO 국가 코드 기반)
- ✅ trips.activated 필드 제거 (데이터 정합성 보장)

**아키텍처 확정 사항**:

- tripActivations 테이블을 활성화 상태의 단일 진실 공급원으로 사용
- Trip 작업 vs Child(Schedule/Expense) 작업의 의미적 분리
- Service 레이어 책임 명확화 (getTripActivationStatusDetail)

**남은 작업**:

- [ ] Pull 동기화 고도화 (현재 activate 시 1회만)
- [ ] 자동 비활성화 Background Job (여행 종료 + 7일)
- [ ] 활성화 진행률 실시간 업데이트
- [ ] 오프라인 지도 다운로드 재시도 로직

**관련 문서**:

- [Session: 아키텍처 설계](./.claude/sessions/2025-11-06-activation-architecture-design.md)
- [Feature Guide](./.claude/features/activation-system.md)
- [local-architecture.md](./.claude/core/local-architecture.md)

---

## 🚧 작업 예정 (Planned Features)

---

## 📋 Quick Commands

```bash
# 개발 환경
pnpm dev          # 전체 개발 서버 실행
pnpm dev:client   # 클라이언트만 실행
pnpm dev:server   # 서버만 실행

# 데이터베이스
pnpm db:push      # DB 스키마 푸시
pnpm db:studio    # Prisma Studio 실행
pnpm db:generate  # Prisma Client 생성

# 빌드 & 배포
pnpm build        # 전체 빌드
pnpm typecheck    # 타입 체크
pnpm lint         # Lint 검사
```

---

## 📝 Project History

> **Latest**: 2025-11-19 - Documentation restructure (Progressive Disclosure)

<details>
<summary>전체 변경 이력 보기</summary>

### 2025-11

- **2025-11-19**: Root CLAUDE.md 재구조화
  - Progressive Disclosure 패턴 적용 (30초 → 5분 → Deep Dive)
  - Task-oriented 가이드 추가 (Most Common Tasks)
  - "💡 Why" 맥락 추가 (실제 버그 사례, 사용 빈도 기반)
  - .claude/README.md 통합 (Single Source)

- **2025-11-16~19**: Offline 준비 시스템 (22 commits)
  - tripActivations 테이블 추가 (Single Source of Truth)
  - Offline-Prep Router 4개 함수 구현
  - 활성화/비활성화 UI 완성
  - trips.activated 필드 제거 (데이터 정합성)

- **2025-11-08**: 오프라인 라우팅 구현
  - Mapbox Directions API 통합
  - Session, Feature Guide, ADR-003 추가

- **2025-11-07**: 오프라인 지도 구현
  - Mapbox OfflineManager 통합
  - Session, Feature Guide, ADR-002 추가

- **2025-11-06**: 활성화 시스템 설계
  - Architecture session 문서화
  - temp_cache 방식 폐기 → 선택적 활성화 (1개 제한) 결정

- **2025-11-05**: .claude 디렉토리 재구조화
  - core/, features/, references/ 분리
  - .cursor/rules → .claude/ 마이그레이션

</details>

---

## 🤝 Contributing Guidelines

이 문서는 AI 어시스턴트가 프로젝트를 이해하고 일관된 코드를 생성하도록 돕는 가이드입니다.

### 문서 업데이트 시

1. **Root CLAUDE.md 우선**: 핵심 패턴은 여기에
2. **Progressive Disclosure 유지**: 30초 → 5분 → 상세 구조
3. **실제 코드 기반**: 추상적 원칙보다 구체적 사용법
4. **맥락 추가**: "💡 Why" 설명 항상 포함

### 코드 작성 시

- 기존 패턴을 최대한 따르되, 더 나은 방법이 있다면 제안
- 불확실한 부분은 추측하지 말고 명확히 질문
- 코드 작성 전 계획을 먼저 공유하고 확인

---

**Last Updated**: 2025-11-19
