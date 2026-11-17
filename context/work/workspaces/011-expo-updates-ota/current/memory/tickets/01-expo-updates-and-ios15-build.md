# 01 — expo-updates와 iOS 15를 넣고 1.1.4로 낸다

**상태:** 진행 중 (2026-11-17). 단계 1–6을 진행했다. 판단 지점(단계 2)은 로컬과 EAS 모두에서 통과했다. 실기기(iPhone 14 Pro)에서 완료 판단 1–4를 확인했고, 5는 preview 쪽(번들 환경값과 OTA 소스맵)까지 확인했다. 남은 일은 production 쪽 확인과 1.1.4 출시(단계 7)다. 발행 절차는 Ticket 02의 `pnpm ota:publish`로 묶었다. 코드 변경은 브랜치 `feat/011-expo-updates`의 커밋 `3592a538`에 있다(main 병합 전).

## 할 일과 결과

1. **패키지와 dev-client 정렬. 완료.** `expo-updates ~0.25.28`, `expo-build-properties ~0.12.5`를 넣고 `expo-dev-client`를 `^6.0.20`에서 `~4.0.29`로 내렸다.
   - 설치는 저장소 루트의 `pnpm --filter @apps/client add`로 했다. `apps/client`의 `npx expo install`은 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패한다.
   - `Podfile.lock` 결과는 EXUpdates 0.25.28, EXUpdatesInterface 0.16.2, EXManifests 0.14.3, expo-dev-launcher 4.0.29, expo-dev-menu 5.0.23이다. 앞서 걱정한 하위 모듈의 두 버전 섞임은 없어졌다.
   - SDK 51에 들인 정리는 이것과 아래 패치 하나다. 나머지 어긋난 패키지는 [Work 012](../../../../012-expo-sdk-upgrade/README.md)가 다룬다.
2. **Xcode 26 빌드 확인(판단 지점). 통과, 011 계속.** 로컬 Xcode 26.5, iPhone 15 Pro 시뮬레이터(iOS 26.0)에서 Release로 빌드했다(`npx expo run:ios --configuration Release`).
   - 처음 두 번은 실패했다. 첫째는 `pod install`의 Ruby Encoding 오류로, 셸 locale을 `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`로 주면 된다. 둘째는 실제 막힘이었다. `expo-dev-menu` 5.0.23의 `ios/DevMenuViewController.swift` 66행이 "cannot find 'TARGET_IPHONE_SIMULATOR' in scope"를 냈다. 5.0.23이 5.0.x의 마지막 판이라 버전으로는 피할 수 없다.
   - 그 줄을 `#if targetEnvironment(simulator)`로 바꾸자 빌드에 성공했고 앱이 로그인 화면까지 떴다.
   - 막힘이 한 줄이라 "SDK 51에 큰 투자"에 해당하지 않는다고 Main이 판단했고, 사용자가 "됐으면 진행해 계속 012 는 다른데서 할거고"로 011 계속을 택했다.
   - 수정은 루트 `patches/expo-dev-menu@5.0.23.patch`로 고정했다(`pnpm.patchedDependencies`, lockfile `patch_hash`). `pnpm install --frozen-lockfile` 뒤에도 적용됐고, 같은 Release 빌드를 다시 돌려 오류 0건으로 로그인 화면까지 확인했다. 012에서 dev-client가 올라가면 이 패치는 지운다.
   - EAS(Xcode 26.2)에서도 패치를 포함해 빌드됐다. 두 번째 preview 빌드 `f610d9b5-3c04-46d5-b191-e50efac28247`이 FINISHED였다.
3. **`app.config.js`. 완료.** `runtimeVersion: { policy: 'fingerprint' }`, `updates: { url, fallbackToCacheTimeout: 0 }`, `['expo-build-properties', { ios: { deploymentTarget: '15.0' } }]`를 넣었다. prebuild한 `Expo.plist`는 `EXUpdatesEnabled` true, `EXUpdatesLaunchWaitMs` 0, `EXUpdatesRuntimeVersion` `file:fingerprint`였고, `Podfile.properties.json`의 `ios.deploymentTarget`은 15.0이었다. iOS 15 설정은 1.1.4만을 위한 임시 조치다.
4. **`eas.json`. 완료.** preview·production 프로필에 같은 이름의 `channel`을 넣었다. 단계 5의 조사로 `environment`도 명시했다(preview는 `"preview"`, production은 `"production"`). preview 프로필의 `APP_VARIANT=development`는 프로필 `env`에 그대로 있어 `com.noline.dev` 앱으로 빌드된다.
5. **발행 방법. 정함.** 환경 대응과 Sentry 소스맵 업로드 방식이 정해졌다. 스크립트로 묶는 일은 Ticket 02에서 했다.
   - fingerprint runtime이 `app.config.js`가 읽는 환경값(Sentry 설정 유무, Mapbox 토큰, Google Maps 키, `APP_VARIANT`)에 따라 달라진다. 발행 쪽 환경이 빌드와 다르면 업데이트가 아무 기기에도 가지 않고 오류도 나지 않는다.
   - 그래서 발행 명령은 `eas update --channel <채널> --environment <같은 이름>`으로 정했다. eas-cli 16.28.0 코드에서 `--environment`를 주면 그 EAS 환경의 서버 변수로 config와 runtime을 계산하고, 빌드 프로필의 `env`는 읽지 않는 것을 확인했다.
   - 비어 있던 EAS preview 환경을 사용자 허락("preview 환경 채우기 (추천)")을 받아 채웠다. 공통 변수를 production·preview 양쪽에 연결하고, preview 전용으로 `APP_VARIANT=development`, `EXPO_PUBLIC_SENTRY_ENVIRONMENT=preview`를 만들었다. 처음 공통으로 연결한 13개 가운데 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`는 뒤에 환경별 값으로 나눴다(production은 운영 client, preview는 개발 client). 경위는 [Google 로그인 기록](../../../records/2026-11-17-03-preview-google-login-fix.md)에 있다.
   - runtime은 `EXPO_NO_DOTENV=1 eas env:exec <환경> 'npx expo-updates runtimeversion:resolve --platform ios'`로 계산한다. 처음 계산한 preview `22d6ec17…`은 EAS와 달랐다. 로컬 `node_modules`의 오래된 중첩 사본 때문이었고, 다시 설치하자 EAS와 같은 `54a96787…`이 됐다. 그래서 처음의 production 값 `24bdaa23…`도 다시 계산해야 한다. 경위는 [실기기 확인 기록](../../../records/2026-11-17-02-preview-build-and-device-ota-check.md)에 있다.
   - `--environment preview`로 발행한 번들에 preview EAS 환경의 `EXPO_PUBLIC_*` 값이 들어가고 로컬 `.env.development` 값은 들어가지 않는 것을 확인했다.
   - Sentry 소스맵은 로컬 토큰으로 올린다. `SENTRY_AUTH_TOKEN`은 EAS의 SECRET이라 로컬 CLI가 읽지 못한다. 그래서 사용자 선택에 따라 `.env.development.local`의 토큰을 `apps/client/.env.production`(gitignore)에도 복사했다. 토큰을 바꿀 때는 두 곳을 모두 고친다. `eas update` 다음에 `apps/client`에서 `EXPO_NO_DOTENV=1 eas env:exec <환경> 'node --env-file=.env.production ../../node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps.js dist' --non-interactive`를 실행한다. `dist`의 hbc와 map이 debug ID로 올라간다.
   - 정리된 발행 순서는 깨끗한 재설치 → runtime 대조 → `eas update --channel <채널> --environment <같은 이름>` → 소스맵 업로드다. 이 순서는 [Ticket 02](02-ota-publish-guard.md)의 발행 스크립트 `pnpm ota:publish`로 묶었다(2026-11-17, 미커밋). EAS Workflows로 서버에서 발행하는 안은 Ticket 02에서 다시 본다. 경위는 [소스맵 기록](../../../records/2026-11-17-04-commit-and-ota-sourcemap.md)에 있다.
6. **preview 빌드로 [완료 판단](../spec/04-quality-and-completion.md)의 1–5를 확인한다. 1–4 확인, 5 일부.**
   - iPhone 14 Pro 1대를 등록했다(ad hoc 프로필 AN57L8X528, 인증서와 함께 2026-12-30 만료).
   - 첫 빌드 `8316db33…`은 runtime 불일치(로컬 `22d6ec17…`, EAS `54a96787…`)로 `CONFIGURE_EXPO_UPDATES`에서 실패했다. 로컬 `node_modules`를 지우고 `pnpm install --frozen-lockfile`로 다시 설치해 맞췄다. 두 번째 빌드 `f610d9b5…`은 runtime `54a96787…`, channel preview로 성공했다.
   - 실기기에서 사용자가 관찰한 결과다. 1은 그룹 `9889e7f4…`를 두 번째 실행에서 적용했다. 2는 비행기 모드에서도 바로 열리고 받아 둔 업데이트가 유지됐다. 3은 `eas update:roll-back-to-embedded`(그룹 `4c567056…`)로 원래 번들로 돌아왔다. 4는 runtime `63918ede…`의 업데이트(그룹 `dee2e1d6…`)를 받지 않았다. 시험용 문구·설정 변경은 매번 되돌렸다.
   - 5는 preview 쪽까지 확인했다. 번들의 환경값을 셌고, 시험 업데이트 `8c8eb6e9…`에서 일부러 낸 오류가 Sentry에서 `src/screens/LoginScreen.tsx` 144:133으로 풀렸다(issue `7851900817`, environment preview). 시험 코드는 정리 업데이트 `f40c0676…`로 뺐다. 롤백 대신 재발행한 이유는 내장 번들에 운영용 Google client가 들어 있기 때문이다. production 채널 번들의 값과 소스맵은 남았다. 경위는 [소스맵 기록](../../../records/2026-11-17-04-commit-and-ota-sourcemap.md)에 있다.
   - 시험 앱의 Google 로그인은 처음에 "액세스 차단됨"이었다. preview 환경이 운영용 iOS client를 공유한 탓이었다. EAS 값을 나누고, 서버가 iOS client를 여러 개 받게 고쳐 운영에 배포하고, preview OTA(그룹 `a86d1596…`)를 낸 뒤 운영 앱과 시험 앱 모두 로그인된다. 상세는 [Google 로그인 기록](../../../records/2026-11-17-03-preview-google-login-fix.md)에 있다.
   - 상세와 빌드·업데이트 ID는 [실기기 확인 기록](../../../records/2026-11-17-02-preview-build-and-device-ota-check.md)에 있다.
7. **1.1.4 출시.** 버전을 1.1.4, 빌드 번호를 18로 올리고 production 빌드 → `eas submit` → App Store Connect 정보 입력 → 심사 제출을 한다. 인증서 만료(2026-12-30) 전에 해야 한다.

## 완료 조건

완료 판단 1–5와 7을 확인한다. 각 확인에 사용한 빌드 ID, 채널, 기기(시뮬레이터 또는 실기기)를 records에 남긴다. 판단 지점의 결과(로컬 Xcode 26.5 Release 빌드 성공, 패치 한 줄)는 [착수 기록](../../../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)에, EAS 빌드와 완료 판단 1–4·5 일부의 확인은 [실기기 확인 기록](../../../records/2026-11-17-02-preview-build-and-device-ota-check.md)에 남겼다.

## 진행 기록

- 2026-11-16: 사용자 확인 전에 1의 두 패키지를 설치했다가 "바로 시작하지말고 파악만 해봐"라는 지시로 되돌렸다. 그동안 SDK 51 버전 조합과 fingerprint 지원을 확인했고 dev-client 충돌을 찾았다. 경위는 [파악·분리 기록](../../../records/2026-11-16-02-scoping-check-and-sdk-split.md)에 있다.
- 2026-11-16–17: "일단 011 부터 하고 다되면 병합하자"로 착수했다. 1.1.3이 여전히 "심사 대기 중"인 것을 확인한 뒤 단계 1–4를 넣고, 판단 지점을 패치로 통과했고, 발행 환경을 정리했다. 경위와 근거는 [착수 기록](../../../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)에 있다.
- 2026-11-17: 브랜치에 커밋했다(`cad1ec8f` main 병합, `3592a538`, `233e0a17`, `212040c2`). Sentry 소스맵을 로컬 토큰 방식으로 정하고 preview에서 end-to-end로 확인했다. 경위는 [소스맵 기록](../../../records/2026-11-17-04-commit-and-ota-sourcemap.md)에 있다.
- 2026-11-17: iPhone을 등록하고 preview 빌드를 만들어, runtime 불일치를 고친 뒤 실기기에서 완료 판단 1–4를 확인했다. 경위는 [실기기 확인 기록](../../../records/2026-11-17-02-preview-build-and-device-ota-check.md)에 있다.

## 주의

- 1.1.3 심사 결과는 아직 모른다. 2026-11-16 밤 App Store Connect에서 "심사 대기 중"이었다. 거절되면 그 대응(Work 008)이 먼저다.
- 네이티브 설정과 dev-client가 바뀌었으므로 로컬 개발 앱도 다시 빌드해야 한다(`pnpm client ios`). 지금 `apps/client/ios/`는 이번 Release 확인 때 `.env.production`으로 새로 prebuild한 것이다(운영 이름 `com.ham.noline`). 1월에 만든 이전 폴더는 세션 scratchpad로 옮겨 두었고 재부팅 등으로 지워질 수 있다. `ios/`는 gitignore 대상이며 로컬 폴더 유무는 fingerprint에 영향이 없었다.
- 로컬에서 `pod install`이나 `expo run:ios`를 돌릴 때는 UTF-8 locale이 필요하다.
- **알려진 제한:** preview 앱의 Apple 로그인은 서버의 `APPLE_CLIENT_ID`가 운영 번들이라 실패할 수 있다. 확인하지 않았고 이번 범위 밖이다.
- **EAS 환경을 바꿀 때:** 값이 production과 preview에서 달라야 하는 변수가 있다. 번들 ID에 묶인 client ID가 그 예다. 공통으로 연결하기 전에 로컬 `.env.development`·`.env.production`과 대조한다.
- 로컬 `node_modules`에 예전 설치의 중첩 사본이 남으면 lockfile이 같아도 runtime이 달라진다. 업데이트를 발행하기 전에 깨끗이 설치하고, runtime이 대상 빌드와 같은지 확인한다.
- 2027년 4월부터 Apple이 iOS 27 SDK 빌드를 요구해 SDK 51로는 그 뒤 새 스토어 빌드가 사실상 어렵다. 1.1.4는 그 전에 내야 의미가 있다.
