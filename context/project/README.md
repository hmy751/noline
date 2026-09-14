# Noline Project context

이 디렉터리는 여러 Workspace가 공유하는 실제 Project-wide 판단 context를 소유한다. 기존 제품 문서의 복사본이나 링크 목록이 아니라, 다음 관련 작업이 제품 목적·사용자 문제·현재 현실과 관련 판단 기준을 다시 추론하지 않게 하는 내용 층이다.

## 물리 구조

```text
context/project/
├── README.md               # 구조·읽기 경로·권위 관계
├── MAINTENANCE.md          # Project context 작성·복원·갱신 기준
├── common/                 # 여러 Work에 지속되는 제품·domain 의미
├── current/                # 교체되는 현재 구현·지원·proof 경계
├── guidance/               # 관련 작업에서만 적용하는 조건부 판단 기준
└── decisions/              # 중요한 선택의 이유와 재검토 신호
```

`common/`, `current/`, `guidance/`는 설명용 profile이 아니라 Project context의 필수 탐색 경계다. 각 폴더의 `README.md`는 그 층의 책임과 현재 문서 위치를 소유하며, 실제 본문 수는 Project에 맞게 달라질 수 있다. 적용할 guidance가 없어도 `guidance/README.md`에 그 사실과 추가 조건을 남겨 세 책임의 존재 여부를 다시 추측하게 하지 않는다.

`decisions/`는 네 번째 현재 책임 층이 아니다. 현재 답 자체보다 중요한 선택의 이유·기각안·재검토 신호를 보존하는 보조 경계다. 제품·domain 본문은 root에 평면 파일로 만들지 않고 주 책임에 맞는 폴더에 둔다. Root `README.md`는 전체 구조와 권위 관계를, `MAINTENANCE.md`는 이 경계의 관리 계약을 소유한다.

## 읽는 경로

- 제품 목적·사용자 문제·domain 의미·Project-wide 제약은 [`common/README.md`](common/README.md)에서 찾는다.
- 지금 구현·지원되는 범위, 상세 Owner와 검증의 증명 상한은 [`current/README.md`](current/README.md)에서 찾는다.
- 특정 종류의 작업에만 적용할 반복 판단 기준은 [`guidance/README.md`](guidance/README.md)에서 찾는다.
- 현재 답보다 선택 이유와 재검토 신호가 필요하면 [`decisions/README.md`](decisions/README.md)에서 찾는다.
- Project context를 작성·복원·재구성·갱신할 때는 [`MAINTENANCE.md`](MAINTENANCE.md)를 읽는다. 제품 작업의 조건부 판단 기준은 `guidance/`, 이 context 자체의 관리 기준은 `MAINTENANCE.md`가 맡는다.

모든 Workspace의 `recover.json`은 이 root `README.md`를 안정된 routing anchor로 선택한다. README만으로 작업에 필요한 내용이 충분하다고 보지 않으며, 현재 goal의 판단을 바꾸는 `common/`, `current/`, `guidance/`, `decisions/`의 실제 문서만 이유와 함께 추가 선택한다. Project context 전체나 모든 층을 자동으로 읽지 않는다.

## 층별 책임

### `common/`

작업이 바뀌어도 계속 필요한 제품 목적, 사용자 장면, domain 관계·불변성, 제품 기준과 Project-wide 제약을 둔다. 구현 현황이나 한 Workspace의 목표를 섞지 않는다. 각 내용 문서는 자신이 소유하는 주제 범위와 현재 authority를 밝힌다. 기존 상세 canonical을 옮기지 않은 범위는 그 Owner와 충돌 우선순위를, 승인된 주제별 Owner 이동을 마친 범위는 이전 문서와 구현·검증 Owner의 역할을 함께 밝힌다.

### `current/`

현재 구현·지원·미지원 범위, 연결 구조, 위험과 proof boundary처럼 실제 구현과 검증 변화에 맞춰 교체해야 하는 Project-level 지도를 둔다. 마지막 대조 시점·대상, 상세 코드·테스트 Owner, stale 신호와 갱신 책임을 찾을 수 있어야 한다. 이 층으로 Owner가 이동된 현재 의미와 코드·테스트가 소유하는 구현 사실을 구별한다. 둘이 충돌하면 명시된 authority와 직접 근거를 대조해 claim 범위를 좁히고 이 층을 갱신한다.

### `guidance/`

특정 종류의 Work에서만 반복해서 판단이나 행동을 바꾸는 Project-wide 지침을 둔다. 각 지침은 적용 조건, 비적용 조건, 재검토 신호와 제거 조건을 밝힌다. 단지 유용해 보이는 조언이나 모든 작업이 이미 지키는 공통 의미를 guidance로 승격하지 않는다.

### `decisions/`

중요한 선택이 왜 만들어졌고 어떤 조건에서 다시 열어야 하는지 보존한다. 기본적으로 `common/`, `current/`, `guidance/`의 현재 답을 대신하지 않는다. 문서가 특정 현재 값의 normative Owner임을 명시한 경우에만 그 범위의 현재 답을 소유한다.

## Noline의 현재 배치

- [`common/product.md`](common/product.md): 여행 중 일정·경비를 이어갈 사용자 목적, 활성화된 여행의 데이터 관계와 공통 제약
- [`current/architecture.md`](current/architecture.md): client·server·schema·UI의 현재 책임, 지원 경계와 검증 경로
- [`guidance/README.md`](guidance/README.md): 기존 Noline rule·guard·runbook Owner와 조건부 설명 기준의 소비 관계
- [`decisions/0001-selective-local-first.md`](decisions/0001-selective-local-first.md): Selective Local-First 선택의 근거 요약. 상세 결정은 `.claude/decisions/`가 유지한다.

## Authority와 작업 경계

각 Project 내용 문서는 자신이 명시한 주제와 의미 범위의 canonical이다. 기존 README·STATUS·docs는 Owner 이동이 승인되지 않은 범위와 구현 상세의 canonical로 유지한다. Project context는 여러 Workspace의 판단에 필요한 의미를 실제 내용으로 다시 서술하되 원문을 문단째 복제하지 않는다.

사용자가 한정한 주제의 Owner를 이 경계로 옮기도록 승인했다면 그 범위의 현재 의미는 대응하는 Project 내용 문서가 소유한다. 이전 문서는 구현 상세·근거·역사·호환 routing 중 실제 남은 역할만 맡고, 같은 현재 답을 소유하는 경쟁 canonical로 남지 않는다. 주제별 이동은 다른 제품 문서 전체의 이동 승인이 아니며, 구체적인 전환 방법은 [`MAINTENANCE.md`](MAINTENANCE.md)가 소유한다.

한 Workspace에만 해당하는 목표·현재 상태·분석·후보·검증 이력은 이 층으로 올리지 않는다. 첫 Workspace의 작업 장면도 상세 Owner가 Project 전체에 적용됨을 뒷받침할 때만 Project context로 일반화한다.

Noline의 상세 의미는 root [`CLAUDE.md`](../../CLAUDE.md), [`.claude/context/`](../../.claude/context/), [rules](../../.claude/rules/), [guards](../../.claude/guards/), [runbooks](../../.claude/runbooks/)가 소유한다. 제품 코드와 테스트는 [`apps/`](../../apps/)·[`packages/`](../../packages/)가 소유하며, 충돌 시 상세 Owner와 실제 코드를 대조해 이 층을 갱신한다. Harness와 skill은 이 계약을 선택·적용·검사하는 교체 가능한 관리 장치이며 Project 의미나 사람의 acceptance를 소유하지 않는다.

## 관리 경로

여러 Workspace에 계속 유효할 변화가 명확해지거나 누락된 Project 맥락의 복원이 필요하면 [`MAINTENANCE.md`](MAINTENANCE.md)의 기준을 적용한다. [`update-project-context`](../../.agents/skills/update-project-context/SKILL.md)는 그 기준을 실행하는 절차다. Workspace Maintain은 Project 문서의 갱신을 맡지 않는다.

관리 기준은 작성·복원·갱신을 수행하는 주체가 해당 작업에서 직접 읽으며, 일반 Recover의 기본 입력에 추가하지 않는다.
