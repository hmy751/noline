# 제약·현재 설계·가정

## 지킬 제약

- **오프라인 시작을 늦추지 않는다:** `fallbackToCacheTimeout: 0`. 제품의 핵심 약속이라 OTA의 편의보다 앞선다.
- **방지 장치는 거부가 기본이다:** 판단이 필요한 변경은 사람이 명시적으로 확인해야 통과한다. 장치가 없거나 실패한 상태에서 조용히 발행되지 않게 한다.
- **기존 릴리스 절차를 유지한다:** 스토어 릴리스는 EAS production 빌드 → `eas submit` → App Store Connect 정보 입력 → 심사 순서를 그대로 쓴다. 절차의 원문 근거는 Work 007의 [빌드 16 기록](../../../../007-sync-failure-recovery/records/2026-11-14-08-build-16-release-and-review-submission.md)과 Work 008의 [1.1.3 기록](../../../../008-exception-notice-rules/records/2026-11-16-01-pressable-drawer-fixes.md)에 있다.
- **인증서 만료:** 배포 인증서·프로비저닝 프로필이 2026-12-30에 만료된다. 1.1.4 빌드가 그 뒤라면 먼저 갱신해야 한다.
- **SDK 51의 남은 기간:** Apple은 2027년 4월부터 iOS 27 SDK(Xcode 27)로 빌드한 앱만 받는다. iOS 27 SDK로 빌드한 앱은 UIScene 생명주기가 필요한데 SDK 51/RN 0.74에는 없다. 그래서 그 뒤에는 SDK 51로 새 스토어 빌드를 올리기가 사실상 어렵다(Main이 Apple·Expo 문서로 확인한 판단이며 UIScene 직접 패치는 시도하지 않았다). 이미 설치된 앱과 OTA 전달은 계속 된다. 업그레이드 자체는 [Work 012](../../../../012-expo-sdk-upgrade/README.md)가 맡는다. 011은 SDK 51에 필요 이상으로 투자하지 않는다.

## 설계 방향과 현재 구현

2026-11-17 현재 패키지·`app.config.js`·`eas.json`은 아래대로 들어가 있다(브랜치 `feat/011-expo-updates`, 미커밋). 결과와 경위는 [Ticket 01](../tickets/01-expo-updates-and-ios15-build.md)과 [착수 기록](../../../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)에 있다.

| 항목 | 방향 |
| --- | --- |
| 패키지 | SDK 51용 `expo-updates@~0.25.28`, `expo-build-properties@~0.12.5`. 함께 `expo-dev-client`를 SDK 51용 `~4.0.29`로 내린다(아래 가정의 충돌). `apps/client`에서 `npx expo install`을 실행하면 내부 `pnpm add`가 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패하므로 저장소 루트에서 `pnpm --filter @apps/client add <버전>`으로 설치한다 |
| 패치 | `expo-dev-menu` 5.0.23의 Swift 한 줄을 루트 `patches/expo-dev-menu@5.0.23.patch`로 고친다(`pnpm.patchedDependencies`). Xcode 26에서 컴파일되게 하는 임시 조치이며 012에서 dev-client가 올라가면 지운다 |
| `app.config.js` | `runtimeVersion: { policy: 'fingerprint' }`, `updates.url`(EAS 프로젝트), `updates.fallbackToCacheTimeout: 0`, plugin `['expo-build-properties', { ios: { deploymentTarget: '15.0' } }]` |
| `eas.json` | preview·production 프로필에 같은 이름의 `channel`과 `environment` |
| 발행 | `eas update --channel <채널> --environment <같은 이름>`. 빌드와 같은 EAS 환경값으로 번들과 runtime을 만든다. EAS preview 환경은 production과 공통 변수를 함께 쓰고 `APP_VARIANT`·Sentry 환경값·Google iOS client ID만 따로 둔다. Sentry 소스맵 업로드를 어떻게 묶을지는 미정이다 |
| 순서 | 설치·dev-client 정렬 → Xcode 26 빌드 확인(아래 판단 지점) → 설정 → preview 빌드로 확인 → 방지 장치 → 1.1.4 스토어 빌드·심사 → Project 반영 |

`apps/client/ios/`는 gitignore 대상이라 EAS 빌드가 매번 prebuild한다. 따라서 `app.config.js`에 넣은 `expo-build-properties` plugin이 EAS 빌드에 그대로 적용된다. preview 프로필은 `APP_VARIANT=development`라 개발용 앱 `com.noline.dev`로 빌드되며, preview 채널 확인도 이 앱에서 한다.

## 1단계의 판단 지점

SDK 51용 `expo-updates`와 `expo-dev-client` 4.0.29가 Xcode 26에서 빌드되는지를 먼저 본다. EAS 이미지는 `macos-sequoia-15.6-xcode-26.2`로 고정돼 있고 로컬은 Xcode 26.5다. Sentry 5.24(SDK 51용)가 Xcode 26.5에서 컴파일되지 않았던 전례(Work 007)가 있어서 오래된 네이티브 코드가 깨질 수 있다.
- **빌드되면:** 011을 계획대로 이어간다.
- **깨지면:** SDK 51에 더 투자하지 않는다. OTA를 012에 합치는 쪽으로 사용자와 다시 판단한다.

**결과(2026-11-16–17):** 로컬 Xcode 26.5 Release 빌드에서 `expo-dev-menu`의 Swift 한 줄이 막았고, 그 줄만 고치면 빌드되고 앱이 뜬다. Main은 이것이 "SDK 51에 큰 투자"에 해당하지 않는다고 보고 패치로 계속하자고 추천했다. 사용자는 "됐으면 진행해 계속 012 는 다른데서 할거고"라고 답했다. EAS 이미지(Xcode 26.2)에서도 패치를 포함한 preview 빌드 `f610d9b5…`이 성공했다.

이 판단 지점은 SDK 업그레이드를 012로 나눈 추천에 함께 들어 있던 방향이다. 사용자는 분리에 동의했다. 세부 진행은 구현 때 확정한다. 이유는 [분리 기록](../../../records/2026-11-16-02-scoping-check-and-sdk-split.md)에 있다.

## 방지 장치 (hook 등) — 계획만 있음

사용자가 "hook같은걸로 뭔가 방지하게 하는 그런것도 할거"라고 했다. 형태는 정하지 않았다. 판단할 후보는 다음과 같다.
- **발행 전용 스크립트:** 예를 들어 `pnpm client update:publish`. 마지막 스토어 빌드 커밋 이후의 diff를 검사한다. migrations·`db/index.ts`·`packages/schema`·네이티브 설정 변경이 있으면 거부하고, 환경값을 확인하고, Sentry 업로드까지 수행한다.
- **AI 도구 hook:** Claude·Codex가 `eas update`를 직접 실행하려 할 때 위 검사를 거치게 막는다. 현재 `.claude/settings.json`에는 hook이 없다. `.claude/hooks/maintain.py`는 퇴역한 Work hook이 아무 일도 하지 않고 끝나게 하는 잔재다. `.codex/hooks.json`은 따로 있다.
- **git hook이나 CI:** 현재 CI(`.github/workflows`)는 없다.

AI 도구 hook만으로는 사람이 터미널에서 직접 실행하는 발행을 막지 못한다. 그래서 검사 자체는 발행 스크립트가 맡고, hook은 그 스크립트로 유도하는 보조가 되는 구성이 유력하다. 이 판단은 아직 사용자와 확정하지 않았다.

어떤 형태든 장치는 특정 SDK 버전에 묶이지 않게 만든다. 검사는 경로 diff와 fingerprint처럼 SDK가 바뀌어도 그대로 쓰는 기준에 기댄다. 012의 업그레이드 뒤에도 이 장치를 이어 쓰기 위해서다.

## 가정과 확인하지 못한 것

- **dev-client 충돌(해소):** `expo-dev-client` 6.0.20(SDK 54 세대)은 `expo-updates-interface` 2.0.0과 `expo-manifests` 1.0.10을 끌어왔고, `expo-updates` 0.25.28은 `~0.16.2`, `~0.14.0`을 요구했다. dev-client를 4.0.29로 내리자 `Podfile.lock`에 EXUpdatesInterface 0.16.2, EXManifests 0.14.3 하나씩만 남았고 로컬 Release 빌드가 됐다(위 패치 포함).
- `npx expo install --check`로 SDK 51 기대 버전과 어긋난 패키지가 10개 나왔다. 011에서는 dev-client만 맞춘다. `expo-splash-screen` 31.0.10(SDK 54 세대)을 포함한 나머지는 012에서 다룬다. dev-client만 내린 상태로 로컬 Release 빌드는 됐다.
- **runtime 일치(조건부로 확인):** 로컬과 EAS의 runtime은 로컬 `node_modules`가 깨끗할 때만 같다. 처음 로컬 값 `22d6ec17…`은 예전 설치의 중첩 사본 때문에 EAS 값 `54a96787…`과 달랐다. 다시 설치한 뒤에는 둘이 같았고 preview 빌드도 `54a96787…`이다. production runtime은 다시 설치한 뒤 계산하지 않았다. 발행 전 확인 방법은 [Ticket 02](../tickets/02-ota-publish-guard.md)에서 정한다.
- **preview 앱의 로그인:** preview 앱 `com.noline.dev`는 운영 서버를 본다. Google 로그인은 2026-11-17에 고쳐 실기기에서 성공했다. 원인은 preview가 운영용 iOS client를 공유한 것이었다. 고친 방법은 EAS 값을 환경별로 나누고, 서버가 iOS client 목록을 받게 하는 것이었다. Apple 로그인은 서버 `APPLE_CLIENT_ID`가 운영 번들이라 실패할 수 있다(미확인, 범위 밖). [Google 로그인 기록](../../../records/2026-11-17-03-preview-google-login-fix.md)
- **로컬 빌드 환경:** 이 기기에서 `pod install`을 돌리려면 UTF-8 locale(`LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`)이 필요했다.
- iOS 13–14 사용자는 1.1.4부터 새 버전을 받지 못한다. 현재 그런 사용자는 거의 없다고 보았지만 App Store Connect 통계로 확인하지 않았다.
- Expo 무료 플랜의 업데이트 한도는 확인하지 않았다.
