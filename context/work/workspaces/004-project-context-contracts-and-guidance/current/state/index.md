# 현재 상태와 다음 행동

Main이 다른 세션의 Project 문서를 기존 Owner와 실제 작업 진입점에서 다시 대조해 남은 누락을 직접 보완했다. 통화 본문에는 금액과 currency code/symbol 동시 표시, 대표 금액과 나머지 통화 개수 표시를 복원했다. API·날짜·통화 runbook과 server/client guide는 새 Project Owner 및 날짜의 현재 경계 차이로 이어진다.

통화·날짜·API 본문과 `current/architecture.md`, 도시 검색·저장 용량 current, 동작 보존 리팩터링 guidance를 현재 Project 기준으로 채택했다. 기존 `.claude` 통화·시간·API/Data 문서는 구현 위치와 호환 진입을 맡는다. 004 Recover·Project 선택·output도 이 권위 관계에 맞췄다.

Main 보고에 따르면 `git diff --check`, Harness 검사와 004 explicit Recover가 모두 통과했고, Recover에서 통화·날짜·API 본문을 실제로 읽는 것도 확인했다. 이 검사는 문서 형식·하네스 연결·재진입 상태를 뒷받침하지만 열린 제품 계약이나 실제 제품 동작 acceptance를 증명하지 않는다.

현재 채택한 Project 계약·읽기 경로와 최소 지침 수정은 commit `33bde33` (`docs(context): Project 계약과 읽기 경로 정비`)에 저장됐다. Main 보고 기준으로 커밋 뒤 작업 트리에는 커밋에서 제외한 미추적 `.pnpm-store/`만 남아 있다.

[01 제품 계약](../memory/tickets/01-product-contract-agreements.md)의 남은 작업은 날짜의 장기 의미, 금액 정밀도와 `주 통화` 라벨, 서버 오류 계약의 사용자 선택이다. 현재 구현 차이와 사용자 결과를 대조해 선택한 뒤 관련 기준과 남은 구현 차이에 반영한다.

Ticket 02의 최소 지침 수정은 `update-project-context`에 반영했다. 기존 Owner와 기존 작업 진입점에서 시작하는 확인을 이번 보완에 적용해 현재 누락은 해소했다. 다른 실행 주체에서도 재발이 줄어드는지는 다음 독립 Project 갱신에서 확인한다.

`status.json`은 Workspace Verify 미실행 상태다. 문서 보완과 Owner 이동의 현재 반영은 확인했지만 열린 제품 선택과 Workspace 전체 완료, 실제 제품 동작 acceptance는 아직 남아 있다. 이번 Main session의 004 binding generation 1은 마무리 시 해제했으며 다음 session에서 이어 갈 때에는 004를 다시 명시 연결한다.
