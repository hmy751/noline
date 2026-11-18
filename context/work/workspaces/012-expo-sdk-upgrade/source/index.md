# 선택한 원자료

## 이 저장소와 세션의 원문

[버전 이력 원문 발췌](version-history-evidence.md)에 다음을 모았다. 과거 버전 결정의 뜻이나 사용자가 실제로 한 말을 다시 확인할 때 읽는다.
- 버전을 바꾼 커밋 7개와 변경 줄
- 2026-11-02 SDK 업그레이드를 미룬 대화(세션 원문 행번호 포함)
- 2026-11-16 이 Work를 만든 대화
- `npx expo install --check` 출력

archive(`_archive/`)에는 SDK 업그레이드 계획이 없다. "React Native 0.74.5, Expo SDK 51"이라는 당시 사실만 있다(`_archive/offline-map-decision-pre-project-2026-10-31.md` 등). 2026-11-16 검색으로 확인했다.

## 외부 자료

2026-11-16에 읽었다. 외부 문서는 바뀌므로 버전을 확정하기 전에 다시 확인한다.

| 자료 | 이 Work에서 쓴 내용 |
| --- | --- |
| [Apple — App Store submissions now open for the latest OS releases](https://developer.apple.com/news/?id=k1mtkt1k) (2026-09-09) | 2027년 4월부터 iOS 앱은 iOS 27 SDK 이상으로 빌드해야 업로드 가능 |
| [Apple TN3187 — Migrating to the UIKit scene-based life cycle](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle.md) | iOS 26 다음 릴리스부터 최신 SDK로 빌드한 앱은 scene 생명주기 필요. 웹 검색 요약과 Apple 포럼 발췌로 확인했고 TN 본문 전체는 읽지 않았다 |
| [Expo SDK 버전 문서](https://docs.expo.dev/versions/latest/) | SDK 56–58의 RN 버전, 최소 iOS 16.4, Xcode 26.4+, 최신 SDK 58 |
| [EAS 빌드 인프라](https://docs.expo.dev/build-reference/infrastructure/) | iOS 이미지와 SDK 별칭, Xcode 27 이미지, SDK 57의 `ios.enableSceneSupport`, Xcode 지원 범위 |
| [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55) | Legacy Architecture 지원 종료(SDK 54가 마지막), RN 0.83 |
| [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58) | 2026-10-15 출시, RN 0.88, iOS 27 SDK·SceneDelegate, Node 22.13+ |
| [Expo New Architecture 안내](https://docs.expo.dev/guides/new-architecture) | SDK 55 이상은 New Architecture를 끌 수 없음 |

### 2026-11-17에 추가로 읽은 자료

Node 상향과 서버 포함을 판단하며 Main이 읽었다. 판단과 확인 한계는 [전수 조사 기록](../records/2026-11-17-01-version-inventory-and-server-scope.md)에 있다.

| 자료 | 이 Work에서 쓴 내용 |
| --- | --- |
| [Expo SDK 58 버전 문서](https://docs.expo.dev/versions/v58.0.0) | React 19.3.0, RN 0.88, 최소 Node 22.13, 최소 iOS 16.4+, Xcode 26.4+ |
| [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58) (다시 읽음) | Node 22.13+·24.3+·26+ 지원, 홀수 미지원. RN 0.87부터 Strict TypeScript API 기본. expo-router navigation core 재작성. prebuild의 `SceneDelegate.swift` 생성. expo-sqlite libSQL 제거 |
| [Node.js — Evolving the Node.js Release Schedule](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule) | 26이 옛 짝·홀 방식의 마지막 릴리스, 27부터 매년 4월 출시. 20·22·24·26의 지원 종료일은 웹 검색 요약(endoflife.date 인용 포함)에서 함께 읽었다 |
| [devx — Node.js 26 LTS](https://www.devx.com/coding/nodejs-26-lts-new-features-release-date/) | Node 26 일정의 보조 출처 |
| [buildmvpfast — Expo SDK 58 breaking changes](https://www.buildmvpfast.com/blog/expo-sdk-58-ios-27-react-native-088-breaking-changes-2026) | 처음 Node 24.3·26 하한을 본 제3자 블로그. 뒤에 공식 changelog로 확인해 이 자료에 의존하지 않는다 |
| [EAS 빌드 인프라](https://docs.expo.dev/build-reference/infrastructure/) | SDK 58 빌드의 EAS 기본 Node는 문서에서 찾지 못했다 |

저장소 설정값(`package.json`·lockfile·`eas.json`·`render.yaml`·`nixpacks.toml`·docker-compose·`START_GUIDE.md`)은 원문을 따로 옮기지 않았다. 2026-11-17 값은 [제약·현재 설계·가정](../current/memory/spec/05-constraints-design-assumptions.md)의 표에 있고, 실제 파일이 원천이다.

## 2026-11-17 라이브러리 호환 점검

[라이브러리 호환 조사](library-compatibility-2026-11-17.md): reanimated를 계기로 사용자가 요청한 점검의 결과다. 라이브러리마다 SDK 54 Legacy 단계, New Architecture 단계, SDK 58의 목표 버전과 근거, 함께 움직여야 하는 묶음, 이 앱이 뒤처진 지금의 기본값, 미확인 항목, 외부 출처와 확인 주체를 담는다. 라이브러리 버전을 정하거나 올릴 때 읽는다.

[Expo bundledNativeModules 사본](expo-bundled-native-modules/): Expo가 SDK별로 정한 버전 목록 원본이다. 조사 서브가 2026-11-17 받은 expo@54.0.38·58.0.26의 파일을 그대로 옮겼다. `npx expo install`이 고를 버전을 다시 대조할 때 쓴다.

2026-11-17에 Main이 [Expo SDK 업그레이드 안내](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)에서 "We recommend upgrading SDK versions incrementally, one at a time."를 확인했다. SDK를 한 버전씩 올리기로 한 근거다.

## 2026-11-18 Ticket 01 검사 기준선

[기준선 원자료](ticket-01-baseline-2026-11-18.md): Main이 Ticket 01에서 직접 실행한 검사의 명령·통과/실패 수·실패 이름(Node 24, 변경 전과 Node 24 설정 변경 뒤), 서버·schema의 Node 20 비교, `expo install --check` 출력 9줄, 1.1.4 빌드의 `gitCommitHash`. 원래 로그는 세션 scratchpad에만 있어 비교에 필요한 최소한을 옮겼다. 이후 단계의 검사 결과를 비교하거나 `--check` 변화를 볼 때 읽는다.

## 2026-11-18 Ticket 02 판정 원자료

[판정 원자료](ticket-02-verification-2026-11-18.md): 판정용 앱이 iPhone에서 읽은 DB(표별 행 수, `sync_queue`), 지도 pack(v11·Legacy API), 저장 공간 값과 덮어 설치 전 1.1.4의 기준값, 지도 화면 확인, RNTL 14 확인 조합. scratchpad의 원래 보고서에서 개인 식별자를 빼고 옮겼다. 04·05에서 출시 빌드 덮어 설치 결과와 비교할 때 읽는다.
