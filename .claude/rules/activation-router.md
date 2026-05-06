# 규칙: Activation Router

## 적용 범위

- `apps/client/src/entities/**`
- Trip/Schedule/Expense 계열 entity의 data hook과 repository
- Local SQLite와 Server API 중 어디를 읽고 쓸지 결정하는 코드

## 규칙

- Data Layer 코드는 Local/Remote 동작을 Activation Router를 통해 분기한다.
- UI component나 feature screen이 SQLite/API를 직접 고르지 않는다.
- 활성화된 여행은 local SQLite를 진실의 원천으로 본다.
- 비활성 여행은 server API를 진실의 원천으로 본다.
- Map, Search, Directions 같은 Service Layer 코드는 sync-owned Data Layer entity가 아니다. Policy 기반 network/service flow로 다룬다.
- 새 sync-owned entity를 추가할 때는 UI 연결보다 repository/data layer routing을 먼저 잡는다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 Activation Router와 Data/Service 분리를 확인한다.
- routing 판단이 애매하면 수정 전에 [Selective Activation context](../context/README.md#selective-activation-and-router)를 읽는다.
