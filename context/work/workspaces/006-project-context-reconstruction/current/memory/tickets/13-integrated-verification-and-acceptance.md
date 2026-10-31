# Ticket 13 — 전체 검증과 종료 판단

## 맡은 결과와 범위

Ticket 01–12의 결과가 006 전체 목표를 충족하는지 대조한다. 남은 `.claude` 항목마다 왜 필요한지, 어떤 내용을 어디로 통합·보강·제외했는지 설명할 수 있는 상태를 만들고, 개별 검사 통과와 전체 목표의 사용자 수락을 구별한다.

첫 후보 지도, 추가 정리 조사와 [09–13 구성](../../../output/ticket-recomposition-09-13.md)의 대상 및 실제 결과를 대조한다. root·Project·경로별 guide·직접 명령·skill·agent·hook에서 출발한 직접·간접 읽기와 실행 연결을 확인한다. 제품 버그 수정, 신규 기능과 운영 배포 수정은 범위 밖이다.

## 실행 맥락과 접근

Ticket 09–12의 자체 검증이 끝난 뒤 마지막에 실행한다. 새 내용을 이때 처음 조사·통합하는 것을 기본 계획으로 삼지 않는다. 알려진 항목의 담당 누락이나 현재 경로 실패가 발견되면 해당 Ticket을 다시 열어 해결한다.

남은 문서나 archive에 필요한 역할이 있더라도 그것만으로 `.claude`의 기존 파일·계층을 유지하지 않는다. Project·Work·공통 스킬·루트 가이드가 이미 맡는 내용과 실제 host 연결을 대조해 책임과 배치를 함께 정리한다.

기존 checker가 선택하지 않은 파일도 실제 진입에서 도달하면 검사 범위에 포함한다. default와 현재 explicit-bound Workspace를 확인해 필요한 Recover·Verify 선언을 맞추고 유효한 원문·역사 근거를 보존한다. 기존 역사 참조와 현재 경로 실패를 구별하며, green을 만들기 위해 검사기를 근거 없이 완화하거나 역사 원문 전체를 현재화하지 않는다.

## 완료 조건과 확인 방법

- 현재 내용의 정확성·충분성, 재구성의 이득과 비용, 옛 읽기·발견 경로 제거, 필요한 host 연결 동작을 각각 확인한다.
- 모든 후보와 남은 파일에 통합·보강·제외·잔존 판단, 실제 Owner와 근거가 있다.
- 대표 개발·문서 작업에서 현재 진입 경로만으로 필요한 의미와 수행 방법을 찾을 수 있다.
- 직접 링크, 우회·간접 참조, discovery·bridge와 실제 host 호출 결과를 입증 범위별로 구별한다.
- 확인되지 않은 핵심 범위나 현재 경로 실패를 단순 후속 목록으로 넘기고 완료하지 않는다.
- 현재에 영향이 없는 역사 참조와 범위 밖 제품 공백은 영향·근거·후속을 구별해 남긴다.
- 실제 결과와 확인 한계를 사용자에게 제시하고 006 전체 수락을 별도로 요청한다. 검사나 Main 판단으로 사용자 수락을 대신하지 않는다.

## 현재 상태와 실제 결과

[전체 대조 결과](../../../output/ticket-13-result.md)에서 최초 후보와 현재 Owner를 대조하고 독립 검토·검증의 발견을 반영했다.

- client/server guide에 남은 옛 rule·guard 연결과 약화된 transaction 문구, 제거된 sessions 기록 관행을 현재 Project·Work Owner에 맞췄다.
- Project Decision의 archive 읽기 연결을 제거했다. 필요한 대안·이유·비용·인용은 현재 본문에 유지했으며 Project에서 archive로 가는 Markdown 연결은 0으로 확인했다.
- 당시 default 001과 current-generation 002·006의 Verify 입력을 regular 파일로 맞췄다. 002의 삭제된 폼 입력 6개를 현재 책임 파일 9개로 전환했으며 claim과 argv는 바꾸지 않았다.
- 001 구조 검사는 역사 링크 62건으로 실패했고, 002 client noEmit 타입 검사는 좌표·Mapbox·UI package rootDir 관련 제품 오류로 실패했다. 두 실패는 새 append-only receipt와 `verification_failed` 상태로 남겼다.
- 그 뒤 001·002·006 Recover는 모두 exit 0이었다. 001·002의 receipt freshness가 fresh라는 사실은 입력 일치이며 검사 통과가 아니다.

이 대조 뒤 남은 `.claude/README.md`, `.claude/harness/README.md`, `.claude/_archive`의 역할과 기존 배치 필요성을 다시 검토했다. 두 README의 탐색·Owner·보존 설명은 루트 가이드와 Context에 상당 부분 중복되고, 필요한 host 연결은 settings·hook·skills symlink로 한정할 수 있다는 판단이다. 사용자는 이 판단을 기록하고 변경을 차례로 진행하라고 했다.

다음 실행은 현재 Ticket 12·13 결과를 중간 커밋으로 보존한 뒤, 두 README의 유효한 공통 내용을 기존 Owner에 통합하고 제거 가능성을 확인하며 archive를 root 보존 경계로 옮기는 것이다. 그다음 프로젝트 root·하위 `CLAUDE.md` 계층을 정리한다. 전역 `CLAUDE.md` 개편은 여러 Project에 영향을 주므로 별도 작업으로 구분하며 006 종료의 선행 조건으로 삼지 않는다.

006 전체 사용자 수락은 아직 받지 않았다. 로컬 배치 정리와 프로젝트 `CLAUDE.md` 단계의 결과·검증 한계를 제시한 뒤 별도로 판단받는다.
