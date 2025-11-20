# Decision: Data/Service Layer 분리와 Policy-Driven Architecture

**날짜**: 2025-11-20
**작성자**: Claude & 개발팀
**상태**: Accepted
**영향 범위**: High - 전체 아키텍처

## 1. 배경 (Context)

### 문제 상황

Noline의 Selective Activation 아키텍처는 "활성화 = Local-First"라는 단순한 규칙을 따랐습니다. 이는 데이터 무결성을 보장하는 훌륭한 접근이었지만, 예상치 못한 부작용이 발생했습니다:

1. **온라인 기능 제한**: 활성화된 여행은 온라인 상태에서도 구글맵을 사용할 수 없고, 오프라인 맵만 사용 가능
2. **데이터 신선도 문제**: 다른 기기에서 수정한 내용이 실시간으로 반영되지 않음
3. **모순적인 UX**: "오프라인 대비"를 위해 활성화했는데, 오히려 온라인에서 기능이 제한됨

### 핵심 통찰

문제의 본질은 **"데이터"와 "서비스"를 구분하지 않고** 모든 것에 동일한 정책을 적용했다는 점입니다:

- **데이터** (Trip, Schedule, Expense): 소유권이 있고, 동기화가 필요하며, 무결성이 중요함
- **서비스** (Map, Search, Directions): 소유권이 없고, 단순 조회이며, 최신성이 중요함

## 2. 결정 (Decision)

### 2.1 Data와 Service Layer 분리

#### Data Layer (소유권 있음)

- **대상**: Trip, Schedule, Expense 엔티티
- **특징**:
  - CRUD 작업 수행
  - sync_queue를 통한 동기화 필요
  - 데이터 무결성이 중요
- **정책**: Router를 통한 Local-First 유지
  ```typescript
  // 활성화된 여행 = Local DB가 진실의 원천
  // 비활성 여행 = Server가 진실의 원천
  routeChildMutation({ local, remote });
  ```
- **이유**: sync_queue 메커니즘 안정성, 데이터 소유권 명확화

#### Service Layer (소유권 없음)

- **대상**: Map View, Place Search, Directions API
- **특징**:
  - 읽기 전용 서비스
  - 외부 API 의존
  - 실시간성이 중요
- **정책**: Network-First (Router 무시)
  ```typescript
  // 온라인 = Google Maps/Places API
  // 오프라인 + 활성화 = Mapbox/캐시
  // 오프라인 + 비활성화 = 서비스 불가
  ```
- **이유**: 최상의 사용자 경험 제공

### 2.2 Policy Layer 도입

비즈니스 로직을 코드에서 분리하여 중앙에서 관리:

```typescript
// 4가지 상태 조합
type PolicyKey = 'online_active' | 'online_inactive' | 'offline_active' | 'offline_inactive';

const POLICY_TABLE = {
  online_active: {
    mapProvider: 'google',
    searchMode: 'api',
    createTrip: { allowed: true },
    createSchedule: { allowed: true, mode: 'full' },
  },
  offline_active: {
    mapProvider: 'mapbox',
    searchMode: 'disabled',
    createTrip: { allowed: false, reason: 'internet-required' },
    createSchedule: { allowed: true, mode: 'manual-only' },
  },
  // ...
};
```

### 2.3 Selective Blocking (선택적 차단)

외부 API 의존성을 기술적이 아닌 **정책적으로** 해결:

| 기능              | 오프라인 정책    | 이유                                |
| ----------------- | ---------------- | ----------------------------------- |
| **Trip 생성**     | ❌ 차단          | 초기 메타데이터(통화, 타임존) 필수  |
| **Schedule 생성** | ✅ 허용 (Manual) | 텍스트 기록이 핵심, 좌표는 부가정보 |
| **Expense 생성**  | ✅ 허용          | 금액 기록이 핵심                    |

### 2.4 Manual Input 지원

오프라인에서도 핵심 기능 유지:

```typescript
// Schedule 생성시
if (policy.createSchedule.mode === 'manual-only') {
  // 좌표 없이 저장
  await withTransaction(async () => {
    await db.insert(schedules).values({
      ...data,
      latitude: null, // nullable
      longitude: null,
      address: manualAddress, // 수동 입력
    });
    await addToSyncQueue('schedules', id, 'CREATE', {
      ...data,
      metadata: { inputMode: 'manual' },
    });
  });
}
```

## 3. 구현 세부사항

### 3.1 Router와 Policy의 책임 분리

| Layer      | 책임             | 질문           | 예시                     |
| ---------- | ---------------- | -------------- | ------------------------ |
| **Router** | 데이터 저장 위치 | WHERE to save? | Local DB vs Server API   |
| **Policy** | 기능 사용 가능   | CAN I use?     | 버튼 활성화, 메시지 표시 |

### 3.2 구현 파일 구조

```
shared/
├── services/
│   └── offline-prep/
│       └── router.ts        # 기존 유지 (Data Layer)
├── policy/
│   ├── constants.ts         # POLICY_TABLE 정의
│   ├── types.ts            # PolicyKey, PolicyRule 타입
│   └── useAppPolicy.ts     # React Hook
└── hooks/
    └── useNetworkStatus.ts  # 네트워크 감지 (기존)
```

### 3.3 SmartMapView 리팩토링

```typescript
// Before: 오프라인 맵 유무로만 판단
if (offlineCity) return <MapboxView />;
else return <GoogleMapView />;

// After: Policy 기반
const policy = useAppPolicy();
switch(policy.mapProvider) {
  case 'google': return <GoogleMapView />;
  case 'mapbox': return <MapboxView />;
  case 'none': return <NoMapAvailable />;
}
```

## 4. 영향 (Consequences)

### 긍정적 효과

1. **일관된 UX**: 온라인에서는 모든 기능 사용 가능
2. **유연한 정책**: Policy Table 수정만으로 정책 변경
3. **명확한 책임**: Data/Service 분리로 복잡도 감소
4. **Graceful Degradation**: 오프라인에서도 핵심 기능 유지

### 잠재적 위험

1. **Manual 데이터 품질**: 좌표 없는 데이터 관리 필요
2. **네트워크 전환시 UX**: 맵 전환시 깜빡임 가능
3. **두 레이어 학습곡선**: 신규 개발자 온보딩 필요

### 마이그레이션 계획

1. Phase 1: Policy Layer 구조 생성
2. Phase 2: SmartMapView에 Policy 적용
3. Phase 3: Manual Input UI 추가
4. Phase 4: 기존 컴포넌트 점진적 마이그레이션

## 5. 대안 검토 (Alternatives Considered)

### 대안 1: Router 정책 변경

- 내용: 온라인시 Server 우선으로 변경
- 기각 이유: sync_queue 메커니즘 붕괴, Ghost Data 문제

### 대안 2: 완전 온라인/오프라인 모드

- 내용: 사용자가 모드 선택
- 기각 이유: 사용자에게 복잡도 전가

### 대안 3: 현 상태 유지

- 내용: 제한 사항 수용
- 기각 이유: 핵심 UX 문제 미해결

## 6. 참고 자료

- [Selective Activation Architecture](./../core/selective-activation-architecture.md)
- [Router Implementation](../../apps/client/src/shared/services/offline-prep/router.ts)
- [Network Status Hook](../../apps/client/src/shared/hooks/useNetworkStatus.ts)

## 7. 후속 작업

- [ ] Policy Layer 구현 (`shared/policy/`)
- [ ] SmartMapView 리팩토링
- [ ] Manual Input 컴포넌트 개발
- [ ] 문서 업데이트 (CLAUDE.md, CHANGELOG.md)
- [ ] 테스트 케이스 추가

---

**결론**: Data와 Service를 분리하고 Policy Layer로 제어함으로써, 데이터 무결성을 유지하면서도 최상의 사용자 경험을 제공할 수 있습니다.
