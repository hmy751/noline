---
name: read-project-context
description: 이전 read-project-context 이름의 명시 요청을 현재 읽기 경로로 연결하는 호환 안내. 일반 작업의 자동 선택 대상이 아니다.
disable-model-invocation: true
---

# read-project-context — 이전 이름의 호환 안내

현재 수행 방법은 [공통 읽기 USAGE와 Project 읽기 기준](../../../context/USAGE.md)에서 읽는다. 이 경로를 명시적으로 요청받으면 그 본문과 호출 조건으로 이어 수행하며, 여기에는 별도 실행 규칙을 유지하지 않는다. 읽기 요청은 [Project 읽기 기준](../../../context/project/REFERENCE/reading.md)을 함께 사용한다.

기존 Workspace001의 verify evidence, Project 구성·읽기 Decision과 Workspace004의 output 참조가 남아 있어 이 경로와 bridge를 보존한다. 자동 선택은 비활성화했다. 과거 본문은 Git 이력에서 확인하며, 현재 안내를 당시 실행 판본으로 해석하지 않는다. [전환 이유](../../decisions/2026-10-30-context-and-explanation-refresh.md)를 참고한다.
