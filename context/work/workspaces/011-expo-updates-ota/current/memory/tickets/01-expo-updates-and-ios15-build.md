# 01 — expo-updates와 iOS 15를 넣고 1.1.4로 낸다

**상태:** 준비됨, 실행 전 (2026-11-16). 착수 전 파악을 마쳤고, 실제 첫 작업이 dev-client 정렬과 Xcode 26 빌드 확인으로 바뀌었다. 구현 착수는 사용자가 정한다.

## 할 일

1. **패키지와 dev-client 정렬.** SDK 51용 `expo-updates@~0.25.28`, `expo-build-properties@~0.12.5`를 넣고 `expo-dev-client`를 `~4.0.29`로 내린다.
   - 지금 깔린 dev-client 6.0.20(SDK 54 세대)은 `expo-updates-interface` 2.0.0·`expo-manifests` 1.0.10을 끌어온다. `expo-updates` 0.25.28은 `~0.16.2`·`~0.14.0`을 요구해서 그대로는 같은 네이티브 모듈이 두 버전으로 섞인다.
   - `apps/client`에서 `npx expo install`을 실행하면 내부 `pnpm add`가 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패했다. 2026-11-16 시험에서는 저장소 루트의 `pnpm --filter @apps/client add <버전>`으로 설치됐다.
   - SDK 51에 들이는 정리는 여기까지다. 나머지 어긋난 패키지는 [Work 012](../../../../012-expo-sdk-upgrade/README.md)에서 다룬다.
2. **Xcode 26 빌드 확인 (판단 지점).** 1의 조합이 Xcode 26(EAS 26.2, 로컬 26.5)에서 빌드되는지 먼저 본다. 깨지면 더 진행하지 않고 OTA를 012에 합칠지 사용자와 다시 판단한다. 기준은 [제약·설계의 판단 지점](../spec/05-constraints-design-assumptions.md#1단계의-판단-지점)에 있다.
3. `app.config.js`에 다음을 넣는다.
   - `runtimeVersion: { policy: 'fingerprint' }` (SDK 51 조합의 지원은 코드로 확인함)
   - `updates: { url, fallbackToCacheTimeout: 0 }`
   - `expo-build-properties` plugin (`ios.deploymentTarget: '15.0'`). 1.1.4만을 위한 임시 조치다.
4. `eas.json`의 preview·production 프로필에 `channel`을 넣는다. preview 프로필은 `APP_VARIANT=development`라 `com.noline.dev` 앱으로 빌드된다.
5. production 환경값과 Sentry 소스맵 업로드를 포함한 발행 방법을 정한다. 02의 발행 스크립트와 합칠 수 있다.
6. preview 빌드를 만들어 [완료 판단](../spec/04-quality-and-completion.md)의 1〜5를 확인한다.
7. 버전을 1.1.4로, 빌드 번호를 18로 올리고 production 빌드 → `eas submit` → App Store Connect 정보 입력 → 심사 제출을 한다. 인증서 만료(2026-12-30)를 먼저 확인한다.

## 완료 조건

완료 판단 1〜5와 7을 확인한다. 각 확인에 사용한 빌드 ID, 채널, 기기(시뮬레이터 또는 실기기)를 records에 남긴다. 2의 판단 지점 결과(빌드 성공 여부와 사용한 Xcode)도 남긴다.

## 진행 기록

- 2026-11-16: 사용자 확인 전에 브랜치 `feat/011-expo-updates`에서 1의 두 패키지를 설치했다가 "바로 시작하지말고 파악만 해봐"라는 지시로 되돌렸다. 브랜치는 지웠고 저장소 코드 변경은 남지 않았다. 설치된 동안 SDK 51 버전 조합과 fingerprint 지원을 확인했고, dev-client 충돌을 찾았다. 경위는 [파악·분리 기록](../../../records/2026-11-16-02-scoping-check-and-sdk-split.md)에 있다.

## 주의

- 1.1.3 심사 결과가 아직 확인되지 않았다. Gmail 커넥터 연결이 끊겨 메일로 확인하지 못했다. 1.1.3이 거절됐으면 그 대응(Work 008)이 먼저다.
- 네이티브 설정과 dev-client가 바뀌므로 로컬 개발 앱도 다시 빌드해야 한다(`pnpm client ios`). JS만 다시 받는 것으로는 반영되지 않는다.
- 2027년 4월부터 Apple이 iOS 27 SDK 빌드를 요구해 SDK 51로는 그 뒤 새 스토어 빌드가 사실상 어렵다. 1.1.4는 그 전에 내야 의미가 있다.
