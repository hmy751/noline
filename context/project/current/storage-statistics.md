# 저장 용량 집계의 현재 동작 경계

프로필의 SQLite·오프라인 지도 저장 용량 계산, 표시나 refresh 상태 연결을 수정할 때 읽는다. 이 본문은 2026-09-14 현재 [useStorageStats](../../../apps/client/src/features/profile/hooks/useStorageStats.ts)의 부분 결과·실패·비동기 적용 관계를 소유한다. 모든 hook이나 native 조회의 공통 정책으로 확대하지 않는다.

## 집계와 표시

Hook은 SQLite 파일과 Mapbox offline pack의 byte를 순서대로 모아 `dbSize`, `mapPackSize`, `totalSize` 문자열을 반환한다. SQLite에서는 `.db`, `.db-wal`, `.db-shm`만 더하고, Mapbox에서는 각 pack의 `completedResourceSize`를 더한다. 음수·`NaN`·무한대 같은 유효하지 않은 native byte 값은 합계에서 제외한다. 표시는 1,024 단위의 `B`·`KB`·`MB`·`GB`·`TB`를 사용하고 소수 한 자리로 정리한다.

[ProfileScreen](../../../apps/client/src/screens/ProfileScreen.tsx)은 현재 `dbSize`와 `mapPackSize`만 표시하며 `totalSize`는 공개 반환값과 검사에는 남아 있다. 새 표시를 추가하거나 반환 필드를 제거할 때에는 화면 consumer와 hook 검사를 함께 맞춘다.

## 실패 위치가 남길 결과를 결정한다

- document directory를 사용할 수 없거나 SQLite 파일 조회가 중간에 실패하면, 그때까지 모은 DB byte를 보존하고 Mapbox 조회는 시작하지 않는다.
- SQLite directory가 없으면 DB 합계 0을 정상 완료로 보고 Mapbox 조회를 계속한다.
- Mapbox `getPacks`가 실패하면 DB 결과를 보존하고 지도 합계를 0으로 둔다.
- 개별 pack의 `status`가 실패하면 해당 pack만 건너뛰고 다음 pack을 계속 더한다.

이 차이는 모두 실패를 0으로 만드는 하나의 catch나 무조건 병렬 조회로 바꾸면 사라진다. 흐름을 리팩터링할 때에는 성공 결과뿐 아니라 어느 단계에서 중단하고 어떤 부분 합계를 남기는지를 보존 계약으로 다룬다.

## React 상태와 검증 상한

초기 mount와 공개 `refresh`가 계산을 시작한다. 여러 refresh가 겹치면 가장 최근 요청의 결과만 state에 반영하고, unmount 뒤 끝난 native 요청은 state를 갱신하지 않는다. 병렬 조회, 공개 실패 상태나 새 단위 체계는 현재 계약에 포함되지 않는다.

[Hook test](../../../apps/client/tests/features/profile/hooks/useStorageStats.test.ts)는 FileSystem과 Mapbox를 대체해 빈 입력·파일 선별·표시, 부분 실패, 유효하지 않은 byte, refresh와 겹친 요청을 실제 hook에서 확인한다. 이는 Expo 파일 경로, Mapbox native pack, development build와 실제 기기 연결을 입증하지 않는다. Native API shape, 집계 순서, 반환 필드, Profile consumer나 최신 요청 적용 방식이 바뀌면 이 본문과 검사를 다시 대조한다.

완료 과정과 초기의 얕은 정리에서 보강된 이유는 Workspace 002 [Ticket 03](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/03-storage-stats.md), [리팩터링 실행 기록](../../work/workspaces/002-code-readability-refactoring/records/2026-09-11-04-storage-stats-refactor.md), [최초 범위 재확인](../../work/workspaces/002-code-readability-refactoring/records/2026-09-12-01-ticket-03-initial-scope-reanalysis.md)이 소유한다.
