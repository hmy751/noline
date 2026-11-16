# 개념과 지킬 계약

## SDK가 묶는 것

Expo SDK 하나는 React Native 버전과 그에 맞는 `expo-*` 패키지 버전 묶음을 정한다. `npx expo install`은 현재 SDK에 맞는 버전을 고르고, `pnpm add`는 npm의 최신을 고른다. 이 저장소의 과거 문제는 대부분 후자로 SDK 54용 패키지가 SDK 51 앱에 들어온 데서 생겼다.

## 외부 계약

| 계약 | 내용 | 출처 |
| --- | --- | --- |
| Apple 업로드 요건 | 2027년 4월부터 iOS 앱은 iOS 27 SDK 이상으로 빌드해야 업로드할 수 있다 | Apple 2026-09-09 공지 |
| UIScene 생명주기 | iOS 27 SDK로 빌드한 앱은 scene 기반 생명주기를 쓰지 않으면 시작 시 실패한다. iOS 26 SDK로 빌드한 기존 앱에는 해당하지 않는다 | Apple TN3187, iOS 27 릴리스 노트 |
| Apple 최소 iOS 경고 | ITMS-90068: 2027년 4월부터 최소 iOS 15.0 이상이어야 업로드할 수 있다 | Apple 메일(Work 011) |
| Expo New Architecture | SDK 54가 Legacy Architecture를 지원하는 마지막 SDK다. SDK 55부터 New Architecture만 쓴다 | Expo SDK 55 changelog |
| Expo SDK 58 | 2026-10-15 출시, RN 0.88. iOS 27 SDK에 맞춰 prebuild가 SceneDelegate를 만든다. Node 22.13 이상 필요 | Expo SDK 58 changelog |
| Expo SDK 56–58 | 최소 iOS 16.4, Xcode 26.4 이상 | Expo 버전 문서 |
| EAS 이미지 | Xcode 27 이미지(`macos-tahoe-26.6-xcode-27.x`)가 있다. SDK 57은 `expo-build-properties`의 `ios.enableSceneSupport`로 Xcode 27 빌드를 맞춘다. Expo는 보통 최신과 그 전 stable Xcode만 지원한다 | EAS 빌드 인프라 문서 |

출처 URL과 확인 시점은 [source 색인](../../../source/index.md)에 있다. 외부 문서는 바뀌므로 버전을 확정하기 전에 다시 확인한다.

## 이미 설치된 앱과 새 빌드의 구별

2027년 4월 요건은 **새로 올리는 빌드**에 적용된다. 이미 설치된 SDK 51 빌드는 iOS 27 기기에서도 iOS 26 SDK 빌드로서 계속 실행된다고 이해했다(Apple 문서의 범위 설명 기준, 실기기 미확인). Work 011의 OTA는 스토어 업로드가 아니므로 그 빌드에 JS 수정을 계속 보낼 수 있다. 막히는 것은 네이티브 변경이 필요하거나 새 스토어 빌드를 내야 하는 수정이다.

## 아직 정하지 않은 계약

- **대상 SDK:** 2026-11-16 분석의 추천은 SDK 58이다. iOS 27 SDK를 기본으로 맞추고, 지금 최신이라 지원 기간이 가장 길다. SDK 57 + scene 설정도 가능하다. Mapbox·nativewind·react-native-maps의 RN 0.88 지원을 확인한 뒤 확정한다.
- **최소 iOS:** SDK 56 이상이면 16.4가 된다. iOS 15.x–16.3 기기(예: iPhone 6s·7·1세대 SE는 iOS 15까지)를 지원에서 빼게 된다. 사용자 수는 App Store Connect 통계로 확인하지 않았다.
- **단계:** 추천은 51→54(Legacy Architecture 유지, 버전만 상향) → 54에서 New Architecture 전환·검증 → 58이다. "버전 상향"과 "아키텍처 전환"의 위험을 나눠 원인을 찾기 쉽게 하려는 것이다. 중간 단계를 출시할지는 정하지 않았다. SDK 54는 Xcode 27로 빌드할 근거가 없어 4월 요건을 혼자 맞추지 못한다.
