# 05 완료 뒤 남은 Ticket 점검과 장면 순서 재배치

## 요청과 판단

사용자는 05 완료와 최근 변경을 다시 확인한 뒤 003의 앱 진입부터 시작하는 시나리오 구성을 참고해 리팩토링 순서를 재검토하자고 했다. 이어 현재 대화에서 “그럼 재배치 전에 한번더 06~17 이쓴거 점검하고 재배치 시작하자”라고 요청했다. 이번 반영은 그 요청에 따른 Ticket 문서 재배치이며 제품 구현이나 커밋 요청으로 확대하지 않았다.

Main은 기존 06–17의 12개 본문을 모두 읽고 Spec 다섯 문서·공통 Spec/Ticket 운영 기준·기존 분석 및 추가 조사, 003의 대응 Ticket과 실제 코드를 대조했다. 기준 HEAD는 `d7bf5ff fix(server): enforce schedule access boundaries`, branch는 `refactor/codebase`다. 조사 시작 때 기존 미추적 `.pnpm-store/`만 있었으며 이 경로는 작업에 포함하지 않았다.

기존 책임을 버리거나 티켓을 실행 직전에만 만들 이유는 없었다. API·form·날짜·route·local·sync·cleanup·활성화·표시·서버 경계와 종료 검토를 유지하면서 읽는 순서를 바꿨다. 파일을 앱 진입부터 검토하되 각 범위 안에서는 기존 Spec대로 작은 조건·변환·타입에서 실제 연결 책임까지 살핀다. 번호는 모든 구현의 직렬 선행 순서가 아니다.

## 다시 점검하며 보완한 범위

기존 구성에는 앱 준비·인증 상태·첫 화면·초기 작업을 연결하는 담당이 없었다. root는 DB/auth 순차 준비와 `finally`의 ready 설정, 인증 후 initializer, 2초 cleanup trigger, sync provider와 라우팅을 조립한다. 탭 layout도 인증 준비와 이동을 제어한다. 새 06은 이 연결의 이해·수정 부담을 맡고, 계산·sync 엔진·cleanup 알고리즘은 기존 담당에 남겼다. 준비 실패·재인증·선택 보존의 동작 수정은 003-01·02·03과 연결한다.

기존 09는 일정 저장 뒤 route만 명시해, 분석이 함께 지적한 여행·경비의 저장 후 callback·화면 이동 차이가 담당에서 빠져 있었다. 새 13에 저장 이후 연결 범위를 보완했다. 현재 `CreateTripScreen`은 `TripDateForm`을 렌더하고 그 form이 성공 뒤 `router.replace`를 호출한다. 분석의 `useCreateTripForm`은 현재 앱 consumer 검색에서 호출을 찾지 못했다. 경비 hook은 callback 뒤 `router.back`, 일정 hook은 화면 callback과 지연 경로 준비를 소유한다. 이 차이를 실제 사용처로 판정하되 무조건 같은 구현·UX로 통일하지 않는다.

기존 16의 “서버 test runner 없음”, 17의 “05 별도 판단·결과 없음”, 여러 Ticket의 “결함 미배정”은 현재 결과와 맞지 않았다. 05는 직렬화·response schema·접근 경계를 완료했고, 기존 16은 Trip·Expense 직렬화 조각을 `fd1db26`으로 저장했다. Vitest·Supertest와 격리 PostgreSQL 기반을 새로 만들 필요가 없으므로 재사용하도록 고쳤다. 003의 실제 담당 Ticket은 연결하되 아직 구현 완료로 표시하지 않았다.

## 신구 번호 대응

01–05는 번호와 결과를 유지한다. 후속은 앱 준비, 여행 조회·선택·활성화, 일정·경비 입력·표시·저장 이후, local·sync·정리·서버, 전체 종료 판단 순으로 찾게 했다. 다음은 이전 기록의 번호를 현재 실행 문서로 해석하는 대응표다.

| 이전 번호 | 현재 번호 | 현재 맡은 범위 |
| --- | --- | --- |
| 없음 | [06](../current/memory/tickets/06-app-startup-lifecycle.md) | 앱 준비·인증 상태·첫 화면·초기 작업 연결 |
| 06 | [07](../current/memory/tickets/07-client-api-boundaries.md) | Trip·Schedule client API |
| 10 | [08](../current/memory/tickets/08-date-selection-grouping.md) | 날짜 범위·그룹·대표 여행 계산 |
| 14 | [09](../current/memory/tickets/09-activation-readiness.md) | 활성화·offline 준비 상태 |
| 07 | [10](../current/memory/tickets/10-schedule-form-lifecycle.md) | 일정 입력 생명주기 |
| 08 | [11](../current/memory/tickets/11-expense-form-lifecycle.md) | 경비 입력 생명주기 |
| 15 | [12](../current/memory/tickets/12-expense-presentation-ownership.md) | 경비 표시·컴포넌트 Owner |
| 09 | [13](../current/memory/tickets/13-schedule-route-preparation.md) | 저장 이후 처리·일정 경로 준비 |
| 11 | [14](../current/memory/tickets/14-local-mutation-router-transaction.md) | local mutation·Router·transaction |
| 12 | [15](../current/memory/tickets/15-sync-result-retry-pull-types.md) | Sync 결과·재시도·pull 타입 |
| 13 | [16](../current/memory/tickets/16-unsynced-data-cleanup.md) | 미전송 보존·cleanup·logout |
| 16 | [17](../current/memory/tickets/17-server-data-route-boundaries.md) | Trip·Expense·Sync server 경계 |
| 17 | [18](../current/memory/tickets/18-spec-coverage-closure.md) | Spec 종료 검토 |

이전 날짜별 record는 당시 번호·판단·검증을 그대로 보존했다. `2026-09-14-02` 기록이 인용하는 이전 `16-server-data-route-boundaries.md`는 현재 17로 연결하는 짧은 이동 안내로 남겼다. 이 파일은 새 16 cleanup이나 별도 실행 Ticket이 아니다. 현재 색인·state·output·05의 관련 참조는 새 번호를 사용한다.

## 선행 관계와 003 연결

09를 홈의 활성화 장면 가까이 옮겼어도 전체 준비 완료에는 13의 경로 결과, 14의 local 원자성, 15의 sync 결과가 필요하다. 10·11의 입력 계약과 14의 cache 계약은 13이 소비하며, 14·15는 16의 안전한 정리 판단에 연결된다. 06은 이 하위 결과의 시작 조건만 사용하고 계산·전송·정리 알고리즘을 다시 소유하지 않는다. 07·17은 Trip update method의 같은 기대값을 사용해야 한다.

003의 준비·인증·여행 선택, form·날짜, 활성화·지도·경로, inactive child·local·sync·pull·서버 Ticket을 해당 002 담당에 연결했다. 기존 자료의 정적 후보와 후속 분리 재현을 구별했으며 실제 Axios retry 횟수·native 동작·전체 API 왕복은 확인된 것으로 올리지 않았다. Drawer 탈출 불가와 같은 ID 재열기 전체를 결함으로 전제하지 않는 정상·미확정 근거도 반영했다.

003-13에는 002-05의 완료 범위와 17의 직렬화 결과를 연결했다. Schedule 접근 경계·activation 변환은 재구현하지 않고, 남은 Trip·Expense·Sync 경계·실제 JWT·client parser 검증과 구별한다. 003 전체나 해당 Ticket 전체의 완료로 바꾸지는 않았다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId` 입력 UX는 Main 조율이 남았다. 낮은 근거의 Auth/Places 구조·RadioGroup 단언·미사용 export와 별도 배포 설정 후보도 완료나 배정으로 가장하지 않고 현재 색인에 남겼다. 모든 003 버그를 일괄 선행 조건으로 두지는 않되 직접 필요한 결과가 미해결이면 관련 002 완료를 열어 둔다.

## 보존과 확인 범위

01·02·04의 사용자 수락, 03의 구현·미수락, 05의 완료와 검증 한계, 당시 16의 직렬화 부분 결과를 유지했다. 05 본문은 다른 Ticket 번호·링크 연결만 바꿨다. Spec 목표·기존 날짜별 records·source·제품 코드·test·machine status·Verify·session binding은 변경하지 않았다. 이번에 제품 테스트나 실제 앱·DB를 다시 실행한 것은 아니다.

Main이 반영 후 `git diff --check`와 `node scripts/check-harness.mjs`를 실행해 통과했다. 002·003의 Markdown 109개에서 local link 934개를 검사해 끊긴 경로가 없었고, 색인의 실행 Ticket 01–18 순서·번호와 새 06–18 본문의 네 기본 구성을 확인했다. 제품 코드·test·JSON 계약·기존 날짜별 records·01–04 본문에 변경이 없음을 read-only Git 대조로 확인했다. 05는 번호·링크를 정규화하면 기존 본문과 같고, 새 17에 이전 직렬화 실행·검증 문단이 보존됨도 확인했다. 이는 문서 구조·경로·보존 검사이며 제품 동작이나 전체 Spec 완료를 입증하는 검증은 아니다.
