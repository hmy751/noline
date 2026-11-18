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
| Expo SDK 58 | 2026-10-15 출시, RN 0.88, React 19.3.0. iOS 27 SDK에 맞춰 prebuild가 `SceneDelegate.swift`와 `UIApplicationSceneManifest`를 만든다. Node는 22.13+·24.3+·26+를 지원하고 홀수(23·25)는 지원하지 않는다. RN 0.87부터 Strict TypeScript API가 기본이라 `react-native/Libraries/*` deep import가 타입 오류가 된다 | Expo SDK 58 changelog·버전 문서(2026-11-17 다시 확인) |
| Node.js 지원 기간 | 20은 2026-04-30 종료. 22는 2027-04-30, 24는 2028-04-30(2026-10-20 Maintenance 전환), 26은 2029-04-30(2026-10-28 Active LTS)까지 | Node.js 릴리스 일정 공지 |
| Expo SDK 56–58 | 최소 iOS 16.4, Xcode 26.4 이상 | Expo 버전 문서 |
| EAS 이미지 | Xcode 27 이미지(`macos-tahoe-26.6-xcode-27.x`)가 있다. SDK 57은 `expo-build-properties`의 `ios.enableSceneSupport`로 Xcode 27 빌드를 맞춘다. Expo는 보통 최신과 그 전 stable Xcode만 지원한다 | EAS 빌드 인프라 문서 |

출처 URL과 확인 시점은 [source 색인](../../../source/index.md)에 있다. 외부 문서는 바뀌므로 버전을 확정하기 전에 다시 확인한다.

## 이미 설치된 앱과 새 빌드의 구별

2027년 4월 요건은 **새로 올리는 빌드**에 적용된다. 이미 설치된 SDK 51 빌드는 iOS 27 기기에서도 iOS 26 SDK 빌드로서 계속 실행된다고 이해했다(Apple 문서의 범위 설명 기준, 실기기 미확인). 2026-11-17 iOS 27.2.1 iPhone 14 Pro로 확인할 수 있게 됐지만 아직 확인하지 않았다. Work 011의 OTA는 스토어 업로드가 아니므로 그 빌드에 JS 수정을 계속 보낼 수 있다. 막히는 것은 네이티브 변경이 필요하거나 새 스토어 빌드를 내야 하는 수정이다.

## 2026-11-17에 정한 계약

사용자가 Main의 질문과 제안에 답해 정했다. 경위는 [Ticket 구성·결정 기록](../../../records/2026-11-17-02-ticket-composition-and-release-decisions.md)과 [채택·점검 기록](../../../records/2026-11-17-04-release-plan-adopted-and-library-check.md)에 있다.

- **대상 SDK 58:** 사용자가 고른 "중간 단계 각각 출시" 선택지가 58 출시를 명시해 함께 정해진 것으로 본다(기록 담당자의 해석). 뒤에 출시 횟수를 줄이라고 한 뒤에도 58은 바뀌지 않았다. iOS 27 SDK를 기본으로 맞추고 지원 기간이 가장 길다는 2026-11-16 추천 이유는 그대로다.
- **최소 iOS 16.4 수용:** SDK 56 이상의 최소값이다. iOS 15.x–16.3 기기(예: iPhone 6s·7·1세대 SE는 iOS 15까지)는 업데이트를 받지 못한다. App Store Connect 사용자 수 통계는 보지 않고 받아들였다.
- **핫픽스 브랜치:** 1.1.4 시점에서 `release/1.1`을 만들어 업그레이드 출시 전까지의 1.1.x 핫픽스(OTA·빌드)는 그쪽에서 낸다. 업그레이드는 Ticket마다 main에 병합한다.
- **변경 단계와 출시 횟수를 나눈다:** 사용자는 처음에 SDK 54 → New Architecture → SDK 58을 각각 출시(심사 3번)하기로 골랐다가 "더 줄일수 있음 줄이고"라고 했고, 둘을 나눈 안에 "그래 좋아"라고 답했다. 개발은 51→54(Legacy 유지) → 54에서 New Architecture → 58로 하나씩 바꾸고 단계마다 preview 빌드로 검증한다. 출시는 1.2.0(SDK 54 + New Architecture)과 1.3.0(SDK 58·iOS 27) 2번이며, 1.2.0 뒤 1주일 동안 Sentry에 새 크래시가 없으면 1.3.0을 낸다. 58만 한 번 출시하는 안은 기기 DB 변경(expo-sqlite 14→16)·구조 전환·iOS 27을 한꺼번에 내보내고 스토어 빌드는 되돌릴 수 없어 버렸다. SDK 54는 Xcode 27로 빌드할 근거가 없어 4월 요건은 1.3.0이 맞춘다.
- **목표 Node 24:** 승인한 Ticket 표(서버·로컬은 01, EAS는 03)에 들어 있어 채택으로 본다. Node만 따로 확인한 발화는 없다.
- **SDK는 한 버전씩 올린다:** Expo 안내의 "We recommend upgrading SDK versions incrementally, one at a time."(2026-11-17 확인)에 따라 54에서 58로 건너뛰지 않는다. 중간 SDK는 로컬 빌드로 확인하고 EAS preview 빌드는 Ticket 끝에 돌린다.
- **데이터 보존을 먼저 판정한다:** 구현 전에 검증용 최소 앱으로 기기 DB와 오프라인 지도가 남는지 실기기로 본다(Ticket 02). 기기 DB가 그대로 열리지 않으면 SDK 54 단계로 가지 않고 보존 방법부터 다시 설계한다. DB는 여행 데이터 자체라 안내로 넘길 수 없다.
- **옛 오프라인 지도가 남지 않으면 구별해 다시 받게 한다:** 사용자 제안을 Main이 다듬은 방향이다. 새 지도 기록에 엔진 버전(`mapEngine`)을 남기고, 업데이트 뒤 첫 실행에 한 번 옛 기록의 `mapDownloaded`를 내려 "지도 다시 받기 필요"로 바꾸고 옛 파일을 정리한다. 첫 실행에 바로 안내하며, 활성 여행은 기존 재시도 경로로 지도만 다시 받고 비활성 여행은 다음 활성화 때 받는다. "준비됨" 배지가 `mapDownloaded`만 보기 때문에, 이 정리가 없으면 빈 지도가 "준비됨"으로 보인다. 지도가 그대로 읽히면 대응하지 않는다.
- **출시마다 release 브랜치:** 1.2.0을 낼 때 `release/1.2`를 만든다. 1.2.0 뒤 main에서 SDK 55–58을 진행하는 동안 1.2.0 핫픽스를 낼 곳이 필요하기 때문이다. OTA는 채널의 최신 빌드와 runtime이 같을 때만 발행되므로 `release/1.1`의 OTA는 production에 1.2.0 빌드가 생기기 전까지만 유효하다. 그 뒤 1.1.x는 스토어 빌드로만 고친다. 이것은 Project [출시 기준](../../../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)의 기존 정책을 따르는 것이며, 바꿀 필요가 생기면 Project 쪽에서 판단한다.
- **Ticket 5개:** 01 준비, 02 데이터 보존 선검증과 목표 확정, 03 SDK 51→54(Legacy), 04 New Architecture와 1.2.0, 05 SDK 55→58·iOS 27과 1.3.0. 상세는 [Ticket 색인](../tickets/index.md), 경위는 [재구성·지도 대응 기록](../../../records/2026-11-17-05-ticket-restructure-and-map-data-plan.md)에 있다.

## 아직 정하지 않은 계약

- **라이브러리 지원:** 2026-11-17 [호환 조사](../../../source/library-compatibility-2026-11-17.md)로 react-native-maps(1.29.11)·rnmapbox(≥10.3.10)의 RN 0.88 대응 버전은 찾았다. nativewind의 SDK 58·RN 0.88 지원, Mapbox v10→v11의 오프라인 pack 보존, expo-sqlite 상향 뒤 DB 파일 경로는 미확인이며 Ticket 02에서 판정한다. 이들이 막히면 SDK 58 계획(또는 SDK 57 + scene 설정 같은 대안)을 다시 판단한다.
- **04·05의 기존 사용자 업데이트 확인 방식:** 02는 preview 번들 ID로 한다. 04·05의 출시 빌드 확인을 preview 앱으로 할지는 Main 기본값이며 Ticket 04에서 정한다.
