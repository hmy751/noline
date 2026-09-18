# 현재 상태와 다음 행동

## 완료·수락된 범위

사용자는 [01번 Ticket](../memory/tickets/01-expense-totals.md)부터 [05번 Ticket](../memory/tickets/05-schedule-response.md)까지를 완료된 결과로 확정했다. 각 결과는 해당 Ticket의 검사와 미확인 한계를 포함한 범위에서 수락됐으며 Workspace나 제품 전체 완료를 뜻하지 않는다.

- 01은 제한된 fixture·정적 검사 범위에서 경비 합계 표시의 반복 해석을 줄였다.
- 02는 fixture·별도 verifier 범위에서 도시 선별과 변환을 정리했다.
- 03은 SQLite·Mapbox 집계, 부분 실패와 React 연결을 나눴다. development build·실기기·native module 미확인은 남아 있다.
- 04는 fetcher를 mock한 범위에서 Expense API 요청 검증·HTTP·응답 검증·반환 흐름을 정리했다.
- 05는 Schedule 날짜 직렬화, response schema, ownership·soft-delete를 완료했다. 실제 JWT·배포 process와 일부 통합 범위는 확인하지 않았다.

제품 Verify receipt는 없으며 이 수락을 native·외부 서비스·전체 서버 계약의 검증으로 확대하지 않는다. 선택된 제품 산출물과 저장 경계는 [output](../../output/index.md)에서 찾는다.

## 공통 기준과 Project Context 후보

Ticket 03의 초기 범위가 개선 깊이를 충분히 전달하지 못한 사례를 계기로 공통 운영 기준은 목표에 필요한 일을 찾고 맡은 결과·필요한 범위·완료 근거로 실행을 판단하도록 보완됐다. 현재 정본은 [공통 운영 기준](../../../spec-and-tickets/README.md)이 소유한다. 대화 맥락 없는 세션에서의 독립 적용 재검증은 아직 없다.

Project Context 후보 구성에는 Ticket 01–05와 관련 records·output·실제 코드를 주 자료로, `_archive`를 제외한 기존 `.claude/context`·decisions·sessions·CHANGELOG를 보조 자료로 사용한다. Ticket 06 이후는 이 구성 범위에서 제외하지만 Workspace의 후속 리팩토링 범위에는 남는다.

Project-wide 판단으로 남은 항목은 Expense 날짜 계약, 금액 반올림·정밀도와 서버 오류 처리의 목표 구조다. Project Context의 실제 반영은 이 Workspace Maintain의 소유 범위가 아니며 완료로 간주하지 않는다.

## Ticket 06 — 파일별 검토와 레이아웃 검사 저장

현재 실행은 [Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)의 코드 품질 보완이다. 네트워크 정책 전체 계약은 유지하지만, 확대 워커 구현은 철회됐으며 미구현 계약을 발견했다는 이유로 자동 확장하지 않는다. [철회 기록](../../records/2026-09-17-02-network-consumer-quality-improvements.md)은 이력으로 보존한다.

사용자는 Network Store와 테스트, Policy·Router·SyncProvider, 레이아웃과 테스트를 순서대로 확인했다. Store의 실제/표시 상태와 refresh 완료 의미를 유지했고 Provider는 사용자 제안 코드의 ref 잠금·안정된 타이머·차단 사유 로그를 채택했다. 동일 렌더의 Provider 중복 진입 문제는 보완됐다. Root의 초기화·인증 라우팅·인증 후 작업은 사용자 결정에 따라 `_layout.tsx` 안에 유지한다.

제품 코드는 `c578446`, `6efdfed`, `0ce6f4d`로 저장했다. 최신 검증은 전체 Jest 8개 suite·108개 test 통과이며 Layout 15개는 개선 전후 통과했다. 남은 6개 파일의 포맷 통과, ESLint 연동 규칙 제외 시 오류 0개·경고 9개, client 타입 검사의 기존 지도 오류 3개가 남는다. 실제 Expo·native·SQLite·서버 검증을 뜻하지 않는다. 선택과 검사·커밋의 상세는 [최신 실행 기록](../../records/2026-09-18-01-network-provider-layout-review-and-commits.md)이 소유한다.

후속 판단은 DebugScreen의 engine 직접 sync 호출, DB/auth·login·override 해제의 sync 시작 연결, DB/auth 실패 정책, 대상별 Router와 inactive child 선조회, 제한·복구 화면과 선택 유지다. 현재 품질 변경을 저장한 사실을 Ticket 06 전체 완료나 사용자 최종 수락으로 해석하지 않는다. 사용자 요청에 따라 기록을 수동 반영했으며 machine status·receipt·자동 session binding은 변경하지 않았다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. DB·auth 실패, routing과 여행 선택 등 Ticket 06의 나머지 범위는 첫 네트워크 결과 뒤에 이어서 판단한다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
