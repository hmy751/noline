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

## Ticket 06 — 초기화·sync 기반 구현, 후속 인증 설계 확정

[Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)의 DB 실패 재시도·인증 복원·여행 선택·pending cleanup과 application 책임 분리, sync 시작 조건·Debug 경계·진행 중 sync 종료 대기는 구현했다. 앞선 앱 초기화·스타일 결과는 `8a1a3ea`, sync 연결 결과는 `029adb6`에 저장돼 있다. 마지막 구현 시 Main이 보고한 검사는 client Jest 18개 suite·185개 test 통과, 변경 TypeScript 16개 파일의 ESLint 오류 0개·기존 경고 3개와 포맷·diff 통과다. 기존 지도 관련 타입 오류 3개와 실제 기기·native·SQLite 보존·서버 전송 미확인은 남아 있다. 이 수치를 아래 새 인증 설계의 검증으로 사용하지 않는다.

후속으로 SecureStore 세션 기록과 `initializing`·`signed-out`·`signed-in`·`reauth-required`·`restore-failed`, 초기 복원의 실행 수명, 재로그인 진입·계정 경계·늦은 토큰 응답 처리를 확정했다. 재로그인이 필요해도 같은 계정의 활성 여행 Local CRUD를 유지하고 별도 이용 기한을 두지 않는다. 다른 계정 전환 시 이전 로컬 데이터와 미전송 큐를 폐기한다. 요청 당시 세션이 끝난 갱신 응답은 같은 계정 재로그인 뒤에도 적용하지 않는다.

다중 기기 제어와 로그아웃 도중 앱 강제 종료를 복구하는 진행 표시·재개 장치는 제외한다. 기존 로그아웃의 대기·정리·일반 오류 처리는 유지한다. 채택·철회와 사용자 정정의 이유는 [인증 논의 기록](../../records/2026-09-18-04-auth-session-policy-and-decisions.md)에서 읽는다.

**다음 행동은 Ticket 06의 후속 인증 절을 읽고 시나리오 테스트부터 작성하는 것**이다. 저장·복원·일반 API/sync·로그인 화면과 root guard·계정 전환을 함께 연결해야 한다. 기존 낱개 키의 이관·큐 귀속·세션 식별의 구체 방식은 실제 코드에서 정한다. 이번 요청에서는 문서를 반영했으며 이 후속 설계의 제품 코드·테스트는 아직 변경하지 않았다.

재진입은 [Spec의 동작·사례](../memory/spec/02-behavior-and-cases.md)와 Ticket 06에서 현재 기준을 읽고, 이유가 필요하면 인증 논의 기록으로 내려간다. 이전 초기화·스타일과 sync 검증의 근거는 [초기화 기록](../../records/2026-09-18-02-app-initialization-and-style.md)·[sync 기록](../../records/2026-09-18-03-sync-start-and-session-teardown.md), 제품 코드 위치는 [output](../../output/index.md)에 있다. 원문 전체나 임시 파일 없이 이 문서들로 이어 갈 수 있게 유지한다.

대상별 Trip Router·inactive child Local 선조회, 제한/복구 화면 전체와 foreground 재확인은 06의 다른 남은 범위다. 새 인증 연결에 필요한 계정 경계는 이번 후속 작업에서 다루고, 엔진 전체 결과·재시도와 cleanup 보존 내부는 15·16에서 이어 간다. Ticket 06 전체의 최종 수락과 Workspace 완료는 아직 없다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. Ticket 06의 DB·auth 실패 처리와 선택 적용은 위 결과에 포함하며, 남은 routing·네트워크 소비 연결은 06, 엔진 결과/재시도는 15에서 이어 간다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
