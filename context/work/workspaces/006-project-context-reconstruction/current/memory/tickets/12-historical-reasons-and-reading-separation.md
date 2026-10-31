# Ticket 12 — 선택 이유 복원과 역사 자료 분리

## 맡은 결과와 범위

현재 판단에 필요한 이유가 sessions·audits·CHANGELOG·옛 하네스 결정에만 남아 있지 않게 한다. 현재 설명과 당시 원문의 권위를 구별하고, 역사 자료가 일반 읽기의 우회 정본이나 필수 경로가 되는 연결을 없앤다.

남은 harness decisions·sessions·audits·CHANGELOG와 root·harness의 역사 연결을 Ticket 09–11의 현재 Owner 및 기존 형성 자료와 대조한다. 09–11에서 이동하는 자료의 원문 보존과 해당 주제의 선택 이유는 각 Ticket이 맡는다. 이 Ticket은 그때까지 미처리된 역사 묶음과 현재 소비를 맡으며 앞선 Ticket의 내용 복원을 대신하는 마지막 수거 단계가 아니다.

## 실행 맥락과 접근

[09–13 구성](../../../output/ticket-recomposition-09-13.md)과 [Spec의 내용 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)을 적용한다. 제품 의미는 Project, 실행·관리 기준은 해당 책임 본문에 통합하고, 정확한 원문이 필요한 선택 이유는 가까운 형성 근거에 선별한다. 이미 충실히 보존한 내용을 다시 복제하지 않는다.

원문은 재검토·복구 가치와 중복 여부를 판단해 일반 읽기 밖의 archive로 격리하거나 불필요한 사본을 제거한다. 모든 archive를 옮기거나 과거 문장을 현재 정책으로 고쳐 쓰지 않는다. 이미 격리된 자료는 현재 읽기 의존·중복·보존 문제가 있는 범위에서만 추가 처리한다.

## 완료 조건과 확인 방법

- 현재 읽기에서 필요한 이유·비용·재검토 조건을 이해할 수 있고 옛 문서나 archive를 필수 단계로 열 필요가 없다.
- 보존한 원문은 이동 전후 내용과 출처를 확인할 수 있다.
- 현재 root·guide·형성 자료와 live consumer의 참조는 함께 전환하되 역사 Workspace를 일괄 최신화하지 않는다.
- 남긴 역사 자료와 제거한 사본의 역할·재접근 경로·판단 이유를 설명한다.
- 현재 판단과 역사 근거를 혼합하거나 archive를 경쟁 Owner로 유지하지 않는다.

## 현재 상태와 실제 결과

audits·decisions·sessions 28개의 현재 의미 통합과 원문 보존, 기존 세 폴더 제거는 앞서 완료돼 commit `b3e29bd`에 포함됐다. 이번 잔여 범위에서는 [Ticket 12 결과](../../../output/ticket-12-result.md)에 따라 CHANGELOG와 역사 링크를 추가로 정리했다.

- CHANGELOG 614줄의 제품·구조·하네스 의미를 현재 Owner와 대조했다. 필요한 의미·대안·비용이 이미 Project와 형성 자료에 있어 새 제품 본문은 만들지 않았고, 원문은 경로·기준 commit·SHA-256과 함께 같은 바이트로 보존한 뒤 현재 `.claude/CHANGELOG.md`와 일반 읽기 연결을 제거했다.
- baseline 63회, 고유 target 29개의 역사 링크를 [재접근 지도](../../../output/ticket-12-historical-access.md)와 기계용 상세 지도에 분류했다. default 001과 current-generation 002·006을 당시 live consumer로 확인했고, live 002 output의 삭제된 결정 stub 중복 연결 1건만 제거했다.
- strict checker의 역사 링크 실패는 63건에서 62건이 됐다. 나머지 역사 기록을 현재 정책으로 고치거나 검사 예외를 추가하지 않았다.
- target 29개 중 27개는 식별한 commit의 exact-path Git 객체를 확인했고, 문서 25개는 별도 보존판도 확인했다. `session-restoration.ts`와 `screens/read-query.ts` 두 미커밋 초기 원판은 현재 파일과 Git에서 확인되지 않으며 후속 구현을 원판 복구로 간주하지 않는다.
- 독립 대조는 기존 manifest에 포함된 보존 파일 47개, Git 객체 27개, archive 대상 25개의 재접근 근거와 원문 해시 보존을 확인했다.

현재 의미와 역사 원문을 구별하고 재접근 한계를 드러내는 범위는 완료됐다. 모든 역사 링크를 유효하게 만들거나 두 미커밋 원판을 복구한 것은 아니다. 보존 위치를 `.claude` 아래에 계속 둘 필요가 있는지는 Ticket 13의 남은 배치 정리에서 다시 판단한다.
