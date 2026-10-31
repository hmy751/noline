# Ticket 10 — 반복 개발·문서 관리 절차 통합

## 맡은 결과와 범위

같은 개발·문서 작업에 여러 절차, 기록 위치와 정책 원천을 제시하는 상황을 없앤다. runbooks·workflows·옛 commands·deprecated noline-work에 남은 유효한 수행 방법은 현재 실행·관리 체계에 받아들이고, 낡은 지시·중복 절차와 옛 호출 경로를 정리한다.

대상에는 반복 개발 runbook과 workflow, `check-docs`·`doc-save`·`doc-discuss`·`doc-refactor`·`generate-pr`, noline-work의 원본·bridge·발견 설정이 포함된다. 개발·context 갱신·설명·작업 논의·앱 실행에 관여하는 관련 skill의 실제 워크플로와 연결된 지침·관리 계약도 함께 대조한다.

제품 기준 자체는 Ticket 09가 정한 Owner를 사용한다. 공통 실행 기준·agent·host 연결의 전반적인 재배치는 Ticket 11이 맡지만, 이 Ticket에서 바꾸는 호출·발견 연결을 깨진 상태로 미루지는 않는다.

## 실행 맥락과 접근

[09–13 구성](../../../output/ticket-recomposition-09-13.md), [추가 정리 후보](../../../output/claude-cleanup-candidates.md)와 [Spec의 내용 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)을 적용한다.

006이 보존한 “필요한 역할의 보존과 현 위치·구조의 유지는 별개”라는 판단을 따른다. 유효한 기능이 필요하다는 이유만으로 `.claude`의 옛 위치나 양식을 유지하지 않는다. 현재 Owner와 수행 체계에 이미 충분한 기능은 복제하지 않고, 실제 공백만 보완한 뒤 옛 호출 경로를 현재 읽기에서 제외한다.

Project guidance는 제품별 적용·검증 방법과 필요한 실행 순서·실패 대응을 소유할 수 있다. `development`는 요청 해석, 맥락 선택, 구현·검토·검증과 결과 연결을 조율한다. 각 skill은 호출 조건뿐 아니라 실제 판단·수행·종료 책임을 기준으로 평가한다.

### 제품 개발 runbook과 guidance

- Entity·API·Form·날짜·통화·UI의 유효한 기준과 적용·검증 방법은 기존 Project 주제별 본문을 사용하고 실제로 부족한 내용만 보완한다.
- 동기화 조사는 대상 계정·여행·Entity·변경·관찰 시점을 맞추고 Local 행·queue·실제 요청을 대조하는 출발점을 데이터 수명 guidance에 둔다. 증상별 분기를 모든 경우의 강제 순서로 만들지 않는다.
- 작업명 탐색은 별도 runbook 색인이 아니라 기존 Project guidance 색인과 경로별 guide가 맡는다.
- 현재 소비자를 Project 본문으로 전환한 뒤 옛 제품 runbook과 내용 없는 workflow 호환 경로를 현재 읽기에서 제외한다.
- 이는 `.claude` 전체의 일괄 제거가 아니다. skill·설정처럼 실제 도구 연결이 있는 항목은 해당 범위에서 대체 연결과 함께 판단한다.

### 옛 문서 관리 명령

- `check-docs`의 유효한 기능은 변경으로 지속할 의미가 달라졌는지 `development`에서 판단하고 필요한 Project 반영을 `context-update`로 수행하는 흐름에 연결한다. 모든 정책 선행 읽기, 키워드 기반 위반 판정과 중요도·개수·주기로 문서 종류를 정하는 지시는 제외한다.
- `doc-save`의 제품 설명·선택 이유는 Project 관리 계약, 진행 중 Work의 판단·결과는 Work·Maintain 계약에 연결한다. 문서화 전 commit과 코드·문서 분리 commit 강제, CHANGELOG·Session 일괄 생성과 무조건적인 상호 링크는 제외한다.
- `doc-discuss`의 일반 개발 논의는 `development`, 명시적인 작업 정의 보강은 `work-discussion`, 이미 나눈 논의의 보존은 Work 기록 계약에 연결한다. 저장 요청을 새 인터뷰로 바꾸거나 시간·빈도로 기록 여부를 정하지 않는다.
- `doc-refactor`는 요청 범위의 문서·채택 계약·실제 코드·예제를 대조하고 권한에 따라 해당 Owner를 갱신하는 기능을 보존한다. 별도 정책 사전, 검색 패턴 기반 자동 판정·일괄 치환과 역사 문서의 현재화는 제외한다.
- 기존 skill과 관리 계약에서 기능적 공백이 확인되지 않으면 새 문서 관리 skill·runbook·정책 사전을 만들지 않는다.

### 현재 skill과 PR 작성

- `development`, `context-update`, `explain`, `work-discussion`, `start-app`은 현재 확인된 판단·수행·종료 책임을 기준으로 살핀다. 이번 정리를 이유로 같은 절차를 추가하거나 복제하지 않는다.
- `work-discussion`의 현재 실행에서는 Spec·Ticket과 관련 Workspace 문서 갱신을 Maintain에 맡긴다. 본문과 형성 자료는 이번 3번 수정 대상에서 제외하고 그대로 둔다.
- PR 제목·본문 작성법은 `development/references/pull-request.md`가 맡으며, PR 작성이나 갱신을 요청받은 경우에만 적용한다. 일반 개발·검증·설명 책임은 `development` 본문을 따른다.
- PR reference는 사용자가 지정한 범위나 실제 대상 브랜치를 확인하고, 같은 기준으로 커밋과 최종 diff를 대조하게 한다. 고정된 `main`이나 upstream을 자동으로 대상이라고 가정하지 않으며 원격 최신 상태를 확인하지 못한 한계를 밝힌다.
- 제목과 본문에는 최종 변경이 해결한 문제와 결과, 중요한 선택, 실제 검증과 미확인, 실제 호환성·데이터·배포 영향을 리뷰에 필요한 만큼 담는다. 커밋 수·변경 줄 수에 따른 고정 목차, 큰 템플릿과 키워드 기반 Migration Guide는 사용하지 않는다.
- 미커밋·미추적 변경을 자동으로 PR 범위에 넣거나 커밋하지 않는다. 제목·본문 작성 요청은 명시적인 추가 위임 없이 commit·push·원격 PR 생성이나 갱신 권한으로 확대하지 않는다.
- `.claude/commands/generate-pr.md`와 관련 안내·검사 연결은 제거한다. PR 기능은 단축 명령이 아니라 `development`의 조건부 reference로 유지한다.

### guide·발견 경로·검사

- 루트·Document Map·하네스 안내와 앱·패키지 guide는 Project guidance·skill의 실제 역할과 현재 Owner를 가리킨다.
- 없어진 `rules`·`guards`·runbook을 담당 문서처럼 지칭하는 표현과 약화된 transaction 원자성 표현을 바로잡는다.
- deprecated noline-work와 옛 Noline agent 정의는 현재 Owner와 소비 경로를 확인한 뒤 원본·bridge·발견 설정을 함께 제거했다. Work의 Maintain 역할과 현재 skill bridge는 별도 책임으로 유지한다.
- 검사와 live Workspace 선언은 실제 최종 배치에 맞추며 제거 전부터 제거 완료로 표시하지 않는다.
- Ticket 10에서 바꾼 호출과 발견 연결은 이 Ticket 안에서 확인한다.

## 완료 조건과 확인 방법

- Entity·API·Form 변경, 동기화 조사, 문서 갱신·논의와 PR 작성의 대표 요청에서 필요한 설명과 실제 담당 경로를 찾을 수 있다.
- 제품 의무, 유용한 조사 순서와 선택 가능한 탐색 단서의 강도가 원래 Owner와 다르게 바뀌지 않는다.
- 옛 명령 없이 문서 갱신 필요 판단, 논의 기록과 문서·코드 대조 요청을 현재 책임 배치에 따라 수행할 수 있다.
- `work-discussion`의 현재 Maintain 책임을 보존하고, 이번 범위에서 제외한 본문·형성 자료의 표현 차이를 현재 책임 변경으로 오해하지 않는다.
- PR 작성 요청에서 `development`의 조건부 reference를 찾아 실제 비교 범위·최종 변경·검증 한계를 정확히 설명하며, 요청을 commit·push·원격 PR 작업으로 확대하지 않는다.
- 제거한 `generate-pr`의 안내·검사 연결이 남지 않고, 명령 없이도 PR 작성법의 현재 Owner를 찾을 수 있다.
- 원본·bridge·발견 설정과 영향을 받는 guide를 함께 맞추고, 정적 링크 확인과 실제 수행 경로 확인을 구별한다.
- 무엇을 통합·보강·제외·유지했는지와 그 이유, 실행하지 않은 검증과 남은 범위를 설명한다.

## 현재 상태와 실제 결과

1번 제품 runbook·workflow 통합은 commit `528a5fb`에 포함됐다. 2번에서는 옛 문서 관리 명령 네 개를 제거하고 유효한 기능이 기존 development·context-update·Project·Work 관리 계약에 있는지 대조했다. 새 문서 관리 skill이나 정책 사전은 만들지 않았다.

3번에서는 사용자가 `work-discussion`을 그대로 두고 PR 작성법을 별도 reference로 두어 PR 요청 때만 따르도록 선택했다. `development/references/pull-request.md`가 실제 대상과 비교 기준, 커밋과 최종 diff, 문제·결과·선택·검증·영향과 외부 쓰기 권한의 경계를 맡는다. 후속 요청에 따라 `generate-pr`와 남은 commands 안내를 제거했다.

4번에서는 사용자의 명시적 요청에 따라 deprecated `noline-work` 원본·Codex skill bridge·발견 기대값을 제거했다. 이어 사용자가 지정한 `.claude/agents`의 Noline agent 세 정의와 대응 `.codex/agents` 정의도 제거했다. 제품 기준·위험 점검은 Project guidance, 구현·검토·검증의 배정은 development가 맡는다. Work의 `workspace_context_maintainer`와 현재 skill bridge는 별도 책임이므로 유지했다.

상세 결과와 근거는 [2번](../../../output/ticket-10-part-02-result.md), [3번](../../../output/ticket-10-part-03-result.md), [4번](../../../output/ticket-10-part-04-result.md)에서 찾는다. Main의 최종 검사 보고에서는 전체 Harness 실패 55건이 직전과 항목·순서까지 같았고, retired agent 보존본 6개의 SHA-256, 제거 경로 부재, diff와 검사 script 구문을 확인했다. 독립 개선 검토에서도 중요한 누락을 찾지 못했다고 보고했다.

별도 요구 검증도 4번 요구 충족, 기존 55건과 같은 실패 목록·순서, 추가 실패 없음으로 반환됐다. Ticket 10의 맡은 정리와 검증은 완료됐으며 다음은 Ticket 11이다. 실제 host의 모든 호출 효과, 전체 Harness 통과와 006 전체 사용자 수락은 입증되지 않았다.
