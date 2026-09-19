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

## Ticket 06 — 기존 인증 구현 보완 전

[Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)의 startup·sync 시작/종료·단일 세션 저장·다섯 인증 상태·로컬 접근은 구현돼 있다. startup은 `8a1a3ea`, sync는 `029adb6`, 당시 인증 정책 문서는 `10960e9`에 저장했고 후속 제품 변경은 미커밋 상태다. 전체 원복 대신 기존 코드와 테스트를 기반으로 필요한 함수·책임을 교체하는 방향을 채택했다. 추가 논의와 구현 기준은 문서에 반영했으며 제품 보완 구현은 시작하지 않았다.

최신 기준은 같은 계정의 인증만 복구하는 재로그인, 다른 계정 변경 전 명시적 로그아웃이다. 인증 만료 후 활성 여행 Local CRUD는 계속 허용하고, 만료 후 재로그인 저장 실패에는 기존 `reauth-required`를 유지한다. 새 실패 상태나 재로그인까지 일반 HTTP 요청을 보관하는 대기열을 추가하지 않는다. 자동 갱신 성공 뒤 원래 요청 재시도와 로컬 sync_queue 보존은 유지한다. [Spec의 동작](../memory/spec/02-behavior-and-cases.md)과 [결정·정정 기록](../../records/2026-09-19-01-auth-complexity-review-and-decisions.md)에서 기준과 이유를 읽는다.

**다음 구현은 apiClient의 갱신·재시도·응답·오류 전달과 세션 저장 실패 정합성을 먼저 고치고, 같은 계정 재로그인·명시적 계정 종료를 연결하는 일**이다. 이후 useAppPolicy의 실제 소비와 서비스 인증 요구, inactive child Local 선조회·제한/복구 화면·foreground 재확인을 정리한다. 현재 변경을 복구 가능하게 보존한 뒤 작은 범위로 진행한다.

Main이 재실행한 기존 client Jest는 23 suite·235 test 통과다. 추가 검사 8개 중 5개에서 API 응답 손실·인증 오류 의미 손실·세션 저장 실패 불일치·큐 귀속 판정·DB rollback 간섭을 재현했다. 3개는 갱신 공유·일반 요청 비보관·재로그인 재시도를 확인했다. 자세한 코드와 결과는 [검사 근거](../../records/2026-09-19-02-auth-review-checks.md)에 보존했다. 이번 검토는 typecheck·lint·실기기·실제 OAuth/server token rotation을 재실행하지 않았으며 과거 검사와 미확인은 [인증 구현 기록](../../records/2026-09-18-05-auth-session-implementation.md)을 따른다.

DB 원자성·격리는 14, 엔진 결과·FAILED 복구는 15, 미전송 기록과 cleanup·로그아웃 손실 판정은 16에 연결했다. 이 문제가 남은 상태를 전체 보존 완료로 보지 않는다. 06의 정상 재로그인 단순화를 이유로 복원 실패·잔존 데이터의 소유권 검사를 제거하지 않는다. 다중 기기 제어·로그아웃 중 앱 강제 종료 후 복구 장치는 기존 제외 범위다.

기기 세션 결정 문서에는 후속 합의를 연결했다. 실제 로그인 안내와 제품 코드는 아직 이전 자동 전환을 사용하므로 구현 때 최신 Spec과 맞춰야 한다. 기록의 커밋 범위는 Workspace 문서와 관련 결정 문서이며 제품 변경은 미커밋 상태로 유지한다. 문서 정리를 Ticket 06 수락이나 제품 검증 완료로 보지 않는다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. Ticket 06의 DB·auth 실패 처리와 선택 적용은 위 결과에 포함하며, 남은 routing·네트워크 소비 연결은 06, 엔진 결과/재시도는 15에서 이어 간다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
