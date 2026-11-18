# 03 — SDK 51→54로 올린다 (Legacy 유지, 출시 안 함)

**상태:** 시작 전 (2026-11-17 확정). 02가 끝난 뒤 12월에 한다. 범위와 목표 버전은 02의 결과로 바뀔 수 있다.

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

**설치 절차.** 패키지는 01에서 확정한 방식으로 넣는다. `npx expo install`이 `apps/client`에서 실패하던 문제(`ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`, Work 011)는 01에서 원인을 고치거나 대체 절차(Expo가 고른 버전을 `--check`로 얻어 루트에서 `pnpm --filter @apps/client add`로 넣고 단계 끝에 `--check` 확인)를 확정한다. 01의 결과가 이 Ticket의 선행이다.

**실행하며 정할 것:** 52·53에서 각각 확인할 범위, `--check` 검사의 형태, ui peer 전환 방식.

## 완료 조건과 확인 방법

- 51→52→53→54 각 단계의 로컬 빌드·검사 결과가 남아 있다.
- 마지막 EAS preview 빌드(Node 24)에서 실기기 점검표 6항목이 기준선과 같다.
- 1.1.4 preview에 데이터를 넣은 상태에서 이 빌드를 덮어 설치해 로그인·여행 데이터·미전송 변경·오프라인 지도가 남는다.
- client lint·test·typecheck와 ui lint, server·schema 검사가 기준선과 같거나 더 낫다. 실패가 늘었다면 원인과 처리가 적혀 있다.
- `npx expo install --check`가 통과하거나 차이마다 이유가 있다. 설치 결과에 react·react-native가 한 버전씩만 있다(`pnpm why` 등으로 확인).
- `release/1.1`의 핫픽스 경로는 그대로다(main만 바뀌었다).

## 현재 상태와 실제 결과

시작 전. 단계별 진행(51→52, 52→53, 53→54)과 실제 결과를 여기 채운다.
