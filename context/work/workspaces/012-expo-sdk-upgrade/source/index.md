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
