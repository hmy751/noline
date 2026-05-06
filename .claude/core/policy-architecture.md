# Policy-Driven Architecture Guide

> **📋 상태**: ✅ 구현 완료 (Phase 1~4, 90%)
> **버전**: v3.0
> **작성일**: 2025-11-20
> **최종 업데이트**: 2025-11-21
> **구현 추적**: [v3.0-tracker.md](../implementation/v3.0-tracker.md)

> 문서 상태: active source다. 상단 구현률/phase 표기는 작성 당시 추적 정보이므로 현재 코드와 충돌하면 코드를 우선 확인한다.
>
> **핵심**: 비즈니스 로직을 코드에서 분리하여 중앙에서 관리하는 아키텍처 패턴
> **구조**: CRUD-Centric (Operation-First) - 각 동작이 4가지 상태에서 어떻게 동작하는지 한눈에 파악

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
// ✅ Good: 정책에 따라 자동 결정 (CRUD-Centric)
const policy = useAppPolicy(tripId);
if (!policy.schedule.create.allowed) {
  return <DisabledMessage reason={policy.schedule.create.reason} />;
}
```

### 핵심 원칙

1. **Separation of Concerns**: 비즈니스 정책과 구현 로직 분리
2. **CRUD-Centric Structure**: 동작(Operation) 중심으로 4가지 상태를 한눈에 파악
3. **Single Hook Design**: `useAppPolicy()` 하나로 모든 정책 제공
4. **Type Safety**: TypeScript로 정책 타입 보장
5. **Testability**: 정책을 독립적으로 테스트 가능

## Policy Layer 구조

### 파일 구조

```
shared/policy/
├── constants.ts         # CRUD-Centric Policy 정의 (TRIP/SCHEDULE/EXPENSE_POLICIES)
├── types.ts            # CRUD-Centric 타입 정의
├── useAppPolicy.ts     # 단일 Hook (PolicyKey 계산 포함)
├── errors.ts           # PolicyError 클래스
├── index.ts            # Clean exports
└── __tests__/          # 테스트
    └── policy.test.ts
```

### 타입 정의 (CRUD-Centric)

```typescript
// types.ts
export type NetworkStatus = 'online' | 'offline';
export type ActivationStatus = 'active' | 'inactive';
export type PolicyKey = `${NetworkStatus}_${ActivationStatus}`;

export type CRUDMode = 'full' | 'manual-only' | 'limited';

export interface CRUDPermission {
  allowed: boolean;
  mode?: CRUDMode;
  reason?: string;
  validation?: {
    required?: string[];
    optional?: string[];
    allowed?: string[];
    blocked?: string[];
    enforced?: Record<string, any>;
  };
}

/**
 * CRUD Operation Policies
 * 각 CRUD 동작이 4가지 상태에서 어떻게 동작하는지 정의
 */
export interface CRUDOperationPolicies {
  create: Record<PolicyKey, CRUDPermission>;
  read: Record<PolicyKey, CRUDPermission>;
  update: Record<PolicyKey, CRUDPermission>;
  delete: Record<PolicyKey, CRUDPermission>;
}

export interface TripPolicies extends CRUDOperationPolicies {}
export interface SchedulePolicies extends CRUDOperationPolicies {}
export interface ExpensePolicies extends CRUDOperationPolicies {}

export interface ServicePolicies {
  mapProvider: 'google' | 'mapbox' | 'none';
  searchMode: 'api' | 'disabled';
  syncStrategy: 'immediate' | 'background' | 'disabled';
  uiMode: 'full' | 'limited' | 'readonly';
}

export interface AppPolicyContext {
  trip: {
    create: CRUDPermission;
    read: CRUDPermission;
    update: CRUDPermission;
    delete: CRUDPermission;
  };
  schedule: {
    create: CRUDPermission;
    read: CRUDPermission;
    update: CRUDPermission;
    delete: CRUDPermission;
  };
  expense: {
    create: CRUDPermission;
    read: CRUDPermission;
    update: CRUDPermission;
    delete: CRUDPermission;
  };
  service: ServicePolicies;
}
```

### Policy Table 정의 (CRUD-Centric)

```typescript
// constants.ts - CRUD-Centric Structure
// 각 동작(Operation)이 4가지 상태에서 어떻게 동작하는지 한눈에 파악

export const SCHEDULE_POLICIES: SchedulePolicies = {
  /**
   * Schedule 생성
   * 오프라인 활성화: Manual Input 모드 (좌표 없이 생성 가능)
   */
  create: {
    online_active: {
      allowed: true,
      mode: 'full',
      validation: {
        required: ['title', 'scheduledAt'],
        optional: ['location', 'latitude', 'longitude'],
      },
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
      validation: {
        required: ['title', 'scheduledAt'],
        optional: ['location', 'latitude', 'longitude'],
      },
    },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      reason: '장소 검색을 사용할 수 없어요. 직접 입력해주세요.',
      validation: {
        required: ['title', 'scheduledAt'],
        optional: ['location'],
        enforced: {
          latitude: null,
          longitude: null,
        },
      },
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },

  /**
   * Schedule 조회
   */
  read: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' }, // Router가 로컬 DB 읽기
    offline_inactive: {
      allowed: true,
      mode: 'full',
      reason: '수정하려면 여행을 활성화해주세요',
    },
  },

  /**
   * Schedule 수정
   */
  update: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      validation: {
        allowed: ['title', 'scheduledAt', 'location'],
        blocked: ['latitude', 'longitude'],
      },
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },

  /**
   * Schedule 삭제
   */
  delete: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },
};

// TRIP_POLICIES, EXPENSE_POLICIES도 동일한 구조
// SERVICE_POLICIES는 별도 타입으로 관리
export const SERVICE_POLICIES: Record<PolicyKey, ServicePolicies> = {
  online_active: {
    mapProvider: 'google',
    searchMode: 'api',
    syncStrategy: 'immediate',
    uiMode: 'full',
  },
  offline_active: {
    mapProvider: 'mapbox',
    searchMode: 'disabled',
    syncStrategy: 'background',
    uiMode: 'limited',
  },
  // ...
};
```

## 구현 가이드

### useAppPolicy Hook (단일 Hook, PolicyKey 계산 포함)

````typescript
// useAppPolicy.ts
import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/shared/store/network';
import { getTripActivationStatus } from '@/shared/services/offline-prep/metadata';
import { TRIP_POLICIES, SCHEDULE_POLICIES, EXPENSE_POLICIES, SERVICE_POLICIES } from './constants';
import type { PolicyKey, ActivationStatus, AppPolicyContext } from './types';

/**
 * 앱 전체 정책을 제공하는 단일 Hook
 *
 * @param tripId - 여행 ID (선택적, 제공시 해당 여행의 활성화 상태 체크)
 * @returns AppPolicyContext - 모든 Entity의 CRUD 정책과 Service 정책
 *
 * @example
 * ```tsx
 * const policy = useAppPolicy(tripId);
 *
 * // Schedule 생성 체크
 * if (!policy.schedule.create.allowed) {
 *   return <DisabledMessage reason={policy.schedule.create.reason} />;
 * }
 *
 * // Manual-only mode 체크
 * if (policy.schedule.create.mode === 'manual-only') {
 *   return <ManualInputForm />;
 * }
 *
 * // Service 정책 체크
 * if (policy.service.mapProvider === 'google') {
 *   return <GoogleMapView />;
 * }
 * ```
 */
export function useAppPolicy(tripId?: string): AppPolicyContext {
  const networkStatus = useNetworkStatus();
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>('inactive');

  useEffect(() => {
    if (!tripId) {
      setActivationStatus('inactive');
      return;
    }

    getTripActivationStatus(tripId).then((isActivated) => {
      setActivationStatus(isActivated ? 'active' : 'inactive');
    });
  }, [tripId]);

  // PolicyKey 계산 (내부 로직)
  const policyKey: PolicyKey = `${networkStatus}_${activationStatus}`;

  // CRUD-Centric 구조로 반환
  return {
    trip: {
      create: TRIP_POLICIES.create[policyKey],
      read: TRIP_POLICIES.read[policyKey],
      update: TRIP_POLICIES.update[policyKey],
      delete: TRIP_POLICIES.delete[policyKey],
    },
    schedule: {
      create: SCHEDULE_POLICIES.create[policyKey],
      read: SCHEDULE_POLICIES.read[policyKey],
      update: SCHEDULE_POLICIES.update[policyKey],
      delete: SCHEDULE_POLICIES.delete[policyKey],
    },
    expense: {
      create: EXPENSE_POLICIES.create[policyKey],
      read: EXPENSE_POLICIES.read[policyKey],
      update: EXPENSE_POLICIES.update[policyKey],
      delete: EXPENSE_POLICIES.delete[policyKey],
    },
    service: SERVICE_POLICIES[policyKey],
  };
}
````

**설계 결정**:

- ✅ 단일 Hook으로 통합 (`useAppPolicy`만 export)
- ✅ PolicyKey 계산 로직 내장 (별도 Hook 불필요)
- ✅ Entity별 Hook 제거 (`useSchedulePolicy` 등 불필요)
- ✅ 이유: 간결함, 단일 진실 공급원, 명확한 API

## 사용 예시

### 1. Trip 생성 버튼

```typescript
function CreateTripButton() {
  const policy = useAppPolicy(); // tripId 없음 - 전역 상태 체크

  if (!policy.trip.create.allowed) {
    return (
      <Button disabled>
        <Text>새 여행 만들기</Text>
        <Text style={styles.reason}>{policy.trip.create.reason}</Text>
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

  switch(policy.service.mapProvider) {
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

### 3. Schedule 생성 Form (실제 구현 예시)

```typescript
function CreateScheduleScreen({ tripId }) {
  const policy = useAppPolicy(tripId);

  // ✅ 생성 불가 시 화면 차단
  if (!policy.schedule.create.allowed) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader title='새 일정 추가' />
        <View className='flex-1 items-center justify-center px-lg'>
          <Text className='text-h3'>일정을 추가할 수 없습니다</Text>
          <Text className='text-body text-muted-foreground'>
            {policy.schedule.create.reason}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-background'>
      <MobileHeader title='새 일정 추가' />

      {/* ⚠️ Manual-only mode 안내 메시지 */}
      {policy.schedule.create.mode === 'manual-only' && (
        <View className='bg-yellow-50 px-md py-sm border-b border-yellow-200'>
          <Text className='text-small text-yellow-800'>
            {policy.schedule.create.reason}
          </Text>
        </View>
      )}

      {/* ✅ Full mode에서만 검색창 표시 */}
      {policy.schedule.create.mode !== 'manual-only' && (
        <LocationSearchBar />
      )}

      <ScheduleForm />
    </View>
  );
}
```

### 4. Manual Input 처리

```typescript
function ManualScheduleInput({ tripId }) {
  const policy = useAppPolicy(tripId);
  const createSchedule = useCreateSchedule();

  const handleSubmit = async (data: FormData) => {
    if (policy.schedule.create.mode === 'manual-only') {
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
      return policy.service.uiMode === 'readonly'
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

### 새로운 Entity 추가시 (CRUD-Centric)

1. CRUD Operation Policies 인터페이스 정의:

```typescript
// types.ts
export interface NewEntityPolicies extends CRUDOperationPolicies {}
```

2. Constants에 CRUD-Centric 정책 추가:

```typescript
// constants.ts
export const NEW_ENTITY_POLICIES: NewEntityPolicies = {
  create: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'manual-only', reason: '...' },
    offline_inactive: { allowed: false, reason: '여행을 활성화해주세요' },
  },
  read: {
    /* 4개 상태 정의 */
  },
  update: {
    /* 4개 상태 정의 */
  },
  delete: {
    /* 4개 상태 정의 */
  },
};
```

3. AppPolicyContext에 추가:

```typescript
// types.ts
export interface AppPolicyContext {
  // 기존...
  newEntity: {
    create: CRUDPermission;
    read: CRUDPermission;
    update: CRUDPermission;
    delete: CRUDPermission;
  };
}
```

4. useAppPolicy Hook에 통합:

```typescript
// useAppPolicy.ts
export function useAppPolicy(tripId?: string): AppPolicyContext {
  // ...
  return {
    // 기존...
    newEntity: {
      create: NEW_ENTITY_POLICIES.create[policyKey],
      read: NEW_ENTITY_POLICIES.read[policyKey],
      update: NEW_ENTITY_POLICIES.update[policyKey],
      delete: NEW_ENTITY_POLICIES.delete[policyKey],
    },
  };
}
```

**사용 예시**:

```typescript
const policy = useAppPolicy(tripId);
if (!policy.newEntity.create.allowed) {
  return <DisabledMessage reason={policy.newEntity.create.reason} />;
}
```

### 새로운 서비스 추가시

1. ServicePolicies 인터페이스에 추가:

```typescript
// types.ts
export interface ServicePolicies {
  // 기존...
  weatherProvider: 'openweather' | 'cached' | 'none';
}
```

2. SERVICE_POLICIES 상수에 4가지 상태 정의:

```typescript
// constants.ts
export const SERVICE_POLICIES: Record<PolicyKey, ServicePolicies> = {
  online_active: {
    // 기존...
    weatherProvider: 'openweather',
  },
  online_inactive: {
    // 기존...
    weatherProvider: 'openweather',
  },
  offline_active: {
    // 기존...
    weatherProvider: 'cached',
  },
  offline_inactive: {
    // 기존...
    weatherProvider: 'none',
  },
};
```

3. 컴포넌트에서 사용:

```typescript
function WeatherWidget({ tripId }) {
  const policy = useAppPolicy(tripId);

  switch(policy.service.weatherProvider) {
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

해당 Entity의 POLICIES 상수에서 값만 수정하면 됩니다:

```typescript
// constants.ts
// 예: 오프라인에서도 Trip 생성 허용하기
export const TRIP_POLICIES: TripPolicies = {
  create: {
    // 기존...
    offline_active: {
      allowed: true, // ✅ false → true로 변경
      mode: 'manual-only',
      reason: '최소한의 정보만 입력해주세요',
    },
  },
  // ...
};
```

**CRUD-Centric 장점**: 하나의 operation에 대한 4가지 상태를 한눈에 볼 수 있어서 정책 변경이 직관적

### Q: 테스트는 어떻게?

```typescript
// __tests__/policy.test.ts
describe('Policy Layer - CRUD-Centric', () => {
  it('Schedule 생성: 온라인 활성화 상태에서 full mode', () => {
    const policy = SCHEDULE_POLICIES.create['online_active'];
    expect(policy.allowed).toBe(true);
    expect(policy.mode).toBe('full');
  });

  it('Schedule 생성: 오프라인 활성화 상태에서 manual-only mode', () => {
    const policy = SCHEDULE_POLICIES.create['offline_active'];
    expect(policy.allowed).toBe(true);
    expect(policy.mode).toBe('manual-only');
    expect(policy.validation?.enforced).toEqual({
      latitude: null,
      longitude: null,
    });
  });

  it('Schedule 생성: 오프라인 비활성화 상태에서 차단', () => {
    const policy = SCHEDULE_POLICIES.create['offline_inactive'];
    expect(policy.allowed).toBe(false);
    expect(policy.reason).toBe('여행을 활성화해주세요');
  });
});
```

### Q: Performance 고려사항?

- Policy 조회는 O(1) (Object lookup - CRUD-Centric 구조도 동일)
- 네트워크 상태 변경시만 리렌더링
- 활성화 상태는 useEffect로 비동기 조회 (초기 렌더링 블로킹 없음)

```typescript
// useAppPolicy Hook (이미 최적화됨)
export function useAppPolicy(tripId?: string): AppPolicyContext {
  const networkStatus = useNetworkStatus(); // React Hook
  const [activationStatus, setActivationStatus] = useState('inactive');

  useEffect(() => {
    // 비동기 조회 - 초기 렌더링 블로킹 안 함
    if (!tripId) return;
    getTripActivationStatus(tripId).then(setActivationStatus);
  }, [tripId]);

  // O(1) Policy 조회
  const policyKey: PolicyKey = `${networkStatus}_${activationStatus}`;
  return {
    schedule: {
      create: SCHEDULE_POLICIES.create[policyKey], // O(1)
      // ...
    },
    // ...
  };
}
```

## 마이그레이션 체크리스트

> **📋 구현 추적**: 상세한 구현 체크리스트는 [v3.0-tracker.md](../implementation/v3.0-tracker.md)를 참조하세요.

**Phase 1: Policy Layer Core** ✅ 완료 (2025-11-20)

- [x] `shared/policy/` 디렉토리 생성
- [x] CRUD-Centric 타입 정의 (`types.ts`)
- [x] CRUD-Centric Policy 정의 (`constants.ts` - TRIP/SCHEDULE/EXPENSE_POLICIES)
- [x] 단일 Hook 구현 (`useAppPolicy.ts` - PolicyKey 계산 내장)
- [x] PolicyError 클래스 (`errors.ts`)
- [x] Clean exports (`index.ts`)
- [x] CreateScheduleScreen에 실제 적용 (3가지 패턴)

**리팩토링 이력**:

- ❌ `usePolicyKey` 제거 → `useAppPolicy`에 통합
- ❌ `useSchedulePolicy` 제거 → `useAppPolicy`로 통합
- ✅ 최종: 단일 Hook (`useAppPolicy`)으로 모든 정책 제공

**Phase 2-4: Service Layer & Manual Input** ✅ 완료 (2025-11-21)

- [x] SmartMapView 마이그레이션 (Policy 기반 지도 전환)
- [x] CreateTripButton 마이그레이션
- [x] Manual Input 컴포넌트 추가 (ManualScheduleForm, ManualExpenseForm)

**Phase 5: 마무리** ⏳ 대기중

- [ ] 테스트 작성
- [x] 문서 업데이트 (policy-architecture.md 업데이트 완료)

## 참고 자료

- [Decision: Data/Service 분리](../decisions/2025-11-20-data-service-separation.md)
- [Selective Activation Architecture](./selective-activation-architecture.md)
- [Router 구현](../../apps/client/src/shared/services/offline-prep/router.ts)
