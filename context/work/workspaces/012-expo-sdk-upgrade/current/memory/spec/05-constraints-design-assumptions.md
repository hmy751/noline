# 제약·현재 설계·가정

## 지킬 제약

- **마감:** 2027년 4월(Apple 요건). 심사·재제출 여유를 두려면 2027년 3월 중 심사 제출을 목표로 잡는 것이 추천이다. 목표일은 사용자와 확정하지 않았다.
- **011이 먼저다:** 011(expo-updates, 1.1.4)을 SDK 51에서 먼저 끝낸다. 업그레이드 릴리스 뒤의 버그를 심사 없이 고치려면 OTA가 이미 운영에서 검증돼 있어야 하기 때문이다. 011 1단계에서 SDK 51용 expo-updates가 Xcode 26에서 빌드되지 않으면 OTA를 이 Work에 합치는 쪽으로 다시 판단한다(011의 판단 지점).
- **인증서:** 배포 인증서·프로비저닝 프로필이 2026-12-30에 만료되고, Apple Developer 멤버십 갱신은 2026-12-18이다. 이 Work의 스토어 빌드는 그 뒤가 될 가능성이 높아 갱신이 먼저다.
- **기존 릴리스 절차:** EAS production 빌드 → `eas submit` → App Store Connect 입력 → 심사. 근거는 Work 007·008의 records다.
- **설치 방식:** 패키지는 `npx expo install`로 넣는다. 반복된 버전 혼선의 공통 원인이었다.

## 2026-11-16 현재 버전 상태

| 항목 | 현재 | 비고 |
| --- | --- | --- |
| Expo SDK / RN / React | 51.0.39 / 0.74.5 / 18.3.1 | `newArchEnabled: false` |
| EAS iOS 이미지 | `macos-sequoia-15.6-xcode-26.2` 고정 | 2026-11-02 `latest`(Xcode 27.1 RC)에서 Pod 배포 대상 13.4 때문에 실패해 고정(`f3007396`) |
| Node | `.nvmrc`·EAS `base.node` 20.18.1 | SDK 58은 22.13 이상 필요 |
| eas-cli | 로컬 16.28.0 | 2026-11-02 세션에서 27.x 상향을 권했으나 그대로 |
| 최소 iOS | 13.4(Podfile 기본값) | 011이 1.1.4에서 15.0으로 올릴 예정 |

`npx expo install --check`(SDK 51 기준)가 어긋난 패키지 10개를 냈다. 성격이 다르므로 섞어서 되돌리지 않는다.

| 구분 | 패키지(현재 → SDK 51 기대) | 이유 |
| --- | --- | --- |
| 일부러 벗어남 | `@sentry/react-native` 6.22.0 → ~5.24.3 | 5.24.3의 Sentry Cocoa가 Xcode 26.5에서 컴파일되지 않음(Work 007) |
| 일부러 벗어남 | `react`·`react-dom` 18.3.1 → 18.2.0 | 2025-10 expo-router 빌드 실패를 고치려 맞춤(`80ee0751`) |
| 섞여 들어옴 | `expo-dev-client` 6.0.20 → ~4.0.29 | SDK 54 세대. expo-updates와 충돌(Work 011) |
| 섞여 들어옴 | `expo-splash-screen` 31.0.10 → ~0.27.7 | SDK 54 세대 |
| 섞여 들어옴 | `react-native-safe-area-context` 5.6.1 → 4.10.5, `react-native-screens` 3.37.0 → 3.31.1, `react-native-svg` 15.14.0 → 15.2.0, `@react-native-community/netinfo` 11.4.1 → 11.3.1, `@types/react` 18.3.26 → ~18.2.79 | 근거 기록 없음 |

011은 이 가운데 dev-client 정렬만 맡는다. 나머지는 업그레이드에서 어차피 바뀌므로 SDK 51에서 따로 정리하지 않는다.

## 가정과 확인하지 못한 것

- SDK 51 / RN 0.74로 iOS 27 SDK 빌드를 맞추는 것은 사실상 어렵다고 판단했다. 배포 대상(13.4)은 고칠 수 있지만 UIScene 전환은 네이티브 패치가 필요하다. 실제로 시도하지는 않았다.
- Mapbox·nativewind·react-native-maps·drizzle의 RN 0.88/New Architecture 지원은 조사하지 않았다.
- iOS 15.x–16.3 사용자 수는 확인하지 않았다.
- 이미 설치된 SDK 51 빌드가 iOS 27 기기에서 그대로 동작한다는 것은 Apple 문서 해석이고 실기기로 확인하지 않았다.
- Expo가 Xcode 26.2 이미지를 언제까지 제공할지는 문서에 명시가 없다.
