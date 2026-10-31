# `.claude` 추가 정리 후보

2026-10-31, Ticket 08 이관 뒤 남은 자료를 읽기 전용으로 조사했다. 역할·실제 참조·checker·bridge와 현재 관리 계약을 대조했다. 폴더가 오래됐거나 참조 수가 적다는 이유로 미사용·삭제 가능이라고 단정하지 않는다. 실제 최근 Claude command 호출과 저장소 밖 링크는 확인하지 않았다.

## 이후 정정과 현재 사용 범위

이 문서는 추가 조사 당시의 후보와 근거를 보존한다. 아래의 **‘현재 유지하는 편이 맞는 영역’ 분류와 두 묶음의 후속 제안은 현재 실행안이 아니다.** 사용자는 역할이 필요하다는 사실과 `.claude`의 위치·구조를 유지하는 판단을 구별하도록 정정했다. 현재 사용·참조는 대체할 연결을 찾는 근거이며 현 배치를 유지할 충분한 이유가 아니다.

구체적인 충돌·소비자 관찰은 재사용하되, 통합·보강·폐기·남길 연결은 [09–13 재구성](ticket-recomposition-09-13.md)과 최신 Spec/Ticket을 따른다. 이 조사 결과의 과거 권고와 뒤의 교정을 한 결론처럼 합치지 않는다.

## 우선 처리할 후보

| 후보 | 정리할 이유 | 권장 처리와 함께 볼 연결 |
| --- | --- | --- |
| 문서 관리 command 네 개 | check-docs·doc-save·doc-discuss·doc-refactor의 본문이 현재 Project/Work와 다른 정책·저장·실행 순서를 지시한다. README의 ‘reference’ 표시만으로 직접 호출 위험이 사라지지 않는다. | 먼저 원문을 보존하고 호출 경로에서 격리하는 안을 권장한다. commands 색인·root·Document Map·harness 안내와 직접 호출의 대체 경로를 함께 정리한다. |
| 사용 중단된 noline-work | deprecated인데 SKILL.md와 Codex symlink가 발견 가능한 위치에 남고 checker가 존재까지 강제한다. | 원본·bridge·expectedSkills·관련 색인과 보존 설명을 한 단위로 전환한다. 단순 삭제는 검사 실패를 만든다. |
| harness-observer의 skill 평가 기준 | ‘skills stay dispatchers’가 현재 스킬의 호출 조건·판단·수행 계약 소유와 어긋난다. | Claude/Codex 두 정의를 함께 검토해 제품 정책·지속 Context의 중복 소유 금지는 유지하고 모든 스킬을 dispatcher로 제한하는 기준을 교정한다. agent 자체 제거는 필요하지 않다. |
| workflows 호환 지도 | 현재 실행 본문이 없고 runbooks로 다시 보내는 중간 경로다. runbooks가 이 지도를 역으로 안내한다. | 호환 필요가 없다면 원문 격리와 runbooks의 역방향 안내 제거를 함께 수행한다. 저장소 밖 링크 사용은 미확인이다. |
| generate-pr command | PR 생성 목적은 여전히 유효할 수 있지만 고정 분량·서식이 작업에 비해 무겁다. | 앞의 네 문서 command와 자동으로 묶어 폐기하지 않는다. 실제 사용할 가치와 현재 작성 기준을 비교해 간소화 또는 격리한다. |

## 무엇이 현재 기준과 충돌하는가

[doc-refactor](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-10/commands/doc-refactor.md.txt)는 `CURRENT_POLICIES`와 `POLICY_HISTORY`를 command 안에서 수정하도록 지시한다. 제품 정책의 별도 정본이 생기는 구조다. ‘Router를 통한 모든 데이터 접근’은 외부 Service와 datasource 책임까지 구별하지 않고, `.claude/**/*.md` 전체의 자동 치환 예시는 archive·역사 근거를 현재 지침처럼 바꿀 위험이 있다.

[check-docs](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-10/commands/check-docs.md.txt)는 모든 정책을 먼저 읽도록 하며 모든 시간 데이터를 ISO 8601로 설명한다. 현재는 질문에 맞는 본문을 선택하고 경비의 달력 날짜와 시점을 구별한다. [doc-save](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-10/commands/doc-save.md.txt)는 ‘모든 문서화는 Git commit부터’를 강제하며 제품 결정까지 `.claude/decisions/`에 저장하도록 한다. [doc-discuss](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-10/commands/doc-discuss.md.txt)는 논의를 `.claude/sessions/`로 저장하는 독자 흐름을 제시한다. 단순 링크 교체보다 실행 역할을 계속 유지할지 판단하는 일이 먼저다.

[observer](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-10/retired-agents/claude/agents/noline-harness-observer.md.txt)의 dispatcher 기준은 [현재 스킬 관리 정책](../../../../../.claude/skills/SKILLS-CONTENT-POLICY.md)과 [development](../../../../../.claude/skills/development/SKILL.md)의 독립 실행 본문 역할을 충분히 반영하지 못한다. ‘실행 기준을 스킬에 둔다’와 ‘제품 정책을 스킬에 복제한다’를 구별하는 쪽이 적절하다. 이는 이번 조사자의 제안이며 아직 agent 기준을 수정하지 않았다.

## 08의 누락으로 바로잡은 경로

추가 조사에서 `runbooks → workflows/README → 삭제된 .claude/context/README` 연결을 발견했다. 직전 검증은 현재 본문과 대표 질문을 확인했으나 checker의 입력에 workflows가 없고 이 간접 경로를 놓쳤다. 이전의 ‘현재 연결 없음’을 모든 문서의 재귀 전수 검증으로 확대할 수 없다.

옛 색인을 향하던 링크 한 곳은 Project 입구로 바로잡아 08 작업 커밋에 포함했다. workflows 파일 자체를 제거하거나 command·skill 역할을 바꾸지는 않았다. 이 발견 때문에 workflows의 격리는 단순 폴더 정리보다 읽기 경로 단순화 후보로 보는 것이 적절하다.

## 현재 유지하는 편이 맞는 영역

- rules·guards·runbooks: root·앱 가이드와 개발·검토 역할이 실제 소비한다. Project의 깊은 의미와 compact 적용 규칙·작업 진입의 책임 차이가 유효하다.
- 현재 skills·agents·브릿지: 실행 조건·수행·읽기 전용 검토를 맡는다. 개별 낡은 기준을 고치는 것과 실행층 전체 폐기를 구별한다.
- hooks·settings: Claude 설정에서 Maintain wrapper로 연결하며 optional evidence-collector가 있으면 공통 dispatch로 넘긴다. 제품 문서 이관으로 불필요해진 파일이 아니다. 개인 settings.local.json은 읽지 않았다.
- sessions·audits·CHANGELOG·하네스 decisions: 과거 설계·검증·변경 이유의 근거다. history라는 역할을 분명히 하되 오래됐다는 이유로 내용 재작성·삭제하지 않는다. root/harness와 기록 간 실제 참조가 남는다.
- 이미 격리된 archive: 현재 읽기에서 빠져 있으므로 추가 삭제의 이득이 작다. 보존 원문을 다시 현재 입력으로 끌어오는 연결이 있는지를 우선 확인한다.

## 후속 작업 구성 제안

첫 묶음은 **옛 문서 관리 command와 deprecated noline-work의 호출·발견 경로 정리**가 적합하다. 사용자 호출 기능 중 계속 필요한 것을 남길지 정하고 원문·대체 실행·bridge·검사 선언을 함께 전환한다. 다음 묶음은 **observer 기준과 workflows 호환 경로 정리**다. 나머지 현재 실행층은 유지하고 역사 자료의 재배치는 별도 목적이 있을 때만 수행한다.

현재 checker는 commands·workflows·sessions·CHANGELOG 전체를 검사하지 않는다. 통과 여부만으로 이 영역의 정책·권한·링크 적합성을 판단하지 말고 직접 호출과 현재 진입에서 도달하는 경로를 별도 확인해야 한다. 반대로 모든 역사 원문에 현재 링크 규칙을 적용해 검사만 통과시키는 것은 원문 보존과 충돌한다.

이 결과는 추가 정리의 조사·권고다. 네 command·noline-work·observer·workflows의 제거·격리는 아직 실행하지 않았다. 전체 Harness의 보존 참조 47건과 제품 보호 공백은 [08 결과](ticket-08-result.md)에 남는다.
