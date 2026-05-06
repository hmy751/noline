# Policy Layer 책임 분리

**날짜**: 2025-11-20
**상태**: ✅ 확정 및 구현 완료
**영향**: Phase 1 구현 완료
**최종 업데이트**: 2025-11-20 (CRUD-Centric 리팩토링 반영)

---

## 결정 사항

**Policy 체크는 컴포넌트 레벨에서 수행하고, Hook은 순수하게 데이터 작업만 담당한다.**

**추가 결정 (리팩토링)**:

- ✅ CRUD-Centric 구조로 변경 (Operation-First)
- ✅ 단일 Hook (`useAppPolicy`) 패턴 채택
- ❌ Entity별 Hook (`useSchedulePolicy` 등) 제거
- ❌ 내부 Helper (`usePolicyKey`) 제거

---

## 배경

Phase 1 구현 중, Policy 체크를 어느 레벨에서 수행할지에 대한 질문:

### Option A: Hook 내부에서 Policy 체크 (❌ 기각)

```typescript
export const useCreateSchedule = () => {
  return useMutation({
    mutationFn: async (data) => {
      // Policy 체크
      const policy = await getAppPolicy(data.tripId);
      if (!policy.createSchedule.allowed) {
        throw new PolicyError(...);
      }

      // Router 호출
      return await routeChildMutation(...);
    }
  });
};
```

**문제점**:

- Hook이 너무 많은 책임 (Policy + Router + Data)
- 응집도 저하
- 재사용성 감소

### Option B: 컴포넌트에서 Policy 체크 (✅ 채택)

```typescript
// Hook: 순수하게 데이터 작업만
export const useCreateSchedule = () => {
  return useMutation({
    mutationFn: async (data) => {
      return await routeChildMutation(data.tripId, {
        local: () => createLocal(data),
        remote: () => createRemote(data),
      });
    }
  });
};

// Component: Policy 기반 UI 제어 (CRUD-Centric 구조)
function CreateScheduleScreen() {
  const policy = useAppPolicy(tripId); // ✅ 단일 Hook
  const createSchedule = useCreateSchedule();

  // Policy 기반 분기 (CRUD-Centric 접근)
  if (!policy.schedule.create.allowed) {
    return <DisabledMessage reason={policy.schedule.create.reason} />;
  }

  if (policy.schedule.create.mode === 'manual-only') {
    // 검색창 숨김, 경고 메시지 표시
  }

  return <Form />;
}
```

**장점**:

- 명확한 책임 분리
- UI 로직과 Policy가 자연스럽게 결합
- 높은 응집도

---

## 계층별 책임

| Layer         | 책임                  | 예시                            |
| ------------- | --------------------- | ------------------------------- |
| **Component** | Policy 체크 → UI 분기 | "manual-only면 검색창 숨기기"   |
| **Hook**      | 데이터 작업 (CRUD)    | "DB에 저장하기"                 |
| **Router**    | Local/Remote 분기     | "활성화면 local, 아니면 remote" |

---

## 구현 패턴

### 패턴 1: 화면 전체 차단

```typescript
function CreateScheduleScreen() {
  const policy = useAppPolicy(tripId);

  if (!policy.schedule.create.allowed) {
    return (
      <View>
        <Text>일정을 추가할 수 없습니다</Text>
        <Text>{policy.schedule.create.reason}</Text>
      </View>
    );
  }

  return <ScheduleForm />;
}
```

### 패턴 2: 조건부 UI 렌더링

```typescript
function CreateScheduleScreen() {
  const policy = useAppPolicy(tripId);

  return (
    <View>
      {/* Full mode: 장소 검색 표시 */}
      {policy.schedule.create.mode === 'full' && (
        <LocationSearchBar />
      )}

      {/* Manual-only mode: 경고 메시지 */}
      {policy.schedule.create.mode === 'manual-only' && (
        <Banner warning>
          {policy.schedule.create.reason}
        </Banner>
      )}

      <ScheduleForm />
    </View>
  );
}
```

### 패턴 3: 버튼 비활성화

```typescript
function ScheduleList() {
  const policy = useAppPolicy(tripId);

  return (
    <Button
      disabled={!policy.schedule.create.allowed}
      onPress={handleCreate}
    >
      {policy.schedule.create.allowed
        ? '일정 추가'
        : policy.schedule.create.reason
      }
    </Button>
  );
}
```

---

## 실제 구현 예시 (CRUD-Centric)

### CreateScheduleScreen.tsx

```typescript
export default function CreateScheduleScreen() {
  const policy = useAppPolicy(tripId); // ✅ 단일 Hook
  const createSchedule = useCreateSchedule(); // Policy 체크 없음

  // ✅ 생성 불가 시 화면 차단 (CRUD-Centric 접근)
  if (!policy.schedule.create.allowed) {
    return <DisabledMessage reason={policy.schedule.create.reason} />;
  }

  return (
    <View>
      {/* ✅ Manual-only 경고 */}
      {policy.schedule.create.mode === 'manual-only' && (
        <Banner warning>{policy.schedule.create.reason}</Banner>
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

### useCreateSchedule.ts

```typescript
export const useCreateSchedule = () => {
  return useMutation({
    mutationFn: async (data: CreateScheduleRequest) => {
      // ✅ Policy 체크 없음 - 순수하게 데이터 작업만
      return await routeChildMutation(data.tripId, {
        local: () => createLocal(data),
        remote: () => createRemote(data),
      });
    },
  });
};
```

---

## 이점

### 1. 명확한 관심사 분리

- **Component**: "무엇을 보여줄까?" (UI 로직)
- **Hook**: "어떻게 저장할까?" (데이터 로직)
- **Router**: "어디에 저장할까?" (Local/Remote 분기)

### 2. 높은 응집도

Policy와 UI는 밀접하게 연관되어 있음:

- Manual-only → 검색창 숨김
- Offline_inactive → 비활성화 메시지

→ 같은 레이어(Component)에 있는 것이 자연스러움

### 3. 재사용성

Hook은 Policy에 의존하지 않으므로:

- 다른 컨텍스트에서 재사용 가능
- 테스트가 단순함 (Policy mock 불필요)

### 4. 유연성

컴포넌트마다 다른 Policy 반응 가능:

- 어떤 컴포넌트: 전체 차단
- 다른 컴포넌트: 조건부 렌더링
- 또 다른 컴포넌트: 버튼만 비활성화

---

## 결과

✅ **Phase 1 완료 (2025-11-20)**:

- Policy Layer 구현 완료 (CRUD-Centric 구조)
- useCreateSchedule 원복 (Policy 체크 제거)
- CreateScheduleScreen에 Policy 적용 (3가지 패턴)

**CRUD-Centric 리팩토링**:

- ✅ Operation-First 구조로 변경 (`SCHEDULE_POLICIES.create[policyKey]`)
- ✅ 단일 Hook 패턴 (`useAppPolicy`)
- ❌ `usePolicyKey` 제거 → PolicyKey 계산 로직 `useAppPolicy`에 통합
- ❌ `useSchedulePolicy` 제거 → `useAppPolicy`로 통합

**파일**:

- [useCreateSchedule.ts](../../apps/client/src/entities/schedule/data/useCreateSchedule.ts) - Policy 체크 제거
- [CreateScheduleScreen.tsx](../../apps/client/src/screens/CreateScheduleScreen.tsx) - Policy 기반 UI 제어 (CRUD-Centric)
- [shared/policy/](../../apps/client/src/shared/policy/) - CRUD-Centric Policy Layer 구현

---

## 참고

- [Policy Architecture](../context/policy-architecture.md) - 전체 설계
- [v3.0 Tracker](../_archive/implementation/v3.0-tracker.md) - 구현 진행 상황
