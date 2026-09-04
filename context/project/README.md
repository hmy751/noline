# Noline Project context

이 디렉터리는 Noline에서 여러 Workspace가 반복해 판단할 실제 Project common context를 소유한다. 기존 문서의 복사본이나 링크 모음이 아니라, 작업 재진입에 필요한 제품 목적·구조·제약·채택 결정을 읽을 수 있게 압축한 층이다.

- [`overview.md`](overview.md): Noline의 사용자 장면, 핵심 불변식, 공통 범위와 정합성 경계
- [`prd.md`](prd.md): 현재 문서가 지지하는 제품 목적·성공 기준·범위와 범위 밖
- [`architecture.md`](architecture.md): monorepo 구성, 데이터·서비스 경계와 검증 경로
- [`decisions/`](decisions/): 여러 작업에 계속 적용되는 선택을 재진입에 필요한 수준으로 정리한 결정 Owner

## 상세 Owner와 우선순위

`README.md`, root [`CLAUDE.md`](../../CLAUDE.md), [`.claude/context/`](../../.claude/context/), [`.claude/rules/`](../../.claude/rules/), [`.claude/guards/`](../../.claude/guards/), [`.claude/runbooks/`](../../.claude/runbooks/)와 실제 `apps/`·`packages/` 코드는 계속 상세 Owner다. 이 디렉터리는 그 Owner들을 이동시키지 않는다.

실제 코드와 active guide가 충돌하면 코드를 먼저 확인하고 active guide를 최소 수정한다. 이 Project context와 상세 Owner가 충돌하면 이 문서를 최신 사실로 간주하지 않고 상세 Owner를 기준으로 다시 대조한다. 한 Workspace에만 속한 목표·현재 상태·분석·검증 이력은 [`../work/workspaces/`](../work/workspaces/)에 둔다.

각 Workspace는 이 디렉터리 전체를 기본 입력으로 읽지 않는다. 해당 Workspace의 `recover.json`이 필요한 문서와 이유를 명시한다.
