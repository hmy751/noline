# 01 — expo-updates와 iOS 15를 넣고 1.1.4로 낸다

**상태:** 준비됨, 실행 전 (2026-11-16)

## 할 일

1. `apps/client`에서 `npx expo install expo-updates expo-build-properties`를 실행한다. `expo-dev-client` ^6과의 호환을 확인한다.
2. `app.config.js`에 다음을 넣는다.
   - `runtimeVersion: { policy: 'fingerprint' }`
   - `updates: { url, fallbackToCacheTimeout: 0 }`
   - `expo-build-properties` plugin (`ios.deploymentTarget: '15.0'`)
3. `eas.json`의 preview·production 프로필에 `channel`을 넣는다.
4. production 환경값과 Sentry 소스맵 업로드를 포함한 발행 방법을 정한다. 02의 발행 스크립트와 합칠 수 있다.
5. preview 빌드를 만들어 [완료 판단](../spec/04-quality-and-completion.md)의 1〜5를 확인한다.
6. 버전을 1.1.4로, 빌드 번호를 18로 올리고 production 빌드 → `eas submit` → App Store Connect 정보 입력 → 심사 제출을 한다. 인증서 만료(2026-12-30)를 먼저 확인한다.

## 완료 조건

완료 판단 1〜5와 7을 확인한다. 각 확인에 사용한 빌드 ID, 채널, 기기(시뮬레이터 또는 실기기)를 records에 남긴다.

## 주의

- 1.1.3 심사 결과가 아직 나오지 않았다. 1.1.3이 거절되면 그 대응(Work 008)이 먼저다.
- 네이티브 설정이 바뀌므로 로컬 개발 앱도 다시 빌드해야 한다(`pnpm client ios`). JS만 다시 받는 것으로는 반영되지 않는다.
