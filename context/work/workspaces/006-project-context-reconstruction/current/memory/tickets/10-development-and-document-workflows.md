# Ticket 10 — 반복 개발·문서 관리 절차 통합

## 맡은 결과와 범위

같은 개발·문서 작업에 여러 절차, 기록 위치와 정책 원천을 제시하는 상황을 없앤다. runbooks·workflows·옛 commands·deprecated noline-work에 남은 유효한 수행 방법은 현재 실행·관리 체계에 받아들이고, 낡은 지시·중복 절차와 옛 호출 경로를 정리한다.

대상에는 반복 개발 runbook과 workflow, `check-docs`·`doc-save`·`doc-discuss`·`doc-refactor`·`generate-pr`, noline-work의 원본·bridge·발견 설정이 포함된다. 개발·context 갱신·설명·작업 논의·앱 실행에 관여하는 관련 skill의 워크플로와 그 skill이 선택하는 지침·관리 계약도 함께 대조한다.

제품 기준 자체는 Ticket 09가 정한 Owner를 사용한다. 공통 실행 기준·agent·host 연결의 전반적인 재배치는 Ticket 11이 맡지만, 이 Ticket에서 바꾸는 호출·발견 연결을 깨진 상태로 미루지는 않는다.

## 실행 맥락과 접근

[09–13 구성](../../../output/ticket-recomposition-09-13.md), [추가 정리 후보](../../../output/claude-cleanup-candidates.md)와 [Spec의 내용 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)을 적용한다.

006이 보존한 “필요한 역할의 보존과 현 위치·구조의 유지는 별개”라는 판단을 따른다. 작업명 탐색이나 유효한 조사 단서가 필요하다는 이유만으로 `.claude`의 옛 위치를 현재 진입점으로 유지하지 않는다. 유효한 의미와 소비자 연결을 현재 Owner에 충분히 옮긴 뒤 옛 제품 문서를 현재 읽기에서 제외한다.

Project guidance는 제품별 적용·검증 방법과 필요한 실행 순서·실패 대응을 소유할 수 있다. `development`는 요청 해석, 맥락 선택, 구현·검토·검증과 결과 연결을 조율한다. skill을 단순 분배기로 가정하거나 Project guidance와 떼어 평가하지 않는다.

### 제품 개발 runbook과 guidance

- Entity·API·Form·날짜·통화·UI의 유효한 기준과 적용·검증 방법은 기존 Project 주제별 본문을 사용하고 실제로 부족한 내용만 보완한다.
- 동기화 조사는 대상 계정·여행·Entity·변경·관찰 시점을 맞추고 Local 행·queue·실제 요청을 대조하는 출발점을 데이터 수명 guidance에 둔다. 증상별 분기를 모든 경우의 강제 순서로 만들지 않는다.
- 작업명 탐색은 별도 runbook 색인이 아니라 기존 Project guidance 색인과 경로별 guide가 맡는다.
- 현재 소비자를 Project 본문으로 전환한 뒤 옛 제품 runbook과 내용 없는 workflow 호환 경로를 현재 읽기에서 제외한다.
- 이는 `.claude` 전체의 일괄 제거가 아니다. skill·설정처럼 실제 도구 연결이 있는 항목은 해당 범위에서 대체 연결과 함께 판단한다.

### 옛 문서 관리 명령

- `check-docs`의 유효한 기능은 실제 변경이 지속 설명을 바꾸는지 `development`에서 판단하고 필요한 Project 반영을 `context-update`로 수행하는 흐름에 연결한다. 중요도·개수·주기로 문서 종류를 정하는 지시는 제외한다.
- `doc-save`의 제품 설명·선택 이유는 Project 관리 계약, 이번 작업의 판단·진행은 Work·Maintain 계약에 연결한다. 문서화 전 commit과 코드·문서 분리 commit 강제, 옛 CHANGELOG·Session 경로로 모든 기록을 보내는 지시는 제외한다.
- `doc-discuss`의 일반 개발 논의는 `development`, 명시적인 작업 정의 보강은 `work-discussion`, 이미 나눈 논의의 보존은 Work 기록 계약에 연결한다. 저장 요청을 새 인터뷰로 바꾸거나 시간·빈도로 저장 여부를 정하지 않는다.
- `doc-refactor`는 요청 범위의 문서·채택 계약·실제 코드·예제를 대조하고 권한에 따라 Owner를 갱신하는 기능을 보존한다. 별도 정책 사전과 검색 패턴 기반 자동 판정은 제외한다.
- 유효한 기능은 기존 skill 색인의 요청별 안내에서 찾게 하며, 새 `document-maintenance.md`를 전체 절차로 만들지 않는다.

### 현재 skill과 PR 작성

- `development`의 구현·검토·검증·완료 흐름은 유지하고 바뀐 자료 선택 경로와 폐기된 참조만 맞춘다.
- `context-update`, `explain`, `work-discussion`, `start-app`의 현재 책임은 유지하며 옛 명령을 없앤다는 이유로 같은 절차를 복제하지 않는다.
- `work-discussion` 형성 자료의 과거 Main 직접 기록 표현은 설치 후 Main·Maintain 계약과 구별한다.
- `generate-pr`의 유효한 기능은 요청받은 PR 제목·본문 작성의 조건부 상세로 `development` 아래에 둔다. 비교 기준, 최종 diff와 미커밋 변경의 구별, 실제 검사 근거, 호환성 영향과 제목·본문 작성만 맡기며 commit·push·원격 PR 생성으로 확대하지 않는다.

### guide·발견 경로·검사

- 루트·Document Map·하네스 안내와 앱·패키지 guide는 Project guidance·skill의 실제 역할과 현재 Owner를 가리킨다.
- 없어진 `rules`·`guards`·runbook을 담당 문서처럼 지칭하는 표현과 약화된 transaction 원자성 표현을 바로잡는다.
- deprecated noline-work는 유효한 역할이 현재 skill·guidance에 있는지 확인한 뒤 원본·발견 설정·Codex 연결을 함께 처리한다.
- 검사와 live Workspace 선언은 실제 최종 배치에 맞추며 제거 전부터 제거 완료로 표시하지 않는다.
- Ticket 10에서 바꾼 호출과 발견 연결은 이 Ticket 안에서 확인한다.

## 완료 조건과 확인 방법

- Entity·API·Form 변경, 동기화 조사, 문서 갱신·논의와 PR 작성의 대표 요청에서 필요한 설명과 실제 담당 경로를 찾을 수 있다.
- 제품 의무, 유용한 조사 순서와 선택 가능한 탐색 단서의 강도가 원래 Owner와 다르게 바뀌지 않는다.
- 옛 경로 없이 현재 Project 본문과 skill·관리 계약만으로 유효한 의미와 수행 경계를 이해할 수 있다.
- 원본·bridge·발견 설정과 영향을 받는 guide를 함께 맞추고, 정적 링크 확인과 실제 수행 경로 확인을 구별한다.
- 무엇을 통합·보강·제외·유지했는지와 그 이유, 실행하지 않은 검증과 남은 범위를 설명한다.

## 현재 상태와 실제 결과

Ticket 09의 제품 기준 Owner 통합은 끝났다. Ticket 10의 1번인 제품 runbook·workflow 정리는 Main이 006의 이관 목표에 맞춰 다시 적용했고, 상세 범위와 근거는 [1번 결과](../../../output/ticket-10-part-01-result.md)에 남겼다.

Main 보고와 결과 기록에 따르면 기존 Project guidance가 이미 맡는 작업별 설명은 재사용하고, Entity 변경·동기화 조사·통화 helper처럼 부족한 내용과 탐색 연결만 Project 본문과 guidance 색인에 보완했다. 루트·앱·패키지 guide와 관련 skill·agent·검사·live consumer 연결을 현재 Project 본문으로 전환한 뒤 제품 runbook과 workflows 호환 지도는 원본을 보존하고 현재 경로에서 제거했다.

승인 전에 만든 문서 관리·PR 초안은 미채택 자료로 격리했다. 아직 남은 command·generate-pr·noline-work를 제거 완료로 표시하지 않았고, 관련 선행 검사와 안내도 실제 상태에 맞췄다.

별도 검토자는 1번의 요구 충족 근거가 있다고 판정했다. Main과 검증자는 변경 Markdown의 상대 링크·앵커, Recover 경로와 정적 검사를 확인했다고 결과 기록에 보고했다. 다만 실제 host의 agent 호출 효과나 앱·DB·네트워크 동작은 검증하지 않았고 durable Verify receipt나 사용자 acceptance는 만들지 않았다.

`node scripts/check-harness.mjs`는 55건으로 실패했다. 결과 기록은 기존 52건과 runbook·workflow 제거로 드러난 역사 Workspace 003·004의 옛 링크 3건을 구별하며 전체 Harness 통과를 주장하지 않는다.

Ticket 10 전체는 진행 중이다. 옛 문서 관리 명령, PR 작성 상세, deprecated noline-work 전체 정리와 나머지 guide·발견 경로·검사 정비가 남아 있다. Main은 2–4번 적용과 commit을 수행하지 않았다고 보고했다. 다음 작업은 이 남은 범위를 현재 Owner와 호출 경로에 맞춰 적용하고 대표 요청과 도구 연결을 함께 확인하는 것이다.
