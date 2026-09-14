# Project context의 주제 구성과 읽기·갱신 기준

날짜: 2026-09-14

## 배경과 선택

002의 Ticket 01–05 결과를 Project로 옮긴 뒤 주제별 책임은 드러났지만, 세부 current 문서가 늘고 다음 개발에서 읽을 계약·이유·구체적인 적용이 충분히 이어지지 않는다는 문제를 논의했다. 작업 결과를 분류해 보존하는 것과 다음 관련 작업이 이해할 본문을 만드는 것은 다르다.

사용자는 guidance를 처음부터 판단과 적용을 포함하는 작업 가이드로 생각했으며, common/current/guidance 물리 경계도 의도적으로 요구했다. 따라서 폴더를 없애거나 guidance를 수행 순서만으로 좁히지 않는다. 관련 작업이 반복해서 읽을 온전한 주제를 먼저 구성하고, 일부 작업에만 필요한 상세를 읽을 조건과 함께 나누기로 했다.

## 책임 배치

- [Project README](../../context/project/README.md)는 정체성·세 층의 관계·권위와 주제별 읽기 경로를 소유한다.
- [Project reference](../../context/project/REFERENCE/README.md)는 구성 판단과 읽기·적용 기준을 연결한다. 구성과 읽기는 소비 시점이 달라 별도 본문으로 두며 갱신 절차는 복제하지 않는다.
- [MAINTENANCE.md](../../context/project/MAINTENANCE.md)는 갱신 시점·권한·영향 범위·Owner 이동·완료 확인을 소유한다.
- [읽기 스킬](../skills/read-project-context/SKILL.md)과 [갱신 스킬](../skills/update-project-context/SKILL.md)은 기준을 읽고 적용한다. 제품 의미·문서별 읽기 조건을 스킬에 복제하거나 Workspace Maintain의 쓰기 범위를 넓히지 않는다.

이 배치는 사람이나 다른 실행 장치가 같은 기준을 적용할 수 있게 한다. 대신 문서와 스킬의 연결을 함께 관리해야 하는 비용이 있다. 주제별 routing이나 스킬 호출만으로 실제 읽기·이해·적용이 보장되지는 않는다.

## 외부 조사에서 취한 기준

Matt Pocock의 로컬 skills 자료에서는 쉽게 찾는 사실의 복제와 이유·관례·여러 경로의 관계를 보존하는 가치의 차이, 한 개념의 정의·규칙·주의점을 함께 배치하는 기준을 참고했다. Peter Steinberger의 로컬 agent-scripts 자료에서는 읽을 조건을 문서와 함께 관리하는 방식과 한 주제 가이드에 전제·계약·실행·검증을 연결하는 구성을 참고했다.

두 자료의 책임 배치나 자동화를 그대로 도입하지 않는다. 특히 `summary/read_when` 메타데이터·문서 목록 도구를 추가하지 않으며, 해당 저장소가 Noline과 같은 세 층의 적정 크기나 실제 관리 효과를 입증한다고 보지 않는다. 자료의 버전·근거와 한계는 [외부 조사 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-09-14-06-project-context-reference-insights-and-retest-direction.md)에 보존했다.

## 보류와 검증 경계

`current`는 유지한다. 유용한 현재 정보가 있다는 것과 독립 문서가 필요하다는 판단을 나누되, 편입 목록·문서 수·축소나 폐기를 먼저 고정하지 않는다. 가이드·코드와 함께 읽었을 때 얻는 이해와 유지비용을 후속 재구성에서 확인한다.

사용자는 이번에 새로 만든 하위 Project 제품 문서를 원복하고 지침부터 작업하도록 요청했다. 따라서 기존 제품 문서와 연결된 참조는 재구성 전 상태로 돌리고, 제품 본문을 새 기준으로 다시 만드는 작업은 이번 지침 수정에 포함하지 않는다. Ticket·제품 코드·기존 records는 원복하지 않는다. 원복은 기존 제품 자료가 현재 코드와 모두 일치한다는 검증이 아니다.

후속 적용에서는 관련 작업의 시작 본문, 계약·이유·구체적인 적용의 충분성, 불필요한 읽기, 변경된 의미에 따른 갱신 범위를 확인한다. 지침이 설치됐다는 사실과 실제 새 작업 주체가 이를 읽고 좋은 본문을 구성한 결과는 구별한다. Workspace Maintain의 기존 실패와 미처리 상태는 별도 운영 문제이며 이 변경이 자동 반영을 복구하지 않는다.

상세 논의와 조건부 합의는 [구성·읽기·갱신 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-09-14-05-project-context-structure-reading-and-maintenance.md)과 위 외부 조사 기록을 함께 읽는다. 일반 제품 작업의 기본 입력은 이 결정 기록이 아니라 해당 주제 본문이다.

## 이번 적용에서 확인한 범위

Main은 새 읽기 스킬과 갱신 스킬의 YAML·이름·호출 설정·상대 bridge, 변경 문서의 local link와 diff를 확인했다. 제공된 Python skill 검사기는 환경에 PyYAML이 없어 실행되지 않았으며, 설치된 Node YAML parser로 같은 기본 항목과 호출 설정을 별도 검사했다. 이는 실제 host의 자동 발견·호출 시험이 아니다.

Active/default인 001의 기본·명시 Recover와 session-bound된 002의 명시 Recover가 성공했다. 원복된 002는 Project README·기존 제품 기준·기존 구현 지도만 선택하며 새 reference나 관리 계약을 기본 packet에 추가하지 않았다. Recover와 임시 Workspace 상태 보존 회귀 검사 37개가 통과했다. 제품 코드·기존 기록·Ticket의 수락 상태를 원복하거나 제품 Verify를 실행하지 않았다.

`pnpm harness:check`는 환경의 의존성 설치 단계에서 중단돼 `node scripts/check-harness.mjs`를 직접 실행했다. 직접 검사에서 남은 실패는 원복으로 제거한 통화 본문을 가리키는 위 구성 기록의 과거 링크 한 건이다. 기존 날짜별 기록을 고치거나 링크 검사를 완화하지 않았다. 새 지침·스킬·현재 진입점의 링크와 bridge 검사는 통과했으나 전체 하네스 검사 통과로 보고하지 않는다.

이번 확인은 지침 설치와 소비 경로의 정합성까지다. 새 작업 주체의 본문 구성·읽기·갱신 효과와 `current`의 독립적인 효용은 후속 적용에서 확인한다.

후속 재시험에서 드러난 실패 원인과 의미·사실·진입 경로 검증 기준은 [Project context 갱신의 의미·사실·진입 경로 검증](2026-09-14-project-context-semantic-and-routing-verification.md)에 기록했다.
