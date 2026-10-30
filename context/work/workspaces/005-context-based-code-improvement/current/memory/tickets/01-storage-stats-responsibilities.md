# 01 — 저장 용량 Hook의 책임 분리 재검토

## 맡은 결과와 범위

당시 개선하려던 집계·부분 실패·표시·React 연결의 이해와 수정 부담이 현재 코드에서 어떻게 해결됐는지 판단한다. 남은 개선을 채택하면 구현·필요한 검증까지 이 Ticket에서 수행한다. 현재 선택이 적절하면 그 근거로 유지한다.

대상은 useStorageStats와 ProfileScreen의 실제 소비, 관련 hook 검사다. 새 실패 UI·병렬 조회·공개 반환 변경은 근거 없이 도입하지 않는다. 전체 저장소 정리나 native 저장 방식 개편을 목표로 삼지 않는다.

## 실행 맥락과 접근

먼저 [기존 Ticket 03](../../../../002-code-readability-refactoring/current/memory/tickets/03-storage-stats.md), [최종 구현·검증 기록](../../../../002-code-readability-refactoring/records/2026-09-11-04-storage-stats-refactor.md), [초기 정리와 정정의 재확인](../../../../002-code-readability-refactoring/records/2026-09-12-01-ticket-03-initial-scope-reanalysis.md)을 읽는다. 표시값 조립만 공통화한 초기안, 여러 helper가 공유 객체를 바꾸는 탈락안, 같은 파일 안에서 집계·실패·표시·React를 나눈 최종안의 이유를 구별한다.

[현재 hook](../../../../../../../apps/client/src/features/profile/hooks/useStorageStats.ts), [화면 소비자](../../../../../../../apps/client/src/screens/ProfileScreen.tsx), [hook 검사](../../../../../../../apps/client/tests/features/profile/hooks/useStorageStats.test.ts)를 대조한다. [제품 계약](../../../../../../project/current/storage-statistics.md)과 [적용할 Context](../project-context.md)의 코드 표현·계약과 수명을 먼저 읽고 현재 구조와 의미 있는 대안을 비교한다. 당시 검사는 mock 기반이며 실제 native 연결을 증명하지 않는다.

## 완료 조건과 확인 방법

- DB 실패의 부분 결과·Mapbox 중단, 팩 목록 실패와 개별 팩 실패의 차이, 유효한 byte·단위·반환과 실제 화면 소비를 확인한다.
- 겹친 refresh의 최신 결과와 unmount 뒤 반영 차단을 코드·검사에 대조한다. 내부 helper 존재 대신 관찰 가능한 결과로 검증한다.
- 현재 구조에서 여전히 다시 추론하거나 여러 곳을 수정해야 하는 의미가 있는지 설명하고, 유지 또는 채택한 개선의 이득·비용을 비교한다.
- 수정했다면 영향받은 hook 시나리오·정적 확인을 수행하고 동작 보존과 읽기·변경 부담의 차이를 각각 제시한다. 의미 있는 계약 변경은 별도 검증을 연결한다.
- 근거 있는 유지 또는 채택한 개선·검증을 마쳐야 완료다. 테스트 수와 과거 수락을 이번 판단의 대용으로 쓰지 않는다.

## 현재 상태와 실제 결과

2026-10-30 기록·과거 변경 diff·현재 Hook·화면 소비자·검사를 대조했고 현재 책임 분리는 유지했다. 사용자 지시에 따라 Hook·전체 계산을 상세 helper보다 먼저 읽게 배치했으며, 기존 여덟 함수의 본문과 제품 동작은 보존했다.

문서 경로 부재와 unmount 후 늦은 응답 테스트를 추가했다. 기존 9개를 포함한 11개가 통과했고, 각 보호 처리를 제거한 복사본에서는 새 테스트가 실패함을 확인했다. Prettier와 포맷 플러그인만 제외한 대상 ESLint는 통과했다. 전체 typecheck는 HEAD와 동일한 기존 8개 진단으로 실패하며 변경 파일 진단은 없다. 기본 ESLint의 기존 Prettier 호환 오류와 native 연결 미확인 범위는 유지한다.

별도 검증자의 근거 대조를 포함해 Main은 이번 Ticket의 검토·채택한 보완·필요한 확인을 완료로 판단했다. 기존 [검토 판단](../../../records/2026-10-30-04-storage-stats-review.md)과 [구현·검증 기록](../../../records/2026-10-30-05-storage-stats-improvement.md)에서 선택 이유·검사 방법·한계를 찾는다. Work 전체 완료나 사용자 수락을 뜻하지 않는다.
