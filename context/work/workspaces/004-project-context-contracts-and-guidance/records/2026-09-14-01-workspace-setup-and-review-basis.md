# 004 생성과 Project 갱신 시험의 검토 근거

날짜: 2026-09-14. 사용자는 002에서 논의한 미합의 해결과 직전 지침 보완 작업을 다른 세션에서 이어가기 위해 004 생성을 요청했다. Main은 이 두 결과를 독립 Ticket으로 정의했다. 이 기록은 생성 과정의 최초 기록이며 완료된 제품 판단이나 지침 재시험 결과가 아니다.

## 이어받은 판단과 아직 확인하지 못한 것

다른 세션은 `2937c25` 이후 통화·날짜·리팩터링·API 본문을 작성하고 기존 architecture에 검사 정보를 통합했다. 사용자가 붙여넣은 결과 보고에는 client 18 tests, server 29 tests, build와 Harness 통과, 기존 typecheck 실패, PostgreSQL 통합 검사 미재실행이 있다. Main은 그 제품 테스트를 재실행하지 않았고 원실행의 전체 도구 기록도 확인하지 않았다.

Main은 실제 diff·본문·직접 관련 코드를 읽고 다음을 확인했다. 날짜 문서의 local date-only 강제 설명은 생성 form의 datetime 검증, create request의 min(1), local 원값 저장과 모순된다. Currency Owner 이동에서는 기존 문서의 Expense별 통화 변경 가능과 금액·통화 코드/기호 동시 표시가 새 본문에 명시적으로 이어지지 않았다. 기존 API runbook은 새 Project API 가이드로 연결되지 않았고 날짜 runbook은 여전히 일괄 datetime 설명에서 시작한다.

Current의 검사 기반·지원 범위 설명은 유지할 가치가 있지만 이번 pass 개수·EPERM·Docker 미실행 서술은 실행 기록 성격이 강하다고 Main이 평가했다. API 주제 구성과 리팩터링 원칙의 연결은 개선됐으며 모든 결과를 폐기할 판단은 하지 않았다. 이 평가는 개별 구성의 효용에 대한 판단이고 `current`를 없애라는 새 합의가 아니다.

Main은 지침에 관련 기준이 있다는 이유로 결과 보완을 먼저 제안했으나 철회했다. 사용자와 진행한 시험의 목적은 다른 세션이 지침을 통해 적절한 본문을 만드는지 확인하는 것이었다. 규칙의 존재와 실제 수행의 충분성을 혼동하지 않고, 실패가 지침·실행·확인의 어느 관계에서 생겼는지 먼저 판단하는 일을 004에 남겼다. 아직 원인을 확정하지 않았다.

## 현재 작업과 보호 범위

기준 HEAD는 `2937c252a735ecc6edbe1d3516659fcf459da970`이다. Project·`.claude` 초안, 002의 context 선택과 별도 Spec·Ticket·state 변경, `.pnpm-store/`는 기존 상태로 보호했다. 003은 관련 버그를 다루는 별도 Work이며 실제 Ticket 색인에 날짜·폼·서버 경계 작업이 있어, 코드 구현이 필요해지면 담당을 대조해야 한다.

이번 생성은 004 디렉터리에만 파일을 만든다. 002의 실패한 Maintain generation과 pending은 보존하고, 기본 index와 session binding을 바꾸거나 제품 Verify·commit을 실행하지 않는다. 생성자에게 보이는 대화의 핵심 의미를 successor current에 직접 옮겼고 필수 원문은 source에 선택했다. 이전 Workspace 전체의 Recover나 미처리 이벤트 재실행을 전제로 하지 않는다.

## 생성 검증

004를 명시한 Recover가 성공했고 Workspace identity·Verify 계약·basis/evidence 경로·초기 status를 현재 Harness의 loader로 검증했다. `node scripts/check-harness.mjs`와 `git diff --check`도 통과했다. 기존 변경 파일과 active index·지침을 포함한 24개 파일의 SHA-256을 생성 전후 대조해 동일함을 확인했다. Durable Verify는 실행하지 않았고 receipt는 null로 유지했다.

이전 대화를 받지 않은 별도 read-only 주체가 004의 Recover packet 전체만으로 재진입을 검토했다. 두 목표, 첫 행동, Project 초안의 한계, 날짜 사실 오류와 제품 선택의 구분, 직접 문서 수정과 지침 효과의 구분, 원문을 읽을 시점과 보호 범위를 복원했으며 재진입을 막는 누락·모순을 찾지 못했다고 보고했다. Main은 이를 bounded 재진입에 충분하다는 판단으로 채택했다.

별도 검토는 packet에 포함되지 않는 Ticket·source·관리 지침의 본문이나 파일 존재를 검증하지 않았다. 그 경로의 존재와 live schema는 Main의 별도 검사로 확인했다. 이 결과는 Workspace 생성·재진입 준비의 근거이며 제품 계약의 수락, 작성 지침 개선 효과나 새로운 세션의 실제 Maintain 연결을 입증하지 않는다.
