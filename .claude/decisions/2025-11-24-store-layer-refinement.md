# ADR: Store 계층 재정의 및 Network Service 마이그레이션

**날짜**: 2025-11-24  
**상태**: ✅ Accepted  
**관련 커밋**: 65028a9, ef5d0b9, f0f39c4

---

## Context

### 문제 상황

1. **Network Service의 위치 혼란**
   - `shared/services/network/`에 위치했지만 실제로는 "상태 관리"
   - Zustand를 사용하여 런타임 상태 보유 (`realStatus`, `overrideStatus`)
   - Services의 정의("로직 실행")와 맞지 않음

2. **파일 파편화**
   - `network/store.ts` - Zustand Store
   - `network/hooks.ts` - Hook 정의
   - `network/provider.tsx` - Provider
   - `network/index.ts` - Export
   - 4개 파일로 분산되어 유지보수 어려움

3. **Policy 위치에 대한 고민**
   - `shared/policy/`에 있지만, 적절한 위치인가?
   - `lib/`? `services/`? `store/`? 어디가 맞는가?

4. **성능 문제**
   - Policy의 `useAppPolicy`가 매번 DB 조회
   - 같은 `tripId`를 여러 컴포넌트에서 사용 시 중복 조회
   - React Query 미활용

### 기존 아키텍처 정의 (불명확)

```
shared/
  ├─ lib/         - 순수 함수 (Side effect 없음)
  ├─ services/    - Side effect OR 앱 특화 로직
  └─ store/       - ??? (명확한 정의 없음)
```

---

## Decision

### 1. Store vs Services 기준 명확화

**Store의 정의:**

- **본질**: 상태 저장소 (State Container)
- **주 목적**: 상태를 **보유**하고 **변경**함
- **Zustand 사용**: 필수 (상태 관리 도구)
- **예시**: `selectedTripId`, `networkStatus`

**Services의 정의:**

- **본질**: 로직 실행기 (Logic Executor)
- **주 목적**: 작업을 **수행**함
- **예시**: `syncData()`, `routeTripQuery()`, `downloadOfflineMap()`

**Policy의 정의:**

- **본질**: 비즈니스 규칙 (Business Rules)
- **주 목적**: 규칙을 **제공**함
- **특징**: 충분히 중요하여 독립 카테고리로 존재
- **위치**: `shared/policy/` 유지

### 2. Network Service → Store 마이그레이션

**변경 사항:**

```typescript
// Before
shared/services/network/
  ├─ store.ts       // Zustand Store
  ├─ hooks.ts       // useNetworkStatus, useNetworkControl
  ├─ provider.tsx   // NetworkProvider
  └─ index.ts       // Export

// After
shared/store/
  └─ network.ts     // 모든 것 통합
```

**이유:**

- Network는 "상태를 보유"함 (Store의 정의에 부합)
- 파일 파편화 해결 (4개 → 1개)
- 명확한 책임 (상태 관리만)

### 3. Hook 통합 규칙

**원칙:** Store 파일 하나에 모든 관련 Hook 포함

```typescript
// shared/store/network.ts
export const useNetworkStore = create(...);  // Zustand Store
export const networkStore = { ... };         // 비-React 헬퍼
export function useNetworkStatus() { ... }   // React Hook
export function useNetworkControl() { ... }   // Debug Hook
```

**이유:**

- 파편화 방지
- Single Source of Truth
- "Network 관련 = network.ts" 명확

### 4. 중복 함수 제거

**문제:**

- `getNetworkStatus()` 함수와 `networkStore.status`가 같은 일을 함
- 두 개의 API 혼란 유발

**해결:**

```typescript
// Before
const status = await getNetworkStatus(); // 비동기
const status2 = networkStore.status; // 동기

// After
const status = networkStore.status; // 동기만 유지
```

### 5. Policy 성능 최적화

**문제:**

- `useAppPolicy`가 `useState` + `useEffect`로 DB 조회
- 캐싱 없음

**해결:**

```typescript
// Before
const [activationStatus, setActivationStatus] = useState('inactive');
useEffect(() => {
  getTripActivationStatus(tripId).then(setActivationStatus);
}, [tripId]);

// After
const { data: isActivated } = useQuery({
  queryKey: ['tripActivation', tripId],
  queryFn: () => getTripActivationStatus(tripId!),
  staleTime: 5 * 60 * 1000, // 5분 캐싱
});
```

**추가 최적화:**

- `useMemo`로 return 객체 메모이제이션
- 불필요한 리렌더링 방지

---

## Consequences

### Positive ✅

1. **명확한 계층 구분**
   - Store = 상태 관리
   - Services = 로직 실행
   - Policy = 비즈니스 규칙

2. **파일 파편화 해결**
   - Network: 4개 → 1개 파일
   - 관련 코드가 한 곳에 모임

3. **성능 개선**
   - Policy: DB 조회 캐싱 (5분)
   - 중복 요청 방지
   - useMemo로 리렌더링 최적화

4. **API 단순화**
   - `getNetworkStatus()` 제거
   - `networkStore.status` 하나로 통일

### Negative ⚠️

1. **Breaking Changes**
   - 기존 `getNetworkStatus()` 사용 코드 수정 필요
   - `NetworkOverrideContext` 제거로 디버그 코드 수정

2. **Migration 필요**
   - 모든 import 경로 변경
   - 4개 파일 업데이트 (`router.ts`, `sync/provider.tsx`, 등)

### Neutral 🔵

1. **Policy 위치 유지**
   - `shared/policy/` 그대로 유지
   - 독립 카테고리로서 충분히 타당

---

## Migration Guide

### 코드 변경

```typescript
// Before
import { useNetworkStatus } from '@/shared/services/network/hooks';
import { getNetworkStatus } from '@/shared/services/network';

const status1 = useNetworkStatus(); // React Hook
const status2 = await getNetworkStatus(); // 비동기 함수

// After
import { useNetworkStatus, networkStore } from '@/shared/store/network';

const status1 = useNetworkStatus(); // React Hook
const status2 = networkStore.status; // 동기 접근
```

### 영향받는 파일

1. `apps/client/src/shared/services/offline-prep/router.ts` - ✅ 수정 완료
2. `apps/client/src/shared/services/sync/provider.tsx` - ✅ 수정 완료
3. `apps/client/src/shared/policy/useAppPolicy.ts` - ✅ 수정 완료
4. `apps/client/src/features/debug/ui/DashboardView.tsx` - ✅ 수정 완료
5. `apps/client/src/shared/components/Navigation/NetworkStatusIndicator.tsx` - ✅ 수정 완료
6. `apps/client/src/features/trip/create-trip/TripDateForm.tsx` - ✅ 수정 완료

---

## 아키텍처 다이어그램

### Before

```
shared/
  ├─ services/
  │   ├─ network/          ← 상태 관리인데 services에 있음
  │   │   ├─ store.ts
  │   │   ├─ hooks.ts
  │   │   └─ provider.tsx
  │   ├─ sync/
  │   └─ offline-prep/
  ├─ policy/               ← 위치 혼란
  │   └─ useAppPolicy.ts   ← 매번 DB 조회
  └─ store/
      └─ useTripStore.ts
```

### After

```
shared/
  ├─ services/
  │   ├─ sync/             ← 로직 실행
  │   └─ offline-prep/     ← 로직 실행
  ├─ policy/               ← 비즈니스 규칙 (독립)
  │   └─ useAppPolicy.ts   ← React Query 캐싱
  └─ store/                ← 상태 관리
      ├─ network.ts        ← 통합 완료
      └─ useTripStore.ts
```

---

## 관련 문서

- [CHANGELOG.md](..//CHANGELOG.md#2025-11-24)
- [architecture.md](../core/architecture.md)
- Policy Architecture: [policy-architecture.md](../core/policy-architecture.md)

---

## Alternatives Considered

### Alternative 1: Policy도 Store로 이동

```
shared/store/
  ├─ network.ts
  └─ policy.ts    ← 추가
```

**장점:**

- 모든 상태 관리가 한 곳에

**단점:**

- Policy는 상태를 보유하지 않음 (계산만)
- 비즈니스 규칙이 인프라 레이어에 섞임
- Policy의 중요성이 희석됨

**결정:** ❌ 거부

### Alternative 2: Network도 Services에 유지

```
shared/services/
  └─ network/
      └─ index.ts   ← 통합만
```

**장점:**

- 이동 없이 파일만 통합

**단점:**

- "Services = 로직 실행"과 맞지 않음
- 아키텍처 혼란 지속

**결정:** ❌ 거부

### Alternative 3: 현재 방안 (채택)

```
shared/
  ├─ services/   ← 로직 실행
  ├─ policy/     ← 비즈니스 규칙
  └─ store/      ← 상태 관리
      └─ network.ts
```

**장점:**

- 명확한 책임 분리
- 각 계층의 정의가 명확
- Policy의 독립성 유지

**결정:** ✅ 채택
