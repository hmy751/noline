# 📝 CHANGELOG

> Noline 프로젝트의 주요 변경사항 및 정책 진화 기록

## Format

각 항목은 다음 형식을 따릅니다:

- **날짜**: YYYY-MM-DD
- **유형**: [Policy] [Architecture] [Feature] [Fix] [Docs]
- **영향도**: 🔴 Breaking | 🟡 Major | 🟢 Minor

---

## 2025-12

### 2025-12-23

**[Feature]** 🟡 Google/Apple OAuth 인증 시스템 구현

> **브랜치**: `feature/google-auth`
> **변경**: 38개 파일 (+5,179 / -4,282)

**핵심 변경사항**:

1. **Schema Layer**
   - `auth.ts` 응답 스키마 추가 (loginResponse, refreshTokenResponse, getCurrentUserResponse)

2. **Server Layer**
   - Google/Apple OAuth 라우트 구현 (`routes/auth.ts`)
   - JWT 서비스 (`services/jwt.ts`)
   - `requireAuth` 미들웨어 적용 (모든 보호된 라우트)

3. **Client Layer - Auth 서비스**
   - `google-auth.ts`, `apple-auth.ts`: OAuth 로그인 처리
   - `auth-api.ts`: 서버 API 호출
   - `token-storage.ts`: SecureStore 토큰 관리
   - `auth-interceptor.ts`: 401 처리 + 토큰 갱신
   - `logout-service.ts`: 로그아웃 처리

4. **Client Layer - 상태 관리**
   - `authStore`: Zustand 기반 인증 상태
   - `SessionExpiredBanner`: 세션 만료 UI

5. **Client Layer - userId 필터링**
   - `trip-local.ts`, `schedule-local.ts`, `expense-local.ts`
   - 로컬 데이터 계정별 분리

6. **아키텍처 결정**
   - Axios Instance Factory 패턴 (순환 참조 해결)
   - `authAxios` (인터셉터 없음) vs `apiAxios` (인터셉터 있음)
   - Decision: [2025-12-23-auth-axios-factory.md](./decisions/2025-12-23-auth-axios-factory.md)

**신규 파일**:

- `apps/client/src/shared/api/axios-instances.ts`
- `apps/client/src/shared/services/auth/*.ts` (6개 파일)
- `apps/client/src/shared/store/auth.ts`
- `apps/client/src/screens/LoginScreen.tsx`
- `apps/server/src/routes/auth.ts`
- `apps/server/src/services/jwt.ts`
- `apps/server/src/middleware/auth.ts`
- `packages/schema/src/responses/auth.ts`

---

## 2025-11

### 2025-11-27

**[Feature]** 🟢 Google Maps 길찾기 연동 및 경로 다운로드 개선

> **브랜치**: `feature/google-route`
> **변경**: 7개 파일 (+368 / -43)

**핵심 변경사항**:

1. **Google Maps 길찾기 버튼** (온라인 모드)
   - `external-map.ts` 유틸리티 생성
   - Policy 기반 버튼 표시/숨김 (`mapProvider === 'google'`)
   - 이전 일정 → 현재 일정 길찾기 지원
   - 첫 번째 일정은 현위치에서 출발

2. **여행 활성화 시 경로 자동 다운로드**
   - `route-downloader.ts` 유틸리티 생성 (재사용 가능)
   - `useActivateTrip`에서 백그라운드 다운로드 호출
   - 기존: Schedule 생성/수정 시만 → 활성화 시에도 추가

3. **활성화/비활성화 UI 즉시 반영**
   - `refreshKey` 패턴으로 MainTripSection 상태 갱신
   - Optimistic Update 적용
   - 실패 시 상태 복구

**신규 파일**:

- `apps/client/src/shared/lib/external-map.ts`
- `apps/client/src/shared/services/directions/route-downloader.ts`

**수정 파일**:

- `MapScheduleCard.tsx` - 길찾기 버튼 추가
- `ScheduleMapViewContainer.tsx` - 좌표 파싱, 카드 데이터 전달
- `useActivateTrip.ts` - 경로 다운로드 호출 추가
- `MainTripSection.tsx` - refreshKey, Optimistic Update
- `TripsSection.tsx` - refreshKey 상태 관리

---

### 2025-11-26

**[Architecture]** 🟡 Entity Architecture Refactoring - Type System 정립

> **브랜치**: `refactor/type-system`
> **변경**: 49개 파일 (1,232 추가 / 880 삭제)

**핵심 변경사항**:

1. **Entity 레이어 구조 정립**
   - Trip/Schedule/Expense Entity에 새 레이어 적용
   - `model/` → `api/` → `lib/` → `repository/` → `data/`

2. **새 레이어 추가**
   - `lib/*-local.ts`: Local DataSource (SQLite 직접 접근, withTransaction 사용)
   - `repository/*-repository.ts`: Router 패턴 (Local/Remote 분기)

3. **타입 흐름 정립**

   ```text
   @repo/schema (Zod - Single Source of Truth)
       ↓ z.infer
   entities/*/model (타입 추출)
       ↓
   entities/*/repository (Router 패턴)
       ↓
   entities/*/data (React Query Hooks)
       ↓
   features/* (Components)
   ```

4. **타입 Import 통일**
   - `@/shared/db/schema` 직접 참조 제거 (debug 제외)
   - 컴포넌트에서 `@/entities/*`로 타입 import 통일

**주요 개선**:

- ✅ `useGetScheduleExpenses` export 추가 (`expense/index.ts`)
- ✅ `any` 타입 → 명시적 `Expense` 타입으로 수정 (`ScheduleDetailScreen.tsx`)
- ✅ `Schedule` 타입 import 경로 수정 (`useCreateScheduleForm.ts`, `UpdateScheduleDrawer.tsx`)
- ✅ `@repo/schema` Response 타입 일관성 확보

**영향 파일**:

- 신규: `lib/trip-local.ts`, `lib/schedule-local.ts`, `lib/expense-local.ts`
- 신규: `repository/trip-repository.ts`, `repository/schedule-repository.ts`, `repository/expense-repository.ts`
- 수정: 모든 Entity data hooks (Repository 사용으로 리팩토링)
- 수정: `packages/schema/src/responses/*.ts` (타입 일관성)
- 수정: `apps/server/src/routes/*.ts` (응답 형식 통일)

**Migration 패턴**:

```typescript
// Before: 컴포넌트에서 DB 스키마 직접 import
import type { Schedule } from '@/shared/db/schema';

// After: Entity에서 타입 import
import { type Schedule } from '@/entities/schedule';
```

```typescript
// Before: Data Hook에서 직접 DB/API 호출
const trips = await db.select().from(trips);

// After: Repository 패턴 사용
const trips = await TripRepository.getAll();
```

**정책 준수 확인**:

- ✅ `@repo/schema` 규칙: schema만 export, 타입은 z.infer 사용
- ✅ `withTransaction` 패턴: lib/local에서 DB+sync_queue 원자성 보장
- ✅ Router 패턴: Repository에서 활성화 상태 기반 Local/Remote 분기

**문서 업데이트**:

- `CLAUDE.md` - "Add New Entity" 가이드 5단계로 확장
- `.claude/core/architecture.md` - Entity 폴더 구조 (lib/, repository/ 추가)
- `.claude/core/api-data.md` - 5단계 레이어 아키텍처 다이어그램, Production 체크리스트
- `.claude/core/selective-activation-architecture.md` - Entity Layer 구조 및 구현 예시
- `apps/client/CLAUDE.md` - Entity 5단계 레이어 구조 섹션 추가

---

### 2025-11-24

**[Architecture]** 🟡 Store 계층 재정의 및 상태 관리 최적화

> **관련 커밋**: 65028a9, ef5d0b9, f0f39c4
> **Decision**: `.claude/decisions/2025-11-24-store-layer-refinement.md`

**핵심 변경사항**:

1. **Network Service → Store 마이그레이션**
   - `shared/services/network/` 제거
   - `shared/store/network.ts` 생성 (Zustand 사용)
   - Hook 통합: `useNetworkStatus`, `useNetworkControl`
   - 중복 제거: `getNetworkStatus()` → `networkStore.status`

2. **Store vs Services 기준 명확화**
   - **Store**: 상태 보유 (Network status, UI state)
   - **Services**: 로직 실행 (Sync, Offline-prep)
   - **Policy**: 비즈니스 규칙 (독립 카테고리)

3. **Policy 성능 최적화**
   - `useState` + `useEffect` → React Query 전환
   - 활성화 상태 캐싱 (5분 staleTime)
   - `useMemo`로 불필요한 리렌더링 방지

**파일 변경**:

- 신규: `shared/store/network.ts` (+118 lines)
- 제거: `shared/services/network/` (3 files, -170 lines)
- 최적화: `shared/policy/useAppPolicy.ts` (React Query 도입)
- 수정: `entities/trip/data/useActivateTrip.ts` (upsert 패턴)

**Migration 패턴**:

```typescript
// Before: 파편화된 구조
import { useNetworkStatus } from '@/shared/services/network/hooks';
import { getNetworkStatus } from '@/shared/services/network';

// After: 통합 구조
import { useNetworkStatus, networkStore } from '@/shared/store/network';
const status = networkStore.status; // 동기 접근
```

**Breaking Changes**:

- ❌ `getNetworkStatus()` 함수 제거 → `networkStore.status` 사용
- ❌ `NetworkOverrideContext` 제거 → `useNetworkControl()` 사용

**성능 개선**:

- ✅ Policy DB 조회 캐싱 (중복 방지)
- ✅ Network Hook 통합 (파일 수 감소)
- ✅ useMemo로 객체 재생성 방지

---

### 2025-11-21

**[Feature]** 🟡 v3.0 구현 완료 (90%) - Policy-Driven Extension

> **관계**: v2.0 Selective Activation 기반 위에 Policy Layer 확장
> **상태**: Phase 1~4 구현 완료, Phase 5 수동 테스트 남음
> **추적**: [v3.0-tracker.md](./.claude/implementation/v3.0-tracker.md)

**핵심 컨셉**: v2.0의 활성화 정책(active/inactive) + 네트워크 상태(online/offline) → **4-State Matrix**

- **Phase 1-4 완료**: Policy Layer Core, Service Layer, Manual Input, 기존 코드 통합
- **주요 컴포넌트**:
  - `useAppPolicy`: 중앙 정책 조회 Hook
  - `PolicyErrorDisplay`: 3 variants (banner, block, inline)
  - `ManualScheduleForm` / `ManualExpenseForm`: 오프라인 입력
  - `NetworkStatusIndicator`: 헤더 우측 네트워크 상태 (online/offline/unknown)
  - `LocationSearchModal`: 장소 재검색

- **통합 완료**:
  - ExpenseForm: Policy 기반 일정 연결 제어
  - TripDateForm: 네트워크 체크 간소화
  - CreateScheduleScreen: PolicyErrorDisplay 적용
  - SmartMapView: Policy 기반 지도 전환 (Mapbox ↔ Google Maps)

- **제거**: OfflineIndicator (NetworkStatusIndicator로 통합)

- **테스트 시나리오**: [v3.0-test-scenarios.md](./.claude/implementation/v3.0-test-scenarios.md)

**Migration 완료**:

```typescript
// 이전: 산발적 에러 처리
<View className='bg-yellow-50'><Text>에러 메시지</Text></View>

// 현재: Policy 기반 표준화
const policy = useAppPolicy(tripId);
if (!policy.schedule.create.allowed) {
  return <PolicyErrorDisplay permission={policy.schedule.create} variant='block' />;
}
```

**v2.0과의 관계**:

- v2.0 Router는 그대로 유지 (Data Layer에서 Local/Remote 분기)
- v3.0 Policy는 추가 레이어 (4가지 상태별 동작 제어)
- Service Layer는 Router 미사용, Policy만 확인

---

### 2025-11-20

**[Architecture Design]** 📋 v3.0 설계 완료 - Policy-Driven Architecture

> **상태**: 설계 문서 작성 완료 → 구현 완료 (2025-11-21)
> **추적**: [v3.0-tracker.md](./.claude/implementation/v3.0-tracker.md)

- **설계 완료**: Data와 Service를 분리하여 각각 다른 정책 적용하는 아키텍처
  - **Data Layer** (Trip/Schedule/Expense): Router 통한 Local-First 유지
  - **Service Layer** (Map/Search/Directions): Network-First로 전환

- **Policy Layer 설계**: 4가지 상태 매트릭스로 기능 제어
  - `online_active`: 모든 기능 사용 가능
  - `online_inactive`: 모든 기능 사용 가능
  - `offline_active`: Trip 생성 차단, Schedule Manual Input 허용
  - `offline_inactive`: 읽기 전용 모드

- **Manual Input 설계**: 오프라인에서도 핵심 데이터 입력
  - Schedule: 좌표 없이 생성 가능 (latitude/longitude nullable)
  - Expense: 환율 정보 없이 생성 가능
  - Trip: 정책적으로 차단 (메타데이터 필수)

- **작성된 문서**:
  - Decision: `.claude/decisions/2025-11-20-data-service-separation.md`
  - Guide: `.claude/core/policy-architecture.md` (520줄)
  - Feature: `.claude/features/manual-input.md` (568줄)

- **해결 예정 문제**:
  - ✅ (설계) 활성화 여행도 온라인에서 Google Maps 사용 가능
  - ✅ (설계) 오프라인에서도 핵심 기능 유지
  - ✅ (설계) 정책 변경이 Policy Table 수정만으로 가능

**구현 시 Migration Guide**:

```typescript
// 현재: Router만으로 모든 것 제어
if (활성화) return Local;

// 구현 후: Data는 Router, Service는 Policy
// Data Layer
routeChildQuery({ local, remote });
// Service Layer
const policy = useAppPolicy();
switch(policy.mapProvider) { ... }
```

**[Feature]** 🟡 Deactivation Sync Queue Safety 구현

- **문제**: 여행 비활성화 시 sync_queue PENDING 작업 무시로 데이터 손실 위험
- **해결**: 3단계 삭제 시스템 구축
  - Phase 1: 즉시 비활성화 (사용자 대기 없음)
  - Phase 2: Soft delete (Sync 완료 후 Background Job)
  - Phase 3: Hard delete (7일 후 Vacuum)
- 새 파일: `cleanup-job.ts` (+265 lines)
- 새 함수: `processPendingCleanups()`, `vacuumDeletedRecords()`, `forceCleanupTrip()`
- Decision: `.claude/decisions/2025-11-20-deactivation-sync-queue-safety.md`
- 관련 커밋: f0b5039 (5 files, +445/-17)

**핵심 패턴 추가**:

- `hasPendingTasksForTrip()` - sync_queue 체크
- `cleanupPending` 플래그 - 지연된 cleanup 제어
- Soft Delete 패턴 강화 (withTransaction 필수)

---

### 2025-11-19

**[Docs]** 🟢 Documentation 리팩토링 시스템 구축

- `/doc-refactor` command 추가
- 정책 버전 관리 시스템 도입 (v1.0 → v2.0)
- CHANGELOG.md 파일 생성

### 2025-11-19

**[Docs]** 🟢 Root CLAUDE.md 재구조화

- Progressive Disclosure 패턴 적용 (30초 → 5분 → Deep Dive)
- Task-oriented 가이드 추가 (Most Common Tasks)
- "💡 Why" 맥락 추가 (실제 버그 사례 기반)
- .claude/README.md 통합 (Single Source)

### 2025-11-16 ~ 2025-11-19

**[Architecture]** 🔴 Offline 준비 시스템 완성 (22 commits)

- **Breaking**: `trips.activated` 필드 제거
- `tripActivations` 테이블 추가 (Single Source of Truth)
- Offline-Prep Router 4개 함수 구현
  - `routeTripQuery/Mutation` (Trip 레벨)
  - `routeChildQuery/Mutation` (Schedule/Expense 레벨)
- 활성화/비활성화 UI 완성

**정책 변경 (v1.0 → v2.0)**:

- Before: "모든 데이터는 로컬 SQLite가 진실의 원천"
- After: "활성화 상태가 데이터 위치 결정"

### 2025-11-08

**[Feature]** 🟡 오프라인 라우팅 구현

- Mapbox Directions API 통합
- Polyline6 압축 (85% 용량 감소)
- 3-Profile 전략 (driving, walking, cycling)
- Session 문서: `.claude/sessions/2025-11-08-offline-routing-implementation.md`
- ADR-003: `.claude/decisions/003-offline-routing-integration.md`

### 2025-11-07

**[Feature]** 🟡 오프라인 지도 구현

- Mapbox OfflineManager 통합
- SQLite 메타데이터 분리 저장
- referenceCount 패턴으로 중복 방지
- Session 문서: `.claude/sessions/2025-11-07-offline-map-implementation.md`
- ADR-002: `.claude/decisions/002-offline-map-integration.md`

### 2025-11-06

**[Architecture]** 🔴 활성화 시스템 설계

- 초기 설계: 3개 대안 비교
  1. Local-First 유지 (모든 데이터 로컬)
  2. 선택적 활성화 (1개 제한) ✅ 채택
  3. 개수 제한 (3개까지)
- temp_cache 방식 검토 → 복잡도로 폐기
- Session 문서: `.claude/sessions/2025-11-06-activation-architecture-design.md`

### 2025-11-05

**[Docs]** 🟢 .claude 디렉토리 재구조화

- `core/`, `features/`, `references/` 분리
- `.cursor/rules` → `.claude/` 마이그레이션
- 중복 제거 및 일관성 확보

---

## 2025-10

### 2025-10-31

**[Architecture]** 🟡 Local-First 아키텍처 확립

- SQLite + Drizzle ORM 도입
- sync_queue (Outbox Pattern) 구현
- Echo Protocol 확립 (Client ID 생성)
- withTransaction 패턴 도입

---

## Policy Versions

### v2.0 - Selective Activation (2025-11-06 ~ Current)

- **핵심**: 활성화 상태에 따른 선택적 로컬 저장
- **진실의 원천**:
  - 활성화된 여행 → Local SQLite
  - 비활성 여행 → Remote Server
- **라우팅**: Offline-Prep Router가 자동 분기

### v1.0 - Pure Local-First (2025-10-31 ~ 2025-11-05)

- **핵심**: 모든 데이터는 로컬 우선
- **진실의 원천**: Local SQLite
- **동기화**: 백그라운드에서 서버로 전송

---

## Migration Guides

### v1.0 → v2.0 Migration

**Code Changes**:

```typescript
// Before (v1.0)
const trips = await db.select().from(trips);

// After (v2.0)
const trips = await routeTripQuery({
  local: () => db.select().from(trips),
  remote: () => api.get('/trips'),
});
```

**Documentation Updates**:

- "모든 데이터는 로컬" → "활성화된 여행은 로컬"
- "로컬이 진실의 원천" → "활성화 상태가 데이터 위치 결정"
- Router 패턴 필수 사용 강조

---

## Statistics

- **Total Commits**: ~150+
- **Documentation Files**: 25+
- **Policy Changes**: 2 major versions
- **Architecture Decisions**: 3 ADRs
