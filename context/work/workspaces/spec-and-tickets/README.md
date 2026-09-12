# Workspace의 Spec과 Ticket

이 디렉터리는 Workspace의 작업 정의, 실행 단위, 전체 상태를 연결하는 운영 기준을 소유한다. Spec·Ticket의 내용과 읽는 범위, 작업을 나누고 완료하는 판단, Main·Maintain의 갱신 책임을 여기서 찾는다.

Workspace 전체의 범위와 source·output·records 관계는 [Workspace collection](../README.md)이 소유한다. 실제 작업 내용은 각 Workspace의 `current/`에 두며, 이 운영 기준을 작업별 Spec에 복제하지 않는다.

## 문서의 계층과 책임

이 폴더는 **전체 관계를 설명하는 진입 문서**, **공통 판단과 그 판단을 문서에 담는 기준**, **갱신 책임**, **선택 배경**으로 구성된다. 아래 트리는 문서의 적용 관계를 나타내며, 실제 파일은 모두 이 폴더 바로 아래에 있다.

```text
README.md — 전체 범위와 문서 사이의 관계
├── EXECUTION-CRITERIA.md — 목표를 분해·실행·완료로 이어가는 공통 판단
│   ├── SPEC.md — Work 전체의 목표와 공통 기준을 어떻게 정의하는가
│   └── TICKET.md — 각 실행의 결과·맥락·완료 근거를 어떻게 구체화하는가
├── MAINTENANCE.md — Spec·Ticket·state 전반을 누가, 언제, 어떻게 갱신하는가
└── HISTORY.md — 이 판단과 구성을 선택한 이유와 검토 근거
```

**공통 판단과 작성 기준:** `EXECUTION-CRITERIA.md`는 결과에 필요한 일을 찾고 충분한 범위와 완료 근거를 판단하는 기준이다. `SPEC.md`와 `TICKET.md`는 그 판단을 각각 Work 전체의 정의와 개별 실행의 정의·결과에 담도록 구체화한다. 실제 작업에서 지킬 목표와 제약은 해당 Workspace의 Spec에 있으며, 공통 실행 기준도 그 목표와 제약을 바탕으로 적용한다.

**갱신 책임과 이력:** `MAINTENANCE.md`는 위 기준으로 정한 내용과 실행 결과를 Spec·Ticket·state에 이어 주는 책임을 맡는다. `HISTORY.md`는 이 운영 방식의 선택 이유를 보존하며, 기준을 변경할 때 읽는다. 현재 적용할 요구는 각 운영 문서에서, 그 요구를 둔 배경은 이력에서 찾는다.

이 폴더의 `SPEC.md`와 `TICKET.md`는 여러 Workspace가 사용하는 작성 지침이다. 각 작업의 실제 Spec·Ticket 본문은 해당 Workspace의 `current/memory/`에 둔다.

## 실제 작업에서 Spec·Ticket·state의 관계

- **Spec:** 하나의 Work에서 해결할 문제와 이루려는 결과, 그 결과를 판단할 기준이다. 여러 실행이 함께 지켜야 할 의미·계약·제약과 현재 설계·가정을 담는다.
- **Ticket:** Spec의 목표와 기준 안에서 확인 가능한 결과를 만들도록 범위를 묶은 실행 단위다. 맡은 범위·완료 조건·필요한 입력·의존 관계와 진행·실제 결과를 함께 남긴다.
- **state:** Workspace 전체의 현재 상황과 판단, 다음 행동이다. 필요한 Ticket 상황을 종합하되 개별 Ticket 본문의 정의와 진행을 대신하지 않는다.

Spec과 Ticket은 크기나 사용자 행동 여부만으로 구별하지 않는다. 기능 구현, 결함 수정, 코드 개선에서 각각 맡은 결과와 공통 기준의 관계로 구별한다. 내부의 세부 구현을 모두 미리 정할 필요는 없다.

## 언제 무엇을 읽는가

Main과 실행자는 Ticket을 나누거나 실행·완료 판단을 할 때 [목표를 실행 결과로 이어가는 기준](EXECUTION-CRITERIA.md)을 읽고 적용한다. 이 문서는 필요한 일을 찾는 책임과 범위·품질·완료 판단을 소유한다. 이미 본문을 입력받았다면 같은 파일을 다시 읽을 필요는 없다.

문서를 만들거나 고칠 때에는 [문서 작성과 갱신](../DOCUMENT-WRITING.md)을 적용하고, 맡은 문서에 따라 아래 기준을 함께 읽는다.

- [Spec 작성](SPEC.md): 작업 목표와 공통 요구·계약·품질·설계의 다섯 관점을 구체화할 때.
- [Ticket 작성](TICKET.md): 실행할 결과와 맥락·접근·완료 근거·실제 결과를 남길 때. Ticket 분해와 완료 판단에는 위 실행 기준도 적용한다.
- [갱신과 작업의 연속성](MAINTENANCE.md): 누가 무엇을 갱신하는지, 새 근거가 기존 판단에 미치는 영향과 다른 실행자의 결과를 어떻게 이어받는지 정할 때.

Maintain은 위 다섯 운영 문서를 함께 적용한다. 자동 입력 경로는 [Maintain](../../harness/maintain/README.md)이 연결하며, 수동 경로에서는 제공되지 않은 본문을 직접 읽는다. 기록 책임을 맡는다는 이유로 Main의 작업 판단이나 실행자 선택까지 대신하지 않는다. 선택 배경을 보존하는 `HISTORY.md`는 아래 기준 변경 시점에 읽는다.

## Workspace 안의 실제 구성

각 Workspace가 맡는 Work당 Spec 하나를 유지하며, 그 Spec을 아래 다섯 파일로 구성한다. 상위 `context/work/` 전체의 공유 Spec은 만들지 않는다.

```text
current/
├── memory/
│   ├── index.md
│   ├── spec/
│   │   ├── 01-problem-goal-scope.md
│   │   ├── 02-behavior-and-cases.md
│   │   ├── 03-concepts-and-contracts.md
│   │   ├── 04-quality-and-completion.md
│   │   └── 05-constraints-design-assumptions.md
│   ├── tickets/
│   │   ├── index.md
│   │   └── <ticket>.md
│   └── project-context.md
└── state/
    ├── index.md
    └── status.json
```

`memory/index.md`는 Spec 다섯 파일, Ticket 색인, Project context 선택과 필요한 추가 memory를 연결한다. Spec이 기존 `01-goal.md`와 작업별 `02-constraints.md`를 대체하므로 같은 작업 정의를 따로 유지하지 않는다. `project-context.md`는 이번 작업에 선택한 Project 맥락과 그 이유를 맡는다.

`tickets/index.md`는 각 Ticket의 제목·하는 일·본문 경로를 안내한다. 개별 진행 상태의 두 번째 정본으로 만들지 않으며, Ticket이 없으면 없다고 적는다. `status.json`은 제품 Verify의 기계 결과만 맡고 Ticket 상태를 저장하지 않는다.

## 일반 재진입과 개별 실행의 입력

일반 Workspace 재진입에서는 다음 자료를 읽는다.

1. memory 색인과 Spec 전체, Project context 선택과 추가 memory
2. Ticket 색인과 전체 state, output 색인
3. 선택한 Project 본문과 지금 판단에 필요한 Ticket 본문

[Recover](../../harness/recover/README.md)는 이 기본 packet을 만들며, Ticket 본문의 추가 선택은 작업 주체가 한다. 실행할 Ticket을 정하거나 그 결과를 판단할 때는 본문을 직접 확인한다.

개별 Ticket 실행자에게 읽힐 Spec 범위·자료와 직접 갱신할 문서는 실제 위임에 맞게 정한다. 모든 Ticket의 위임이나 새 세션 실행을 강제하지 않는다. 실행자는 위의 공통 실행 기준과 자신에게 맡겨진 결과를 함께 읽어 판단한다.

## 이 기준의 유지

공통 운영 기준의 유효성은 하네스 변경을 맡은 Main이 관리한다. Workspace별 Spec·Ticket·state의 유지 책임은 [갱신 기준](MAINTENANCE.md)을 따른다. Recover·Maintain 같은 관리 장치가 이 문서들의 의미를 별도로 정의하지 않는다.

판단에 영향을 주는 문구·구성·읽기 경로를 변경할 때는 [선택 배경과 변경 이력](HISTORY.md)을 먼저 읽는다. 변경할 부분을 왜 두었는지, 어떤 실패를 막으려 했는지 확인하고 새 안에서도 그 판단이 유지되는지 대조한다. 표현을 줄이거나 일반화했다는 사실만으로 같은 의미가 보존됐다고 판단하지 않는다.

선택 이유가 달라지거나 더 적절한 방법을 확인했다면 그 근거로 개선할 수 있다. 판단 기준·책임·읽기 경로를 바꾸거나 이전 선택을 대체할 때는 이유, 영향과 확인 범위를 `HISTORY.md`의 새 날짜별 항목으로 남긴다. 앞선 결정의 근거를 현재 결론에 맞춰 덮어쓰지 않는다.

작성과 책임 배치에 `ai-system_instruction-clarity.md: 적용`, `ai-system_context-ownership-boundary.md: 적용`, `ai-system_responsibility-cohesion.md: 적용`, `ai-system_human-readable-structure.md: 적용`, `ai-system_harness-rippability.md: 적용`.
