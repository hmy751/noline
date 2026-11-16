# 제약·현재 설계·가정

## 지킬 제약

- **오프라인 시작을 늦추지 않는다:** `fallbackToCacheTimeout: 0`. 제품의 핵심 약속이라 OTA의 편의보다 앞선다.
- **방지 장치는 거부가 기본이다:** 판단이 필요한 변경은 사람이 명시적으로 확인해야 통과한다. 장치가 없거나 실패한 상태에서 조용히 발행되지 않게 한다.
- **기존 릴리스 절차를 유지한다:** 스토어 릴리스는 EAS production 빌드 → `eas submit` → App Store Connect 정보 입력 → 심사 순서를 그대로 쓴다. 절차의 원문 근거는 Work 007의 [빌드 16 기록](../../../../007-sync-failure-recovery/records/2026-11-14-08-build-16-release-and-review-submission.md)과 Work 008의 [1.1.3 기록](../../../../008-exception-notice-rules/records/2026-11-16-01-pressable-drawer-fixes.md)에 있다.
- **인증서 만료:** 배포 인증서·프로비저닝 프로필이 2026-12-30에 만료된다. 1.1.4 빌드가 그 뒤라면 먼저 갱신해야 한다.
- **SDK 51의 남은 기간:** Apple은 2027년 4월부터 iOS 27 SDK(Xcode 27)로 빌드한 앱만 받는다. iOS 27 SDK로 빌드한 앱은 UIScene 생명주기가 필요한데 SDK 51/RN 0.74에는 없다. 그래서 그 뒤에는 SDK 51로 새 스토어 빌드를 올리기가 사실상 어렵다(Main이 Apple·Expo 문서로 확인한 판단이며 UIScene 직접 패치는 시도하지 않았다). 이미 설치된 앱과 OTA 전달은 계속 된다. 업그레이드 자체는 [Work 012](../../../../012-expo-sdk-upgrade/README.md)가 맡는다. 011은 SDK 51에 필요 이상으로 투자하지 않는다.

## 논의에서 정한 설계 방향 (구현 전)

| 항목 | 방향 |
| --- | --- |
| 패키지 | SDK 51용 `expo-updates@~0.25.28`, `expo-build-properties@~0.12.5`. 함께 `expo-dev-client`를 SDK 51용 `~4.0.29`로 내린다(아래 가정의 충돌). `apps/client`에서 `npx expo install`을 실행하면 버전은 맞게 고르지만 내부 `pnpm add`가 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패했다. 2026-11-16에는 저장소 루트에서 `pnpm --filter @apps/client add <버전>`으로 설치했다(사용자 확인 전에 한 설치라 되돌림) |
| `app.config.js` | `runtimeVersion: { policy: 'fingerprint' }`, `updates.url`(EAS 프로젝트), `updates.fallbackToCacheTimeout: 0`, plugin `['expo-build-properties', { ios: { deploymentTarget: '15.0' } }]` |
| `eas.json` | preview·production 프로필에 `channel` |
| 발행 | production 환경값을 쓰는 발행 방법(EAS 환경변수 또는 발행 전용 스크립트)과 Sentry 소스맵 업로드를 함께 묶는다. 구체 방식은 미정이다 |
| 순서 | 설치·dev-client 정렬 → Xcode 26 빌드 확인(아래 판단 지점) → 설정 → preview 빌드로 확인 → 방지 장치 → 1.1.4 스토어 빌드·심사 → Project 반영 |

`apps/client/ios/`는 gitignore 대상이라 EAS 빌드가 매번 prebuild한다. 따라서 `app.config.js`에 넣은 `expo-build-properties` plugin이 EAS 빌드에 그대로 적용된다. preview 프로필은 `APP_VARIANT=development`라 개발용 앱 `com.noline.dev`로 빌드되며, preview 채널 확인도 이 앱에서 한다.

## 1단계의 판단 지점

SDK 51용 `expo-updates`와 `expo-dev-client` 4.0.29가 Xcode 26에서 빌드되는지를 먼저 본다. EAS 이미지는 `macos-sequoia-15.6-xcode-26.2`로 고정돼 있고 로컬은 Xcode 26.5다. Sentry 5.24(SDK 51용)가 Xcode 26.5에서 컴파일되지 않았던 전례(Work 007)가 있어서 오래된 네이티브 코드가 깨질 수 있다.
- **빌드되면:** 011을 계획대로 이어간다.
- **깨지면:** SDK 51에 더 투자하지 않는다. OTA를 012에 합치는 쪽으로 사용자와 다시 판단한다.

이 판단 지점은 SDK 업그레이드를 012로 나눈 추천에 함께 들어 있던 방향이다. 사용자는 분리에 동의했다. 세부 진행은 구현 때 확정한다. 이유는 [분리 기록](../../../records/2026-11-16-02-scoping-check-and-sdk-split.md)에 있다.

## 방지 장치 (hook 등) — 계획만 있음

사용자가 "hook같은걸로 뭔가 방지하게 하는 그런것도 할거"라고 했다. 형태는 정하지 않았다. 판단할 후보는 다음과 같다.
- **발행 전용 스크립트:** 예를 들어 `pnpm client update:publish`. 마지막 스토어 빌드 커밋 이후의 diff를 검사한다. migrations·`db/index.ts`·`packages/schema`·네이티브 설정 변경이 있으면 거부하고, 환경값을 확인하고, Sentry 업로드까지 수행한다.
- **AI 도구 hook:** Claude·Codex가 `eas update`를 직접 실행하려 할 때 위 검사를 거치게 막는다. 현재 `.claude/settings.json`에는 hook이 없다. `.claude/hooks/maintain.py`는 퇴역한 Work hook이 아무 일도 하지 않고 끝나게 하는 잔재다. `.codex/hooks.json`은 따로 있다.
- **git hook이나 CI:** 현재 CI(`.github/workflows`)는 없다.

AI 도구 hook만으로는 사람이 터미널에서 직접 실행하는 발행을 막지 못한다. 그래서 검사 자체는 발행 스크립트가 맡고, hook은 그 스크립트로 유도하는 보조가 되는 구성이 유력하다. 이 판단은 아직 사용자와 확정하지 않았다.

어떤 형태든 장치는 특정 SDK 버전에 묶이지 않게 만든다. 검사는 경로 diff와 fingerprint처럼 SDK가 바뀌어도 그대로 쓰는 기준에 기댄다. 012의 업그레이드 뒤에도 이 장치를 이어 쓰기 위해서다.

## 가정과 확인하지 못한 것

- **dev-client 충돌(의존성은 확인, 빌드는 미확인):** `expo-dev-client` 6.0.20은 SDK 54 세대다. 이 패키지가 끌어온 `expo-updates-interface` 2.0.0과 `expo-manifests` 1.0.10이 루트에 깔려 있다. 반면 `expo-updates` 0.25.28은 `expo-updates-interface ~0.16.2`, `expo-manifests ~0.14.0`을 요구한다. 그대로 넣으면 같은 네이티브 모듈이 두 버전으로 섞인다고 보고 dev-client를 4.0.29로 내리기로 했다. 실제로 빌드해서 깨지는지는 보지 않았다.
- `npx expo install --check`로 SDK 51 기대 버전과 어긋난 패키지가 10개 나왔다. 011에서는 dev-client만 맞춘다. `expo-splash-screen` 31.0.10(SDK 54 세대)을 포함한 나머지는 012에서 다룬다. dev-client만 내려도 1단계 빌드가 되는지는 판단 지점에서 함께 본다.
- iOS 13–14 사용자는 1.1.4부터 새 버전을 받지 못한다. 현재 그런 사용자는 거의 없다고 보았지만 App Store Connect 통계로 확인하지 않았다.
- Expo 무료 플랜의 업데이트 한도는 확인하지 않았다.
