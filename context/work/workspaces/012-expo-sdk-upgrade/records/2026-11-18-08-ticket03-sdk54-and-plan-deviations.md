# 2026-11-18 — Ticket 03 진행: SDK 54와 계획에서 달라진 것

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 앞 단계는 [SDK 52·53 기록](2026-11-18-07-ticket03-sdk52-53.md)에 있다. 검사 로그(`baseline/sdk54`·`sdk54b`·`sdk54c`)와 빌드 로그(`sdk54-sim-build.log` 실패, `sdk54-sim-build2.log` 성공)는 세션 scratchpad에만 있다.

## SDK 54 (`3902bf7f`)

worktree `.claude/worktrees/012-sdk54`, 브랜치 `feat/012-sdk54`에서 이어 했다. 이 구간에 사용자 발화는 마지막 질문 하나뿐이고, 아래 선택은 Main이 실행하며 정했다.

**Expo가 고른 버전:** expo 54.0.38, RN 0.81.5, React 19.1.0, expo-router ~6.0.24, expo-sqlite ~16.0.10, expo-file-system ~19.0.24, screens ^4.16, react-native-maps 1.20.1, jest-expo ~54.0.18, TypeScript ~5.9.3, `@types/react` ^19.1.17. Sentry는 `expo.install.exclude`에서 빼 Expo가 고른 ~7.2.0으로 갔고 Xcode 26에서 빌드됐다. exclude는 `["react-native-reanimated"]` 하나다.

**직접 고른 버전과 정리:**
- react-native-reanimated ~3.19.5. SDK 54가 고르는 4.1.1은 New Architecture 전용이라 exclude로 고정했고, worklets가 설치되지 않았음을 확인했다.
- @rnmapbox/maps ~10.1.45(native Mapbox v10 유지), lucide-react-native ^0.577.0, nativewind ^4.2.7(client·ui), react-test-renderer 19.1.0. ui는 tailwind-merge ~2.6.0(설치 2.6.1), `@types/react` ~19.1.17, TS ~5.9.3.
- react-native-monorepo-tools는 사용처가 없어 지웠다.
- **tailwindcss-animate는 남겼다.** Ticket은 "쓰지 않는 패키지"로 적었지만 `packages/ui/styles/tailwind.config.ts`의 `plugins`가 쓰고, client `tailwind.config.js`가 그 preset을 가져온다. Ticket 서술이 틀렸다.
- babel-preset-expo 54는 reanimated plugin을 자동으로 넣지만 앱 `babel.config.js`에도 명시돼 있다. 이전 단계와 같아 그대로 뒀다.

**코드:**
- SDK 54에서 `expo-file-system`의 기본 export가 새 API로 바뀌어 `src/features/profile/hooks/useStorageStats.ts`와 그 테스트를 `expo-file-system/legacy`로 import하게 했다(3443행).
- RN 0.81에서 `AlertButton.onPress`가 `((value?: string) => void) | ((value?: { login, password }) => void)` 합집합이 돼 콜백 추론과 문자열 호출이 깨졌다. `UpdateExpenseDrawer`(2곳)·`UpdateScheduleDrawer`(1곳)는 `onPress: (text?: string)`로, 테스트 7곳(offline-values 3, update-save-lifetime 2, read-query-consumers 1, schedule-recovery 1)은 `(…?.onPress as ((value?: string) => void) | undefined)?.(…)`로 좁혔다. 그 4개 테스트 파일만 `eslint --fix`로 형식을 맞췄다(기준선에서 이 파일들의 lint 오류는 0).

**막혔던 것: 중첩 사본.** 첫 테스트에서 32 suites가 `SyntaxError … ViewConfigIgnore.js: 'identifier' expected in type parameter`로 실패했다(RN 0.81의 `const T` Flow 문법). @react-native/babel-preset 0.81.5는 babel-plugin-syntax-hermes-parser 0.29.1을 요구하는데, 그 아래 중첩 `node_modules`에 예전 설치의 0.25.1 사본이 남아 있었다. `node_modules` 전체를 지우고 `pnpm install --frozen-lockfile`로 다시 설치해 해결했다(3493–3529행). Project 출시 기준이 OTA 발행에서 깨끗한 재설치를 요구하는 이유("예전 설치가 남긴 중첩 사본")와 같은 종류의 문제다.

**검사 수치:**

| 검사 | 기준선(SDK 51) | SDK 54 첫 실행 | 재설치 뒤 | 최종 |
| --- | --- | --- | --- | --- |
| client test | 920 통과 | 32 suites·64 tests 실패 | 920 통과 | 920 통과 |
| client typecheck | 6 | 15 | 15 | 5 |
| client lint | 11 errors / 254 warnings | 같음 | — | 11 / 254 (테스트 수정 뒤 18이 됐다가 4파일 `--fix`로 복귀, 3588–3589행) |
| ui lint | 25 errors / 7 warnings | 같음 | — | 같음 |
| server test·typecheck·build, schema build | 통과 | 통과 | — | 통과 |

`expo install --check`는 reanimated(의도적 제외)만 빼고 통과했다.

**네이티브와 fmt 우회.** 제거 기준("SDK 54 이상에서 이 처리 없이 빌드되면 삭제")에 따라 fmt 우회 plugin 등록을 빼고 시뮬레이터 Release 빌드를 돌렸더니 같은 consteval 오류 10개로 실패했다(3597–3619행). SDK 54에서도 필요하다는 뜻이다. 등록을 되돌리고 plugin 머리말을 "RN 0.76–0.81, SDK 54에서도 필요, SDK를 올릴 때마다 빼고 빌드해 보고 없이 되면 삭제"로 고쳤다. 재빌드는 0 errors였다. 시뮬레이터에서 실행해 기존 데이터(파리 여행 일정 6·EUR 219, 준비 완료)가 보였다. 빌드된 Info.plist는 CFBundleShortVersionString 1.1.4, MinimumOSVersion 15.1, RCTNewArchEnabled false이고, Frameworks에 MapboxMaps·MapboxCoreMaps·MapboxCommon·hermes가 있었다(3639–3676행).

**커밋 나누기.** Main은 브랜치를 SDK 단계당 커밋 하나로 둔다고 판단했다(3700행). SDK 52 커밋에는 ui peer 전환·drizzle·fmt 우회가 함께 들어 있지만 셋 다 52로 올리자마자 필요해진 변경이라, 따로 나누면 중간 커밋이 테스트나 빌드에 실패하는 상태가 된다. "단계마다 원인을 가를 수 있게 한다"는 목적에는 "SDK 한 단계 = 통과하는 커밋 하나"가 맞다는 이유다. Work 기록은 main에 따로 커밋한다.

## 계획에서 달라진 것

사용자가 "그래 기록할거 하고 커밋 적절히 나눠서 하고 근데 예상과 달라진건 없지? 작업하면서"(3681행)라고 물었다. Main은 "출시 계획(1.2.0·1.3.0)이나 Ticket 구성을 바꿀 정도는 아니지만, 순서와 임시 처리가 예상과 달랐다"고 답했다(3685행). 그 목록과 영향은 다음과 같다.

| 달라진 것 | 계획 | 실제 | 이후 영향 |
| --- | --- | --- | --- |
| patch 삭제, ui peer·root react, drizzle 0.45.4 | SDK 54 | SDK 52(막혀서) | 없음. 03 안에서 끝남 |
| React 19 | SDK 54 | SDK 53 | 없음 |
| 최소 iOS | 15.0 → 16.4 | 52에서 15.1을 거침 | 없음. 16.4는 05 |
| fmt consteval 우회 | 계획에 없음 | RN 0.76–0.81과 Xcode 26 clang 조합에서 필요, SDK 54에서도 필요 | **04·05에 걸린다.** EAS 이미지(Xcode 26.2)에서도 필요할 가능성이 높아 03 끝 EAS preview에서 확인한다. SDK 55–58은 단계마다 빼고 빌드해 본다. 05의 Xcode 27 이미지에서도 다시 본다 |
| tailwindcss-animate | 쓰지 않음, 지운다 | ui preset이 씀, 남김 | Ticket 서술 오류 |
| 중첩 사본 | Ticket에 없음 | 깨끗한 재설치가 필요했음 | 이후 SDK 단계에서도 같은 증상이면 재설치를 먼저 본다 |
| Jest `queueMicrotask` | 없음 | React 19 `act` 때문에 `doNotFake` 설정 | 05의 테스트 도구 이전 때 다시 본다 |
| 시뮬레이터 Release 환경값 | 없음 | `.env.production`을 읽어 운영 번들이 됨, dev 환경값 명시 필요 | 이후 로컬 Release 빌드에 같은 조건 |

"이후 영향" 열에서 fmt 우회의 영향(EAS preview 확인, 단계마다 빼고 빌드, Xcode 27 재확인)은 Main의 판단이다. 중첩 사본·Jest·시뮬레이터 환경값의 이후 영향은 기록 담당자가 정리한 것이며, 정한 규칙은 아니다.
