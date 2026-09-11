# Ticket 03 테스트 환경 구축 결과

날짜: 2026-09-11
Workspace: `002-code-readability-refactoring`

이 기록은 [Ticket 03](../current/memory/tickets/03-storage-stats.md)의 실제 hook 특성화 테스트를 작성하기 전에 client 테스트 환경을 구축한 결과와 입증 범위를 보존한다. 도구와 소유 경계를 고른 이유는 앞선 [테스트 전략 기록](2026-09-11-02-storage-stats-test-strategy.md)이 소유한다.

## 구축한 환경

테스트 runtime은 `apps/client`가 소유한다. `apps/client/package.json`에 Jest 실행·watch·테스트 전용 typecheck script를 추가하고 다음 버전을 확정했다.

- Jest 29.7.0
- `jest-expo` 51.0.4
- `@testing-library/react-native` 13.3.3
- `@types/jest` 29.5.12
- `react-test-renderer` 18.3.1

`apps/client/jest.config.cjs`는 Expo preset, client `tests` 아래의 test match, `@/` source alias, pnpm·React Native·Expo package 변환 예외를 소유한다. 실행 환경이 Watchman의 사용자 LaunchAgent 경로를 쓸 수 없는 경우에도 같은 명령을 실행할 수 있도록 `watchman: false`를 명시했다.

`apps/client/tsconfig.test.json`은 Jest globals와 테스트 파일을 별도 compiler entrypoint로 둔다. client source 전체를 별도 include하지 않아 이번 설정 검증이 기존의 무관한 client type error에 막히지 않게 했으며, 테스트가 import하는 제품 source는 TypeScript module graph를 통해 계속 검사된다.

`apps/client/tests/setup/jest-environment.test.ts`는 React hook을 render하고 state를 갱신하는 최소 smoke test다. 이 파일은 Jest·Expo preset·React renderer·Testing Library의 연결만 확인하며 `useStorageStats`의 제품 동작을 검증하지 않는다.

테스트 파일에서 Jest globals를 인식하도록 client ESLint override를 추가했다. 기존 client ESLint 설정이 사용하는 `@repo/eslint-config`도 `apps/client`의 직접 devDependency로 선언해 workspace 의존 관계를 명시했다.

## 실행 중 확정한 조건

저장소의 `packageManager`가 지정한 pnpm 9.6.0으로 설치와 검증을 수행했다. 실행 환경의 다른 pnpm major version을 사용하면 virtual store link와 설치 동작이 달라질 수 있으므로, 이 테스트 환경의 재현 명령도 project-declared pnpm을 기준으로 한다.

처음 검토한 React Native Testing Library 12 계열은 deprecated API 경고를 발생시켰다. React 18.3.1·React Native 0.74.5·Jest 29를 지원하면서 React 19를 요구하지 않는 13.3.3으로 확정했다. React 19와 더 새로운 React Native를 전제로 하는 14 계열은 선택하지 않았다.

공용 `jest.setup`이나 전역 `__mocks__`는 만들지 않았다. Ticket 03의 첫 제품 테스트에서는 FileSystem과 Mapbox mock을 해당 테스트 파일에 두고, 다른 테스트에서도 같은 준비가 반복될 때 공용화를 다시 판단한다.

## 검증 결과

다음 검증을 project-declared pnpm 9.6.0 기준으로 수행했다.

- `corepack pnpm@9.6.0 --filter @apps/client test -- --runInBand`: 1 suite·1 test 통과.
- `corepack pnpm@9.6.0 --filter @apps/client test:typecheck`: 통과.
- 변경한 test·config 파일의 Prettier 검사: 통과.
- 변경한 client test·config 파일의 대상 ESLint 검사: `prettier/prettier` rule을 제외한 조건에서 통과.
- `git diff --check`: 통과.

client 기본 lint 전체 통과는 확인하지 못했다. 현재 `eslint-plugin-prettier`가 Prettier 3에서 제거된 `prettier.resolveConfig.sync`를 호출해 실패하며, 이번 테스트 설정에서 새로 만든 오류로 보이지 않아 별도 범위로 남겼다.

설치 과정에서는 기존 React Native 0.74.5와 React 18.3.1 조합의 peer warning, server의 `expo-sqlite` peer warning도 다시 나타났다. 이번 client 테스트 환경의 목적과 분리된 기존 workspace 상태이므로 dependency 정렬이나 server 변경은 하지 않았다.

## 이 결과가 보장하지 않는 것

현재 결과는 client에서 React hook test를 실행하고 테스트 파일만 별도로 typecheck할 수 있다는 것까지 보장한다. 아직 다음 항목은 입증하지 않았다.

- `useStorageStats`의 성공·부분 실패·중단·계속·refresh 동작 보존.
- 리팩터링 전후 결과가 같은지 여부.
- client source 전체의 typecheck와 기본 lint 통과.
- development build와 실제 기기에서 Expo FileSystem·Mapbox native module이 연결되는지 여부.

다음 작업은 `apps/client/tests/features/profile/hooks/useStorageStats.test.ts`에 Ticket의 보존 시나리오를 작성해 현재 구현을 먼저 특성화하는 것이다. 그 테스트가 통과한 뒤 표시값 조립 중복을 줄이고 같은 테스트로 동작 보존을 비교한다.
