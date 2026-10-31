# Ticket 10의 2번 — 옛 문서 관리 명령 제거

2026-10-31. 사용자는 새로 넣지 않아도 될 내용은 제외하는 안을 검토한 뒤 “그래 그럼 이건 없애면 될것 같고 3번도 봐봐”라고 요청했다. 2번 제거는 적용했고 3번은 조사·제안만 한다. 이번에 새 문서 관리 스킬·런북·공통 절차를 추가하지 않았다.

## 기능을 새로 옮기지 않은 이유

옛 명령 네 개의 본문 전체와 실제 스킬·관리 계약을 대조했다. 문서 갱신 필요 판단, 논의·대안·선택 이유 보존, 현재 본문과 코드의 대조, 허용된 Owner 반영은 기존 체계에 있다.

- `check-docs`: development가 지속할 의미의 변화와 반영 필요를 판단하고 context-update 및 해당 관리 계약으로 잇는다. 정책 전수 선행 읽기, 키워드·중요도·개수와 주기로 문서 종류를 고르는 기준은 가져오지 않았다.
- `doc-save`: Project 의미·선택 이유는 그 본문·형성 자료·Decision에, Work의 판단·진행은 기존 Main·Maintain 계약에 따른다. 문서화 전 커밋 강제, 두 번 커밋, CHANGELOG·Session 자동 생성과 일괄 상호 링크는 제외했다.
- `doc-discuss`: 중요한 대안·선택 이유·미확인은 기존 Work 기록 기준으로 보존한다. 대화 시간·월별 빈도 기준과 별도 Session 양식은 제외했다. 기록 요청을 work-discussion의 새 인터뷰로 바꾸지 않는다.
- `doc-refactor`: 요청 범위의 문서·유효한 계약·실제 코드·예제를 대조하고 해당 관리 권한으로 수정한다. command 안의 독립 정책 사전, 정규식만으로 위반을 확정하는 판단과 역사 자료까지 포함하는 일괄 치환은 제외했다.

현재 수행·내용 기준은 [development](../../../../../.claude/skills/development/SKILL.md), [context-update](../../../../../.claude/skills/context-update/SKILL.md), [Project 관리](../../../../project/MAINTENANCE.md), [선택 이유의 기록](../../../../project/decisions/README.md), [Work 갱신 책임](../../spec-and-tickets/MAINTENANCE.md)과 [Work 작성 기준](../../DOCUMENT-WRITING.md)에서 찾는다. 문서의 존재만 확인한 것이 아니라 해당 본문에서 수행·권한·기록 위치와 확인 조건을 대조했다. 실제 host의 자동 선택·수행 효과까지 입증한 결과는 아니다.

## 실제 변경과 보존

`.claude/commands/check-docs.md`, `doc-save.md`, `doc-discuss.md`, `doc-refactor.md`를 현재 호출 위치에서 제거했다. 1번 커밋에 이미 보존한 원본 네 개의 바이트·SHA-256이 삭제 전 파일과 일치함을 확인해 재복제하지 않았다. 보존 위치는 [Ticket 10 archive](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-10/README.md)다.

루트·Document Map·harness와 commands README는 실제로 남은 `generate-pr`와 기존 문서 갱신 진입을 안내한다. 기존 스킬 색인은 이미 충분하므로 변경하지 않았다. `generate-pr`에서는 제거한 두 명령의 관련 명령 안내만 없앴고 PR 작성 본문은 개편하지 않았다. 검사에는 네 옛 호출 파일의 재등장을 확인하도록 추가했다.

006의 기존 조사 산출물 `claude-cleanup-candidates.md`에 있던 네 원문 링크는 같은 내용을 보존한 archive로 바꿨다. 이 문서는 명시적인 과거 조사 자료이며, 당시 권고·판단은 다시 쓰지 않았다. 그 밖의 역사 session/audit/결정/CHANGELOG의 언급은 현재 호출 지시로 취급하지 않았다.

## 확인과 남은 범위

독립 내용 검토자는 네 원문·현재 변경·006 품질 기준·관련 스킬과 관리 계약을 직접 대조해 중요한 결함을 찾지 못했다. 유효한 기능이 기존 본문에 남고 3번 PR 절차를 미리 적용하지 않았다고 판정했다. 이 검토는 실제 제품 실행이나 host의 명령 발견을 검증한 것이 아니다.

Main은 변경한 현재 안내의 상대 링크·앵커 124개, 네 원본의 바이트·해시, 삭제된 호출의 현재 참조 잔존을 확인했다. `git diff --check`와 검사 스크립트 구문 확인은 통과했다. 전체 Harness 검사는 적용 전과 같은 **55건으로 실패**했고 새로운 실패는 없다. 처음 드러난 006 조사 산출물의 원문 링크 네 개는 보존본으로 연결해 해결했다. [최종 검사 원문](ticket-10-part-02-check.txt)에 실제 결과를 남긴다.

001의 Verify 선언은 삭제한 네 명령을 evidence로 선택하지 않아 수정하지 않았다. 기존 실패·역사 자료 정리와 Ticket 10의 3·4번은 남아 있다. 3번의 스킬·PR 처리는 적용하지 않았고, 이번 변경은 아직 커밋하지 않았다.

이 문서는 2번 적용 당시의 범위·확인을 보존한다. 이후 PR 상세 통합과 명령 삭제, 옛 dispatcher·agent 제거는 [3번 결과](ticket-10-part-03-result.md)와 [4번 결과](ticket-10-part-04-result.md)를 따른다. 최종 다음 행동은 current/state가 소유한다.
