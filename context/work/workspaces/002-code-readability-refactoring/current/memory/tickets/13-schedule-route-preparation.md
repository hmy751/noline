# 13 — 저장 이후 처리와 일정 경로 준비 책임

## 맡은 결과와 범위

여행·경비·일정 저장 성공 뒤 callback·캐시 반영·화면 이동·후속 준비가 어디서 끝나고 무엇이 계속되는지 직접 읽을 수 있게 한다. 특히 일정 생성·수정의 최신 목록 조립, 정렬·좌표 변환과 route 준비 요청의 책임·순서를 정리한다. create/update에 반복된 projection과 500ms timer 의존을 줄이고, 경로 생성 알고리즘과 기존 경로 재사용 규칙을 한 책임에서 수정할 수 있게 한다. 서로 다른 화면 이동을 같은 UX로 바꾸거나 범용 submit coordinator로 합치는 것은 목표가 아니다.

범위는 여행의 `TripDateForm`, 경비의 `useCreateExpenseForm`·`UpdateExpenseDrawer`, 일정 생성·수정의 mutation 성공 처리와 화면 callback, `useAutoDownloadRoutes`, `downloadRoutesForSchedules` 및 관련 route 저장·조회 코드·test다. 입력 초기화와 picker 의미는 [10번](10-schedule-form-lifecycle.md)·[11번](11-expense-form-lifecycle.md), query invalidation의 entity 계약은 [14번](14-local-mutation-router-transaction.md), 활성화 전체 완료 상태는 [09번](09-activation-readiness.md)이 맡는다. 이 Ticket은 저장 뒤 consumer 연결을 확인하며 입력 전체나 datasource를 다시 소유하지 않는다.

## 실행 맥락과 접근

현재 일정 생성과 수정은 각각 500ms 뒤 일정 projection·정렬·좌표 변환을 반복한다. 수정에서 새 장소를 선택해도 route 입력은 기존 query의 좌표를 사용할 수 있고, hook과 service에는 유사한 route 생성 흐름이 따로 있다. 한쪽은 기존 route 확인이 없고 다른 쪽은 schedule ID와 profile 중심으로 존재를 판단해 좌표·순서가 달라진 stale route를 재사용할 가능성이 있다.

[기존 분석](../../../source/codebase-analysis/components.md)은 여행 hook의 직접 이동, 경비 hook의 callback 후 이동, 일정의 callback 이동 차이를 함께 지적했다. 현재 여행 생성 화면은 `TripDateForm`의 성공 callback에서 `router.replace`를 호출하고, 분석의 `useCreateTripForm`은 현재 앱 consumer 검색에서 호출을 찾지 못했다. 사용 중인 경로를 기준으로 비교하고, 이전 hook의 유지·제거는 실제 export와 consumer를 확인한 근거로 판정한다. 차이가 있다는 이유만으로 이동 책임을 전부 하나로 통일하지 않는다.

[10번](10-schedule-form-lifecycle.md)에서 submit되는 좌표의 null/0 의미가 먼저 확정돼야 최신 저장 결과를 안전하게 조립할 수 있다. 좌표 0·stale route·downloader 실패 반환의 동작 수정은 [003-09](../../../../003-bug-investigation-and-fixes/current/memory/tickets/09-map-search-route-behavior.md)이 맡는다. 좌표 변경 후 ID pair 경로 재사용과 directions 전체 실패의 정상 반환은 003에서 분리 재현했다. create/update의 500ms timer 제거는 최신 저장 결과와 cache 반영 순서를 확인한 뒤 결정하며, 시간만 줄여 해결됐다고 하지 않는다.

003-09와 같은 경로 코드의 수정 책임을 중복 수행하지 않는다. 이 Ticket은 projection·segment·결과 전달의 공통 책임을 정리하고 09에 실제 준비 결과를 제공한다. 10의 입력 계약과 003-09의 기대 결과가 정해지기 전에도 중복 흐름의 특성화는 가능하지만 최신 경로 보장까지 완료할 수 없다.

## 완료 조건과 확인 방법

- 일정 생성, 시간 변경으로 순서가 바뀌는 수정, 장소 좌표 변경, 좌표 없는 일정, 일부 route 다운로드 실패의 최종 segment와 결과를 비교한다.
- 여행·경비·일정의 저장 성공·실패에서 화면 이동과 callback의 횟수·순서, cache 반영과 후속 작업의 완료 범위를 비교한다. 기존 정상 이동은 보존하고 조회·저장 오류 복구는 003-01, back stack 없는 진입은 003-06의 기대와 대조한다.
- mutation 성공 callback은 저장된 최신 결과를 기준으로 route 준비를 시작하며 임의 지연 시간에 correctness를 의존하지 않는다.
- create/update/activation이 공유하는 route segment 계산과 저장 규칙의 수정 지점이 줄고, 필요한 차이는 호출부에서 드러난다.
- 기존 route의 재사용·교체 조건과 부분 실패 반환이 명시돼 있고 별도 결함 판단이 필요한 조건은 해결 전 완료로 닫지 않는다.
- service Jest와 mutation callback integration fixture, 관련 정적 검사를 실행하고 실제 Mapbox 연결 미확인을 남긴다.

## 현재 상태와 실제 결과

기존 09를 13으로 옮기며 분석에 있었지만 담당이 빠졌던 여행·경비의 저장 후 연결도 구체화했다. 실제 여행 생성 consumer를 확인했으며 제품 구현·검증·수락은 없다. 10·11·14의 관련 입력·캐시 계약과 003-09의 결함 수정 결과를 연결해 최신 경로 보장과 구조 개선을 함께 판정한다.
