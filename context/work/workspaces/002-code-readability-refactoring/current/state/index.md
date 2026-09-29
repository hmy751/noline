# 현재 상태와 다음 행동

## 병렬 작업 위치

Project context의 Ticket 06 후보 수집·합의 반영·문서 갱신은 `refactor/project-context-update` 브랜치의 별도 `project-context-update` 워크트리로 분리했다. 이 작업 디렉터리는 `refactor/app-startup-lifecycle`에서 Ticket 06을 진행한다. 활성 여부 최초 확인 1-A, 연결 상태별 안내 1-B, 재확인 버튼 1-C는 커밋되어 있고 일정 화면 복구 2-A는 미커밋 상태다. Project 갱신 결과는 별도 브랜치에서 검토하며 이곳에는 아직 적용하지 않았다.

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

## 앱 준비·인증·동기화·화면 정책의 현재 경계와 다음 행동

[Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)의 인증 책임과 실행 순서를 재검토한 뒤, 사용자 확정 기준에 따라 구현했다. 상태만으로 답하는 계정·인증 판단은 Auth Store에 모았고, DB 소유권 SQL과 사용자 세션 변경 절차는 각각의 책임으로 유지했다. 계정 검사·저장·적용, 즉시 인증 차단, 로그아웃의 로컬 저장 종료·미전송 확인·삭제 순서를 보호한다.

대상 여행 라우팅·DB 원자성·인증·동기화 중단 결과·화면 정책의 저장 경계와 당시 검사 결과는 [분리 커밋 마무리 기록](../../records/2026-09-22-02-five-stage-commits-and-verification.md)에 있다. 활성 여부 최초 확인 1-A는 `c38efa0`, 연결 상태 안내 1-B는 `eaec466`, 재확인 버튼·공용 UI 연결 1-C는 `0c1b17d`에 저장됐다. 온라인 복구는 2-A 일정 화면, 2-B 경비 목록·상세, 2-C 토스트로 나뉜다.

**2-A는 기존 Query의 캐시·갱신 기준을 활용하고 추가 조회를 허용하는 방향으로 결정했으며, 새 방향에 따른 제품 수정 전이다.** 비활성 여행의 offline/unknown 제한은 유지하고 접근이 허용되면 기존 데이터를 먼저 표시한다. 필요한 조회와 sync 뒤 갱신이 겹치는 것은 허용하며, 화면을 sync 종료까지 기다리게 하거나 조회를 한 번으로 맞추는 별도 조율은 줄인다. 전역 refetchOnReconnect false와 push→pull 순서는 유지한다.

작업 트리에는 재조회 성공 전 캐시 숨김과 복구 요청 추적을 하는 이전 구현이 남아 있다. 새 방향에 맞춰 이를 단순화하면서 최초 오류 구별·지도 선택·입력 보존을 유지하고, 성공한 쓰기 뒤 pull 생략·실패와 이전 GET가 겹쳐도 실제 변경이 반영되도록 연결해야 한다. 구현의 현재 차이·완료 기준은 [Ticket 06](../memory/tickets/06-app-startup-lifecycle.md), 결정 과정과 받아들인 비용은 [Query·sync 복구 결정](../../records/2026-09-29-02-schedule-recovery-query-sync-decision.md)에서 읽는다.

남은 UX 판단은 기존 데이터가 있는 재조회 실패의 표시와 2-C 토스트의 의미다. 내용 유지와 실패·재시도 안내는 Main의 추천이며 아직 별도로 채택하지 않았다. 다음 행동은 이 안내를 정리하고 2-A를 개선·검증하는 것이다. 현재는 사용자 요청에 따라 기록을 먼저 반영했으며 추가 제품 수정·커밋·2-B 구현을 실행하지 않았다.

이전 구현의 마지막 전체 검증 보고는 client 37개 suite·347개 test 통과다. 후속 조사의 관련 3개 suite·47개 test 통과와 제어 fixture에서 확인한 갱신 누락은 결정 기록의 제한된 근거로 보존한다. 새 설계는 아직 구현·검증하지 않았다. 기존 Mapbox/download 타입 오류 3개와 실제 기기·서버·OAuth·SecureStore 미확인 한계는 유지한다.

Ticket 06의 경비 온라인 복구·토스트·foreground 재확인·mutation 오류 전달과 전체 완료 검증, 14의 전체 write/cache 계약, 15의 typed pull·cleanup 부분 실패 결과·중단 작업 재개, 16의 여행별 미전송 판정·cleanup 집계는 남는다. 앞선 데이터 보존 검사의 실제 Drizzle SQL·Node 메모리 SQLite 범위와 화면 검사의 mock 경계를 제품 전체 검증으로 확대하지 않는다.

판단 기준, 앞선 제안의 보정, 수정별 증거와 정확한 파일 진입점은 [재점검·구현 기록](../../records/2026-09-21-04-auth-responsibilities-and-regression-fixes.md)에서 읽는다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. Ticket 06의 DB·auth 실패 처리와 화면 정책 적용은 위 결과에 포함하며, 남은 네트워크 소비 연결은 06, typed pull·cleanup 부분 실패 결과·중단된 작업 재개는 15에서 이어 간다. 여행별 미전송 판정과 정리 집계는 16에 남는다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
