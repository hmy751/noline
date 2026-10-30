# 현재 상태와 다음 행동

현재 목표는 002에서 얻은 제품·구조·계약을 Project Context에 복원·보완하는 것이다. 개인 판단·협업 방식·스킬 개선은 후순위다. Spec과 실행 Ticket을 이 목표에 맞춰 재구성했다.

[04 — 앱 실행·세션·데이터 보존](../memory/tickets/04-app-runtime-context.md)의 본문 보완과 대표 읽기·근거 대조를 마쳤다. 관련 기존 Jest 14개 suite·146개 test가 통과했다. 실제 native와 앱 강제 종료 뒤 복구까지 검증한 것은 아니며, 확인한 제품 한계는 새 본문에 남겼다. [산출물](../../output/index.md)과 [확인 기록](../../records/2026-10-30-11-app-runtime-context.md)에서 이어 읽는다.

다음은 [05 — 네트워크·조회·화면 복구](../memory/tickets/05-network-read-context.md)다. 실제 관측·표시 정책·조회 실행·내용 표시와 복구의 관계를 기존 상세 Owner에 보완한다. 이후 [06 — 작성·장소·날짜 입력](../memory/tickets/06-draft-input-context.md)을 수행한다. 05·06의 본문 보완은 아직 시작하지 않았다.

이미 반영된 날짜·API·통화·도시 검색·저장 용량·여행 목록 계약은 [범위 지도](../memory/review-scope.md)에 따라 재사용·대조한다. 새 파일이나 티켓의 수로 전체 축적을 대신하지 않는다. 조사·본문 수정·읽기 경로·확인은 각 Ticket이 함께 맡는다.

완료한 저장 용량 01의 코드 보완은 `15ce9b4`에 저장했다. 기존 11개 검사·별도 검증 근거를 유지한다. 실제 native 미확인 및 기존 정적 검사 실패는 [기존 결과](../../records/2026-10-30-05-storage-stats-improvement.md)에 있다. 이전 02·03의 코드 구조 재검토 계획은 새 05·04로 대체했으며 제품 변경을 자동 실행하지 않는다.

002의 사용자 보류·후속 구현·미확인 범위는 보존한다. 기존 02·03 Workspace의 끊어진 링크는 [당시 확인](../../records/2026-10-30-03-review-and-save.md)의 범위이며 이번 재구성으로 수정하지 않았다. active index·session binding·Verify 상태는 변경하지 않는다.
