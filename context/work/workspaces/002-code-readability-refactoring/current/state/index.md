# 현재 상태와 다음 행동

[01번 Ticket](../memory/tickets/01-expense-totals.md)은 사용자가 구현 결과와 검증 한계를 확인하고 수락해 완료됐다. 통화별 소수 자릿수 규칙과 경비 합계의 첫 항목 판단을 정리한 제품 파일은 [output](../../output/index.md)에 연결한다.

01번의 Main 보고상 변경 전후 fixture 결과는 같았고 제한된 정적 검사는 통과했다. client의 기존 타입 오류 3건은 남았으며 정규 ESLint는 기존 Prettier 호환 오류로 완료되지 않았다. 실제 React Native 화면 렌더는 실행하지 않았다. 수락은 이 한계를 포함한 01번 범위에 한정된다.

[02번 Ticket](../memory/tickets/02-city-search.md)도 사용자가 구현 결과와 검증 한계를 확인하고 수락해 완료됐다. 요청과 응답 필터가 도시 코드 목록을 공유하고, 필수 필드·수도 예외·인구 기준 판단과 `City` 변환을 같은 API 파일의 이름 있는 책임으로 분리했다. 수정 전후 직접 fixture와 별도 verifier 비교에서 요청 인자, 선별 경계, 순서, 좌표 변환과 실패 반환이 같았다. 실제 GeoNames 연결과 전체 앱 화면은 확인하지 않았으며 영구 테스트 파일은 없다.

[04번 Ticket](../memory/tickets/04-expense-api.md)은 사용자가 재전파 catch와 로그 제거의 의미, 검증 한계를 확인하고 수락해 완료됐다. 다섯 remote API export에서 요청 검증·HTTP·응답 검증·반환 순서를 직접 보이게 했고, 수정 전후 동일한 8개 Jest 검사가 통과했다. fetcher를 mock한 검사이므로 실제 네트워크·Axios interceptor·React Native 화면은 확인하지 않았다. 제품 파일은 [output](../../output/index.md)에 연결한다.

제품 Verify receipt는 제공되지 않았다. 개별 보고와 사용자 수락을 전체 Work 완료나 제품 Verify 결과로 확대하지 않는다.

## 계속 적용할 기준과 남은 범위

코드 범위별 Ticket 안에서 여러 개선 관점을 바텀부터 적용하고 변경 전후 동작 보존과 개선 효과를 각각 확인한다. 실행 접근은 [작업 단위와 진행 방식](../memory/spec/05-constraints-design-assumptions.md), 전체 후보의 확인한 범위와 남은 범위 관리는 [품질·완료 판단](../memory/spec/04-quality-and-completion.md)을 따른다. 채택 원문과 정정 경위는 [합의 기록](../../records/2026-09-11-01-ticket-boundary-agreement.md)에 있다.

03번과 05번은 이번 수락 범위가 아니며 후속 순서는 확정되지 않았다. [기존 후보](../memory/analysis-items.md)와 [추가 조사·후속 범위](../memory/additional-research.md)도 남아 있다. 폼 초기화·재진입, picker, 날짜 그룹, 저장 후 처리, 공통 데이터·경로·정리, 완료 상태와 설정 등의 후속 분해를 이어가되 전체 후보 배치를 실행의 일괄 선행 조건으로 두지 않는다.

합산·정렬은 01번에서 보존을 비교한 대상이며 대표 통화의 제품 기준을 확정한 결과가 아니다. sync 재시도 설명과 조건의 충돌도 실제 요청 횟수 확인이 필요한 후보로 유지한다. 직접 걸리는 버그만 기대 동작·수정 범위·선행 관계를 연결한다.

과거 타입·린트 실패와 설치 상태의 한계는 [구성 기록](../../records/2026-09-10-01-workspace-setup.md)에 있다. 제한된 검사 결과를 전체 client lint 통과나 다른 package의 검증 결과로 확대하지 않는다.

## 원자료와 운영 경계

최초 방향은 [사용자 원문](../../source/user-direction.md), 분석의 보존본·원문 사본·해시는 [source 색인](../../source/index.md)과 [분석 목차](../../source/codebase-analysis/README.md)에서 찾는다. 원래 분석 경로에 의존하지 않는 보존 검증은 [분석 보존 검증 기록](../../records/2026-09-10-04-analysis-preservation-validation.md)의 범위를 따른다.

대화의 수동 전달·문서 반영·Evidence 사후 보존과 자동 hook 처리는 서로 다른 확인 범위다. 운영 상태 보고를 제품 검증이나 완료로 사용하지 않는다. 연결과 처리 귀속은 [session binding 계약](../../../../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 따른다.
