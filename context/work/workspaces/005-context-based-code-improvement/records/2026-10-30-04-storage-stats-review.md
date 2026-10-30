# 저장 용량 Hook 기록·코드 대조 검토

2026-10-30. 사용자 요청: “그래 1번 저장 용량 Hook부터 기록이랑 코드 대조해서 검토해봐”. 기준 판본은 `07d14d2`이며 검토 시작 시 제품 tracked 변경은 없었다.

## 판단

기존 책임 분리는 유지한다. SQLite 집계와 중단 여부, Mapbox의 팩별 실패, 표시 변환, React의 결과 적용이 각각 독립된 변경 이유를 갖고 같은 파일에서 연결된다. 현재 사용 경로의 계약 위반이나 재현된 제품 결함은 발견하지 않았다. 보완 추천은 전체 흐름을 먼저 읽을 수 있는 함수 배치와 중요한 검사 공백 두 가지다. 이번 요청에서는 검토·기존 검사 재실행·기록을 수행했으며 제품 코드나 테스트를 수정하지 않았다. Ticket 전체 완료는 아니다.

## 기록과 실제 결과

[당시 최종 기록](../../002-code-readability-refactoring/records/2026-09-11-04-storage-stats-refactor.md), [최초안 재확인](../../002-code-readability-refactoring/records/2026-09-12-01-ticket-03-initial-scope-reanalysis.md), [당시 Ticket](../../002-code-readability-refactoring/current/memory/tickets/03-storage-stats.md)을 [현재 Hook](../../../../../apps/client/src/features/profile/hooks/useStorageStats.ts), [화면](../../../../../apps/client/src/screens/ProfileScreen.tsx), [테스트](../../../../../apps/client/tests/features/profile/hooks/useStorageStats.test.ts)와 대조했다. 최초 적용의 세부 순서는 보존된 재확인 기록에서 읽었으며 원래 runtime 대화를 다시 열람한 것은 아니다. Git의 `a147a42` diff에서는 기존 단일 계산 함수와 최종 책임 분리의 실제 차이를 확인했다. 이후 Hook 변경 `5b707e9`는 경고 문구의 한국어화다.

| 기록·계약의 주장 | 현재 코드와 사용처 | 이번 근거 |
| --- | --- | --- |
| DB 중간 실패 시 부분 합계 보존·지도 조회 중단 | `collectDatabaseSize`가 bytes와 completed를 반환하고 `calculateStorageStats`가 중단을 판단한다. | 실제 Hook 테스트의 DB 1 KB 보존, 뒤 DB 파일·Mapbox 미호출 확인. |
| SQLite 디렉터리 없음과 문서 경로 부재는 다름 | 전자는 완료한 0 byte, 후자는 미완료여서 지도 조회를 중단한다. | 전자는 테스트, 후자는 코드 대조만 수행. |
| 지도 목록 실패와 개별 팩 실패는 다름 | 목록 실패는 계산 함수에서 DB만 반환한다. 팩 상태 실패는 반복문 내부에서 해당 팩을 건너뛴다. | 두 시나리오의 결과와 다음 팩 진행 테스트. |
| 유효한 크기·단위·공개 결과 유지 | finite·비음수 방어, 1,024 단위·소수 한 자리·TB 상한, 세 문자열 조립 한 곳. | 테스트는 NaN·음수 및 B·KB를 확인한다. Infinity·상위 단위 경계는 코드 대조만 했다. |
| 최신 요청만 state 반영·unmount 후 늦은 응답 무효화 | 요청마다 번호를 늘리고 결과 적용 전에 비교한다. effect cleanup도 번호를 늘린다. | 완료 순서를 역전한 겹친 refresh 테스트는 존재·통과. unmount 자체를 실행하는 테스트는 없다. |
| Profile은 DB·지도 값만 소비 | `stats.dbSize`, `stats.mapPackSize`만 infoItems에 연결한다. `refresh`·`totalSize`를 사용하지 않는다. | source 사용처 검색과 화면 본문 대조. 화면 통합 테스트는 Hook을 mock하므로 실제 연결 검증으로 세지 않았다. |

Unmount는 이미 시작한 요청의 결과 적용을 막는 경계다. native 작업 자체를 취소하지 않으며, 화면 focus마다 재조회하는 계약도 없다. 현재 유일한 화면 소비자가 refresh를 보관하거나 unmount 뒤 호출하는 경로는 발견하지 않았다. 이런 새 사용 조건을 현재 결함으로 확대하지 않는다.

## 새 Context로 비교한 선택

[코드 표현](../../../../personal/development/code-expression/INDEX.md)의 전체 흐름에서 상세로 내려가는 기준, [계약과 수명](../../../../personal/development/contracts-and-lifetime/INDEX.md)의 실패 의미·상태 적용 수명, [제품 계약](../../../../project/current/storage-statistics.md)과 [동작 보존 기준](../../../../project/guidance/behavior-preserving-refactoring.md)을 적용했다.

현재 파일은 byte 검사·포맷·집계 helper가 먼저 나오고 전체 계산 함수가 100행, 공개 Hook이 117행에서 시작한다. 첫 읽기에서 세부 구현을 지난 뒤 전체 연결을 알게 되고 다시 위의 helper로 이동한다. 타입·상수 뒤에 Hook과 계산 흐름을 놓고 아래에 수집·표시 상세를 두는 배치를 추천한다. 함수 선언과 호출·실패 경계를 보존하면 동작 변경 없이 읽는 순서를 개선할 수 있다. 이득은 제한적이지만 새 파일·타입·옵션을 늘리지 않고 얻을 수 있다. 고정 public/private 순서라는 일반 규칙을 만들지는 않는다.

더 많은 helper나 파일 분리는 현재 하나뿐인 실제 소비자에 재사용 이득이 없고, 실패 정책을 찾을 경로를 늘린다. 공유 누적 객체로 바꾸면 어느 helper가 값을 바꿨는지 추적해야 한다. DB와 지도를 병렬화하면 DB 실패 때 Mapbox를 시작하지 않는 계약이 바뀐다. 공개 오류 상태·focus 재조회·totalSize 제거는 현재 동작을 넘어서는 선택이므로 이번 구조 개선안에 넣지 않는다.

검사 보완의 우선 대상은 unmount 뒤 늦은 응답과 `documentDirectory` 부재다. 둘 다 이미 명시된 동작인데 현재 아홉 테스트가 직접 지나가지 않는다. 특히 unmount 후 경고가 없거나 화면이 다시 그려지지 않는다는 확인만으로 Hook이 상태 반영을 차단했다고 단정하지 말고, 차단을 제거했을 때 실패하는 관찰 방법을 선택해야 한다. 상위 단위·Infinity는 표시·유효성 로직을 수정할 때 추가할 경계로 남긴다.

## 실행 근거와 다음 행동

`apps/client`에서 설치된 Jest를 직접 실행했다.

```text
node ../../node_modules/jest/bin/jest.js --config jest.config.cjs --runInBand --runTestsByPath tests/features/profile/hooks/useStorageStats.test.ts
Test Suites: 1 passed, 1 total
Tests: 9 passed, 9 total
```

2026-10-30 실행 결과다. 과거 통과 수치를 이번 근거로 대신하지 않았다. FileSystem·Mapbox는 mock이며 실제 기기·native pack·Expo 경로는 확인하지 않았다. 제품 변경이 없어 전체 client 검사·lint·typecheck는 실행하지 않았다. 별도 검증자나 durable Verify도 실행하지 않았다.

다음 실행은 같은 [Ticket 01](../current/memory/tickets/01-storage-stats-responsibilities.md) 안에서 읽기 순서와 두 검사 공백을 보완하고 관련 결과를 확인하는 것이다. 이번 검토를 새로운 구현 Ticket으로 나누거나 Ticket 02로 자동 전환하지 않는다.
