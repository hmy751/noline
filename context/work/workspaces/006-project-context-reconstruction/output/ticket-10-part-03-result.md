# Ticket 10 — 3번 PR 작성 상세 통합

사용자가 “그래 따로 문서를 두자  만약 PR 하는 경우 레퍼런스 따르게 정도로”라고 채택한 범위의 결과다. PR 작성 방법을 development 아래 별도 상세로 두고 해당 요청에서만 연결했다. work-discussion 본문·형성 자료는 이번 수정에서 제외했다.

## 실제 적용

- [PR 작성 상세](../../../../../.claude/skills/development/references/pull-request.md)는 비교 대상, 커밋·최종 diff, 미커밋 초안의 범위, 실제 검증과 영향을 연결해 제목·본문을 작성한다.
- [development](../../../../../.claude/skills/development/SKILL.md)에는 PR 제목·본문을 작성·갱신할 때 해당 상세를 따르는 한 문장을 추가했다. 일반 개발의 새 필수 단계는 만들지 않았다.
- 처음에는 generate-pr를 얇은 진입으로 축소했으나, 사용자의 후속 요청 “generate-pr 삭제해”에 따라 해당 명령과 남은 commands 안내를 삭제했다. 루트·Document Map·하네스·검사와 001 Verify 입력도 맞췄다. Claude와 Codex 모두 development에서 같은 상세를 읽는다.
- 기존 원본의 main 고정 비교, 커밋·줄 수별 분량, 통계·완료율 필수 목차, 키워드 기반 migration 요구는 제외했다. 실제 비교 범위와 리뷰 판단에 필요한 내용이라는 유효한 기능은 보존했다.
- 형성 맥락과 [선택 기록](../../../../../.claude/skills/development/_background/records/2026-10-31-pull-request-reference.md)에 이유·최소 발화·보존 원본을 연결했다. 001의 기존 Verify 입력 목록에 새 상세와 기록을 추가했다. 새로운 Verify 통과나 freshness를 선언하지 않았다.

## 확인과 한계

독립 개선 검토자는 원본·현재 상세·주변 진입점·관리 정책을 대조하고 필수 수정할 누락이나 책임 충돌을 발견하지 않았다. 비교 범위·최종 diff·작성 기능을 보존하면서 고정 템플릿 부담을 줄였으며, 추가 양식이나 예시를 넣을 필요는 낮다고 판단했다. Main은 현재 구성을 유지했다.

[검사 원본](ticket-10-part-03-check.txt)에서 전체 harness 실패 55건이 직전 2번 결과와 항목·순서까지 같음을 확인했다. 새 실패는 없지만 전체 검사가 통과한 것은 아니다. git diff --check, 001 evidence 경로 존재·중복 여부, Codex skill bridge의 동일 reference 연결을 확인했다. work-discussion 전체 파일의 SHA-256은 변경 전과 같았다.

별도 검증자는 작은 PR·비main 대상·되돌린 커밋·미커밋 초안·검증 실패·실제 migration 영향에 대한 본문 의미를 대조했다. 임시 Git 저장소에서 release 대상 비교, 되돌린 변경의 최종 diff 제외, 미커밋·미추적 변경 제외도 실제 확인했고 불충족을 발견하지 않았다. 이 검증 뒤 generate-pr 삭제 요청이 들어와 명령 진입 제거와 관련 안내·검사를 갱신했으며, 같은 검증자가 영향 범위를 후속 확인했다. commands 실제 삭제, 현재 진입·검사·001 입력 정합성, 보존 원본 SHA와 변경 링크를 대조하고 불충족을 발견하지 않았다. 최종 전체 검사도 기존 55건과 목록·순서가 같았다. 실제 Claude command 호출이나 원격 PR 작성·생성은 이번 범위에서 수행하지 않는다.

이 문서는 3번 적용 당시의 범위·확인을 보존한다. 후속 사용자 요청에 따른 dispatcher·agent 제거와 확인은 [4번 결과](ticket-10-part-04-result.md)를 따른다. 최종 다음 행동은 current/state가 소유한다.

이번 후속 사용자 입력에서는 Maintain hook이 `duplicate Maintain turn_id has different prompt content`로 실패했다는 통지가 있었다. 이 결과 문서의 저장과 Work current·Ticket의 자동 반영·freshness는 구별하며 자동 반영 성공을 주장하지 않는다.
