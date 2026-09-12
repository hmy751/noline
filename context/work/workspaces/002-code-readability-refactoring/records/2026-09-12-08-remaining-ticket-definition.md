# 남은 Ticket 06–17 구성 확정

## 요청과 결정

사용자는 Workspace 002의 현재 Spec을 달성하도록 남은 Ticket 구성을 다시 검토하되, 구현 전 별도 판단 중인 05의 문서와 제품 구현은 그대로 두고 기존 작업 결과와 수락 이력을 보존하라고 요청했다. 첫 단계에서는 재구성안과 이유만 확인했으며, 이어 06–17을 실제 구현 전에 모두 Ticket 문서로 만들어야 한다는 진행 순서를 확인했다. 마지막으로 공통 `spec-and-tickets` 운영 기준을 읽고 Ticket 문서를 생성하도록 명시적으로 지시했다.

이번 반영은 06–17의 정의, Ticket 색인과 전체 state 연결에 한정한다. 01·02·04의 사용자 수락, 03의 구현 결과와 미수락 상태, 05의 별도 판단 상태를 변경하지 않는다. 제품 코드·제품 test·machine status·output은 이번 Ticket 생성 결과가 아니다.

## 적용한 운영 기준과 근거

[공통 운영 기준](../../spec-and-tickets/README.md), [실행 기준](../../spec-and-tickets/EXECUTION-CRITERIA.md), [Ticket 작성](../../spec-and-tickets/TICKET.md), [갱신 기준](../../spec-and-tickets/MAINTENANCE.md), [문서 작성 기준](../../DOCUMENT-WRITING.md)을 직접 확인했다. 새 Ticket은 조사할 파일이나 수행 활동이 아니라 다음 네 관계를 담았다.

- 실행 뒤 해소할 이해·수정 부담과 보존할 동작
- 필요한 코드·Spec·앞선 결과와 제외 범위
- 동작 보존과 개선 효과를 각각 확인할 근거
- 실제 결함이 분리될 때 선행 결과, 해결 전 완료할 수 없는 부분과 Main의 배치 책임

기존 [후보 전체](../current/memory/analysis-items.md), [추가 조사](../current/memory/additional-research.md), [fresh-session 재구성 검토](2026-09-12-06-fresh-session-ticket-recomposition-review.md)와 현재 코드를 대조했다. 운영 계약, Workspace 이력·Spec, 현재 제품 코드는 서로 다른 read-only subagent가 확인했으며 Main이 결과와 실제 문서 내용을 종합했다. 이 독립 확인은 제품 검증이나 Ticket 완료를 뜻하지 않는다.

## 확정한 구성과 관계

06–17의 책임은 [Ticket 색인](../current/memory/tickets/index.md)이 안내한다. 큰 흐름은 client API, 일정·경비 form, 일정 저장 뒤 route, 날짜 계산, local mutation·sync·cleanup·activation, 경비 표시 Owner, Schedule을 제외한 server Data Entity route와 최종 Spec coverage다.

실행 관계는 다음과 같이 정했다.

- 03 수락 판단과 05 별도 판단은 새 Ticket 실행과 병행한다.
- 06·10·15는 다른 새 Ticket 구현에 선행 의존하지 않는다.
- 07은 09의 입력·좌표 의미에, 09·11·12는 14의 완료 상태에 선행한다.
- 11·12는 13의 미전송 데이터 보존 조건에 선행한다.
- 06과 16은 Trip update의 client/server contract 결정을 공유한다.
- 17은 03·05와 06–16의 실제 결과가 모인 뒤 수행하며 알려진 누락을 처음 배치하는 Ticket으로 사용하지 않는다.

## 결함 경계와 미배정 범위

기존 분리 실험에서는 local write와 queue insert의 transaction 비원자성, 여행별 미전송 조회가 `PENDING`만 보는 문제가 결함으로 재현됐다고 Spec에 보존돼 있다. 현재 코드 독립 확인에서는 Trip update method, inactive child mutation의 local 선행 조회, sync 부분 실패 표시와 retry 조건, activation ready·terminal UI, server schema·route·ownership의 정적 불일치가 Ticket 결과에 걸린다고 보고됐다. 이 후자는 실제 요청·상태·UX fixture로 확인하기 전에는 재현 결함으로 승격하지 않는다.

이 문제를 리팩토링의 정상 동작으로 고정하거나 표현 정리에 숨기지 않았다. 현재 별도 결함 Work는 배정되지 않았으며 Ticket 색인에 미배정 차단·확인 항목으로 표시했다. Spec 밖의 동작 수정이 필요하다고 확인되면 Main이 별도 결함 Work를 배치하거나 사용자가 해당 Ticket에 수정 권한을 추가해야 하며, 그 전에는 관련 Ticket 본문이 표시한 결과를 완료로 닫을 수 없다.

Auth/OAuth·Places server route 전반, `RadioGroup`의 `as any`, 사용처가 확인되지 않은 일부 export처럼 현재 근거가 낮거나 별도 외부 계약인 후보는 구현 Ticket에 억지로 합치지 않고 Ticket 색인에 미배정으로 표시했다. 17은 이를 유지·새 Ticket·별도 Work·미확인 중 하나로 판정하며, 필요한 변경으로 확인되면 전체 완료 전에 Main이 담당 실행을 배치한다.

## 반영과 증명 한계

06–17 본문과 Ticket 색인, 전체 state를 갱신했다. 05 본문과 제품 구현, 01–04 본문, Spec, source, output, `status.json`은 변경하지 않았다. `git diff --check`, 하네스 링크 검사와 새 Ticket 네 기본 구성 검사는 통과했다. 독립 verifier는 blocking 없음과 함께 결함 근거 강도·미배정 책임·후보 연결의 보완을 요구했고 현재 문서에 반영했다. 어떤 제품 구현·동작 보존 test·server 검증·제품 Verify·사용자 acceptance도 이번 문서 생성으로 새로 생기지 않는다.
