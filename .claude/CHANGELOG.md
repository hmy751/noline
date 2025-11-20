# 📝 CHANGELOG

> Noline 프로젝트의 주요 변경사항 및 정책 진화 기록

## Format

각 항목은 다음 형식을 따릅니다:

- **날짜**: YYYY-MM-DD
- **유형**: [Policy] [Architecture] [Feature] [Fix] [Docs]
- **영향도**: 🔴 Breaking | 🟡 Major | 🟢 Minor

---

## 2025-11

### 2025-11-20

**[Architecture Design]** 📋 v3.0 설계 완료 - Policy-Driven Architecture

> **상태**: 설계 문서 작성 완료 - 코드 구현 대기중
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
