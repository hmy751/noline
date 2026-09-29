# 일정 화면 Query 복귀와 변경 후 갱신 구현

사용자는 “기록 커밋하고 구현 시작해봐”라고 요청했다. 정책·논의 기록 8개 파일을 `56f38cc`로 커밋한 뒤 2-A 제품 작업을 진행했다. 이 기록 시점에 제품 코드는 미커밋이며 2-B·2-C는 구현하지 않았다. 현재 실행 상태와 완료 기준은 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md)이 소유한다.

## 복잡도를 줄인 곳과 필요한 보완

[채택 방향](2026-09-29-02-schedule-recovery-query-sync-decision.md)에 따라 복구 성공 전 캐시를 가리던 미커밋 로직을 교체했다. `useScheduleContent`는 접근 정책과 실제 연결로 Query enabled를 정하고, 기존 데이터가 있으면 즉시 표시한다. 별도 Recovery 상태·이전 Promise 대기·QueryCache 성공 구독이 필요 없어졌다. 유효한 캐시는 강제 갱신하지 않고 stale·무효화·데이터 없음의 조회는 Query에 맡긴다. 최초 실패와 빈 목록, 지도 날짜·일정 선택 보존은 유지했다.

재조회 실패 안내를 묻자 사용자는 “안내 재시도가 복잡도가 높나?”라고 물었다. Main은 기존 Query 상태와 refetch를 사용하므로 별도 복구 상태·sync 대기가 필요 없다고 설명하고, 기존 내용과 작은 실패 안내·재시도를 함께 표시하는 기본안으로 구현했다. 이는 Main의 구현 선택이며 사용자 최종 수락 발언으로 바꾸어 기록하지 않는다. 재시도 중에는 안내 버튼을 숨기고 기존 내용을 유지한다.

sync의 push는 실제 서버 쓰기가 하나라도 성공했는지 기록하고 finally에서 변경 후 갱신을 요청한다. 뒤 전송이나 로컬 큐 삭제가 실패해도 이미 성공한 서버 변경은 반영 대상이다. pull의 성공·활성 여행 존재 여부에만 의존하지 않는다. pull 뒤에도 기존 trip·schedule·expense 범위의 보수적인 무효화를 유지한다.

설치된 Query는 캐시 없는 최초 조회가 진행 중일 때 invalidate만으로 이전 Promise를 공유할 수 있다. 따라서 두 변경 경계에서 먼저 Query를 취소하고 무효화한다. 화면 GET 완료까지 기다리지 않으며 sync 성공을 GET 성공에 묶지 않는다. 추가 조회는 허용한다. 비활성 일정 목록만 cancelRefetch false로 공유하던 미커밋 예외는 제거했다.

같은 이유로 여행 활성화·비활성화 성공 callback의 일정 무효화 앞에도 취소를 추가했다. 해당 여행의 Local/Remote 전환 전에 시작한 조회가 새 출처의 결과를 덮지 않게 하는 범위다. 모든 entity mutation·query key·cleanup을 재설계하지 않았다. Query의 결과 채택 취소와 실제 HTTP 전송 중단은 구별하며, 후자를 이번 구현의 보장으로 주장하지 않는다.

## 검사 결과와 입증 범위

Main은 제품 코드를 직접 변경하고 아래 검사를 실행했다.

- client 전체 Jest: **39개 suite·354개 test 통과**. 실행 명령은 client 디렉터리에서 `node ../../node_modules/jest/bin/jest.js --config jest.config.cjs --runInBand`다.
- 화면 검사는 실제 ScheduleScreen·일정 Query·지도 container를 사용하고 repository·native 지도·활성 조회 등을 mock했다. 캐시 즉시 표시, stale·무효화 조회, 제한 복귀, 최초 오류와 빈 결과, 재조회 실패·재시도와 지도 선택 보존을 확인한다. 기존 인증·입력 보존 검사도 전체 실행에 포함됐다.
- [sync 검사](../../../../../apps/client/tests/shared/services/sync/query-refresh.test.ts)는 실제 pushChanges·syncData와 QueryClient/Observer를 사용한다. mock 서버·큐·DB로 pull 생략·실패, 부분 push 성공, 서버 쓰기 뒤 큐 삭제 실패, 캐시 유무와 이전 GET, 미구독 Query와 조회 완료를 기다리지 않는 sync를 확인했다.
- [활성 전환 검사](../../../../../apps/client/tests/entities/trip/activation-query-refresh.test.ts)는 실제 두 mutation의 성공 callback과 QueryClient를 연결한다. useMutation과 DB/서비스는 mock이므로 native transaction 전체를 실행한 결과가 아니다.
- 타입 검사 `node ../../node_modules/typescript/bin/tsc --project tsconfig.json --noEmit`은 기존 `mapbox.ts` 좌표 tuple과 `offline-map/download.ts`의 OfflinePack 필드 오류 3개로 실패했다. 새 테스트의 Axios mock 타입 오류는 수정했고 마지막 검사에는 위 기존 오류만 남았다.
- 변경 파일 Prettier 형식 검사는 통과했다. ESLint 기본 실행은 기존 plugin의 `prettier.resolveConfig.sync` 충돌로 실행되지 않았다. 해당 규칙만 끈 검사에서 오류 0개·기존 지도 경고 4개를 확인했다. 설정이나 의존성은 바꾸지 않았다.

초기 화면 검사의 한 실패는 선택한 날짜가 이미 표시된 상태에서 비동기 Query 결과의 일정 선택 보정을 기다리지 않은 테스트였다. 새 데이터 반영과 일정 선택을 함께 기다리도록 고친 뒤 통과했다. 이는 요청을 한 번으로 고정하거나 새 조회까지 캐시를 숨기는 예전 기대를 유지한 검사가 아니다.

실기기 네트워크 변화·native DB·지도·실서버/OAuth/SecureStore 전체 검증은 하지 않았다. 앞선 기록의 이전 구현 테스트 수와 이번 수는 검사 기대를 재구성한 서로 다른 코드 상태의 결과다. 2-A UX·제품 커밋과 Ticket 전체 완료 수락은 아직 남는다.
