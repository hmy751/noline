# Noline Project context

이 디렉터리는 여러 Workspace가 공유하는 실제 Project-wide 판단 context를 소유한다. 다음 관련 작업이 제품 목적·사용자 문제·계약과 현재 현실을 다시 추론하지 않게 하는 내용 층이다. 한 작업의 진행 기록이나 기존 문서의 링크 목록이 아니다.

## 읽는 경로

작업·주제에 맞는 본문에서 시작하고, 그 본문의 읽기 조건에 따라 필요한 상세만 추가한다. 세 층은 책임과 관리 경계이며 모든 작업의 공통 읽기 순서가 아니다.

- 제품 목적, 여행 데이터의 관계와 보존할 제약을 판단할 때: [제품 의미와 공통 기준](common/product.md)
- client·server·schema·UI의 현재 책임과 지원·검증 범위를 확인할 때: [현재 구조와 지원 경계](current/architecture.md)
- 설명·논의에서 주장과 실제 근거의 관계를 다룰 때: [설명과 근거 기준](guidance/explanation-and-evidence-criteria.md)의 적용 조건
- Selective Local-First를 선택한 이유가 필요할 때: [선택 근거](decisions/0001-selective-local-first.md)
- API·통화·날짜·동기화 등 아직 Project로 옮기지 않은 상세 주제: [기존 Noline 작업 진입점](../../.claude/runbooks/README.md)과 [상세 맥락 색인](../../.claude/context/README.md)

본문이 추가되거나 책임이 이동하면 이 주제별 경로도 실제 Owner에 맞춘다. 없는 가이드를 이미 구성된 것처럼 연결하지 않는다. 각 층의 전체 목록은 [common](common/README.md), [current](current/README.md), [guidance](guidance/README.md), [decisions](decisions/README.md)에서 찾는다.

필요한 본문을 고르고 이번 작업에 적용하는 기준은 [읽기와 적용](REFERENCE/reading.md)에 있다. [read-project-context](../../.agents/skills/read-project-context/SKILL.md)는 적용할 본문을 아직 고르지 못했거나 기존 선택만으로 새 질문을 다루기 어려울 때 이를 실행한다. 이미 이해한 맥락으로 충분한 단순 작업마다 다시 호출하지 않는다.

## 물리 구조

```text
context/project/
├── README.md               # 정체성·층별 책임·권위와 주제별 진입
├── MAINTENANCE.md          # 갱신 시점·권한·영향 범위·완료 확인
├── REFERENCE/             # 본문 구성과 읽기의 판단 기준
├── common/                # 제품·데이터·시스템의 의미와 핵심 제약
├── current/               # 현재 구현·지원·적용 관계와 판단에 필요한 증거 범위
├── guidance/              # 관련 작업의 계약·판단·적용·검증 가이드
└── decisions/             # 중요한 선택의 이유와 재검토 신호
```

`common/current/guidance`는 필수 물리 경계이며 각 README가 해당 층의 문서 위치를 안내한다. 모든 주제에 각 층의 문서가 하나씩 필요한 것은 아니다. 본문은 주된 질문에 맞는 층에 두며, 의미를 함께 이해해야 할 때 다른 층의 전제를 짧게 설명할 수 있다. 상세한 구성·분리 기준은 [내용 선별과 주제 구성](REFERENCE/composition.md)이 소유한다.

`decisions`는 현재 답을 보조하는 선택 근거의 경계이고, `reference`는 이 context의 구성·사용 기준이다. 둘 다 네 번째 제품 내용 층이 아니다. 제품·domain 본문은 root 평면 파일로 만들지 않는다.

## 층별 책임

### `common/`

작업이 바뀌어도 필요한 제품 목적, 사용자 장면, 데이터·시스템의 의미와 핵심 제약을 소유한다. 제품을 무엇으로 이해하고 어떤 관계를 지켜야 하는지 설명한다. 기술적이거나 상세한 내용도 이 의미를 설명한다면 포함할 수 있다. 한 Workspace의 목표·진행은 소유하지 않는다.

### `current/`

Project 수준에서 현재 구현·지원·적용되는 범위와 연결 관계, 현재 상태를 받아들일 지위와 다음 판단에 필요한 검증 범위를 설명한다. 완료된 구조와 지원 범위도 다루며 미정·위험 목록에 한정하지 않는다. 실제 코드·설정·테스트 Owner, 대조한 대상과 근거의 시점, 다시 확인할 변화와 갱신 책임을 찾을 수 있어야 한다.

현재 사실이 존재하거나 작업 하나를 완료했다는 이유만으로 별도 문서를 만들지는 않는다. 가이드와 코드에 더해 어떤 이해를 제공하는지와 유지비용을 실제 구성에서 판단한다. 폴더의 존재가 본문 수·크기나 편입 항목을 미리 정하지 않는다.

### `guidance/`

관련 작업에서 지킬 구체적인 개발 계약과 그 이유, 적용·변경 판단·검증 방법을 소유한다. 새 기능 개발뿐 아니라 관련 수정·리팩터링·조사에도 쓰는 작업 가이드다. 필요하면 실행 순서와 실패 대응을 포함하지만 조언이나 순서에 한정하지 않는다.

적용할 작업과 중요한 예외를 본문에서 알 수 있어야 한다. 같은 종류의 작업들이 함께 지킬 계약도 이 층의 본문이 될 수 있다. `common`과의 구분은 공통 사용 횟수나 추상성·상세함이 아니라 제품 의미와 작업 기준 중 무엇을 소유하는지에 따른다.

### `decisions/`

중요한 선택의 이유·기각안·재검토 신호를 보존한다. 기본적으로 현재 답은 대응하는 내용 본문이 소유한다. 특정 현재 값의 normative Owner임을 결정 문서가 명시한 경우에만 그 범위를 소유한다. [결정 관리 기준](decisions/README.md)을 따른다.

## Authority와 작업 경계

각 내용 문서는 자신이 맡은 의미 범위와 현재 권위를 밝힌다. 기존 상세 canonical을 옮기지 않은 범위는 해당 Owner와 충돌 우선순위를 명시하고, 승인된 주제별 이동을 마친 범위는 Project 본문이 현재 의미를 소유한다. 이전 문서는 구현 상세·근거·역사·호환 routing 중 실제 남은 역할을 맡으며 경쟁하는 현재 정본으로 남지 않는다.

현재 제품 본문은 위 읽기 경로에 연결된 범위다. 미이동 상세 의미와 작업 지침은 root [CLAUDE.md](../../CLAUDE.md), [.claude/context](../../.claude/context/README.md), [rules](../../.claude/rules/README.md), [guards](../../.claude/guards/README.md), [runbooks](../../.claude/runbooks/README.md)가 계속 소유한다. 구현 사실은 [apps](../../apps/)·[packages](../../packages/)의 코드와 테스트에서 확인한다. 현재 코드나 최근 문서라는 이유만으로 제품 결정을 자동 대체하지 않는다.

한 Workspace의 목표·진행·후보·시행착오·검증 이력은 Work에 남긴다. 첫 Workspace에서 얻은 내용도 지속되는 적용 범위와 근거가 확인되면 Project 본문에 반영할 수 있다. 사용자가 한정한 주제의 Owner 이동을 관련 없는 제품 문서 전체 개편으로 넓히지 않는다.

## 관리 책임과 실행 장치

본문을 구성·복원·갱신하는 주체는 [MAINTENANCE.md](MAINTENANCE.md)를 직접 읽는다. 관리 계약은 갱신 시점·권한·영향·완료를, [reference](REFERENCE/README.md)는 본문 구성과 읽기의 판단 기준을 소유한다. 실제 제품 의미의 결정 책임은 사용자 또는 명시된 책임자에 있고, 기준·구현을 바꾸는 주체는 영향받은 문서를 맞춘다.

[update-project-context](../../.agents/skills/update-project-context/SKILL.md)는 관리 계약을 적용한다. Workspace Maintain은 Project 본문을 갱신하지 않는다. Skill·Harness는 기준을 적용하는 교체 가능한 장치이며 제품 의미나 사람의 acceptance를 소유하지 않는다.

Workspace의 `recover.json`은 이 README를 안정된 진입점으로 선택하고 goal에 필요한 실제 내용만 추가한다. README만으로 내용 충분성을 대신하지 않으며, Project 전체·모든 층·관리 지침을 기본 입력에 싣지 않는다. 문서 선택과 실제 읽기·이해·적용은 구별한다. 읽기 스킬은 Recover나 session binding을 대체하지 않는다.

책임 경계와 제거 가능한 장치의 관계에 `ai-system_context-ownership-boundary.md: 적용`, `ai-system_harness-rippability.md: 적용`.
