# 활성화 시스템 아키텍처 설계

## Metadata

- **Date**: 2025-11-06
- **Participants**: User, Claude
- **Status**: Design Complete
- **Duration**: ~2 hours

## Context

### 문제 상황

Noline 프로젝트에 오프라인 지도 기능(Mapbox Offline) 통합 계획:

- 도시별 지도 타일 크기: 15-200MB
- 현재 아키텍처: 모든 여행 자동 Local-First 동기화
- 문제: 여행 10개 = 150MB-2GB 저장 공간 필요
- 모바일 저장 공간 한계 → 구조 변경 필요

### 기존 아키텍처

```
모든 여행 → 자동 로컬 동기화 (Local-First)
├── SQLite에 전체 데이터 저장
├── sync_queue로 서버 동기화
└── 오프라인 작동 보장
```

**문제점**:

- 사용하지 않는 여행 데이터도 모두 로컬 저장
- 오프라인 지도 추가 시 저장 공간 폭증
- 사용자 제어 불가

## Discussion Points

### 1. 활성화 개념 도입 필요성

**핵심 질문**: "모든 여행을 로컬에 저장해야 하는가?"

**사용자 실제 패턴 분석**:

```
여행 계획 (출발 2주 전)
  → 온라인 환경 (집/사무실)
  → 여러 여행 비교, 계획 수립
  → 로컬 저장 불필요

여행 직전 (출발 1일 전)
  → "오프라인 준비하기" 선택
  → 해당 여행만 다운로드

여행 중 (오프라인)
  → 완벽한 오프라인 작동 필요
  → 활성화된 여행만 사용

여행 종료 후 (복귀 1주일 후)
  → 온라인 환경 복귀
  → 자동 비활성화
  → 간단한 정리 작업
```

**결론**: 활성화 시스템 도입으로 사용자 제어 강화

---

### 2. 데이터 레이어 설계

**검토한 질문**: "어떤 데이터를 항상 로컬에, 어떤 데이터를 활성화 시에만?"

**최종 2-Tier 아키텍처**:

```
Tier 1: Metadata (항상 로컬, ~1MB for 100 trips)
  ├── 여행 ID, 목적지, 날짜
  ├── 활성화 상태 (activated: boolean)
  ├── 통계 (총 경비, 일정 개수)
  └── 썸네일

목적: 빠른 목록 조회, 활성화 상태 표시

Tier 2: Full Data (활성화 시만 로컬, ~10-200MB per trip)
  ├── Schedules (전체)
  ├── Expenses (전체)
  ├── Places (전체)
  └── 오프라인 지도 타일

목적: 완전한 오프라인 작동
```

**거부한 대안**:

- 3-Tier (Metadata / Full Data / Assets 분리): 복잡도 과도
- 1-Tier (모두 활성화 시에만): Metadata 조회 불가

---

### 3. 비활성화된 여행 편집 정책

**핵심 논의**: "비활성화된 여행도 편집 가능해야 하는가?"

**초기 설계 (복잡)**:

```typescript
// temp_cache 시스템
CREATE TABLE temporary_cache (
  id TEXT,
  entityType TEXT,
  data TEXT,
  synced BOOLEAN,
  expiresAt TEXT,
  needsVerification BOOLEAN
);

// Merge 로직
function mergeData(serverData, tempCache) {
  // 서버 데이터 + 로컬 캐시 병합
  // 버전 충돌 감지
  // TTL 관리
  // ... 복잡한 로직
}
```

**문제점**:

- temp_cache 관리 복잡도 높음
- Merge 로직 엣지 케이스 12개
- TTL, Cleanup Job 필요
- 버전 충돌 해결 로직

**사용자 피드백**: "활성화을 위한 기능인데 비활성에 너무 많은 복잡도 투자"

**단순화 결정**:

```typescript
// 비활성화된 여행 = 온라인 전용
if (!activated) {
  if (!isOnline) {
    throw new OfflineError('오프라인에서는 활성화한 여행만 편집 가능');
  }
  // 서버 직접 통신 (간단!)
  await api.post('/expenses', data);
}

// 활성화된 여행 = 완전 오프라인
if (activated) {
  // 기존 Local-First 로직 (변경 없음)
  await withTransaction(async () => {
    await db.insert(expenses).values(data);
    await db.insert(syncQueue).values(...);
  });
}
```

**제거된 복잡도**:

- ❌ temp_cache 테이블 및 전체 시스템
- ❌ Merge 로직
- ❌ 버전 충돌 감지
- ❌ TTL 관리 및 Cleanup Job
- ❌ Retry Queue (비활성용)
- ❌ Read-After-Write 일관성 처리

---

## Options Considered

### Option A: Local-First 유지 + sync_queue 제어

**아이디어**: Local-First는 그대로, sync_queue만 제어

```
모든 여행 → 로컬 저장 (변경 없음)
활성화된 여행만 → sync_queue 사용
비활성화된 여행 → sync_queue 사용 안 함
```

**장점**:

- 기존 아키텍처 유지
- 변경 최소화
- Local-First 철학 준수

**단점**:

- 저장 공간 문제 해결 안 됨
- 오프라인 지도 통합 불가능
- 활성화의 의미 불명확

**거부 이유**: 핵심 문제(저장 공간) 미해결

---

### Option B: 선택적 활성화 (초기 복잡 버전)

**아이디어**: 활성화된 여행만 로컬 저장, 비활성은 서버 조회 + temp_cache

```
활성화된 여행:
  ├── 로컬 DB 저장
  ├── sync_queue 사용
  └── 완전 오프라인

비활성화된 여행:
  ├── 서버에서 조회
  ├── temp_cache로 Read-After-Write 보장
  ├── Merge 로직으로 일관성 유지
  └── 온라인/오프라인 모두 편집 가능
```

**장점**:

- 저장 공간 효율적
- 활성화된 여행 완벽한 오프라인

**단점**:

- temp_cache 시스템 복잡도 높음 (엣지 케이스 21개)
- 비활성화된 여행에 과도한 복잡도
- Merge 로직 유지보수 부담
- 버전 충돌 해결 어려움

**검토 결과**: 복잡도가 가치를 초과

---

### Option C: 여행 개수 제한

**아이디어**: Local-First 유지, 여행 10-20개 제한

```
로컬 여행 개수 < 20:
  └── 새 여행 추가 가능

로컬 여행 개수 >= 20:
  └── 오래된 여행 삭제 강제
```

**장점**:

- Local-First 유지
- 구현 단순

**단점**:

- 강제 삭제 UX 나쁨
- 임의적 제한 (20개 기준 불명확)
- 여행 데이터 손실 위험
- 사용자 제어 없음

**거부 이유**: 최악의 UX

---

### **Option B-Simplified: 선택적 활성화 (단순화 버전)** ✅

**최종 선택**

**핵심 철학**:

> "활성화 = 오프라인 보험, 비활성 = 온라인 전용"

**설계**:

```
활성화된 여행:
  ├── 로컬 DB 저장
  ├── sync_queue 사용 (기존 로직)
  └── 완전 오프라인

비활성화된 여행:
  ├── Metadata만 로컬 (목록 표시용)
  ├── 서버 직접 통신
  └── 온라인 필수 (오프라인 시 에러)

자동 비활성화:
  └── 여행 종료일 + 7일 후
```

**장점**:

- ✅ 저장 공간 효율적 (활성화 1개 = ~200MB 최대)
- ✅ 명확한 UX ("오프라인 준비 = 편집 가능")
- ✅ 복잡도 50% 감소 (엣지 케이스 21개 → 9개)
- ✅ 구현 기간 50% 감소 (23-31일 → 12-16일)
- ✅ temp_cache 제거로 유지보수 부담 감소

**단점**:

- ⚠️ 비활성화된 여행 오프라인 편집 불가
- ⚠️ 온라인 필수 (네트워크 의존성)

**트레이드오프 판단**: 단점보다 장점이 큼

---

## Key Technical Decisions

### 1. Echo Protocol 유지

**결정**: 활성화 여부와 관계없이 클라이언트가 항상 ULID 생성

```typescript
// 비활성화된 여행도 클라이언트 ID 생성
const id = ulid();
await api.post('/expenses', { id, ...data });

// 서버는 그대로 수용 (Echo)
app.post('/expenses', (req, res) => {
  const { id, ...data } = req.body; // 클라이언트 ID 사용
  await db.insert(expenses).values({ id, ...data });
});
```

**이유**:

- 아키텍처 일관성
- 오프라인 → 온라인 전환 시 충돌 방지
- 향후 활성화 전환 시 ID 충돌 없음

---

### 2. 라우팅 레이어 패턴

**결정**: 모든 CRUD 연산에 활성화 상태 체크 레이어 추가

```typescript
// 라우팅 레이어
async function createExpense(data: CreateExpenseInput) {
  const metadata = await getTripMetadata(data.tripId);

  if (metadata.activated) {
    // Path A: Local-First
    return await withTransaction(async () => {
      const id = ulid();
      await db.insert(expenses).values({ id, ...data });
      await db.insert(syncQueue).values(...);
      return id;
    });
  } else {
    // Path B: Server-First
    if (!isOnline) {
      throw new OfflineError('오프라인에서는 활성화한 여행만 편집 가능');
    }
    const id = ulid();
    await api.post('/expenses', { id, ...data });
    return id;
  }
}
```

**성능 최적화**: React Query 캐시로 활성화 상태 재사용

```typescript
export function useActivationStatus(tripId: string) {
  return useQuery({
    queryKey: ['activation', 'status', tripId],
    queryFn: () => getTripMetadata(tripId),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}
```

---

### 3. 자동 비활성화 정책

**결정**: 여행 종료일 + 7일 후 자동 비활성화

```typescript
// 활성화하기 시 만료일 자동 설정
async function activateTrip(tripId: string) {
  const trip = await api.get(`/trips/${tripId}`);
  const expiresAt = addDays(new Date(trip.endDate), 7);

  await db.insert(tripActivations).values({
    tripId,
    isActivated: true,
    expiresAt: expiresAt.toISOString(),
  });
}

// Background Job: 하루 1회
async function autoUnactivateExpiredTrips() {
  const expired = await db.select().from(tripActivations).where(lt(tripActivations.expiresAt, new Date())).all();

  for (const sub of expired) {
    await unactivateTrip(sub.tripId);
  }
}
```

**이유**:

- 여행 종료 후 정리 시간 제공
- 자동 저장 공간 확보
- 사용자 부담 최소화

---

### 4. 1-Trip 활성화 제한

**결정**: 동시에 1개 여행만 활성화 가능

```typescript
async function activateTrip(tripId: string) {
  const existing = await db.select().from(tripActivations).where(eq(tripActivations.isActivated, true)).get();

  if (existing && existing.tripId !== tripId) {
    throw new ConflictError('이미 다른 여행이 활성화 중입니다');
  }

  // ... 활성화 로직
}
```

**이유**:

- 저장 공간 예측 가능성
- UI 단순화
- 실제 사용 패턴 (동시에 2개 여행 불가능)

---

## Schema Design

### trip_metadata (Tier 1 - 항상 로컬)

```sql
CREATE TABLE trip_metadata (
  id TEXT PRIMARY KEY,
  destination TEXT NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  activated BOOLEAN DEFAULT false,  -- 핵심 플래그
  totalExpenses REAL DEFAULT 0,
  scheduleCount INTEGER DEFAULT 0,
  expenseCount INTEGER DEFAULT 0,
  thumbnailUrl TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### trip_activations

```sql
CREATE TABLE trip_activations (
  id TEXT PRIMARY KEY,
  tripId TEXT UNIQUE NOT NULL,
  isActivated BOOLEAN DEFAULT false,
  activatedAt TEXT,
  expiresAt TEXT,  -- 자동 해제 기준
  syncStatus TEXT, -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
  lastSyncAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

**제거된 스키마**:

- ❌ temporary_cache (복잡도 제거)

---

## Edge Cases (단순화 후)

초기 21개에서 9개로 감소:

### 유지되는 엣지 케이스

1. ✅ Metadata/Full Data 불일치
2. ✅ 활성화하기 중단 (Pull 실패)
3. ✅ 지도 다운로드 실패
4. ✅ Pull 실패 시 부분 데이터 (트랜잭션 롤백)
5. ✅ 비활성화 후 정리 실패 (재시도)
6. ✅ 대량 데이터 Pull UI 블로킹 (배치 처리)
7. ✅ 여러 기기 동시 활성화 (DB Lock)
8. ✅ 활성화하기 중 데이터 수정 (Lock)
9. ✅ 라우팅 레이어 성능 (React Query 캐시)

### 제거된 엣지 케이스 (12개)

- ❌ temp_cache 관련 (8개): TTL 만료, Merge 충돌, 버전 충돌 등
- ❌ 네트워크 전환 (3개): 플래핑, 타임아웃 vs 저장, 재시도
- ❌ 비활성 편집 (1개): 오프라인 Read-After-Write

---

## Open Questions

- [ ] **자동 비활성화 기간**: 7일이 적절한가? (3일? 14일?)
- [ ] **1-Trip 제한**: 충분한가? 2-3개 허용 검토?
- [ ] **활성화 전환 UX**: Pull 진행률 표시 필요?
- [ ] **비활성 편집 제한**: 온라인 필수 정책 사용자 수용 가능?
- [ ] **지도 다운로드 타이밍**: 활성화하기와 동시? 별도?

---

## Implementation Estimates

**초기 복잡 버전**: 23-31일
**단순화 버전**: **12-16일** (50% 감소)

### Phase 별 분석

| Phase    | 작업           | 초기     | 단순화   | 감소      |
| -------- | -------------- | -------- | -------- | --------- |
| 1        | 스키마         | 3일      | 2일      | -1일      |
| 2        | 라우팅 레이어  | 4일      | 3일      | -1일      |
| 3        | 활성화 관리    | 5일      | 4일      | -1일      |
| 4        | temp_cache     | 4일      | **0일**  | **-4일**  |
| 5        | 기존 코드 통합 | 7일      | 5일      | -2일      |
| 6        | 테스트         | 5일      | 3일      | -2일      |
| 7        | 지도 연동      | 3일      | 2일      | -1일      |
| **합계** |                | **31일** | **19일** | **-12일** |

---

## Next Steps

### 즉시 (문서화)

- [x] Session 문서 작성 ← 현재
- [ ] Feature Guide 작성
- [ ] CLAUDE.md 업데이트

### 개발 시작 전

- [ ] Open Questions 해결
- [ ] 프로토타입 UX 검증

### Phase 1 (2일)

- [ ] trip_metadata, trip_activations 스키마 생성
- [ ] Drizzle 마이그레이션

### 개발 완료 후

- [ ] `/check-docs` 실행
- [ ] `/doc-save --decision` 실행
  - Decision 문서 생성
  - CHANGELOG 업데이트
  - Session 문서 링크 연결

---

## Related Documents

### 정책 문서

- [CLAUDE.md](../../CLAUDE.md) - 프로젝트 전체 가이드
- [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md) - Entity 스키마 규칙
- [.claude/core/selective-activation-architecture.md](../core/selective-activation-architecture.md) - Selective Activation 가이드
- [.claude/core/api-data.md](../core/api-data.md) - API 레이어 패턴

### 구현 가이드 (작성 예정)

- [.claude/features/activation-system.md](../features/activation-system.md) - 활성화 시스템 구현 가이드

---

## Conclusion

활성화 시스템 도입으로:

**문제 해결**:

- ✅ 저장 공간 효율화 (활성화 1개 = 최대 200MB)
- ✅ 오프라인 지도 통합 가능
- ✅ 사용자 제어 강화

**복잡도 관리**:

- ✅ temp_cache 제거로 엣지 케이스 57% 감소
- ✅ 구현 기간 50% 단축
- ✅ 유지보수 부담 감소

**트레이드오프**:

- ⚠️ 비활성화된 여행 온라인 필수
- ⚠️ Local-First 철학 부분 수정

**최종 판단**: 트레이드오프 수용 가능, 진행 결정

---

## Implementation Clarifications (2025-11-06 후속 논의)

아키텍처 설계 완료 후, 실제 구현 전 다음 사항들을 명확화했습니다.

### 배경

설계 문서 작성 후 다음 질문들이 제기됨:

1. Sync Engine과 Offline-Prep의 관계가 불명확
2. 디렉토리 구조 결정 필요 (`services/sync/` 종속 vs 독립)
3. lib/ vs services/ 구분 기준
4. 롤백 가능성 (리스크 관리)

---

### 질문 1: Sync Engine vs Offline-Prep 관계

**질문**: "기존에 services에 sync 엔진이 있는데 이거와는 구별되는건가?"

**논의**:

초기에는 `services/sync/offline-prep/` 구조를 제안했으나, 이는 종속 관계로 오해될 수 있음을 발견.

**비교 분석**:

| 비교            | Sync Engine              | Offline-Prep              |
| --------------- | ------------------------ | ------------------------- |
| **책임**        | 로컬 ↔ 서버 동기화      | 데이터 소스 라우팅        |
| **동작 시점**   | 백그라운드 주기적        | Query/Mutation 시점       |
| **트리거**      | 타이머, 네트워크 복구    | 사용자 액션 (Query 호출)  |
| **판단 기준**   | sync_queue 상태          | 여행 활성화 상태          |
| **데이터 흐름** | 로컬 → 서버, 서버 → 로컬 | 로컬 OR 원격 선택         |
| **관련 개념**   | sync_queue, push/pull    | 활성화 메타데이터, 라우팅 |

**결론**: **완전히 독립적인 두 계층**

- Sync Engine: "로컬 DB와 서버를 언제 어떻게 동기화할까?"
- Offline-Prep: "이 여행 데이터를 어디서 읽을까? (로컬 vs 서버)"
- 관계: 독립적이지만 협력적 (활성화된 여행은 Offline-Prep → 로컬 → Sync 흐름)

**아키텍처 흐름**:

```text
┌─────────────────────────────────────────────────┐
│          Entity Layer (useGetExpenses)           │
└─────────────────────────────────────────────────┘
                      ↓
              Offline-Prep Router
                      ↓
        ┌─────────────┴─────────────┐
        │                           │
    [활성화된 여행]                [비활성화된 여행]
        ↓                           ↓
  Local SQLite                 Remote Server
        ↓                           ✓ 끝
   (백그라운드)
        ↓
  Sync Engine
   (push/pull)
        ↓
   Remote Server
```

---

### 질문 2: lib/ vs services/ 구분

**질문**: "왜 offline-prep은 services에? lib과의 차이는?"

**논의**:

초기에 "DB 조회하면 stateful"이라고 잘못 이해했으나, 이는 틀린 정의임을 명확화.

**Stateful vs Stateless 재정의**:

**Stateful** = 앱 런타임에 상태를 유지

```typescript
// ✅ Stateful 예시
const [isSyncing, setIsSyncing] = useState(false); // React 상태
const intervalId = setInterval(...); // 백그라운드 작업
let cachedData = null; // 모듈 레벨 변수
```

**Stateless** = 호출하고 끝, 상태 유지 안함

```typescript
// ✅ Stateless 예시
function formatDate(date) { return date.toISOString(); }
async function queryDB() { return await db.select()...; }
async function pushChanges() { /* DB 조회 → API 호출 → DB 삭제 */ }
```

**결론**: 대부분의 services는 **Stateless** (복잡한 비즈니스 로직)

**구분 기준 명확화**:

|                 | lib/                           | services/                                 |
| --------------- | ------------------------------ | ----------------------------------------- |
| **기준**        | 순수 함수 + 범용               | Side effect OR 앱 특화                    |
| **예시**        | `formatDate`, `formatCurrency` | `pushChanges`, `generateId`, `routeQuery` |
| **재사용**      | 다른 프로젝트 OK               | 앱에 특화됨                               |
| **Side effect** | ❌ 없음                        | ✅ 있음 (DB, API, 파일 등)                |

**Offline-Prep 판단**:

- Side effect: ✅ (DB 조회, 네트워크 상태 확인)
- 앱 특화: ✅ (Noline의 활성화 시스템에 특화)
- 결론: `services/offline-prep/` ✅

---

### 질문 3: 디렉토리 구조 결정

**질문**: "sync와 병렬계층인가? 종속 계층인가?"

**초기 제안** (잘못됨):

```text
services/sync/
├── engine.ts
├── queue.ts
└── offline-prep/    # ← 종속으로 오해
```

**문제점**: Offline-Prep은 Sync의 하위가 아닌 독립적인 도메인

**최종 결정**:

```text
shared/services/
├── id/
│   └── ulid.ts              # ID 생성 서비스 (독립)
│
├── sync/                    # 🔄 동기화 엔진
│   ├── provider.tsx         # 백그라운드 동기화 Provider
│   ├── engine.ts            # Push/Pull 엔진
│   ├── queue.ts             # sync_queue 관리
│   ├── storage.ts           # sync metadata
│   └── api.ts               # Sync API 클라이언트
│
└── offline-prep/            # 📦 오프라인 준비 시스템
    ├── router.ts            # routeQuery, routeMutation (라우팅)
    ├── metadata.ts          # getTripMetadata (활성화 상태 조회)
    └── manager.ts           # activate, unactivate (활성화 관리 - 미래)
```

**이유**:

1. Sync Engine과 Offline-Prep은 완전히 다른 도메인
2. 병렬 서비스 (독립적)
3. 각자의 책임이 명확히 분리됨

---

### 질문 4: 롤백 가능성 분석

**질문**: "쉽게 이전으로 돌아갈 수 있는가?"

**분석 결과**: 🟢 **매우 쉬움** (9/10)

#### 변경 범위

**변경이 필요한 파일** (13개):

| 영역              | 파일                                | 변경 타입   | 롤백 난이도          |
| ----------------- | ----------------------------------- | ----------- | -------------------- |
| Schema            | `shared/db/schema.ts`               | 테이블 추가 | 🟢 쉬움 (DROP TABLE) |
| Service           | `services/offline-prep/router.ts`   | 신규        | 🟢 쉬움 (파일 삭제)  |
| Service           | `services/offline-prep/metadata.ts` | 신규        | 🟢 쉬움 (파일 삭제)  |
| Entity (Trip)     | `data/useGetTrips.ts`               | 수정        | 🟡 중간 (Git revert) |
| Entity (Trip)     | `data/api/local.ts`                 | 신규        | 🟢 쉬움 (파일 삭제)  |
| Entity (Trip)     | `data/api/remote.ts`                | 신규        | 🟢 쉬움 (파일 삭제)  |
| Entity (Schedule) | 3개 파일                            | 동일        | 동일                 |
| Entity (Expense)  | 3개 파일                            | 동일        | 동일                 |

**변경이 불필요한 파일** (~50개):

- Sync 엔진 (engine.ts, queue.ts, provider.tsx) → 영향 없음
- Mutation Hook (useCreate*, useUpdate*, useDelete\*) → 영향 없음
- Screen, Feature 컴포넌트 → 영향 없음

#### 롤백 시나리오

**시나리오 1: 완전 제거** (1시간 내)

```bash
# Git revert 한 방
git revert <commit-hash>

# 또는 수동
1. services/offline-prep/ 디렉토리 삭제
2. entities/*/data/api/ 디렉토리 삭제
3. entities/*/data/use*.ts 파일 원래대로 복구
4. DB: DROP TABLE trip_activations
```

**시나리오 2: Router만 무시** (30분 내)

```typescript
// entities/expense/data/useGetExpenses.ts
export const useGetExpenses = ({ tripId }) => {
  return useQuery({
    queryKey: ['expense', 'byTrip', tripId],
    queryFn: async () => {
      // routeQuery 제거 → 항상 로컬
-     return await routeQuery(tripId, { local, remote });
+     return await local.getExpensesLocal(tripId);
    },
  });
};
```

변경: 3개 파일 (Trip, Schedule, Expense)

**시나리오 3: 전부 로컬로** (10분 내)

```typescript
// services/offline-prep/router.ts
export async function routeQuery<T>(...) {
  // 항상 로컬 반환
  return operations.local();
}
```

변경: 1개 파일

#### 롤백 용이성 평가

**핵심 이유**:

1. ✅ **단방향 의존성**: Entity → Offline-Prep (제거 쉬움)
2. ✅ **기존 코드 영향 최소**: Sync, Mutation 무관
3. ✅ **Git으로 완벽 복구**: 커밋 단위 롤백 가능
4. ✅ **점진적 롤백 옵션**: Router만 무시 가능
5. ✅ **데이터 손실 없음**: 새 테이블 추가일 뿐

#### 추가 안전장치 제안

##### 1. Feature Flag

```typescript
// shared/config/features.ts
export const FEATURES = {
  OFFLINE_PREP_ENABLED: false, // 🚩 플래그
};

// router.ts
export async function routeQuery<T>(...) {
  if (!FEATURES.OFFLINE_PREP_ENABLED) {
    return operations.local(); // 기존 동작
  }
  // Offline-Prep 로직
  // ...
}
```

**장점**: 1줄만 수정하면 On/Off

##### 2. 단계적 적용

```bash
# Phase 1: Router 추가만 (일단 항상 로컬)
# Phase 2: Trip Entity만 적용
# Phase 3: 검증 후 Schedule, Expense 적용
```

##### 3. 커밋 전략

```bash
# Commit 1: DB 스키마 추가
# Commit 2: Offline-Prep 서비스 추가
# Commit 3: Trip Entity 적용
# Commit 4: Schedule Entity 적용
# Commit 5: Expense Entity 적용
```

커밋 단위로 롤백 가능, 문제 지점 명확히 파악

---

### 결론: 구현 준비 완료

**명확화된 사항**:

1. ✅ Sync Engine과 Offline-Prep은 독립적
2. ✅ 디렉토리 구조: `services/offline-prep/`
3. ✅ 롤백 매우 쉬움 (안전)

**다음 단계**:

- Open Questions 해결 후 구현 시작
- Feature Flag 및 단계적 적용으로 리스크 최소화
- 커밋 전략으로 롤백 용이성 확보
