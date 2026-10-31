# 현재 상태와 다음 행동

**로컬 CLAUDE 정리를 Ticket 14로 분리하고 범위·적용 계획·확인 방법과 논의 근거를 기록했다. 지침 적용은 아직 시작하지 않았으며, 다음 적용은 14가 맡고 그 뒤 13의 전체 검증·수락 판단을 이어간다.**

## 현재 결과와 한계

- 중복 README 두 개를 제거하고 필요한 소수 기준만 루트에 통합했다. 실제 결과와 원문 식별자는 [README 통합 결과](../../output/ticket-13-readme-integration.md)에 있다.
- archive 124개 전부 이동 전과 Git 기준 commit의 바이트·해시가 같다. 기존 manifest·원래 경로·원문은 유지했고 host 폴더에 사본·symlink를 남기지 않았다.
- 현재 스킬·006 output·002 기록 색인·001 Verify 입력·checker는 root 경로로 전환했다. 과거 records와 receipt는 그대로 보존한다. [Archive 이동 결과](../../output/ticket-13-archive-result.md)에서 새 경로와 확인 근거를 찾는다.
- strict 검사는 65개 역사 링크로 실패한다. 앞선 64건에 001 frozen 기록의 옛 archive 링크 1건이 추가됐다. 이동 경로표로 같은 원문에 재접근할 수 있으며 검사 예외를 늘리지 않았다.
- 001 현행 선언의 Verify 실패는 새 receipt에 남겼고, 001·002·006 Recover는 모두 성공했다. freshness·재진입은 검사 pass나 사용자 수락이 아니다.
- 미커밋 초기 원판 2개의 부재와 002 제품 타입 오류는 계속 유효한 한계다.
- 두 README 정리는 `db1a4bb`, archive 이동·참조·검증 기록은 `19b5c7a`에 보존했다. 이번 Ticket 14와 논의 기록은 별도 기록 변경으로 분리했다. 기록 후 006 Recover에서 새 Ticket의 진입 연결을 확인했고, 변경 파일의 형식·링크 검사도 통과했다.

## 현재 작업과 다음 행동

[Ticket 14](../memory/tickets/14-local-project-guides-and-workflow-boundaries.md)는 루트·하위 가이드의 Noline 고유 설명·경로·명령을 유지하면서 development의 공통 수행과 Context의 사용·관리 계약을 중복하지 않도록 정리한다. 적용 계획과 완료 조건은 Ticket 본문에서 찾으며 초기안 교정 이유는 [논의 기록](../../records/2026-10-31-11-claude-guide-scope-and-development-boundary.md)에 남겼다.

이번 요청은 티켓·기록 정리다. 실제 CLAUDE·스킬·Context 기준 본문 변경은 하지 않았다. 다음 적용 요청에서는 14의 내용 판단·수정·독립 검토·검증을 수행한 뒤 [Ticket 13](../memory/tickets/13-integrated-verification-and-acceptance.md)에서 전체 결과와 한계를 대조한다. 006 전체 수락은 아직 남아 있다.

전역 지침 개편은 별도 작업이며 006 종료의 선행 조건이 아니다. Work·Maintain 개편과 work-discussion 유보 사항도 유지한다. 제품 오류·역사 원문 부재를 지침 정리로 해결했다고 보고하지 않고 당시 records/source·machine receipt를 소급 수정하지 않는다.
