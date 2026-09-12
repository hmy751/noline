# 14 — 활성화와 offline-prep 완료 상태

## 맡은 결과와 범위

여행 활성화에서 서버 데이터 수신, local 반영, 이전 활성 해제, map 준비, route 준비, cache 반영과 사용자가 닫을 수 있는 terminal 상태를 서로 구별하고, 상태 이름·반환값·UI 문구가 실제 완료 범위를 드러내게 한다. “ready”나 “완료”를 이해하려고 hook·metadata·화면의 서로 다른 조건을 다시 맞춰 봐야 하는 부담을 줄인다.

범위는 `useActivateTrip`, offline-prep metadata, activation progress UI, Home의 활성 상태 consumer와 map/route downloader 접점 및 test다. route 준비 결과는 [09번](09-schedule-route-preparation.md), local 반영 원자성은 [11번](11-local-mutation-router-transaction.md), sync 결과 의미는 [12번](12-sync-result-retry-pull-types.md)이 선행한다. activation response 안 Schedule 날짜 생산은 [05번](05-schedule-response.md)의 별도 판단에 남기고 이 Ticket은 response 소비와 완료 상태만 다룬다.

## 실행 맥락과 접근

현재 활성화는 data를 local에 반영한 시점에 완료 상태를 기록하고 map·route 준비를 background로 시작한다. metadata의 `ready`는 map download만 보고, UI는 route 준비가 아직 진행 중일 수 있는데도 일정·경비·경로 완료를 알릴 수 있다. progress Drawer는 error가 terminal 상태여도 닫기 조건이 충족되지 않을 수 있다. 이미 활성화된 여행의 재실행도 새 활성화와 다른 흐름을 가진다.

이 흐름은 정적 코드에서 완료 의미가 어긋날 가능성을 보여 주지만 실제 activation 실패·부분 완료와 사용자의 기대 UX는 아직 확인해야 한다. 먼저 coordinator와 UI fixture로 상태 전이를 특성화한다. 차이가 재현되면 Main은 전체 offline readiness와 error terminal UX를 별도 결함 Work에 배치하거나 이 Ticket의 동작 수정 권한을 확인한다. 09·11·12의 결과와 기대 상태가 정해지기 전에는 전체 ready 의미를 완료로 선언할 수 없다.

## 완료 조건과 확인 방법

- activation API 실패, DB 반영 실패, map 실패·timeout, route 부분 실패, 이미 활성화된 여행의 재실행에서 각 단계 결과와 terminal 상태를 확인한다.
- data local 반영, map 준비, route 준비와 사용자에게 보이는 ready가 타입·상태 전이·문구에서 같은 의미를 사용한다.
- 성공과 실패 terminal 모두 UI가 실제 결과를 보여 주고 사용자가 진행 Drawer를 닫거나 재시도할 수 있다.
- 완료 상태를 바꾸는 위치와 판단 기준이 줄어들고, 단순히 범용 coordinator나 option을 추가해 흐름을 더 멀리 옮기지 않는다.
- coordinator/hook Jest, fake timer polling과 component state fixture를 실행하고 실제 Mapbox·기기 다운로드 미확인을 구별한다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 제품 구현·검증은 시작하지 않았다. readiness는 정적 코드상 동작·UX 확인 후보로 미배정이며, 재현된 차이의 조건부 책임 배치와 09·11·12가 선행한다. 사용자 수락은 없다.
