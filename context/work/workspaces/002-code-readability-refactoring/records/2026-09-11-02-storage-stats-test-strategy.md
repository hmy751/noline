# Ticket 03의 테스트 전략과 설정 소유 범위

날짜: 2026-09-11
Workspace: `002-code-readability-refactoring`

이 기록은 Ticket 03의 테스트 범위, 기술 선택, 설정·디렉터리 배치와 monorepo 경계를 논의해 고른 이유를 보존한다. 현재 실행 기준은 [Ticket 03](../current/memory/tickets/03-storage-stats.md)이 소유하며, 이 기록 자체는 구현 착수·테스트 통과·Ticket 완료의 근거가 아니다.

이 결정 이후 확정된 버전·설정과 실제 검증 결과는 [테스트 환경 구축 결과](2026-09-11-03-storage-stats-test-setup.md)에 이어서 기록한다. 아래의 미실행 상태는 이 전략을 채택한 당시의 상태다.

## 채택한 기본안과 열린 세부 사항

주 자동 검증은 `apps/client` 안에서 Jest, `jest-expo`, `@testing-library/react-native`와 Jest module mock으로 실제 `useStorageStats` hook을 실행하는 방식으로 한다. 테스트는 `apps/client/tests/features/profile/hooks/useStorageStats.test.ts`처럼 별도 `tests` 아래 source 소유 구조를 따라 두고, 첫 시나리오 mock은 테스트 파일 안에 둔다. Jest 설정은 client가 소유하는 별도 `jest.config.cjs`에서 시작하며 root나 공용 test-config package로 올리지 않는다.

이는 첫 실행을 위한 기본안이다. 정확한 dependency 버전, `transformIgnorePatterns` 같은 변환 값, `tsconfig.test.json`, `jest.setup.ts`, 전역 `__mocks__`의 필요 여부와 development build smoke test의 플랫폼은 실제 설치와 테스트 오류를 근거로 확정한다. 논의에서 기본 방향은 채택됐지만 이런 실행 세부 값이나 Ticket 03의 다음 착수 순서까지 확정한 것은 아니다.

## 실제 hook을 주 검증 대상으로 고른 이유

`useStorageStats`는 표시 단위 계산만 하는 함수가 아니다. DB 파일 조회 중 실패하면 그때까지의 DB 합계를 남기고 Mapbox 조회를 시작하지 않으며, `getPacks` 실패에서는 DB 결과를 유지하고, 개별 `pack.status` 실패 뒤에는 다음 팩을 계속 조회한다. `refresh`를 호출하면 이 흐름 전체를 다시 실행한다. 실제 hook 검사는 계산 결과와 함께 이 부분 결과·중단·계속 계약을 한 경계에서 확인할 수 있다.

순수 계산 helper를 분리해 단위 테스트하는 방식은 단위 변환 사례를 빠르게 확인하기에는 좋지만, hook의 의존성 호출과 실패 정책까지 증명하지 못한다. 따라서 helper 검사는 필요하면 보조로 사용하고 실제 hook 검사를 대신하지 않는다. 내부 helper의 존재나 모든 호출 순서를 고정하지 않고 결과와 중요한 중단·계속 조건을 검사한다.

`ProfileScreen` 전체 렌더 검사는 화면 연결까지 넓게 확인할 수 있지만 이 Ticket에서 화면 코드를 바꾸지 않으며 mock과 렌더 준비 비용이 커진다. snapshot은 부분 실패의 의미를 직접 설명하지 못한다. Maestro·Detox 같은 E2E는 native 연결을 넓게 확인할 수 있지만 이번 작은 리팩터링의 빠른 회귀 검사로는 무겁다. 따라서 화면 전체 렌더·snapshot·E2E를 주 자동 검사로 삼지 않고, 실제 Expo 파일 경로와 Mapbox native pack은 development build의 선택적 smoke test로 보완한다.

## 테스트 도구 선택의 tradeoff

Jest와 `jest-expo`는 Expo·React Native 변환과 mock 생태계를 활용해 hook을 실제 React 환경에서 실행하기에 적합하다. `@testing-library/react-native`의 hook 도구로 mount·비동기 갱신·refresh를 관찰할 수 있다. 반면 native module mock과 Expo SDK 51에 맞는 설치·변환 설정을 확인해야 하므로, 패키지 이름을 정한 것만으로 호환성이 입증되지는 않는다.

Vitest는 빠르고 TypeScript 경험이 좋지만 이 client의 Expo·React Native 변환과 native mock 체계를 별도로 맞춰야 한다. Node 내장 test runner는 새 dependency가 적고 순수 함수 검사에는 충분하지만 React hook lifecycle을 직접 다루기에는 추가 장치가 필요하다. 두 선택지는 순수 로직만 분리해 검사할 때 다시 고려할 수 있으나, 이번 실제 hook 검사의 기본 도구로는 선택하지 않았다. 이 판단을 `packages/schema` 같은 Node 성격 package에 일반화하지 않는다.

## 설정과 디렉터리 선택의 tradeoff

Jest 설정을 `apps/client/package.json` 안에 둘 수도 있지만 alias, pnpm package 변환, setup 파일 같은 항목이 늘어나면 package metadata와 테스트 설정이 섞인다. 별도 `apps/client/jest.config.cjs`는 설정 책임과 변경 diff를 분리하고 복잡해질 여지를 감당하기 쉽다. 의존성과 실행 script는 계속 `apps/client/package.json`이 소유한다.

테스트를 source 파일 옆에 둘 경우 구현과 함께 찾기 쉽지만, 현재 client의 제품 source와 테스트 전용 타입·mock의 경계가 섞일 수 있다. 별도 `apps/client/tests/`는 router·제품 source와 테스트 기반을 구별하면서 `features/profile/hooks`처럼 source의 책임 구조를 그대로 따라갈 수 있다. 이 이유로 별도 디렉터리를 기본안으로 골랐다.

`tsconfig.test.json`은 Jest globals와 test helper 타입을 제품 typecheck에서 분리할 수 있지만, 첫 테스트에 반드시 필요한지 확인하지 않고 설정 파일을 늘릴 이유는 없다. 실제 typecheck 충돌이 나타나면 추가한다. 같은 이유로 `jest.setup.ts`, 전역 `__mocks__`, fixtures 체계와 coverage threshold도 첫 테스트부터 만들지 않는다. 두 번째 반복 사례가 생기거나 여러 테스트가 같은 준비를 복제할 때 공용화를 다시 판단한다.

## monorepo 경계

이번 테스트의 runtime은 Expo·React Native client이므로 Jest 관련 devDependency, config와 script는 `apps/client`가 소유한다. root에 이를 올리면 `packages/schema`의 Node runtime과 `packages/ui`의 React Native 성격까지 같은 도구로 묶는 인상을 주므로 이번에는 root dependency, root `tests/`, 공용 test-config package와 root 테스트 집계를 만들지 않는다. 각 package는 실제 테스트가 생길 때 자기 runtime에 맞는 구성을 선택한다.

client config에서는 `@/`를 client src에 연결하되 `@repo/*`는 package exports와 build 경계를 유지한다. 테스트 편의를 위해 workspace package를 source에 강제로 연결하면 실제 package 소비 방식과 다른 경로를 검증하게 될 수 있다.

`packages/schema/package.json`에는 실패하도록 작성된 placeholder `test` script가 있는 것을 Main이 직접 확인했다. 따라서 현재 상태에서 무심코 `pnpm -r test`를 root 기본 명령으로 두지 않는다. 다만 이번 논의에서 실제 recursive test 명령을 실행한 것은 아니다.

## 가독성 기준의 해석

“함수 분리 후 실패 결과를 더 많은 파일에서 찾아야 한다면 개선 여부를 다시 본다”는 함수 분리를 금지하는 말이 아니다. 이번 문제는 작은 표시값 조립 중복이다. 이를 없애면서 부분 결과 보존과 실패 시 중단·계속 정책까지 여러 파일이나 adapter로 흩어 놓으면 독자가 실패 결과를 이해하려고 더 많은 위치를 추적해야 한다. 같은 hook 파일 가까이의 명확한 helper나 단일 조립 지점은 허용하되, 수정 위치가 줄었는지와 실패 정책을 가까이에서 읽을 수 있는지를 함께 비교한다.

## 확인한 범위와 아직 하지 않은 일

Main은 `useStorageStats`, `ProfileScreen`과 `packages/schema/package.json`의 현재 내용을 직접 확인했다. `ProfileScreen`은 DB·지도 용량을 표시하고 `totalSize`는 현재 UI에서 소비하지 않는다. 이번 범위에서는 표시 항목을 추가하거나 반환 필드를 제거하지 않는다.

dependency 설치, 제품 코드·테스트·config 변경, 테스트 실행, config 호환 확인, lint/typecheck와 실제 기기 검증은 아직 수행하지 않았다. 선택한 버전과 module mock의 작동 여부, Ticket에 적은 보존 사례의 실제 결과는 실행 때 확인해야 한다.
