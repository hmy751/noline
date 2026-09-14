# 현재 상태와 다음 행동

## 완료·수락된 범위

사용자는 [01번 Ticket](../memory/tickets/01-expense-totals.md)부터 [05번 Ticket](../memory/tickets/05-schedule-response.md)까지를 완료된 결과로 확정했다. 각 결과는 해당 Ticket에 기록된 검사와 미확인 한계를 포함한 범위에서 수락된 것이며, Workspace 전체 완료나 제품 전체 동작 보존을 뜻하지 않는다. 선택된 제품 산출물과 Main이 보고한 저장 경계는 [output](../../output/index.md)에서 찾는다.

- 01은 제한된 fixture·정적 검사와 실제 화면 미실행 범위에서 경비 합계 표시의 반복 해석을 줄였다.
- 02는 fixture·별도 verifier 범위에서 도시 선별과 변환을 정리했으며 실제 GeoNames·전체 화면은 확인하지 않았다.
- 03은 SQLite·Mapbox 집계, 부분 실패와 React 연결을 나눴다. hook 시나리오와 제한된 정적 검사는 통과했지만 전체 typecheck·기본 lint의 기존 실패와 development build·실기기·native module 미확인은 남아 있다.
- 04는 fetcher를 mock한 검사 범위에서 Expense API의 요청 검증·HTTP·응답 검증·반환 흐름을 정리했으며 실제 네트워크·Axios interceptor·화면은 확인하지 않았다.
- 05는 Schedule 날짜 직렬화, response schema, ownership·soft-delete를 완료했다. server unit·route와 PostgreSQL 통합 검사의 한계, 실제 JWT·배포 process 미확인과 기존 `places.ts:138` typecheck 오류는 유지한다.

제품 Verify receipt는 없으며 이 수락을 native·외부 서비스·전체 서버 계약의 검증으로 확대하지 않는다.

## 공통 Spec·Ticket 기준

Ticket 03의 초기 범위가 Spec의 개선 깊이를 충분히 전달하지 못한 사례를 계기로, 공통 운영 기준은 목표에 필요한 일을 찾고 맡은 결과·필요한 범위·완료 근거로 실행을 판단하도록 보완됐다. 현재 정본은 [공통 운영 기준](../../../spec-and-tickets/README.md)이 소유한다. 초기 반영과 후속 보완은 Main이 `d7223b7`과 `c902230`으로 보고했으며, 선택 배경과 검토 범위는 [Ticket 03 재확인](../../records/2026-09-12-01-ticket-03-initial-scope-reanalysis.md), [fresh-session 재구성 검토](../../records/2026-09-12-06-fresh-session-ticket-recomposition-review.md), [지침 보완 범위 정정](../../records/2026-09-12-07-guidance-scope-correction.md)에서 찾는다. 대화 맥락 없는 세션의 독립 적용 재검증은 아직 없다.

## Project Context 구성에 사용할 범위

사용자는 Project Context 후보를 구성할 때 이 Workspace의 Ticket 01–05, 관련 records·output과 실제 코드를 주 자료로 사용하고, `_archive`를 제외한 기존 `.claude/context`·decisions·sessions·CHANGELOG를 보조 자료로 대조하기로 했다. 06 이후 미완료 Ticket은 이번 구성 범위에서 제외하되 Workspace의 후속 리팩토링 범위에서는 그대로 유지한다.

옛 자료와 현재 결과가 일치하면 현재 의미로 합치고, 현재 코드로 해소되는 낡은 구현 설명과 과도한 증명 범위는 현재 사실에 맞게 교정한다. 제품 의미나 새 기준의 선택이 필요한 충돌은 억지로 결론 내리지 않는다. 현재 열린 판단은 다음 세 가지다.

- Expense `date`의 `YYYY-MM-DD`와 timezone 포함 ISO datetime의 장기 domain 구분
- Ticket 01에서 드러난 금액 반올림·정밀도를 현재 표시 동작으로 둘지 Project-wide 금액 계약으로 정할지
- 서버 오류 처리를 현재의 `try/catch + sendInternalError`로 설명할지, `AppError + errorHandler`를 목표 구조로 유지할지

Project Context의 실제 반영은 이 Workspace Maintain의 소유 범위가 아니며 아직 반영 완료로 간주하지 않는다.

## 남은 리팩토링

Ticket 06–18의 정의와 관계는 [Ticket 색인](../memory/tickets/index.md)이 안내한다. 06–16의 제품 구현과 17의 남은 request·response·ownership·오류 경계는 미완료다. 17에는 Trip·Expense 직렬화 선행 결과가 이미 저장돼 있지만 전체 서버 계약 완료로 확대하지 않는다.

제품 리팩토링을 재개할 때에는 06의 정상·실패·지연 진입 특성화부터 시작할 수 있다. 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

003의 결함 Ticket과 담당 연결은 Ticket 색인이 소유한다. 직접 차단하는 결함이 남으면 관련 002 결과를 완료로 닫지 않는다. Trip PATCH/PUT의 기대·수정 담당과 날짜 변경 뒤 무효 `scheduleId`의 입력 UX는 Main 조율이 남았다. 서버 환경 파일 경로, Node 버전 강제, 내부 import 확장자 혼합과 개발용 PostgreSQL 구성도 별도 확인 후보다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. 제한된 검사와 Ticket 01–05 수락을 전체 Work 완료로 사용하지 않는다.
