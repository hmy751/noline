# Workspace current state

## 현재 상태

Noline baseline `74926b8e33f87c04ec11a25991733f1b8bc3cbdc`에서 Context Harness를 적용했다. preflight receipt, Harness test receipt와 Claude/Codex bridge Verify receipt가 남아 있고 `status.json`은 최신 Verify를 가리킨다. Codex와 Claude Code의 새 session은 unbound였으며 checked runtime directory는 만들지 않았다.

다음 작업은 이 Workspace의 자동 activation이 아니라, 필요할 때 새 Context Workspace를 생성하거나 사용자가 target-root Codex 또는 Claude Code task에서 hook trust와 특정 session activation을 명시적으로 선택하는 것이다.

## 상태를 읽는 법

- 최근 Verify의 기계 결과·receipt cursor·시각은 [`status.json`](status.json)이 소유한다.
- 이식 선택과 Harness test receipt는 [`../../records/`](../../records/)에 둔다.
- 다음 판단, Codex·Claude Code actual-host activation 여부와 사람 acceptance는 이 문서와 사용자 지시가 소유한다. Harness가 자동으로 결정하지 않는다.

## 해석 경계

`verification_passed`는 declared canonical basis와 evidence snapshot에서 package script가 호출하는 `node scripts/check-harness.mjs`가 exit 0을 냈다는 기계 사실이다. 제품 기능, 실제 Codex·Claude Code hook trust·event delivery, Main session activation과 사람 acceptance를 증명하지 않는다.
