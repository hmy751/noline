# Ticket 03 특성화 테스트와 저장 용량 리팩터링

날짜: 2026-09-11
Workspace: `002-code-readability-refactoring`

이 기록은 [Ticket 03](../current/memory/tickets/03-storage-stats.md)의 테스트 설정을 에디터 진단과 맞게 보완한 과정, 실제 hook의 변경 전 동작 확인, 리팩터링 선택과 검증 결과를 보존한다. 최초 테스트 runtime을 고른 이유와 당시 입증 범위는 앞선 [테스트 환경 구축 기록](2026-09-11-03-storage-stats-test-setup.md)이 소유한다.

## 설정 보완과 에디터 진단

최초에는 `apps/client/tsconfig.test.json`으로 테스트만 검사했지만 Cursor가 해당 파일을 client project와 같은 방식으로 해석하지 않아 CLI와 에디터의 Jest global·alias 진단이 달라졌다. 테스트만 통과하는 별도 진입점을 유지하지 않고 `apps/client/tsconfig.json`의 include에 `tests`를 넣어 제품 source와 테스트가 하나의 client TypeScript project를 사용하도록 바꿨다. `test:typecheck`도 이 설정 전체를 검사하므로 기존 source 오류를 숨기지 않는다.

테스트는 `@jest/globals` 29.7.0을 client 직접 devDependency로 선언하고 global API를 명시적으로 import한다. CSS import는 `apps/client/global.d.ts`가 선언한다. Cursor 내장 TypeScript 6.0.3에서 deprecated `moduleResolution=node10` 진단이 발생한 공용 React Native 설정은 `packages/typescript-config/src/react-native.json`의 값을 `bundler`로 바꿨다. 이는 client와 UI가 공유하는 owner에서 수정했으며 UI와 schema의 직접 `tsc --noEmit`을 함께 확인했다.

설치 상태는 저장소가 선언한 pnpm 9.6.0으로 다시 설치해 현재 lockfile과 workspace dependency graph에 맞췄다. hoisted 배치 자체를 오류 원인으로 단정하지 않았고, 실제 Jest 에디터 오류는 에디터 compiler·프로젝트 포함 범위·ambient global 의존·느슨한 mock type을 같은 조건에서 재현해 각각 수정했다.

## 변경 전 동작과 테스트 범위

실제 hook을 module mock으로 실행하는 특성화 테스트를 먼저 작성했다. 최초 6개는 다음 계약을 고정했다.

- DB·WAL·SHM만 합산하고 무관한 파일은 조회하지 않는다.
- 0 B, KB와 소수 단위 및 DB·지도·전체 합계를 표시한다.
- DB 파일 조회 중 실패하면 그때까지의 합계를 남기고 Mapbox 조회를 시작하지 않는다.
- `getPacks` 실패에서는 DB 합계를 남긴다.
- 개별 `pack.status` 실패 뒤에도 다음 팩을 계속 합산한다.
- `refresh`는 현재 값을 다시 조회한다.

프로덕션 수준의 같은 파일 개선으로 범위를 구체화하면서 세 시나리오를 추가했다. DB 디렉터리가 없으면 정상적인 0 B 결과로 보고 지도 팩을 계속 조회하는 조건, native module이 준 음수·`NaN` 크기를 합산하지 않는 조건, 여러 새로고침이 겹치면 가장 최근 요청의 결과가 남는 조건이다. 최종 hook 시나리오는 9개다.

## 채택한 코드 구조

처음 검토한 최소안은 성공·실패의 stats 조립을 한 helper와 `finally`로 모으는 정도였다. 중복 수정 위치는 줄지만 SQLite 탐색, Mapbox 집계, 부분 실패 정책과 React 상태 갱신은 계속 한 함수 안에 남아 있었다. 이후 공유 누적 객체를 여러 helper가 수정하는 안도 함수 수만 늘리고 값의 변경 경로를 숨겨 채택하지 않았다.

최종 구현은 새 파일이나 adapter를 만들지 않고 `useStorageStats.ts` 안에서 다음 책임을 나눴다.

- SQLite 집계는 부분 byte 합계와 완료 여부를 반환한다. 상위 계산 함수가 이 값을 보고 Mapbox 진행 여부를 결정한다.
- Mapbox 집계는 팩 목록을 가져오고 개별 팩 실패만 가까이에서 처리해 다음 팩을 계속한다.
- byte 유효성 확인과 표시 변환, 세 표시값 조립은 I/O 흐름 밖의 작은 함수가 맡는다.
- hook은 초기 조회와 공개 `refresh`, React 상태 반영만 맡는다.

DB 실패 시 Mapbox를 시작하지 않는 기존 순서, `getPacks` 실패 시 DB 결과 보존, 개별 팩 실패 후 계속이라는 정책은 유지했다. 반면 `documentDirectory` 부재와 유효하지 않은 native 크기는 명시적으로 방어하고, 기존 단위 목록의 최댓값을 넘는 크기도 마지막 단위로 표시해 `undefined` 단위가 나오지 않게 했다. 외부 반환 필드와 단위 체계는 바꾸지 않았다.

React 연결에서는 `refresh`를 `useCallback`으로 안정화하고 effect가 해당 callback을 dependency로 사용한다. `useRef`의 요청 번호로 최신 요청만 상태에 반영하고 cleanup에서 진행 중 요청을 무효화한다. 이로써 초기 조회와 수동 새로고침이 겹치거나 component가 unmount된 뒤 native 응답이 도착해도 오래된 결과를 반영하지 않는다. 최신 요청 유지 동작은 완료 순서를 역전한 테스트로 확인했다.

## 검증 결과와 한계

- 저장 용량 hook 테스트: 1 suite·9 tests 통과.
- 현재 작업트리의 전체 client Jest: 3 suites·18 tests 통과. 이 수치에는 별도 변경 중인 expense 테스트가 포함되며 Ticket 03의 소유 결과는 저장 용량 9 tests다.
- 변경한 hook·테스트의 대상 ESLint: warning과 error 없이 통과. client 기본 lint 전체는 기존 `eslint-plugin-prettier`와 Prettier 3 호환 오류 때문에 확인하지 못했다.
- 변경한 hook·테스트의 Prettier 검사와 `git diff --check`: 통과.
- 프로젝트 TypeScript 5.3.3과 Cursor TypeScript 6.0.3: 변경한 hook과 테스트에는 진단 없음. client 전체에는 기존 source 오류 3개가 남아 전체 `test:typecheck`는 실패한다.
- `packages/ui`와 `packages/schema`에서 직접 실행한 `tsc --noEmit`: 통과.

남은 client source 진단은 `src/shared/lib/mapbox.ts`의 좌표 tuple 1개와 `src/shared/services/offline-map/download.ts`의 `OfflinePack.size`, `OfflinePack.tileCount` 2개다. 이번 Ticket과 직접 관련되지 않아 고치거나 제외하지 않았다. mock 기반 검증은 실제 Expo FileSystem 경로, Mapbox native pack, development build와 실제 기기 연결을 보장하지 않는다.

개선 효과는 단순 줄 수 감소가 아니다. 변경 전에는 한 함수에서 I/O 두 종류·실패 경계·표시 변환·React state를 함께 따라가야 했고 stats 객체도 성공과 실패에서 따로 조립했다. 변경 후에는 상위 계산 함수에서 DB 중단과 Mapbox fallback을 읽을 수 있고, 개별 팩 계속 정책은 Mapbox 함수 가까이에 있으며, 표시 조립과 React의 최신 요청 반영 위치가 각각 한 곳이다. 이 구조가 다시 여러 파일이나 범용 adapter로 확장돼 실패 결과를 찾기 어려워지면 Ticket 기준에 따라 개선 여부를 재검토한다.
