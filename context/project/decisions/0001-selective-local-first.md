# 0001. Noline은 Selective Local-First와 Activation Router를 사용한다

- 상태: 채택
- Project common context 편입일: 2026-09-04

## 결정

활성화된 여행의 sync-owned data는 Local SQLite를 기준으로 다루고, 비활성 여행은 Server API를 기준으로 다룬다. Trip·Schedule·Expense의 local/remote 선택은 Activation Router가 소유한다. 지도·검색·길찾기는 데이터 Owner가 아니므로 Policy Layer가 현재 상태에 맞춰 Network-First 또는 제한된 동작을 선택한다.

클라이언트는 entity ID를 만들고 서버는 이를 수용한다. local mutation과 `sync_queue` 기록은 같은 transaction에 둔다. `@repo/schema`는 client/server 계약의 원천이다.

## 결과와 경계

비활성 여행을 오프라인에서 편집하는 복잡도를 의도적으로 제한하고, 사용자가 활성화한 여행에 오프라인 준비를 집중한다. 이 결정은 특정 UI·route·sync 구현의 상세 Owner를 옮기지 않으며, 실제 구현 변경은 해당 workspace guide·rule·code를 함께 검토해야 한다.

## 상세 근거

- root [`CLAUDE.md`](../../../CLAUDE.md)의 Core Invariants
- [Selective Activation architecture](../../../.claude/context/selective-activation-architecture.md)
- [Data/Service separation decision](../../../.claude/decisions/2025-11-20-data-service-separation.md)
- [Policy Layer separation decision](../../../.claude/decisions/2025-11-20-policy-layer-separation.md)
- [Terminology unification](../../../.claude/decisions/2026-03-21-terminology-unification.md)

## 현재 authority와 재검토

현재 제품 의미는 [common](../common/product.md), 구현 경계는 [current](../current/architecture.md)에서 읽는다. 이 문서는 선택 이유의 요약이며 상세 rule·code의 Owner를 대체하지 않는다. 활성 여행의 범위, 오프라인 편집 정책 또는 데이터·서비스 소유 구분을 바꾸는 요구가 생기면 기존 상세 결정과 함께 재검토한다. 당시 자료에 없는 대안·불확실성을 새로 꾸며 기록하지 않는다.
