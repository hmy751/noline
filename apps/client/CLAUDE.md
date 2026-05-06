# 📱 Noline Client Guide

> React Native (Expo) 클라이언트 애플리케이션 구현 가이드

## 📚 Quick Navigation

**프로젝트 이해 (처음 읽을 때):**

- [Root CLAUDE.md](../../CLAUDE.md) - 프로젝트 정체성, 핵심 불변식, 문서 진입점
- [Noline Rules](../../.claude/rules/README.md) - 구현 중 지켜야 할 compact rule
- [Noline Runbooks](../../.claude/runbooks/README.md) - 반복 작업 시작 순서
- [Noline Context Map](../../.claude/context/README.md) - 깊은 아키텍처/기능 맥락
- [Schema CLAUDE.md](../../packages/schema/CLAUDE.md) - @repo/schema 타입 계약 (Entity/Request/Response)

**클라이언트 구현시 참조:**

- [Activation Router Rule](../../.claude/rules/activation-router.md) - 활성화 기반 Local/Remote routing
- [Transaction + Sync Queue Rule](../../.claude/rules/transaction-sync-queue.md) - 로컬 mutation과 sync_queue 원자성
- [Client-Side ID Rule](../../.claude/rules/client-side-id.md) - 생성 ID 전략
- [ISO Time Rule](../../.claude/rules/iso-time.md) - 시간 저장/전송 규칙

## 🎯 Client-Specific Patterns

이 문서는 **클라이언트 구현에 특화된 패턴**을 다룹니다. 전체 아키텍처는 Root CLAUDE.md를 참조하세요.

## 🔄 Selective Local-First Implementation

### 핵심 원칙: Client-Side ID Generation

**데이터 흐름:**

1. **ID 생성**: 클라이언트가 ULID 생성
2. **로컬 저장**: withTransaction()으로 DB와 sync_queue 원자적 처리
3. **UI 업데이트**: React Query 캐시 무효화로 즉시 반영
4. **백그라운드 동기화**: SyncProvider가 자동으로 서버 전송

**트랜잭션 패턴:**

- 위치: `shared/db/utils.ts`
- 역할: DB 작업과 sync_queue를 하나의 트랜잭션으로 묶음
- 보장: 둘 다 성공하거나 둘 다 실패 (원자성)

### 데이터 흐름 (5단계 레이어 구조)

| 단계               | 동작                          | 책임             |
| ------------------ | ----------------------------- | ---------------- |
| 1. User Action     | 버튼 클릭, 폼 제출            | UI Component     |
| 2. Data Hook       | React Query hook 호출         | Entity/data      |
| 3. Repository      | 활성화 상태 기반 분기 (Router) | Entity/repository |
| 4. DataSource      | Local(lib) 또는 Remote(api)   | Entity/lib, api  |
| 5. UI Update       | React Query 캐시 무효화       | State Layer      |
| 6. Background Sync | 네트워크 가능시 Push          | Sync Engine      |

**타입 흐름:**

```text
@repo/schema (Zod) → model (z.infer) → repository → data hooks → components
```

## 🕐 Time Management

> **Rule**: [ISO Time](../../.claude/rules/iso-time.md) / **Context**: [Time and date](../../.claude/context/README.md#time-and-date)

**클라이언트 핵심:**

- **SQLite 저장**: TEXT 타입으로 ISO 8601 문자열 저장
- **유틸리티 위치**: `shared/lib/datetime.ts`
- **Zod 검증**: `z.string().datetime({ offset: true })`

```typescript
// 현재 시간을 ISO 8601로
const now = new Date().toISOString(); // "2024-03-15T14:30:00.000Z"

// 사용자 표시용 변환
import { formatISOToLocalDate, formatISOToLocalTime } from '@/shared/lib/datetime';
formatISOToLocalDate(now);     // "2024-03-15"
formatISOToLocalTime(now);     // "14:30"
```

## 🗄 Database Layer

### 데이터베이스 구조

**주요 테이블:**

- **업무 테이블**: trips, expenses, schedules 등
- **sync_queue**: 동기화 대기열 (action: CREATE | UPDATE | DELETE)

**Client-Side ID 필드 (모든 테이블):**

- `id`: ULID (클라이언트 생성)
- `updatedAt`: ISO 8601 문자열
- `deletedAt`: Soft Delete용
- `version`: 충돌 해결용

## 🏗 Entity 5단계 레이어 구조 (2025-11)

**위치**: `entities/{entity}/`

```text
entities/expense/
├── model/          # 타입 정의 (z.infer로 @repo/schema에서 추출)
├── api/            # Remote API 호출 함수
├── lib/            # Local DataSource (SQLite, withTransaction)
├── repository/     # Router 패턴 (Local/Remote 분기)
├── data/           # Query keys, React Query hooks
└── index.ts        # Public API (model/data만 export)
```

**레이어별 역할:**

| 레이어     | 역할                              | import 가능 대상           |
| ---------- | --------------------------------- | -------------------------- |
| model      | 타입 정의                         | @repo/schema               |
| api        | Remote Server 통신                | model, @/shared/api        |
| lib        | Local SQLite 접근                 | model, @/shared/db         |
| repository | Router로 Local/Remote 분기        | model, api, lib, Router    |
| data       | Query keys, React Query hooks     | model, repository          |

**외부 노출 (index.ts):**

```typescript
// ✅ Public API - 외부에서 import 가능
export type { Expense } from './model';
export { useGetExpenses, useCreateExpense, expenseQueryKeys } from './data';

// ❌ Internal - 외부 노출 금지
// api/, lib/, repository/는 캡슐화
```

## 🔑 Query Key Factory Pattern

**목적**: 일관된 캐시 키 관리
**위치**: `entities/{entity}/data/keys.ts`

**패턴 예시**:

- `base`: `['expenses']`
- `byId`: `['expenses', 'id', id]`
- `byTrip`: `['expenses', 'trip', tripId]`

## 🗑 Soft Delete Pattern

**원칙**: 데이터는 삭제하지 않고 `deletedAt` 필드로 숨김
**조회시**: `isNull(deletedAt)` 필터 필수
**동기화**: DELETE action도 sync_queue에 기록

## 🔢 Version Field

**용도**: 충돌 해결 대비
**동작**: 업데이트시 자동 증가
**활용**: Last-Write-Wins 또는 Version Vector

## 🗺 Offline Map Integration

> **Context**: [Offline map](../../.claude/context/README.md#offline-map)

**핵심 패턴:**

### 1. Native Pack + DB Separation

- **Native Layer**: Mapbox OfflineManager가 실제 지도 타일 관리 (60-200MB)
- **SQLite Layer**: 메타데이터만 저장 (cityId, bounds, referenceCount 등)
- **이유**: 관심사 분리, SQLite에 큰 바이너리 저장 피함

### 2. referenceCount Pattern

여러 Trip이 같은 도시를 공유할 때 중복 다운로드 방지:

```typescript
// 첫 Trip → referenceCount: 1
// 두번째 Trip 같은 도시 → referenceCount: 2
// Trip 삭제 → referenceCount--
// referenceCount === 0 → 네이티브 팩 삭제
```

### 3. Auto-download Trigger

**시점**: 첫 Schedule 생성 시 자동 다운로드

```typescript
// features/schedule/create-schedule/useCreateScheduleForm.ts
const isFirstSchedule = schedules.length === 0;
if (isFirstSchedule) {
  downloadOfflineMap({ tripId });
}
```

**구현 위치:**

- Entity: `entities/offline-city/`
- Service: `shared/services/offline-map/`
- DB Schema: `shared/db/schema.ts` (`offlineCities`)

**주요 이슈 & 해결:**

1. **앱 크래시**: `MapboxGL.setAccessToken()` 런타임 초기화 필수 ([#3829](https://github.com/rnmapbox/maps/issues/3829))
2. **Bounds 포맷**: 중첩 배열 `[[west, south], [east, north]]` 사용
3. **중복 방지**: 다운로드 전 `getPacks()`로 네이티브 팩 존재 확인

**관련 문서:**

- [ADR-002: Mapbox 오프라인 지도](../../.claude/decisions/002-offline-map-integration.md)
- [Context: Offline Map](../../.claude/context/README.md#offline-map)
- [Session: 2025-11-07](../../.claude/sessions/2025-11-07-offline-map-implementation.md)

## 🛣 Offline Routing

> **Context**: [Offline routing](../../.claude/context/README.md#offline-routing)

**핵심 패턴:**

### 1. 3-Profile Auto-download

일정 생성/수정 시 3가지 이동 수단의 경로를 모두 다운로드:

```typescript
// walking, cycling, driving-traffic 모두 다운로드
const PROFILES: MapboxProfile[] = ['walking', 'cycling', 'driving-traffic'];

for (const profile of PROFILES) {
  const directions = await getDirections({ from, to, profile });
  // polyline6 geometry를 SQLite에 저장
}
```

**이유**: 사용자가 나중에 자유롭게 이동 수단 선택 가능

### 2. Polyline6 압축

**Mapbox Directions API → polyline6 문자열 → SQLite 저장**

```typescript
// API 응답
{
  geometry: "_p~iF~ps|U_ulLnnqC_mqNvxq`@", // polyline6 압축
  distance: 1234, // meters
  duration: 456,  // seconds
}

// 렌더링 시 디코딩
import { decodePolyline } from '@/shared/lib/mapbox';
const coords = decodePolyline(geometry); // [[lng, lat], ...]
```

**크기**: 200-500 bytes/경로 (매우 작음)

### 3. Auto-download 시점

| 시점               | 동작                 | 이유                         |
| ------------------ | -------------------- | ---------------------------- |
| Schedule 생성      | 전체 경로 다운로드   | 새 일정 추가 → 순서 재계산   |
| Schedule 시간 수정 | 전체 경로 재다운로드 | 순서 변경 가능 → 경로 달라짐 |

```typescript
// features/schedule/create-schedule/useCreateScheduleForm.ts
onSuccess: () => {
  setTimeout(() => {
    const allSchedules = [...schedules, newSchedule].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    autoDownloadRoutes({ tripId, schedules: allSchedules });
  }, 500); // React Query 캐시 업데이트 대기
};
```

### 4. Saved vs Unsaved 경로

| 상태   | 표시        | 색상   | 의미                   |
| ------ | ----------- | ------ | ---------------------- |
| 저장됨 | 실제 도로   | 초록색 | Mapbox API 경로 (신뢰) |
| 미저장 | 직선 (점선) | 회색   | 임시 시각화 (참고용)   |

**구현 위치:**

- Entity: `entities/route/data/`
- Service: `shared/services/directions/mapbox.ts`
- Util: `shared/lib/mapbox.ts` (polyline 디코딩)
- Component: `shared/components/Map/MapboxScheduleMapView.tsx` (via `PolicyBasedScheduleMapView.tsx`)
- DB Schema: `shared/db/schema.ts` (routes 테이블)

**주요 이슈 & 해결:**

1. **ULID 에러**: `ulid` → `generateId()` 사용 (React Native 호환)
2. **아프리카 카메라**: `useMemo`로 initialCamera 계산 + `animationDuration: 0`
3. **경로 미묘한 어긋남**: 도로 네트워크 스냅 특성 (데이터 이슈, 수용)

**관련 문서:**

- [Context: Offline Routing](../../.claude/context/README.md#offline-routing)

## 🔄 Sync Engine

### Push Sync (로컬 → 서버)

**프로세스:**

1. sync_queue에서 PENDING 작업 조회
2. FIFO 순서로 서버 전송
3. 성공시 queue에서 제거
4. 실패시 재시도 카운트 증가

**구현**: `shared/services/sync/engine.ts`의 `pushChanges()` 함수

### Pull Sync (서버 → 로컬)

**상태**: ✅ 구현 완료
**구현**: `shared/services/sync/engine.ts`의 `pullChanges()` 함수
**동작**: lastSyncedAt 이후 변경사항을 서버에서 pull

## 📋 개발 가이드라인

### 권장 패턴

- **트랜잭션**: withTransaction()으로 원자성 보장
- **데이터 조회**: React Query + 로컬 DB
- **타입 처리**: 타입 가드 사용 (as 피함)
- **캐시 관리**: Query Key Factory 패턴

### 주의 사항

- **서버 대기**: 서버 응답 대기하며 UI 블로킹 피함
- **API 호출**: sync_queue 없이 직접 호출 피함
- **삭제**: Hard Delete 대신 Soft Delete

## 🐛 Common Issues & Debugging

### Issue 1: Sync Queue가 계속 쌓임

**증상**: sync_queue 테이블에 레코드가 계속 증가

**디버깅 쿼리**:

```sql
-- sync_queue 상태 확인
SELECT status, COUNT(*)
FROM sync_queue
GROUP BY status;

-- 실패한 작업 조회
SELECT * FROM sync_queue
WHERE status = 'FAILED'
ORDER BY retry_count DESC;
```

**해결방법**:

1. 네트워크 상태 확인
2. 서버 API 엔드포인트 확인
3. 재시도 로직 검증

### Issue 2: UI가 업데이트되지 않음

**증상**: 데이터 변경 후 화면이 갱신되지 않음

**체크리스트**:

- [ ] `queryClient.invalidateQueries()` 호출 확인
- [ ] 올바른 queryKey 사용 확인
- [ ] React Query 캐시 설정 확인

### Issue 3: 중복 ID 에러

**증상**: "UNIQUE constraint failed: trips.id"

**원인**: 동일한 ULID 중복 생성 (매우 드묾)

**해결방법**:

```typescript
// ID 생성시 재시도 로직
let id = generateId();
let retries = 0;
while ((await isIdExists(id)) && retries < 3) {
  id = generateId();
  retries++;
}
```

## 📊 Performance Optimization

### 1. 쿼리 최적화

```typescript
// ✅ 필요한 컬럼만 선택
const trips = await db
  .select({
    id: trips.id,
    name: trips.name,
  })
  .from(trips);

// ❌ 모든 컬럼 선택
const trips = await db.select().from(trips);
```

### 2. 배치 처리

```typescript
// ✅ 트랜잭션으로 배치 처리
await withTransaction(async (tx) => {
  for (const expense of expenses) {
    await tx.insert(expensesTable).values(expense);
  }
});
```

### 3. 메모이제이션

```typescript
// 비싼 계산은 useMemo로 캐싱
const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
```

## 🔍 Development Tools

### 유용한 디버깅 명령어

```bash
# SQLite DB 직접 조회
npx drizzle-kit studio

# React Query Devtools
# 앱 내에서 자동으로 표시됨 (개발 모드)

# 로그 확인
npx expo start --clear
```

### VS Code Extensions 권장

- SQLite Viewer - DB 파일 직접 확인
- React Native Tools - 디버깅 지원
- Expo Tools - Expo 명령어 지원

## 📚 Related Documents

**다른 Workspace:**

- [Server CLAUDE.md](../server/CLAUDE.md) - 서버 API 구현 가이드
- [UI CLAUDE.md](../../packages/ui/CLAUDE.md) - 컴포넌트 라이브러리

**상세 구현 가이드:**

- [Activation Router Rule](../../.claude/rules/activation-router.md) - Local/Remote routing
- [Transaction + Sync Queue Rule](../../.claude/rules/transaction-sync-queue.md) - sync_queue, withTransaction
- [Noline Context Map](../../.claude/context/README.md) - components, error handling, feature context
