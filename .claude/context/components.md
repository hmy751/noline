---
description: Current React Native component guide for @repo/ui, shared/components, entity UI, features, and screens.
alwaysApply: false
---

# Component Guide

> 문서 상태: active source.
> 과거 web/Next.js 중심 예시와 긴 component principle 문서는 [_archive/components-legacy-web-patterns.md](../_archive/components-legacy-web-patterns.md)에 보존되어 있다.

Noline의 현재 UI 기준은 React Native/Expo, NativeWind className, `@repo/ui`, `shared/components` 조합이다. `<div>`, `<button>`, CSS module, Next.js 예시는 active 코드에 복사하지 않는다.

## Layer Ownership

| Layer | 책임 | 예시 |
| --- | --- | --- |
| `packages/ui` | 앱 도메인을 모르는 atom | `Button`, `Input`, `Card`, `Select`, `Pressable` |
| `shared/components` | client 앱 공용 조합 | `MobileHeader`, `Field`, `DatePicker`, `PolicyErrorDisplay` |
| `entities/*/ui` | 비즈니스 entity 표시 | `TripCard`, `TripSelector` |
| `features/*` | 사용자 action과 form flow | `ScheduleForm`, `ManualExpenseForm` |
| `screens/*` | 화면 조립 | `HomeScreen`, `CreateScheduleScreen` |
| `app/` | Expo Router 연결 | route file, layout file |

## Component Rules

- 재사용 컴포넌트의 외부 margin은 부모가 소유한다.
- 컴포넌트 내부 padding과 layout은 컴포넌트가 소유할 수 있다.
- domain data를 알아야 하면 `entities` 또는 `features`로 올린다.
- `shared/components`에는 특정 Trip/Schedule/Expense 비즈니스 규칙을 넣지 않는다.
- 버튼, input, select, card shell이 이미 `@repo/ui`에 있으면 먼저 사용한다.
- React Native 기본 요소는 `View`, `Text`, `TextInput`, `ScrollView`, `Pressable` 계열을 사용한다.
- UI에서 정책 제한을 보여줄 때는 `useAppPolicy`와 `PolicyErrorDisplay`를 먼저 확인한다.

## Form Components

폼 UI는 [form.md](form.md)를 우선한다.

- `react-hook-form`의 `Controller`로 React Native input을 연결한다.
- field label, description, error message는 `Field` 조합을 우선 사용한다.
- submit side effect는 feature hook이나 entity data hook으로 분리한다.

## Map and Policy UI

Map/Search/Directions UI는 Service Layer다. Activation Router를 직접 넣지 않는다.

- `PolicyBasedMapView`
- `PolicyBasedScheduleMapView`
- `MapUnavailableView`
- `PolicyErrorDisplay`
- `NetworkStatusIndicator`

## 체크리스트

- [ ] 이 컴포넌트가 어느 layer 소유인지 분명한가?
- [ ] reusable component가 외부 margin이나 화면 위치를 강제하지 않는가?
- [ ] web element 예시를 React Native 코드에 그대로 가져오지 않았는가?
- [ ] policy 상태를 화면에서 직접 임의 계산하지 않고 `useAppPolicy`를 사용했는가?
- [ ] `app/` route file에 복잡한 UI/비즈니스 로직을 넣지 않았는가?
