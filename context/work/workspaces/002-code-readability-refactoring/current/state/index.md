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

[05번 Ticket](../memory/tickets/05-schedule-response.md)은 구현 전 별도 판단 단계다. Schedule 날짜 직렬화가 일곱 소비 지점에 분산돼 있고 기존 Node 내장 module mock 계획은 고정 런타임에서 실행할 수 없다는 Main 보고를 바탕으로, 공통 추출 없이 유지할지 공유 직렬화 책임으로 재정의할지와 검증 기반을 정해야 한다. 기존 Ticket 문서와 제품 구현은 유지한다.

대화 맥락 없는 fresh session의 06–17 제안은 보완된 공통 기준, 현재 Spec·분석·코드와 독립 조사 결과에 다시 대조했다. 사용자는 05를 그대로 둔 채 나머지 Ticket을 구현 전에 먼저 문서화하는 구성을 확인하고, 공통 `spec-and-tickets` 기준을 마지막으로 읽은 뒤 생성하도록 지시했다. 이에 따라 [Ticket 색인](../memory/tickets/index.md)과 06–17 본문을 만들었다. 제품 코드·제품 test는 변경하지 않았고 새 Ticket의 실행·검증·사용자 수락도 아직 없다.

06–17은 조사할 파일 목록이 아니라 실행 뒤 해소할 이해·수정 부담, 보존할 동작, 완료 근거와 선행 관계로 정의했다. 기존 분리 실험에서 transaction 비원자성과 여행별 미전송 조회는 결함으로 재현됐다. Trip update method, inactive child mutation, sync 부분 실패·retry, activation readiness와 server contract·ownership은 정적 코드 불일치 또는 동작·UX 확인 후보다. 이들은 리팩토링에서 정상 동작으로 고정하지 않으며 현재 별도 결함 Work는 아직 배정되지 않았다. 실제 차이가 확인되고 수정이 필요하면 Main이 별도 Work를 배치하거나 사용자가 해당 Ticket에 동작 수정 권한을 추가해야 하며, 그 전에는 각 본문이 표시한 결과를 완료로 닫을 수 없다.

새 Ticket 중 다른 구현에 의존하지 않는 06·10·15와 03의 수락 판단을 먼저 진행할 수 있다. 07은 09의 입력 의미에, 09·11·12는 14의 완료 상태에 선행하고 11·12는 13의 보존 조건에 선행한다. 05는 병행하는 별도 판단 트랙이며 다른 Ticket이 직렬화 구현을 흡수하지 않는다. 17은 03·05와 06–16의 실제 결과가 모인 뒤 전체 충분성을 판정한다.

## 남은 범위와 증명 경계

[기존 후보](../memory/analysis-items.md)와 [추가 조사](../memory/additional-research.md)의 폼 초기화·재진입, picker, 날짜 그룹, 저장 후 처리, 공통 데이터·경로·정리, 완료 상태, 설정과 서버 계약 후보가 남아 있다. 전체 후보의 Ticket 배치를 실행의 일괄 선행 조건으로 만들지는 않지만, 알려진 누락을 마지막 17에서 처음 배치하지 않도록 재구성안 단계부터 담당·제외·미배정·미확인을 드러낸다.

합산·정렬은 01에서 보존을 비교한 대상일 뿐 대표 통화의 제품 기준을 확정한 결과가 아니다. sync 재시도도 실제 요청 횟수 확인 전에는 재현된 결함으로 확정하지 않는다. 직접 걸리는 버그는 기대 동작, 현재 Ticket 결과와의 선행·차단 관계, 담당 범위를 구별한다.

현재 Workspace 전체에 대한 제품 Verify receipt와 사용자 acceptance는 없다. 제한된 검사, Main 보고, 공통 지침 반영을 제품 기능 전체의 검증이나 Work 완료로 사용하지 않는다.
