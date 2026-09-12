# Ticket

기존 분석과 추가 조사에서 확인한 개선 책임을 01–17에 연결한다. 상세 진행과 결과는 각 Ticket 본문, 전체 상황과 다음 행동은 [state](../../state/index.md)에서 읽는다. 이 색인은 상태의 두 번째 정본이 아니며 각 Ticket이 맡은 결과와 관계를 찾는 진입점이다.

Ticket은 관련된 여러 개선 관점을 함께 다룰 코드 범위다. [작업 단위와 진행 방식](../spec/05-constraints-design-assumptions.md)에 따라 범위 안에서 바텀부터 살피며, 전체 분석 관점·후보의 확인한 범위와 남은 범위는 [품질·완료 판단](../spec/04-quality-and-completion.md)에 따라 연결한다. 채택 원문과 정정 경위는 [합의 기록](../../../records/2026-09-11-01-ticket-boundary-agreement.md), 남은 구성의 재검토 배경은 [fresh-session 검토](../../../records/2026-09-12-06-fresh-session-ticket-recomposition-review.md)에서 읽는다.

## 실행 범위

- [01 — 경비 합계의 강조·소수 자릿수 규칙](01-expense-totals.md) — 강조 판단과 표시 규칙의 반복 해석을 줄이는 범위.
- [02 — 도시 검색의 선별 조건과 변환](02-city-search.md) — 요청과 필터의 동일 기준, 수도 예외와 변환 의미를 드러내는 범위.
- [03 — 저장 용량의 집계·부분 실패·표시](03-storage-stats.md) — 부분 결과와 실패 정책을 보존하면서 집계·표시·React 연결 책임을 드러내는 범위.
- [04 — 경비 API의 요청·검증·반환 흐름](04-expense-api.md) — 오류 책임을 유지하면서 부수 표현을 줄이는 범위.
- [05 — 서버 일정 응답의 날짜 변환](05-schedule-response.md) — Schedule 날짜 직렬화의 일곱 소비 지점을 별도로 판단하는 범위. 이번 재구성에서 문서와 구현을 바꾸지 않는다.
- [06 — Trip·Schedule client API 경계](06-client-api-boundaries.md) — client 요청·응답 검증과 오류 전달을 직접 읽고 검증할 수 있게 하는 범위.
- [07 — 일정 생성·수정 입력 생명주기](07-schedule-form-lifecycle.md) — 초기값·장소·picker·재진입의 값 Owner를 분명히 하는 범위.
- [08 — 경비 생성·수정 입력 생명주기](08-expense-form-lifecycle.md) — 늦은 기본 통화·날짜·연결 일정·재진입의 입력 기준을 분명히 하는 범위.
- [09 — 일정 저장 이후 경로 준비 책임](09-schedule-route-preparation.md) — 저장 결과부터 최신 route 준비까지의 순서와 공통 책임을 정리하는 범위.
- [10 — 날짜 범위·그룹·대표 여행 계산](10-date-selection-grouping.md) — 화면 날짜 범위·그룹과 대표 여행 선택의 반복 날짜 해석을 줄이는 범위.
- [11 — Data Entity local mutation·Router·transaction 계약](11-local-mutation-router-transaction.md) — 실제 transaction 원자성과 active/inactive mutation 경계를 맞추는 범위.
- [12 — Sync 결과·재시도·pull 타입](12-sync-result-retry-pull-types.md) — 부분 실패·재시도·response 검증 결과를 caller와 UI까지 전달하는 범위.
- [13 — 미전송 데이터 보존과 파괴적 정리](13-unsynced-data-cleanup.md) — queue 상태를 공유해 비활성화·cleanup·logout에서 미전송 데이터를 보존하는 범위.
- [14 — 활성화와 offline-prep 완료 상태](14-activation-readiness.md) — data·map·route 준비와 terminal UI 상태의 실제 완료 의미를 맞추는 범위.
- [15 — 경비 카테고리 표시와 컴포넌트 Owner](15-expense-presentation-ownership.md) — 실제 ExpenseCard Owner와 카테고리 표현의 공통·차이를 드러내는 범위.
- [16 — Schedule을 제외한 server Data Entity route 경계](16-server-data-route-boundaries.md) — Trip·Expense·Sync route의 parse·ownership·변환·오류 책임을 정리하는 범위.
- [17 — Spec 범위와 개선 결과의 종료 검토](17-spec-coverage-closure.md) — 모든 후보와 실제 결과를 대조해 완료·유지·별도 Work·미확인을 판정하는 범위.

## 실행 관계

03의 사용자 수락 판단과 05의 별도 범위 판단은 새 Ticket 실행과 병행할 수 있다. 06·10·15는 다른 새 Ticket의 구현을 선행 조건으로 삼지 않는다. 07은 09가 사용할 입력·좌표 의미를 먼저 확정하고, 09는 14의 route 준비 결과를 제공한다. 11의 transaction·Router 결과는 12·13·14의 데이터·상태 보장에 선행하며, 12의 queue 결과 의미는 13·14가 사용한다. 06과 16은 Trip update의 client/server contract 결정을 공유한다. 17은 03·05와 06–16의 결과가 모인 뒤 수행한다.

각 Ticket에 걸린 문제는 재현 결함, 정적 코드 불일치, 동작 확인 후보와 UX 판단을 구별한다. 현재 Spec 밖의 동작 수정은 아직 실제 담당 Work가 배정되지 않았으므로 아래 미배정 차단 항목으로 유지한다. 재현이나 기대 동작 확인 뒤 Main이 별도 결함 Work를 배치하거나 사용자가 해당 Ticket에 수정 권한을 추가해야 하며, 그 전 완료할 수 없는 결과는 각 본문에 적었다.

## 미배정 차단·확인 항목

- **재현 결함:** local write와 `sync_queue` 추가의 transaction 비원자성은 11을 차단한다. 여행별 미전송 조회가 `PENDING`만 보는 문제는 13을 차단하며 12의 queue 상태 의미에도 연결된다.
- **정적 코드 불일치, 실행 확인 필요:** Trip update의 client `PATCH`와 server `PUT` 차이는 06·16, inactive child mutation의 local 선행 조회는 11, sync 부분 실패의 성공 표시와 retry 조건은 12–14, server schema·route·ownership 차이는 16의 완료에 걸린다.
- **동작·UX 확인 필요:** form cancel·늦은 기본값·무효 연결 일정은 07·08, stale route·좌표·timer는 09, UTC/local·미래 상대시간은 10, activation ready와 error terminal UX는 14에서 먼저 특성화한다.

이 항목들은 현재 담당이 정해지지 않았다. 실제 차이가 확인되고 동작 수정이 필요하면 Main이 별도 Work 또는 추가 권한을 배치한다. 해결이 필요한데 담당이 정해지지 않은 상태에서는 관련 Ticket과 17을 완료로 닫지 않는다.

## 분석 관점의 현재 배정

- 이름·주석·로그·catch: 04, 06, 16
- 조건식·표시 규칙: 01, 15
- 값 변환·기본값과 타입 전달: 06–08, 10–12, 16. Schedule server 직렬화는 05에만 남긴다.
- 중복 검증·도달하지 않는 분기: 06, 16
- 목록·날짜 계산과 대표 여행 선택: 10
- form 초기값·reset·picker·생성/수정 차이: 07, 08
- 저장 성공 이후 처리와 route 공통화: 09, 14
- local mutation·upsert·sync·cleanup: 11–14
- 완료 상태·정책 설정의 실제 사용: 12, 14
- server 변환·오류 책임: 05, 16

[추가 조사](../additional-research.md)의 대표 여행 선택과 `datetime.ts` 입력 mutation·offset·미래 상대시간은 10, 카테고리 표시는 15, sync auth/retry와 `syncStrategy`·sync auth helper 사용 여부는 12, logout·계정 삭제의 local 정리는 13이 맡는다. Auth/OAuth·Places server route 전반, `RadioGroup`의 `as any`와 사용처가 확인되지 않은 export처럼 현재 근거가 낮거나 별도 계약인 후보는 구현 Ticket에 억지로 합치지 않았다. 이들은 현재 **미배정**이며 17에서 유지·새 Ticket·별도 Work·미확인 중 하나로 판정해야 한다. 필요한 변경으로 확인되면 17 완료 전에 Main이 담당 실행을 새로 배치한다.
