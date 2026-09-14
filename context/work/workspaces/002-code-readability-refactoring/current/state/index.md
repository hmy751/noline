# 현재 상태와 다음 행동

## 완료·수락된 범위

[01번 Ticket](../memory/tickets/01-expense-totals.md), [02번 Ticket](../memory/tickets/02-city-search.md), [04번 Ticket](../memory/tickets/04-expense-api.md)은 사용자가 각 구현 결과와 검증 한계를 확인하고 수락했다. 선택된 제품 산출물과 Main이 보고한 커밋은 [output](../../output/index.md)에서 찾는다.

01은 제한된 fixture·정적 검사와 실제 화면 미실행, 02는 직접 fixture·별도 verifier와 실제 GeoNames·전체 화면 미확인, 04는 fetcher를 mock한 8개 Jest 검사와 실제 네트워크·Axios interceptor·화면 미확인이라는 범위다. 제품 Verify receipt는 없으며 이 수락을 전체 Work 완료나 제품 전체 동작 보존으로 확대하지 않는다.

## 공통 Spec·Ticket 기준의 현재 상태

Ticket 03의 초기 범위가 Spec의 개선 깊이를 충분히 전달하지 못한 사례를 계기로, 공통 Spec·Ticket 운영 기준을 목표에 필요한 일을 찾고 맡은 결과·필요한 범위·완료 근거로 실행을 판단하는 구조로 보완했다. 초기 기준과 하네스 소비 경로는 Main이 d7223b7 커밋으로 보고했고, 현재 정본은 [공통 운영 기준](../../../spec-and-tickets/README.md)이 소유한다.

fresh-session 검토 뒤 사용자는 발견된 간격을 개별 Ticket 구성안이 아니라 공통 지침에서 보완하려던 요청이라고 정정했다. Main은 이에 따라 실행 뒤 실제 달라질 결과의 정의, 분리한 일과 현재 결과의 성립·선행·담당 관계, 구성안 단계의 목표·담당·미배정·미확인 대조를 공통 실행·Ticket 기준에 추가했다고 보고했다. 이 후속 보완은 `c902230 docs(harness): 티켓 결과와 선행 관계 판단 기준 보완`으로 커밋됐다. read-only Git 조회에서 전체 해시 `c90223012b7135d2a221cf4a97036872111f6df0`, 부모 `d7223b7b6622f625e26f7e7457f6eb1373cf91d9`와 공통 실행·Ticket 기준 파일의 포함을 확인했으며, Ticket 본문과 제품 코드 파일은 포함되지 않았다. 하네스 직접 검사와 `git diff --check` 통과는 Main의 보고이고 Maintain은 재실행하지 않았다. 대화 맥락 없는 세션의 독립 적용 재검증은 아직 없다. 사용자는 이 보완을 커밋한 뒤 이번 작업 단계를 마무리하도록 지시했다.

선택 배경과 검토 범위는 [Ticket 03 재확인](../../records/2026-09-12-01-ticket-03-initial-scope-reanalysis.md), [fresh-session 재구성 검토](../../records/2026-09-12-06-fresh-session-ticket-recomposition-review.md), [지침 보완 범위 정정](../../records/2026-09-12-07-guidance-scope-correction.md)에서 찾는다.

## Ticket 재구성과 다음 단계

[03번 Ticket](../memory/tickets/03-storage-stats.md)은 구현 결과를 보존하고 있으나 사용자의 최종 수락 전이다.

[05번 Ticket](../memory/tickets/05-schedule-response.md)은 완료됐다. 서버 검사 기반, 1번 Schedule 날짜 직렬화, 2번 response schema 적용과 3번 ownership·soft-delete의 구현·검증·저장을 마쳤고 사용자가 후속 대화에서도 완료 상태를 확인했다. 테스트 기반은 `fe5722a`, 날짜 직렬화는 `7dd2521`, response schema 적용은 `9d48b95`, 접근 경계는 `d7bf5ff fix(server): enforce schedule access boundaries`로 저장됐다. 아래 단계별 검증의 한계는 계속 유지한다.

Main은 제품 변경 전에 생성·목록·단건·수정·Trip 하위 목록·activation·sync pull의 일곱 응답 경로를 특성화한 뒤 `serializeSchedule`을 도입해 네 날짜 변환을 일곱 소비 지점 모두에서 교체했다고 보고했다. 공통화 전후 같은 route 계약 검사가 통과했고 serializer 단위 검사 2개를 포함해 3개 file의 10개 test, server build와 `git diff --check`가 통과했다.

2번에서는 먼저 DELETE 계약 실패, activation Expense 표현과 잘못된 activation Schedule을 드러내는 검사를 추가했으며 제품 수정 전 총 3개 검사가 실패했다고 Main이 보고했다. 이어 세 Schedule GET 경로의 중복 entity 검증을 제거하고 바깥 response schema만 사용하게 했으며, DELETE에 `deleteScheduleResponse`, activation 전체에 `activateTripResponse`를 연결했다. activation Expense는 현재 계약에 필요한 날짜 문자열과 receipt boolean만 endpoint 안에서 변환했고 전체 Trip·Expense serializer로 범위를 넓히지 않았다. 수정 후 server test 3개 파일의 13개 test, server `tsup` build와 `git diff --check`가 통과했다고 Main이 보고했다. 기존 `places.ts:138` 타입 오류 때문에 server 전체 typecheck는 계속 실패하며, Maintain은 이 검사들을 재실행하지 않았다.

Schedule 주변에서 논의한 1–5는 Workspace Ticket 번호가 아니라 날짜 직렬화, response schema 적용, ownership·soft-delete, 오류 처리, 서버 테스트 기반의 다섯 책임 후보다. 사용자는 1–3을 Ticket 05에서 모두 처리하고 5를 먼저 수행하기로 확정했다. 5·1·2는 앞선 커밋에 저장됐고 3도 구현·검증 뒤 저장하도록 요청했다. 날짜 변환·schema 판정·접근 query는 서로 다른 책임으로 유지한다. 서버 error envelope부터 client 오류 변환과 UI 표시까지 이어지는 4의 공통화는 이번 Ticket에서 제외한다.

3번 전에 [17번 Ticket(당시 16번)](../memory/tickets/17-server-data-route-boundaries.md)의 Trip·Expense 직렬화 조각을 선행했다. Trip 다섯 소비 지점과 Expense 여섯 소비 지점을 각각 공통 serializer로 수렴시켰고, 변경 전 route 검사 8개와 구현 후 전체 server test 25개가 통과했다. `fd1db26`으로 저장했으며 response schema 중복·요청·오류·ownership은 이 조각에서 변경하지 않았다.

3번은 부모 Trip과 자식 Schedule·Expense의 user scope, 일반 조회의 soft-delete, 실제 수정·삭제 UPDATE 조건을 정리했다. 부모 Trip의 미존재·타 사용자 소유·삭제 상태는 같은 404로 처리한다. 변경 전 mock route 검사 네 개가 결함을 재현했고, 수정 후 server unit·route 29개 test와 tmpfs PostgreSQL 14 integration 4개 test, server build와 형식 검사가 통과했다. JWT와 배포 process는 확인하지 않았고 기존 `places.ts:138` typecheck 오류는 남아 있다. 상세는 [접근 경계 실행 기록](../../records/2026-09-14-03-schedule-access-boundary.md)에 있다.

05의 완료는 서버 전체 오류 처리 재설계나 17의 남은 request·response·ownership 경계까지 완료했다는 뜻은 아니다. 해당 결과를 05에서 다시 실행하지 않고 각 담당과 연결한다.

서버 설정에서는 별도 확인 후보가 생겼다. Main은 `tsup` 단일 번들 뒤 환경 파일 상대 경로가 실제 `apps/server/.env.production`이 아니라 `apps/.env.production`을 가리킨다고 재구성했고, 외부 환경변수 주입이 없다면 시작 검사에서 종료될 가능성이 있다고 보고했다. 실제 프로덕션 프로세스는 기동하지 않았다. Node 버전 강제, 내부 import 확장자 혼합과 개발용 PostgreSQL만 제공하는 Docker 구성도 테스트 기반과 배포 조건을 정할 때 확인해야 하며, 이를 Ticket 05의 날짜 직렬화 수정으로 함께 처리하지 않는다.

기존 06–17은 사용자 요청에 따라 구현 전에 문서화한 범위이며 [최초 구성 기록](../../records/2026-09-12-08-remaining-ticket-definition.md)을 보존한다. 이후 05 완료와 003의 시나리오별 결함 Ticket·조사 결과를 반영해, 2026-09-14 기존 12개 Ticket을 다시 점검하고 앱 진입부터 읽는 06–18로 재배치했다. [현재 색인](../memory/tickets/index.md)과 [신구 대응·판단 기록](../../records/2026-09-14-04-ticket-scene-reordering.md)이 현재 구성을 안내한다.

새 06은 DB/auth 준비·첫 화면·초기 선택·sync/cleanup 시작 접점의 구조를 맡는다. 기존 책임은 모두 보존했고, 새 13에는 분석에서 지적했으나 담당이 빠졌던 여행·경비의 저장 후 callback·화면 이동 연결을 보완했다. 현재 여행 생성 consumer는 옛 `useCreateTripForm`이 아니라 `TripDateForm`이다. 기존 16의 직렬화 결과는 새 17에 그대로 이어지며 06–16의 제품 구현과 17의 남은 경계는 미완료다.

다음 실행은 06의 정상·실패·지연 진입 특성화와 시작 조건 확인부터 가능하다. 번호는 읽기·검토 순서이지 모든 구현의 직렬 선행 순서가 아니다. 07의 독립 export·08의 순수 계산·12의 표시 Owner와 03의 수락 판단도 먼저 진행할 수 있다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 실제 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다. 06은 하위 계산·sync·정리를 소유하지 않는다.

결함 담당은 이제 003의 준비·인증·여행·form·날짜·route·local·sync·server Ticket과 연결돼 있다. 이들은 아직 구현 완료가 아니며, 직접 차단하는 결함이 남으면 관련 002 결과도 완료로 닫지 않는다. Trip PATCH/PUT의 기대·수정 담당과 무효 `scheduleId` 입력 UX는 Main 조율이 남았다. 새로운 제품 구현·test·commit·Verify·수락은 이번 문서 재배치로 발생하지 않았다.

## 남은 범위와 증명 경계

[기존 후보](../memory/analysis-items.md)와 [추가 조사](../memory/additional-research.md)의 폼 초기화·재진입, picker, 날짜 그룹, 저장 후 처리, 공통 데이터·경로·정리, 완료 상태, 설정과 서버 계약 후보가 남아 있다. 전체 후보의 Ticket 배치를 실행의 일괄 선행 조건으로 만들지는 않지만, 알려진 누락을 마지막 18에서 처음 배치하지 않도록 담당·제외·미배정·미확인을 현재 색인에 드러낸다.

합산·정렬은 01에서 보존을 비교한 대상일 뿐 대표 통화의 제품 기준을 확정한 결과가 아니다. sync 재시도도 실제 요청 횟수 확인 전에는 재현된 결함으로 확정하지 않는다. 직접 걸리는 버그는 기대 동작, 현재 Ticket 결과와의 선행·차단 관계, 담당 범위를 구별한다.

현재 Workspace 전체에 대한 제품 Verify receipt와 사용자 acceptance는 없다. 제한된 검사, Main 보고, 공통 지침 반영을 제품 기능 전체의 검증이나 Work 완료로 사용하지 않는다.
