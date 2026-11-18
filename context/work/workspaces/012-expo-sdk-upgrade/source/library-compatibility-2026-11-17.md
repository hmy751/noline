# 라이브러리 호환 조사 (2026-11-17)

reanimated를 계기로 사용자가 요청한 점검의 결과다. 라이브러리마다 SDK 54와 SDK 58에서 맞춰야 할 버전, 함께 움직여야 하는 묶음, 그 근거를 모았다. 이 조사를 계획에 어떻게 반영했는지는 [조사 기록](../records/2026-11-17-04-release-plan-adopted-and-library-check.md)에 있다. Ticket을 시작하기 전에는 외부 문서가 바뀌었는지 다시 본다.

> "잠깐 하나 더 점검하자 reanimated가 어느버전 이상에서 될거야 기록도 있고 이거 말고도 이런식으로 연관된 거 찾아서 요즘 지금 reanimated처럼 쓰이는것도 지금 버전들에서 찾아보자 예를 들어 또 React 19정도는 기본으로 쓰잖아? 이런것처럼"

## 누가 무엇으로 확인했나

| 주체 | 방법 | 범위 |
| --- | --- | --- |
| Main | git 이력, 저장소 grep, 설치된 패키지의 peer 의존성, `curl`로 Expo `bundledNativeModules.json`(sdk-54·sdk-58 브랜치), GitHub API로 rnmapbox v10.3.0 릴리스 노트, `node_modules`의 drizzle `.d.ts` | 아래 "Main이 직접 확인"으로 표시한 값 |
| 조사 서브 A (UI·애니메이션·스타일) | bundledNativeModules, npm registry, 각 라이브러리 changelog·문서, 저장소 사용처 | 대화 원문 537행의 보고 |
| 조사 서브 B (데이터·네비·테스트·도구) | Expo versions API, expo@54.0.38·58.0.26의 bundledNativeModules, 각 changelog·릴리스, 저장소 사용처 | 대화 원문 565행의 보고 |

원문 줄 번호는 Main 대화 `cf346e87-7dfb-4441-ae53-cf37d3cefece`(JSONL 로그) 기준이다. 서브의 보고는 다른 주체의 조사 결과이며, Main이 다시 대조한 값은 따로 표시했다. Expo가 SDK별로 정한 버전 목록 원본은 [sdk-54.0.38](expo-bundled-native-modules/sdk-54.0.38.json)과 [sdk-58.0.26](expo-bundled-native-modules/sdk-58.0.26.json)에 보존했다(서브 B가 받은 파일).

## 저장소 안의 reanimated 이력 (Main이 직접 확인)

- `4995f0d5`(2025-10-24) "react-native-reanimate 이슈로 인한 제거 및 설정": `packages/ui`는 `^3.14.0`, client는 `~3.10.0`으로 서로 달랐다. 두 곳에서 reanimated를 지우고 babel plugin을 주석 처리했으며, `ScheduleScreen`의 `TripSelector`를 "Reanimated 호환 문제로 임시 비활성화"했다.
- `11f9c997`(같은 날) "nativwind 의존으로 react-native-reanimate 재설치": nativewind(`react-native-css-interop`의 peer `react-native-reanimated >=3.6.2`) 때문에 두 곳 모두 `~3.10.0`으로 다시 넣고 plugin을 되살렸다.
- 지금 `TripSelector`는 Schedule·Expenses 화면에서 다시 쓰인다. reanimated를 직접 쓰는 곳은 `MyLocationButton` 하나(`useSharedValue`·`useAnimatedStyle`·`withRepeat`·`withTiming`)와 `apps/client/babel.config.js`의 plugin이다.

즉 2025-10의 문제는 reanimated 자체보다 **`packages/ui`와 client가 같은 라이브러리를 다른 버전으로 선언한 것**에서 나왔다. `packages/ui`는 지금도 react·react-native·reanimated를 `dependencies`로 고정한다.

## SDK별 목표 버전

"SDK 54"는 Expo가 정한 값, "Legacy 단계"는 SDK 54에서 New Architecture를 켜기 전에 써야 하는 값이다. ✓는 Main이 bundledNativeModules를 직접 대조한 값이다.

| 라이브러리 | 현재 | SDK 54 (Legacy 단계) | SDK 54 + New Arch | SDK 58 | 근거·주의 |
| --- | --- | --- | --- | --- | --- |
| react / react-dom | 18.3.1 | 19.1.0 | 19.1.0 | 19.3.0 | `@types/react`·react-test-renderer가 따라간다. 함수 컴포넌트의 `defaultProps`가 무시된다(React 19 가이드) |
| react-native | 0.74.5 | 0.81.5 | 0.81.5 | 0.88.1 | — |
| react-native-reanimated | 3.10.1 | **3.19.x**(`expo.install.exclude` 필요) | ~4.1.1 ✓ | 4.7.1 ✓ | 4.x는 New Architecture 전용. 3.19.x는 RN 0.81의 마지막 3.x이고 유지보수가 끝났다. 4로 갈 때 babel plugin을 지운다(babel-preset-expo가 대신 설정). `MyLocationButton`의 API는 그대로다 |
| react-native-worklets | 없음 | 넣지 않음 | 0.5.1 ✓ | 0.13.0 ✓ | reanimated 4와 함께만 쓴다 |
| nativewind / css-interop | 4.2.1 / 0.2.1 | ≥4.2.2 | ≥4.2.2 | 4.2.7 / 0.2.7 | 4.2.0이 RN 0.81·reanimated 4 대응, 4.2.2가 React 19 ref 대응. **SDK 58·RN 0.88 지원은 미확인**(최신 명시 대상은 SDK 57). v5는 RC이고 Tailwind 4가 필요해 쓰지 않는다 |
| tailwindcss | 3.4.18 | 3.4.x | 3.4.x | 3.4.x | nativewind v4가 ~3에 묶는다 |
| tailwind-merge | 3.3.1 | 2.6.x | 2.6.x | 2.6.x | v3는 Tailwind 4 전용. **지금 이미 어긋나 있다**(`packages/ui/src/lib/utils.ts`가 사용, Main 확인) |
| @rnmapbox/maps | 10.1.33 | ≥10.1.42(10.1.45가 native Mapbox v10 유지) | 10.3.x(native Mapbox v11) | ≥10.3.10 | 10.2.0이 기본 native SDK를 v11로 바꿨다(2025-11 10.2.6 실패의 유력한 원인). 10.3.0은 native v10과 Legacy를 버린다(v10.3.0 노트: Mapbox SDK 11.18.2 상향, v10·old architecture 문서 제거, Main 확인). 10.3.10이 RN 0.88 대응 |
| 오프라인 pack(`offlineManager`, 5개 파일) | — | — | v11로 바뀜 | — | v10에서 받은 pack이 v11에서 남는지 **미확인**. 실기기에서 옛 빌드로 받고, 업그레이드 뒤 `getPacks`로 확인해야 한다 |
| react-native-maps | 1.14.0 | 1.20.1 ✓ | 1.20.1 | 1.29.11 ✓ | 1.21.0부터 Legacy 미지원·RN 0.76+ |
| expo-sqlite | 14.0.6 | ~16.0.10 ✓ | ~16.0.10 | ~58.0.18 ✓ | v15가 legacy API와 `expo-sqlite/next`를 제거. v56이 iOS 16.4, blob을 ArrayBuffer로. v58이 libSQL 제거. 앱은 `openDatabaseSync`·`execSync`·drizzle `run`만 쓴다. **DB 파일 경로가 업그레이드 뒤 그대로인지 미확인** |
| drizzle-orm (client) | 0.30.10 | ≥0.36.2(0.45.x 권장) | 같음 | 같음 | 0.30.10의 `.d.ts`가 `expo-sqlite/next`를 import한다(Main이 `node_modules`에서 확인). `skipLibCheck`로 오류가 가려져 타입이 `any`가 된다. 1.0 RC는 쓰지 않는다. 서버의 0.29는 영향 없음 |
| expo-router | 3.5.24 | ~6.0.24 ✓ | 같음 | ~58.0.32 ✓ | v4 React Navigation 7, v56 react-navigation 의존 제거, v58 navigation 재작성·web 기본 server 출력. 앱이 쓰는 API는 좁아 코드 영향은 작다고 봤다 |
| react-native-screens | 3.37.0 | ~4.16.0 ✓ | 같음 | ~4.30.1 ✓ | 4.25.0부터 Legacy 미지원 |
| react-native-safe-area-context | 5.6.1 | ~5.6.0 ✓ | 같음 | ~5.11.1 ✓ | — |
| react-native-svg | 15.14.0 | 15.12.1 ✓(내려감) | 같음 | 15.16.0 ✓ | lucide와 짝 |
| lucide-react-native | 0.454.0 | ≥0.511.0 | 같음 | 1.x | 0.454는 React ≤18 peer. 서브 A는 사용 아이콘 45개가 1.74.0에 모두 있음을 확인했다고 보고(서브 B는 미확인으로 보고) |
| @sentry/react-native | 6.22.0 | ~7.2.0 ✓ | 같음 | ~8.28.0 ✓ | v8은 iOS 15+ |
| @react-native-community/netinfo | 11.4.1 | 11.4.1 ✓ | 같음 | 12.0.1 ✓ | — |
| expo-updates | 0.25.28 | ~29.0.20 ✓ | 같음 | ~58.0.22 ✓ | SDK 58은 fingerprint `balanced` 기본. `expo-dev-menu` patch는 적용되지 않아 지우거나 다시 만든다 |
| react-native-web | 0.19.13 | ~0.21.0 ✓ | 같음 | ~0.21.4 ✓ | React 18·19 모두 허용 |
| expo-file-system | 17 | 19 | 같음 | 58 | SDK 54부터 기본 export가 새 API. 앱의 `documentDirectory` 등은 `expo-file-system/legacy`에서 import해야 한다 |
| expo-blur / linear-gradient | 13 / 13 | 15 / 15 | 같음 | 58 / 58 | 앱의 사용 범위에서는 영향 없음 |
| 테스트 | jest 29.7, jest-expo 51, RNTL 13.3.3, RTR 18.3.1 | jest-expo ~54.0.18, RTR 19.1.0, RNTL 13 유지 | 같음 | jest 30, jest-expo ~58.0.15(+`@react-native/jest-preset`), **RNTL 14.1**(+`test-renderer`) | RNTL 14는 `render`·`fireEvent`·`act`가 비동기가 되고 `UNSAFE_*`가 사라진다. 테스트 파일 약 78개에 닿는다 |
| TypeScript | 선언 5.3/5.5, 실제 5.9.3 | ~5.9 | 같음 | **~6.0.3** | TS 6은 `strict` 기본, `types: []` 기본, `baseUrl` 폐기. typescript-eslint 7은 TS <5.6만 지원 |
| ESLint | 8 + community config 3 + ts-eslint 7 | `eslint-config-expo` ~10(flat) | 같음 | ~58.0.4 | 빌드 경로 밖이라 위험은 낮다 |
| @rn-primitives/* | 1.2–1.3 | 1.5.x | 같음 | 1.5.x | React 19·New Arch 공식 지원 문구 **미확인**(공식 showcase가 Expo 56·React 19.2에서 1.5.2를 쓴다) |
| react-native-calendars | 1.1313.0 | 1.1314.0 | 같음 | 같음 | React 19·New Arch 공식 지원 **미확인**. `defaultProps` 무시는 ES6 기본값이 있어 화면 영향 없다고 서브 A가 확인. 실기기 확인 필요 |
| react-native-dotenv | 3.4.11 | 선택: `EXPO_PUBLIC_*`로 전환 | — | — | 이미 `EXPO_PUBLIC_` 이름. Expo는 `.env.*`를 mode로, 앱은 `APP_VARIANT`로 고르는 차이가 있다 |
| react-native-monorepo-tools, tailwindcss-animate | 1.2.1, 1.0.7 | 제거 후보 | — | — | 사용처 없음(grep). SDK 52부터 Expo가 monorepo Metro를 자동 설정 |

`expo-splash-screen`은 client `package.json`이 `^31`(SDK 54 세대)을 선언해 lockfile에 31.0.10이 있지만, expo가 끌어오는 0.27.7도 함께 있다. `npx expo install --fix`로 정리될 것으로 서브 B가 봤다.

## 함께 움직여야 하는 묶음

1. **SDK 54, Legacy 단계:** expo 54·RN 0.81.5·React 19.1(+react-dom, `@types/react` ~19.1, RTR 19.1), jest-expo 54, reanimated **3.19.x**(worklets 없음, `expo.install.exclude`), rnmapbox 10.1.4x(native v10), react-native-maps 1.20.1, drizzle ≥0.36.2, `expo-file-system/legacy` import, dev-menu patch 제거, lucide ≥0.511, React 19와 함께 react-native-web 0.21·nativewind ≥4.2.2, Sentry ~7.2, TS ~5.9.
2. **New Architecture 전환(SDK 54):** `newArchEnabled`, reanimated ~4.1.1 + worklets 0.5.1(babel plugin 제거), rnmapbox 10.3.x(native Mapbox v11). 2025-11 실패 지점과 오프라인 pack 보존이 이 한 단계에 모인다.
3. **SDK 58:** RN 0.88·React 19.3, reanimated 4.7.1 + worklets 0.13.0, rnmapbox ≥10.3.10, react-native-maps 1.29.11, expo-router 58, RNTL 14.1 + test-renderer + jest 30 + jest-expo 58, TS 6 + typescript-eslint 8, Sentry 8.28, Node 22.13+ 또는 24, iOS 16.4.
4. **패키지 사이의 공유 버전:** client와 `packages/ui`는 react·react-native·reanimated·nativewind를 같은 버전으로 쓴다. `packages/ui`에서 이들을 peer로 바꾸면 2025-10 같은 중복 위험이 사라진다.
5. **Tailwind 묶음:** nativewind v4 + tailwindcss 3 + tailwind-merge 2.6. v5로 가려면 Tailwind 4·react-native-css·tailwind-merge 3을 함께 바꿔야 한다.

## 이 앱이 뒤처진 지금의 기본값

React 19와 New Architecture, Reanimated 4 + worklets(plugin은 babel-preset-expo가 처리), SDK 54+ 기본 템플릿의 React Compiler, `eslint-config-expo`의 flat config, babel dotenv 대신 `EXPO_PUBLIC_` 환경 변수, Expo의 자동 monorepo Metro 설정, Jest 30 + RNTL 14(비동기 API), TS 6, lucide 1.x. Tailwind 4는 npm `latest`지만 nativewind 안정판은 아직 v3를 쓴다.

## 확인하지 못한 것

- Mapbox v10에서 받은 오프라인 pack이 v11 빌드에서 남는지
- expo-sqlite를 올린 뒤 기기 DB 파일 경로가 그대로인지
- nativewind의 SDK 58·RN 0.88 지원
- 54에서 58로 SDK 55–57을 건너뛰어도 되는지(Expo가 한 SDK씩 올리기를 권하는지 다시 보지 않았다)
- @rn-primitives·react-native-calendars의 React 19·New Architecture 공식 지원
- RN 0.87 Strict TypeScript API가 `packages/ui`와 외부 타입에 주는 영향

## 출처 (2026-11-17 읽음)

- Expo bundledNativeModules: [sdk-54](https://raw.githubusercontent.com/expo/expo/sdk-54/packages/expo/bundledNativeModules.json), [sdk-58](https://raw.githubusercontent.com/expo/expo/sdk-58/packages/expo/bundledNativeModules.json), [Expo versions API](https://api.expo.dev/v2/versions/latest)
- Expo: [SDK 54 changelog](https://expo.dev/changelog/sdk-54), [SDK 58 changelog](https://expo.dev/changelog/sdk-58), [SDK 54 reanimated FYI](https://github.com/expo/fyi/blob/main/expo-54-reanimated.md)(예시의 `~4.0.1`은 bundled `~4.1.1`보다 오래돼 보인다), [babel-preset-expo sdk-54](https://github.com/expo/expo/blob/sdk-54/packages/babel-preset-expo/src/index.ts), [monorepo 가이드](https://docs.expo.dev/guides/monorepos/), [환경 변수](https://docs.expo.dev/guides/environment-variables/), [Tailwind 가이드](https://docs.expo.dev/guides/tailwind/), [expo-blur CHANGELOG](https://github.com/expo/expo/blob/sdk-58/packages/expo-blur/CHANGELOG.md)
- Reanimated: [4.x 호환표](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility), [3.x 호환표](https://docs.swmansion.com/react-native-reanimated/docs/3.x/guides/compatibility/), [3.x에서 이전](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x)
- [React 19 업그레이드 가이드](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- nativewind: [v4 CHANGELOG](https://github.com/nativewind/nativewind/blob/v4/packages/nativewind/CHANGELOG.md), [releases](https://github.com/nativewind/nativewind/releases)
- [tailwind-merge README](https://github.com/dcastil/tailwind-merge#readme), [react-native-screens README](https://github.com/software-mansion/react-native-screens#readme), [react-native-reusables showcase package.json](https://github.com/founded-labs/react-native-reusables/blob/main/apps/showcase/package.json)
- rnmapbox: [GitHub releases](https://github.com/rnmapbox/maps/releases)(v10.3.0 본문은 Main이 GitHub API로 확인)
- 그 밖에 서브 B가 인용한 expo-sqlite·Sentry CHANGELOG, react-native-maps v1.21.0 릴리스, RNTL v14.0.0 릴리스, TS 6.0 블로그, drizzle PR #3197. 서브가 받아 둔 사본은 임시 폴더에 있었고 이 Work에는 옮기지 않았다.
