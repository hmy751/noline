# Policy-Driven Architecture Guide

> **핵심**: 비즈니스 로직을 코드에서 분리하여 중앙에서 관리하는 아키텍처 패턴

## 📋 목차

- [개요](#개요)
- [Policy Layer 구조](#policy-layer-구조)
- [구현 가이드](#구현-가이드)
- [사용 예시](#사용-예시)
- [확장 가이드](#확장-가이드)
- [FAQ](#faq)

## 개요

### 왜 Policy Layer인가?

기존 문제점:

```typescript
// ❌ Bad: 비즈니스 로직이 코드에 산재
if (isOnline && isActivated) {
  // 구글맵 사용... 아니면 맵박스?
} else if (!isOnline && isActivated) {
  // 오프라인 맵... 근데 생성은?
} else if (isOnline && !isActivated) {
  // 이건 또 뭐지?
}
// 개발자가 매번 기억해야 함
```

Policy Layer 도입 후:

```typescript
// ✅ Good: 정책에 따라 자동 결정
const policy = useAppPolicy();
if (!policy.createTrip.allowed) {
  return <DisabledMessage reason={policy.createTrip.reason} />;
}
```

### 핵심 원칙

1. **Separation of Concerns**: 비즈니스 정책과 구현 로직 분리
2. **Single Source of Truth**: 모든 정책은 POLICY_TABLE에서 관리
3. **Type Safety**: TypeScript로 정책 타입 보장
4. **Testability**: 정책을 독립적으로 테스트 가능

## Policy Layer 구조

### 파일 구조

```
shared/policy/
├── constants.ts         # POLICY_TABLE 정의
├── types.ts            # 타입 정의
├── useAppPolicy.ts     # React Hook
└── __tests__/          # 테스트
    └── policy.test.ts
```

### 타입 정의

```typescript
// types.ts
export type NetworkStatus = 'online' | 'offline';
export type ActivationStatus = 'active' | 'inactive';
export type PolicyKey = `${NetworkStatus}_${ActivationStatus}`;

export interface PolicyRule {
  // Map 관련
  mapProvider: 'google' | 'mapbox' | 'none';
  searchMode: 'api' | 'cache' | 'disabled';

  // 생성 권한
  createTrip: {
    allowed: boolean;
    reason?: string;
  };
  createSchedule: {
    allowed: boolean;
    mode: 'full' | 'manual-only' | 'disabled';
    reason?: string;
  };
  createExpense: {
    allowed: boolean;
    mode: 'full' | 'manual-only' | 'disabled';
    reason?: string;
  };

  // 수정/삭제 권한
  updateAllowed: boolean;
  deleteAllowed: boolean;

  // 동기화 정책
  syncStrategy: 'immediate' | 'background' | 'manual' | 'disabled';

  // UI 힌트
  uiMode: 'full' | 'limited' | 'readonly';
}
```

### Policy Table 정의

```typescript
// constants.ts
export const POLICY_TABLE: Record<PolicyKey, PolicyRule> = {
  online_active: {
    mapProvider: 'google',
    searchMode: 'api',
    createTrip: { allowed: true },
    createSchedule: { allowed: true, mode: 'full' },
    createExpense: { allowed: true, mode: 'full' },
    updateAllowed: true,
    deleteAllowed: true,
    syncStrategy: 'immediate',
    uiMode: 'full',
  },

  online_inactive: {
    mapProvider: 'google',
    searchMode: 'api',
    createTrip: { allowed: true },
    createSchedule: { allowed: true, mode: 'full' },
    createExpense: { allowed: true, mode: 'full' },
    updateAllowed: true,
    deleteAllowed: true,
    syncStrategy: 'immediate',
    uiMode: 'full',
  },

  offline_active: {
    mapProvider: 'mapbox',
    searchMode: 'disabled',
    createTrip: {
      allowed: false,
      reason: '인터넷 연결이 필요합니다',
    },
    createSchedule: {
      allowed: true,
      mode: 'manual-only',
      reason: '장소 검색 불가, 직접 입력만 가능',
    },
    createExpense: {
      allowed: true,
      mode: 'manual-only',
    },
    updateAllowed: true,
    deleteAllowed: true,
    syncStrategy: 'background',
    uiMode: 'limited',
  },

  offline_inactive: {
    mapProvider: 'none',
    searchMode: 'disabled',
    createTrip: {
      allowed: false,
      reason: '인터넷 연결이 필요합니다',
    },
    createSchedule: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
    createExpense: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
    updateAllowed: false,
    deleteAllowed: false,
    syncStrategy: 'disabled',
    uiMode: 'readonly',
  },
};
```

## 구현 가이드

### useAppPolicy Hook

```typescript
// useAppPolicy.ts
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useHasAnyActivatedTrip } from '@/shared/hooks/useActivation';
import { POLICY_TABLE } from './constants';
import type { PolicyKey, PolicyRule } from './types';

export function useAppPolicy(tripId?: string): PolicyRule {
  const networkStatus = useNetworkStatus();
  const hasActivated = tripId ? useTripActivationStatus(tripId) : useHasAnyActivatedTrip();

  const policyKey: PolicyKey = `${networkStatus}_${hasActivated ? 'active' : 'inactive'}`;

  return POLICY_TABLE[policyKey];
}

// 특정 기능만 체크
export function useCanCreateTrip(): boolean {
  const policy = useAppPolicy();
  return policy.createTrip.allowed;
}

export function useCanCreateSchedule(tripId: string): {
  allowed: boolean;
  mode: string;
  reason?: string;
} {
  const policy = useAppPolicy(tripId);
  return policy.createSchedule;
}
```

## 사용 예시

### 1. Trip 생성 버튼

```typescript
function CreateTripButton() {
  const policy = useAppPolicy();
  const { createTrip } = policy;

  if (!createTrip.allowed) {
    return (
      <Button disabled>
        <Text>새 여행 만들기</Text>
        <Text style={styles.reason}>{createTrip.reason}</Text>
      </Button>
    );
  }

  return (
    <Button onPress={handleCreateTrip}>
      <Text>새 여행 만들기</Text>
    </Button>
  );
}
```

### 2. SmartMapView

```typescript
function SmartMapView({ tripId, locations, selectedLocation }) {
  const policy = useAppPolicy(tripId);

  switch(policy.mapProvider) {
    case 'google':
      return (
        <GoogleMapView
          locations={locations}
          selectedLocation={selectedLocation}
        />
      );

    case 'mapbox':
      return (
        <OfflineMapView
          locations={locations}
          selectedLocation={selectedLocation}
          cityId={tripId}
        />
      );

    case 'none':
      return (
        <EmptyState
          message="지도를 표시할 수 없습니다"
          description="인터넷 연결 또는 여행 활성화가 필요합니다"
        />
      );
  }
}
```

### 3. Schedule 생성 Form

```typescript
function CreateScheduleForm({ tripId }) {
  const policy = useAppPolicy(tripId);
  const { createSchedule } = policy;

  if (!createSchedule.allowed) {
    return (
      <DisabledState message={createSchedule.reason} />
    );
  }

  if (createSchedule.mode === 'manual-only') {
    return (
      <ManualScheduleInput
        tripId={tripId}
        hint="오프라인: 장소 검색 불가, 직접 입력해주세요"
      />
    );
  }

  // Full mode
  return (
    <FullScheduleForm
      tripId={tripId}
      enableSearch={true}
      enableMap={true}
    />
  );
}
```

### 4. Manual Input 처리

```typescript
function ManualScheduleInput({ tripId }) {
  const policy = useAppPolicy(tripId);
  const createSchedule = useCreateSchedule();

  const handleSubmit = async (data: FormData) => {
    if (policy.createSchedule.mode === 'manual-only') {
      // 좌표 없이 저장
      await createSchedule.mutate({
        ...data,
        latitude: null,
        longitude: null,
        metadata: {
          inputMode: 'manual',
          networkStatus: 'offline'
        }
      });
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <TextInput name="title" placeholder="일정 제목" />
      <TextInput name="location" placeholder="장소명 (직접 입력)" />
      <DatePicker name="scheduledAt" />
      <Text style={styles.warning}>
        📍 위치 정보는 온라인 연결 후 추가할 수 있습니다
      </Text>
      <Button type="submit">저장</Button>
    </Form>
  );
}
```

### 5. 네트워크 상태 표시

```typescript
function NetworkStatusBadge() {
  const policy = useAppPolicy();
  const networkStatus = useNetworkStatus();

  const getStatusColor = () => {
    if (networkStatus === 'offline') return 'red';
    return 'green';
  };

  const getStatusText = () => {
    if (networkStatus === 'offline') {
      return policy.uiMode === 'readonly'
        ? '오프라인 (읽기 전용)'
        : '오프라인 (제한된 기능)';
    }
    return '온라인';
  };

  return (
    <Badge color={getStatusColor()}>
      {getStatusText()}
    </Badge>
  );
}
```

## 확장 가이드

### 새로운 Entity 추가시

1. Policy Rule에 권한 추가:

```typescript
// types.ts
interface PolicyRule {
  // 기존...
  createNewEntity: {
    allowed: boolean;
    mode: 'full' | 'manual-only' | 'disabled';
    reason?: string;
  };
}
```

2. POLICY_TABLE 업데이트:

```typescript
// constants.ts
'online_active': {
  // 기존...
  createNewEntity: { allowed: true, mode: 'full' }
}
```

3. Hook 생성:

```typescript
export function useCanCreateNewEntity(tripId: string) {
  const policy = useAppPolicy(tripId);
  return policy.createNewEntity;
}
```

### 새로운 서비스 추가시

1. Service Provider 추가:

```typescript
interface PolicyRule {
  // 기존...
  weatherProvider: 'openweather' | 'cached' | 'none';
}
```

2. 컴포넌트에서 사용:

```typescript
function WeatherWidget() {
  const policy = useAppPolicy();

  switch(policy.weatherProvider) {
    case 'openweather':
      return <LiveWeather />;
    case 'cached':
      return <CachedWeather />;
    case 'none':
      return null;
  }
}
```

## FAQ

### Q: Policy와 Router의 차이는?

**Router (Data Layer)**:

- 데이터를 **어디에** 저장할지 결정
- 활성화 상태에 따라 Local/Server 분기
- sync_queue 관리

**Policy (Control Layer)**:

- 기능을 **사용할 수 있는지** 결정
- UI 활성화/비활성화
- 사용자 메시지 관리

### Q: 정책 변경이 필요한 경우?

POLICY_TABLE의 값만 수정하면 됩니다:

```typescript
// 예: 오프라인에서도 Trip 생성 허용하기
'offline_active': {
  createTrip: {
    allowed: true,  // false → true
    mode: 'manual-only'
  }
}
```

### Q: 테스트는 어떻게?

```typescript
// __tests__/policy.test.ts
describe('Policy Layer', () => {
  it('온라인 활성화 상태에서 모든 기능 허용', () => {
    const policy = POLICY_TABLE['online_active'];
    expect(policy.createTrip.allowed).toBe(true);
    expect(policy.mapProvider).toBe('google');
  });

  it('오프라인 비활성화 상태에서 읽기만 허용', () => {
    const policy = POLICY_TABLE['offline_inactive'];
    expect(policy.uiMode).toBe('readonly');
    expect(policy.createSchedule.allowed).toBe(false);
  });
});
```

### Q: Performance 고려사항?

- Policy 조회는 O(1) (Object lookup)
- Hook은 메모이제이션 적용
- 네트워크 상태 변경시만 리렌더링

```typescript
// 최적화된 Hook
export const useAppPolicy = memo(
  (tripId?: string) => {
    // ... 구현
  },
  [tripId],
);
```

## 마이그레이션 체크리스트

- [ ] `shared/policy/` 디렉토리 생성
- [ ] 타입 정의 (`types.ts`)
- [ ] Policy Table 정의 (`constants.ts`)
- [ ] Hook 구현 (`useAppPolicy.ts`)
- [ ] SmartMapView 마이그레이션
- [ ] CreateTripButton 마이그레이션
- [ ] CreateScheduleForm 마이그레이션
- [ ] Manual Input 컴포넌트 추가
- [ ] 테스트 작성
- [ ] 문서 업데이트

## 참고 자료

- [Decision: Data/Service 분리](../decisions/2025-11-20-data-service-separation.md)
- [Selective Activation Architecture](./selective-activation-architecture.md)
- [Router 구현](../apps/client/src/shared/services/offline-prep/router.ts)
