# 09 — 활성화와 offline-prep 완료 상태

## 맡은 결과와 범위

여행 활성화에서 서버 데이터 수신, local 반영, 이전 활성 해제, map 준비, route 준비, cache 반영과 사용자가 닫을 수 있는 terminal 상태를 서로 구별하고, 상태 이름·반환값·UI 문구가 실제 완료 범위를 드러내게 한다. “ready”나 “완료”를 이해하려고 hook·metadata·화면의 서로 다른 조건을 다시 맞춰 봐야 하는 부담을 줄인다.

범위는 `useActivateTrip`, offline-prep metadata, activation progress UI, Home의 활성 상태 consumer와 map/route downloader 접점 및 test다. route 준비 결과는 [13번](13-schedule-route-preparation.md), local 반영 원자성은 [14번](14-local-mutation-router-transaction.md), sync 결과 의미는 [15번](15-sync-result-retry-pull-types.md)이 제공한다. 번호는 홈에서 활성화하는 장면을 앞에 둔 것이며 전체 ready 결과의 완료에는 이 계약들이 필요하다. [05번](05-schedule-response.md)이 완료한 activation response·접근 경계는 소비하고 이 Ticket에서 다시 구현하지 않는다.

## 실행 맥락과 접근

현재 활성화는 data를 local에 반영한 시점에 완료 상태를 기록하고 map·route 준비를 background로 시작한다. metadata의 `ready`는 map download만 보고, UI는 route 준비가 아직 진행 중일 수 있는데도 일정·경비·경로 완료를 알릴 수 있다. 이미 활성화된 여행의 재실행도 새 활성화와 다른 흐름을 가진다. 실패 Drawer의 대기 문구는 조사됐지만 Drawer 자체의 탈출 불가는 확정하지 않았으므로 닫기·뒤로가기·재진입을 실제 연결로 확인한다.

데이터 전환·재활성화 안전은 [003-04](../../../../003-bug-investigation-and-fixes/current/memory/tickets/04-activation-data-lifecycle.md), native pack 준비·재시도·실패 UI는 [003-05](../../../../003-bug-investigation-and-fixes/current/memory/tickets/05-offline-map-readiness.md), 경로 결과는 [003-09](../../../../003-bug-investigation-and-fixes/current/memory/tickets/09-map-search-route-behavior.md)이 맡는다. 003 조사에는 pack 생성 promise와 타일 완료의 차이, 준비 flag 잔존·재시도 누락의 근거가 있다. 이 Ticket은 그 기대 계약을 상태·반환값·소비자에 일관되게 드러내는 구조를 맡는다.

coordinator와 UI fixture 특성화는 독립 착수할 수 있다. 다만 13·14·15의 직접 필요한 결과와 003의 기대 상태가 미해결이면 전체 ready 의미를 완료로 선언할 수 없다. 다른 Work에 배정했다는 이유로 잘못된 완료 표시를 그대로 둔 채 구조 개선 전체를 닫지 않는다.

## 완료 조건과 확인 방법

- activation API 실패, DB 반영 실패, map 실패·timeout, route 부분 실패, 이미 활성화된 여행의 재실행에서 각 단계 결과와 terminal 상태를 확인한다.
- data local 반영, map 준비, route 준비와 사용자에게 보이는 ready가 타입·상태 전이·문구에서 같은 의미를 사용한다.
- 성공과 실패 terminal 모두 UI가 실제 결과를 보여 주고 사용자가 진행 Drawer를 닫거나 재시도할 수 있다.
- 완료 상태를 바꾸는 위치와 판단 기준이 줄어들고, 단순히 범용 coordinator나 option을 추가해 흐름을 더 멀리 옮기지 않는다.
- coordinator/hook Jest, fake timer polling과 component state fixture를 실행하고 실제 Mapbox·기기 다운로드 미확인을 구별한다.

## 현재 상태와 실제 결과

기존 14를 09로 옮기고 003-04·05·09와 연결했다. 제품 구현·검증·수락은 없으며 13·14·15의 직접 관련 결과가 전체 완료에 선행한다. 실제 native 준비·실패 복구를 이번 재배치로 검증한 것은 아니다.
