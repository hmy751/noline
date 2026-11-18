# 03 — SDK 51→54로 올린다 (Legacy 유지, 출시 안 함)

**상태:** 진행 중 (2026-11-18 시작). SDK 52·53을 브랜치 `feat/012-sdk54`에 커밋했고 다음은 SDK 54다. 일정은 12월이었지만 02가 끝나 앞당겼다. 결과는 아래 [현재 상태와 실제 결과](#현재-상태와-실제-결과)에 있다.

## 맡은 결과와 범위

New Architecture를 켜지 않은 채 앱을 SDK 54(RN 0.81.5, React 19.1)로 올리고, 지금과 똑같이 동작하게 한다. 그동안 섞여 있던 버전과 의존성 구조를 같이 정리해, 04가 "아키텍처 전환" 하나만 바꾸게 한다. 이 단계는 출시하지 않으며 짧게 지나간다. reanimated 3.19.x는 유지보수가 끝난 버전이라 이 상태로 오래 있으면 안 된다.

이 Ticket이 끝나면 다음이 성립한다.
- 앱이 SDK 54·React 19로 빌드되고, 실기기 점검표가 기준선과 같다.
- 기기 DB 묶음(expo-sqlite 16, drizzle ≥0.36.2)이 들어갔고, 1.1.4 데이터 위에 덮어 설치해도 보존된다(02의 판정을 실제 앱으로 다시 확인).
- `npx expo install --check`가 SDK 54 기준으로 통과하거나, 남은 차이마다 이유가 있다(reanimated 3.19.x는 `expo.install.exclude`로).
- client와 `packages/ui`가 react·react-native·reanimated를 한 버전으로 쓰고, 설치 결과에 React·RN이 하나씩만 있다.
- EAS 빌드가 Node 24로 돈다.

Spec과의 연결: [완료 판단](../spec/04-quality-and-completion.md)의 6(의존성 정합), 9(재발 방지 중 `expo install --check`·`engines`), 10(EAS Node), 11(중복 없음)을 SDK 54에서 맡는다. 05가 SDK 58에서 다시 확인한다.

## 실행 맥락과 접근

**선행:** 02의 DB 판정이 성공이어야 시작한다(멈춤 조건). 01의 기준선과 점검표가 있어야 비교할 수 있고, 01에서 패키지 설치 절차가 정해져 있어야 한다.

**SDK를 한 단계씩 올린다.** Expo 권장("We recommend upgrading SDK versions incrementally, one at a time")에 따라 51→52→53→54로 간다. 중간 단계는 로컬 빌드와 검사로 확인하고, EAS preview 빌드는 Ticket 끝에 한 번 돌린다. 각 단계에서 무엇을 바꿨고 무엇이 깨졌는지 아래 상태 절에 남겨 이어 갈 수 있게 한다.

**SDK 54에서 함께 맞출 묶음.** 버전 근거는 [라이브러리 호환 조사](../../../source/library-compatibility-2026-11-17.md)의 "SDK 54 (Legacy 단계)" 열이다. 02에서 확정한 표가 있으면 그것을 따른다.
- **React 19:** react·react-dom 19.1, `@types/react` ~19.1, react-test-renderer 19.1, jest-expo 54, lucide-react-native ≥0.511, react-native-web 0.21, nativewind ≥4.2.2
- **기기 DB:** expo-sqlite 16, drizzle-orm ≥0.36.2(0.30의 타입이 사라진 `expo-sqlite/next`를 참조), `expo-file-system/legacy` import
- **Legacy 유지:** reanimated 3.19.x + `expo.install.exclude`(worklets는 넣지 않는다), rnmapbox 10.1.4x(native Mapbox v10 유지), react-native-maps 1.20.1, screens 4.16
- **빌드:** EAS `base.node` 24, `expo-dev-menu` patch 제거(새 dev-client에는 적용되지 않는다), Sentry ~7.2, TS ~5.9
- **의존성 구조 정리:** `packages/ui`의 react·react-native·reanimated를 peer로 바꾸고 root의 react 선언을 지운다. `packages/eslint-config`의 react 선언도 맞춘다. 2025-10에 reanimated가 두 버전으로 갈린 원인이 이 구조였다.
- **이미 어긋난 것:** tailwind-merge 3 → 2.6.x(Tailwind 3과 맞춤), 쓰지 않는 react-native-monorepo-tools·tailwindcss-animate 제거, expo-splash-screen 중복(31.0.10과 0.27.7) 해소
- **재발 방지:** `expo install --check`를 검사에 넣고, `engines`(`"node": ">=24"`)를 넣는다. 정확한 위치(script, 문서)는 실행하며 정한다.

**설치 절차.** 패키지는 01에서 확정한 방식으로 넣는다: `apps/client`에서 `pnpm exec expo install <패키지>`(`npx`로 감싸지 않는다). SDK 상향은 `CI=1 pnpm exec expo install expo@~5x.0.0` 뒤 `--fix`로 했고, 2026-11-18 SDK 52·53에서 동작했다.

**실행하며 정할 것:** 52·53에서 각각 확인할 범위, `--check` 검사의 형태, ui peer 전환 방식.

## 완료 조건과 확인 방법

- 51→52→53→54 각 단계의 로컬 빌드·검사 결과가 남아 있다.
- 마지막 EAS preview 빌드(Node 24)에서 실기기 점검표 6항목이 기준선과 같다.
- 1.1.4 preview에 데이터를 넣은 상태에서 이 빌드를 덮어 설치해 로그인·여행 데이터·미전송 변경·오프라인 지도가 남는다.
- client lint·test·typecheck와 ui lint, server·schema 검사가 기준선과 같거나 더 낫다. 실패가 늘었다면 원인과 처리가 적혀 있다.
- `npx expo install --check`가 통과하거나 차이마다 이유가 있다. 설치 결과에 react·react-native가 한 버전씩만 있다(`pnpm why` 등으로 확인).
- `release/1.1`의 핫픽스 경로는 그대로다(main만 바뀌었다).

## 현재 상태와 실제 결과

2026-11-18 사용자의 "03 시작"으로 시작했다. 작업 위치는 main `ff51ecd9`에서 분기한 worktree `.claude/worktrees/012-sdk54`, 브랜치 `feat/012-sdk54`다(push 안 함, main·`release/1.1` 무변경). 상세와 원문은 [SDK 52·53 진행 기록](../../../records/2026-11-18-07-ticket03-sdk52-53.md)에 있다.

| 단계 | 커밋 | 주요 버전 | 검사 결과 | 네이티브 |
| --- | --- | --- | --- | --- |
| 51→52 | `8bfe21e1` | expo 52.0.49, RN 0.76.9, React 18.3.1, expo-router 4.0.22, expo-sqlite 15.1.4, reanimated 3.16.x, dev-client 5.0.20, drizzle-orm 0.45.4 | client test 920 통과, typecheck 6, lint client 11·ui 25 errors, schema·server 통과(모두 기준선과 같음). `expo install --check` 통과(Sentry 제외) | 시뮬레이터 Release 0 errors(fmt 우회 뒤), 실행해 기존 시뮬레이터 데이터 표시 확인 |
| 52→53 | `668d4e73` | expo 53.0.27, RN 0.79.6, **React 19.0.0**, expo-router 5.1.11, expo-sqlite 15.2.14, reanimated 3.17.5, jest-expo 53.0.14, TS ~5.8.3 | client test 920 통과, typecheck 5(기준선보다 1 적음, TimeField 오류 사라짐), lint 같음, schema·server 통과. react·react-native 한 벌씩 | 시뮬레이터 Release 0 errors, 설치·실행. 앱 화면은 보지 않음(사용자 중지 요청) |
| 53→54 | — | — | — | — |

**Ticket과 달라진 배치**
- **52로 앞당긴 것:** `expo-dev-menu` patch 삭제(dev-client 5에서 `ERR_PNPM_PATCH_NOT_APPLIED`로 설치를 막음), `packages/ui` peer 전환과 root react 삭제(RN 두 벌 때문에 테스트 171개 실패), drizzle-orm ~0.45.4(0.30의 타입이 expo-sqlite 15에서 사라진 `expo-sqlite/next`를 참조). ui peer는 react·react-dom `>=18.3.1`, react-native `>=0.74.5`, reanimated `>=3.10.0`이다. 서버 drizzle은 0.29.5를 유지했다.
- **React 19는 53에서 들어왔다.** 54 묶음의 react 19.1·`@types/react` ~19.1·react-test-renderer 19.1은 54에서 맞춘다.
- **최소 iOS 15.1:** SDK 52의 expo-build-properties 0.13이 15.1 이상을 요구해 15.0 → 15.1로 올렸다. 16.4는 05의 SDK 56 단계 그대로다.
- **Sentry 6.22는 `expo.install.exclude`:** Xcode 26 컴파일 때문에 일부러 높인 버전이라 Expo 기대치(SDK 52 기준)로 내리지 않았다. 54 묶음의 Sentry ~7.2로 갈 때 다시 본다.

**새로 넣은 임시 처리와 설정**
- **fmt consteval 우회:** RN 0.76의 fmt 11.0.2가 Xcode 26.5 clang에서 consteval 오류 10개로 빌드되지 않아, pod 설치 뒤 `fmt/base.h`의 감지 줄을 0으로 바꾸는 config plugin `apps/client/plugins/with-fmt-consteval-off.js`를 `app.config.js`에 등록했다. **제거 기준: SDK 54 이상에서 이 처리 없이 빌드되면 파일과 등록을 지운다.** 53에서 필요한지는 따로 보지 않았다.
- **Jest:** `apps/client/jest.config.cjs`에 `fakeTimers: { doNotFake: ['queueMicrotask'] }`. React 19 `act`가 `queueMicrotask`로 예약하는 작업이 타이머 수 검사에 잡혀서다. 앱 코드는 `queueMicrotask`를 쓰지 않는다.
- **테스트·타입 보완:** expo-router 4·5 Router 타입에 맞춰 `tests/app/layout.test.tsx` mock에 `dismissTo`·`reload`·`prefetch`, React 19 ref 타입에 맞춰 `useMyLocation.ts` prop 타입.

**시뮬레이터 Release 빌드 조건:** `.env.development`·`.env.development.local`을 export하고 `APP_VARIANT=development`를 줘야 dev 번들이 된다. 그러지 않으면 Release가 `.env.production`을 읽어 운영 번들 앱이 된다.

**다음:** SDK 54(나머지 React 19.1 묶음, expo-sqlite 16, reanimated 3.19.x + `expo.install.exclude`, rnmapbox 10.1.4x, EAS `base.node` 24, Sentry ~7.2, TS ~5.9, 이미 어긋난 것 정리, `engines`). 54 빌드에서 fmt 우회 없이 빌드되는지 확인한다. 아직 하지 않은 완료 조건은 마지막 EAS preview 빌드의 실기기 점검표와 1.1.4 데이터 위 덮어 설치, 54 기준 `--check`, `pnpm why`로 한 벌 확인이다.
