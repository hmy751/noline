# Ticket

기존 결과를 보존하면서 남은 리팩토링을 앱 진입부터 실제 사용 장면 순으로 찾을 수 있게 배치했다. 01–05는 기존 번호와 결과를 유지하고, 새 06과 기존 06–17을 재배치한 07–18이 후속 범위다. 개별 진행·결과는 각 Ticket, 전체 상황·다음 행동은 [state](../../state/index.md)가 소유한다. 번호는 읽기·검토의 기본 순서이며 모든 구현을 직렬로 기다리는 선행 조건은 아니다.

[Spec의 작업 방식](../spec/05-constraints-design-assumptions.md)대로 각 범위 안에서는 이름·조건·변환·타입 등 가까운 요소부터 실제 연결 부담까지 살핀다. 앱 진입을 먼저 다룬다고 큰 구조부터 개편하는 것은 아니다. [기존 합의](../../../records/2026-09-11-01-ticket-boundary-agreement.md), [최초 06–17 구성](../../../records/2026-09-12-08-remaining-ticket-definition.md), [이번 점검·신구 번호 대응](../../../records/2026-09-14-04-ticket-scene-reordering.md)에 이유와 보존 경계가 있다.

## 기존 결과

- [01 — 경비 합계의 강조·소수 자릿수 규칙](01-expense-totals.md) — 표시 규칙의 반복 해석 개선. 사용자 수락 범위 유지.
- [02 — 도시 검색의 선별 조건과 변환](02-city-search.md) — 필터·수도 예외·변환 의미 개선. 사용자 수락 범위 유지.
- [03 — 저장 용량의 집계·부분 실패·표시](03-storage-stats.md) — 집계·표시·React 연결 구현 결과 유지. 최종 수락 전.
- [04 — 경비 API의 요청·검증·반환 흐름](04-expense-api.md) — 오류 책임을 유지한 API 표현 개선. 사용자 수락 범위 유지.
- [05 — 서버 Schedule 응답과 접근 경계](05-schedule-response.md) — 직렬화·response schema·ownership/soft-delete 완료. 이후 Ticket의 입력으로 사용하며 전체 서버 오류 처리 완료로 확대하지 않는다.

## 앱 진입과 여행 선택·활성화

- [06 — 앱 준비·인증 상태·첫 화면·초기 작업 연결](06-app-startup-lifecycle.md) — 새 범위. 준비·라우팅·대표 여행 적용·sync/cleanup 시작 조건의 책임을 드러낸다.
- [07 — Trip·Schedule client API 경계](07-client-api-boundaries.md) — 기존 06. 요청·응답 검증·오류 전달을 직접 읽고 검증하게 한다.
- [08 — 날짜 범위·그룹·대표 여행 계산](08-date-selection-grouping.md) — 기존 10. 대표 여행의 순수 계산과 일정·경비 날짜 경계를 함께 관리한다.
- [09 — 활성화와 offline-prep 완료 상태](09-activation-readiness.md) — 기존 14. data·map·route 준비와 terminal UI가 실제 완료 의미를 드러내게 한다.

## 일정·경비 입력과 표시·저장 이후

- [10 — 일정 생성·수정 입력 생명주기](10-schedule-form-lifecycle.md) — 기존 07. 초기값·장소·picker·재진입의 값 Owner를 분명히 한다.
- [11 — 경비 생성·수정 입력 생명주기](11-expense-form-lifecycle.md) — 기존 08. 늦은 기본 통화·날짜·연결 일정·재진입의 입력 기준을 분명히 한다.
- [12 — 경비 카테고리 표시와 컴포넌트 Owner](12-expense-presentation-ownership.md) — 기존 15. 실제 카드 Owner와 카테고리 표현의 공통·차이를 드러낸다.
- [13 — 저장 이후 처리와 일정 경로 준비 책임](13-schedule-route-preparation.md) — 기존 09. 여행·경비·일정의 callback·캐시·이동 차이를 실제 consumer로 비교하고, 일정 저장 결과부터 최신 경로 준비까지 연결한다.

## 저장·동기화·정리와 서버 경계

- [14 — Data Entity local mutation·Router·transaction 계약](14-local-mutation-router-transaction.md) — 기존 11. 검증된 원자성·active/inactive 경계를 타입과 책임으로 이어 준다.
- [15 — Sync 결과·재시도·pull 타입](15-sync-result-retry-pull-types.md) — 기존 12. 부분 실패·재시도·response 검증 결과를 caller와 UI까지 전달한다.
- [16 — 미전송 데이터 보존과 파괴적 정리](16-unsynced-data-cleanup.md) — 기존 13. 비활성화·cleanup·logout에서 같은 미전송 판단과 정리 결과를 사용한다.
- [17 — Schedule을 제외한 server Data Entity route 경계](17-server-data-route-boundaries.md) — 기존 16. Trip·Expense 직렬화 선행 결과를 유지하고 남은 request·response·ownership·오류 책임을 정리한다.
- [18 — Spec 범위와 개선 결과의 종료 검토](18-spec-coverage-closure.md) — 기존 17. 실제 결과와 전체 후보의 완료·유지·별도 Work·미확인을 최종 대조한다.

## 시작과 완료의 관계

06의 진입 흐름 특성화부터 시작할 수 있다. 07의 독립 API export, 08의 순수 계산, 12의 표시 Owner 조사와 03의 수락 판단도 다른 후속 구현 전체를 기다리지 않는다. 09를 앞에 놓았지만 전체 준비 상태의 완료에는 13의 route 결과, 14의 local 반영, 15의 sync 결과 계약이 필요하다.

10·11의 입력 계약은 13이 소비하며, entity별 cache invalidation 계약은 14와 맞춘다. 14의 queue·transaction 결과는 15·16·09의 데이터 보장에, 15의 queue 결과 의미는 16·09의 완료 판단에 필요하다. 06은 08·15·16의 계산·엔진·정리 알고리즘을 흡수하지 않고 시작 조건과 결과 소비만 맡는다. 07·17은 Trip update의 client/server 기대 method를 공유한다. 18은 03의 수락 여부, 완료된 05, 06–17의 실제 결과를 대조한 뒤 전체 충분성을 판단한다.

## 003 결함 Ticket과의 연결

002는 이해·수정 부담을 줄이는 결과를, [003](../../../../003-bug-investigation-and-fixes/current/memory/tickets/index.md)은 확인된 결함의 동작 수정을 맡는다. 같은 파일을 만지더라도 기대 동작·구현 책임과 회귀 근거를 먼저 맞추고 중복 수정하지 않는다. 아래는 실제 담당 연결이며 003 전체가 완료됐다는 뜻도, 버그 수정을 002에 자동 허용한다는 뜻도 아니다. 관련 결함이 남아 있어도 독립 특성화·구조 정리는 가능하지만 그 결함이 필요한 결과를 막으면 해당 완료는 열어 둔다.

- 앱 준비·첫 화면·선택: 002-06·08은 [003-01 준비 실패](../../../../003-bug-investigation-and-fixes/current/memory/tickets/01-startup-and-error-recovery.md), [003-02 인증 복구](../../../../003-bug-investigation-and-fixes/current/memory/tickets/02-auth-account-recovery.md), [003-03 여행 선택·수정](../../../../003-bug-investigation-and-fixes/current/memory/tickets/03-trip-management.md)과 연결한다.
- 입력·표시·날짜: 002-10·11·13은 [003-06 form 상태](../../../../003-bug-investigation-and-fixes/current/memory/tickets/06-form-state-and-defaults.md), 002-08은 [003-08 날짜 의미·기간 밖 접근](../../../../003-bug-investigation-and-fixes/current/memory/tickets/08-date-and-range-consistency.md)을 사용한다. 같은 ID 재열기의 정상 근거도 유지한다.
- 활성화·지도·경로: 002-09·13·16은 [003-04 데이터 전환](../../../../003-bug-investigation-and-fixes/current/memory/tickets/04-activation-data-lifecycle.md), [003-05 native 준비·재시도](../../../../003-bug-investigation-and-fixes/current/memory/tickets/05-offline-map-readiness.md), [003-09 좌표·경로](../../../../003-bug-investigation-and-fixes/current/memory/tickets/09-map-search-route-behavior.md)와 연결한다. Drawer 탈출 불가는 확인된 사실로 쓰지 않는다.
- local·sync·정리: 002-14는 [003-07 inactive child 작업](../../../../003-bug-investigation-and-fixes/current/memory/tickets/07-inactive-child-operations.md)·[003-10 원자성·미전송 귀속](../../../../003-bug-investigation-and-fixes/current/memory/tickets/10-local-write-queue-safety.md), 002-15는 [003-11 실패·재시도](../../../../003-bug-investigation-and-fixes/current/memory/tickets/11-sync-retry-recovery.md)·[003-12 pull 충돌·cursor](../../../../003-bug-investigation-and-fixes/current/memory/tickets/12-pull-consistency.md)를 사용한다. 002-16은 이 결과와 003-02·04의 정리 계약을 소비한다.
- 서버·client API: 002-07·17은 003-03의 Trip 허용 필드와 [003-13 서버 계약](../../../../003-bug-investigation-and-fixes/current/memory/tickets/13-server-scope-and-contracts.md)을 사용한다. 002-05의 완료 범위와 17의 직렬화 결과는 재사용하고 실제 JWT·전체 client parser 왕복까지 완료했다고 하지 않는다.

## 분석 관점의 현재 배정과 열린 범위

- 이름·주석·로그·catch: 04·06·07·17. 조건식·표시 규칙: 01·12.
- 값 변환·기본값·타입 전달: 05·07·08·10·11·14·15·17. 중복 검증·도달하지 않는 분기: 05·07·17.
- 목록·날짜·대표 여행의 계산: 08. 선택 적용 시점: 06. form·picker·생성/수정 차이: 10·11.
- 저장 후 callback·캐시·이동·경로: 13, 준비 완료 소비는 09. local mutation·upsert·queue·sync·cleanup: 09·14·15·16.
- 완료 상태·설정의 실제 사용: 06·09·15. server 변환·오류 책임: 완료된 05와 남은 17.

[추가 조사](../additional-research.md)의 `datetime.ts` 입력 mutation·offset 예제·미래 상대시간은 08, 카테고리·경쟁 Card export는 12, `syncStrategy`와 sync auth helper는 15, logout·계정 삭제 local 정리는 16이 맡는다. 여행 생성의 옛 hook과 실제 `TripDateForm` 연결은 13에서 확인한다. 짧은 Input·Checkbox·Switch의 범용 wrapper 추가와 생성 schema의 단순 partial 통일은 기존 근거대로 채택하지 않는다.

아직 배치·기대 확인이 필요한 항목은 남겨 둔다. Trip PATCH/PUT는 07·17의 공동 확인 뒤 Main이 수정 담당을 확정한다. 날짜 변경 뒤 무효 `scheduleId`의 입력 UX는 11에서 003-06·07과 조율한다. Auth/OAuth·Places server 전반의 구조 개선, `RadioGroup`의 단언, 미사용 대표 통화 helper·미확인 export의 의미, 프로덕션 환경 파일 경로·Node 버전 강제는 확정된 구현 담당이 없다. 현재 분석의 낮은 근거 후보나 별도 배포 계약을 억지로 구현에 합치지 않되, 필요한 변경으로 확인되면 Main이 18 완료 전에 담당 실행을 배치한다. 알려진 누락을 마지막 검토까지 숨기지 않는다.
