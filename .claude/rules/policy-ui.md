# 규칙: Policy UI

## 적용 범위

- offline/online UI 제한
- active/inactive trip 동작
- manual input과 기능 사용 가능 상태
- blocked/degraded action을 보여주는 component

## 규칙

- ad hoc conditional을 추가하기 전에 기존 policy primitive를 먼저 사용한다.
- UI code의 policy 판단은 `useAppPolicy`를 우선한다.
- 제한 상태는 `PolicyErrorDisplay`, `NetworkStatusIndicator` 같은 기존 패턴으로 안내한다.
- UI는 막힌 action을 설명하되, underlying data ownership rule을 우회하지 않는다.
- Local/Remote routing은 여전히 data hook과 repository 책임이다. Policy UI가 Activation Router를 우회하면 안 된다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 Policy UI를 확인한다.
- policy 자체가 바뀌면 owning context를 갱신하고 decision record를 추가한다.
