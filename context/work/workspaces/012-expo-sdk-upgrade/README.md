# 012 — Expo SDK를 올려 2027년 4월 Apple 빌드 요건을 맞추기

Noline 앱은 Expo SDK 51 / React Native 0.74.5로 만들어져 있다. 2027년 4월부터 App Store에 올리는 iOS 앱은 iOS 27 SDK(Xcode 27)로 빌드해야 하는데, 지금 구성으로는 그 빌드를 만들기 어렵다. 이 Work는 SDK와 함께 움직여야 하는 React Native·라이브러리·도구 버전을 올려 그 전에 새 스토어 빌드를 낼 수 있게 하는 독립 Work다. 그동안 버전 문제를 개별로 내리거나 고정해 버텨 온 것도 이 Work에서 정리한다.

**2026-11-16 현재 Work를 만들기만 했다.** 대상 SDK, 올리는 단계, 라이브러리별 대응 같은 버전 상세는 아직 정하지 않았고, 이 Work에서 사용자와 논의해 정한다. 구현·빌드는 시작하지 않았다.

이 Work는 [Work 011(expo-updates OTA)](../011-expo-updates-ota/README.md)의 논의 중에 분리됐다. 011은 SDK 51 위에서 OTA를 먼저 넣고, 012가 그 뒤 플랫폼을 올린다. 두 Work의 순서와 조건은 [현재 상태](current/state/index.md)에 있다.

[재개 안내](recover.md)에서 시작한다. 각 폴더가 맡는 내용은 다음과 같다.
- current: 목표·마감·지킬 조건·열린 판단(대상 SDK 등)과 현재 상태
- source: 과거 버전 문제 사례의 원문 발췌, 의존성 점검 결과, 외부 요건의 출처
- output: 실제 결과 위치(아직 없음)
- records: 011에서 분리한 이유와 버전 분석

이 Work를 만들면서 기본 Workspace나 실제 채팅 연결은 바꾸지 않았다.
