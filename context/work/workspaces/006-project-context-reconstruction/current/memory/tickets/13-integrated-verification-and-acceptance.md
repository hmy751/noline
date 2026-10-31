# Ticket 13 — 전체 검증과 종료 판단

## 맡은 결과와 범위

Ticket 01–12와 후속 Ticket 14의 결과가 006 전체 목표를 충족하는지 대조한다. 남은 `.claude` 항목마다 왜 필요한지, 어떤 내용을 어디로 통합·보강·제외했는지 설명할 수 있는 상태를 만들고, 개별 검사 통과와 전체 목표의 사용자 수락을 구별한다.

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

Main 보고에 따르면 Ticket 12·13 결과, 검증 실패와 한계, 배치 재검토 이유 및 다음 순서는 commit `7e5dd42`에 보존됐다. 관련 없는 Personal 변경과 `.pnpm-store`는 이 커밋에서 제외됐다.

사용자가 내용을 남기기 전에 필요성과 더 나은 배치를 먼저 판단하라고 요청한 뒤, 두 README의 내용을 넓게 이관한다는 앞선 접근을 다시 검토했다. Main은 다음과 같이 판단했다.

- `.claude/README.md`의 제품 탐색·Context 사용·스킬 선택·경로별 작업 안내는 기존 Project·USAGE·스킬 색인·경로별 가이드와 중복되므로 별도 이관 없이 제거하는 편이 낫다.
- `.claude/harness/README.md`의 레이어·Owner, bridge, 스킬 연결, Maintain 상세도 기존 루트·Context·Project·스킬 색인·Work 계약이 이미 맡는다.
- 제거 뒤 실제로 빠지는 공통 기준만 기존 Owner에 짧게 보완한다. 실제 보완한 내용은 프로젝트 commit 메시지 기준, 하네스 구조·연결 변경 뒤 `harness:check`를 실행할 조건, 하위 가이드가 자기 경로의 책임만 맡는 경계다.
- 반복·비용이 큰 실패만 하네스화한다는 조건, 반복 사용 뒤에만 실행자를 추가한다는 조건, 모든 agent를 report-only로 일반화하는 표현, 막연한 최종 bridge drift 점검은 현재 기준으로 그대로 유지하지 않는다.
- 새 관리 문서는 만들지 않으며, 두 README를 통째로 축약하거나 복제하지 않는다. 제거할 때 직접 링크, Verify 입력과 검사기가 요구하는 경로를 함께 전환한다.

사용자는 이 판단안을 채택했고 Main은 적용을 완료했다. [두 README 통합 결과](../../../output/ticket-13-readme-integration.md)에서 실제 반영·제외와 원문 재접근을 확인한다. 두 파일은 제거됐고 root·Context·Project의 직접 연결, 001 output·Verify 입력, 006 source 색인과 검사기를 맞췄다. 원문은 삭제 직전 commit의 Git blob·SHA-256으로 재접근할 수 있다. 독립 개선 검토는 의미 누락이나 과도한 이관을 찾지 못했다.

두 README 정리 당시 strict 검사는 역사 링크 64건으로 실패했다. 앞선 62건에 004 당시 current와 006 최초 조사 지도에 남은 옛 Document Map 링크 각 1건이 더해졌다. 001의 실제 Verify 실패는 새 receipt로 남겼고, 이후 001·002·006 Recover는 모두 성공했다. 실패를 pass나 전체 수락으로 보고하지 않는다. 별도 검증에서 발견한 current의 미적용 표시는 이번 갱신으로 실제 결과에 맞췄다.

두 README 적용 결과와 기록은 사용자 요청에 따라 commit `db1a4bb`에 보존했다. 이어 archive 124개 파일을 바이트·원래 경로·기존 manifest를 유지해 root `_archive`로 이동했다. [Archive 이동 결과](../../../output/ticket-13-archive-result.md)와 경로표에서 실제 이동과 현재·역사 참조를 구별한다. 현재 스킬·output·검증 선언·checker는 root 위치를 사용하며 날짜별 Work records와 기존 receipt는 수정하지 않았다.

archive 이동 직후 strict 실패는 65건이었다. 앞선 64건에 001 날짜별 기록의 옛 archive 링크 1건이 추가됐다. 001의 전환된 regular 입력으로 실제 Verify 실패 receipt를 만들었고 live 소비자 001·002·006 Recover는 모두 성공했다. 원문 해시와 이동 경로표로 재접근하며 검사 예외를 늘리지 않는다. archive 이동·참조 전환·검증 결과와 Work 기록은 사용자 요청에 따라 commit `19b5c7a`에 보존됐다. 관련 없는 Personal 변경과 `.pnpm-store`는 이 커밋에서 제외됐다.

로컬 CLAUDE 정리는 [Ticket 14](14-local-project-guides-and-workflow-boundaries.md)로 분리했다. 루트·하위 가이드의 프로젝트 고유 안내를 유지하고 development·Context와의 중복·충돌 및 오래된 사실을 정리하는 적용·확인은 14가 맡는다. 이 Ticket은 그 결과를 포함해 전체 목표와 읽기·도구 연결을 대조한다. 기존 README·archive 정리 결과는 그대로 유효하다.

초기 루트 구성안의 과도한 수행 책임과 development 재검토에 따른 교정 이유는 [논의 기록](../../../records/2026-10-31-11-claude-guide-scope-and-development-boundary.md)에 보존했다. 이후 로컬 지침의 적용·독립 검토·별도 검증까지 완료했다. [Ticket 14 결과](../../../output/ticket-14-local-guides-result.md)에서 실제 문안·책임 경계 보완과 근거를 확인한다.

14의 최신 문안을 포함한 최종 통합 대조도 완료했다. 독립 검증은 현재 73개 문서의 링크·옛 Owner 의존, archive 124개의 크기·해시, 14 최신 8파일 해시와 Ticket 11 실제 host 근거의 재사용 범위를 확인했고 새 필수 누락을 찾지 못했다. 오래된 미실행 표현이 남은 최종 output을 현재 상태로 정리했다.

Main의 최신 001 Verify는 fail·exit 1·64건의 새 receipt를 남겼고, 001·002·006 Recover는 모두 성공했다. [최신 실행 근거](../../../output/ticket-13-final-verification.json)와 [독립 판정](../../../output/ticket-13-final-independent-verification.md)을 최종 대조에 연결했다. 역사 링크·제품 타입 오류·두 원판 부재를 해결 또는 전체 pass로 바꾸지 않았다.

사용자가 “다된건지 확인하고 됐으면 기록 보완하고 마무리 하자”라고 요청해, 확인된 006 문서 정리 범위는 실행 완료로 정리한다. 별도 포괄 수락이나 제품·host 미확인 범위의 위험 수용을 추정하지 않는다. 전역 지침 개편, Work·Maintain과 work-discussion 유보 사항은 별도 작업이다. 실제 다음 실행을 이 Ticket에 남겨 둔 상태는 아니며 새로운 요구·결함이 확인되면 해당 범위에서 재개한다.
