# 011 — expo-updates(OTA)를 도입해 JS 수정을 심사 없이 내보내기

JS만 바뀐 수정을 App Store 심사 없이 사용자 앱에 보낼 수 있도록 `expo-updates`를 넣는 독립 Work다. 같은 스토어 빌드에 iOS 최소 버전을 15.0으로 올리는 설정(Apple 경고 ITMS-90068)도 함께 싣는다. 도입한 뒤에는 "OTA로 내도 되는 변경과 안 되는 변경"을 Project context에 남기고, 위험한 발행을 hook 같은 장치로 막는 것까지 이 Work의 범위다.

**2026-11-16 현재 논의와 착수 전 파악까지 마쳤고 구현은 시작하지 않았다.** 파악에서 `expo-dev-client` 버전 충돌이 새로 나와, 첫 작업은 dev-client를 SDK 51용으로 맞추고 Xcode 26에서 빌드되는지 보는 일이 됐다. 1.1.3(빌드 17)의 심사 결과는 아직 확인하지 못했다. 이 Work의 결과는 다음 스토어 빌드 1.1.4에 실릴 예정이다.

Expo SDK·라이브러리 버전 업그레이드는 이 Work에서 하지 않는다. 같은 날 사용자와 별도 [Work 012](../012-expo-sdk-upgrade/README.md)로 나눴고, 버전의 상세 논의는 012가 맡는다.

[재개 안내](recover.md)에서 시작한다. 각 폴더가 맡는 내용은 다음과 같다.
- current: 목표·위험·완료 기준과 남은 Ticket
- source: 논의가 나온 대화 원문과 Apple 메일의 접근점
- output: 실제 결과 위치(아직 없음)
- records: 논의에서 고른 방향과 그 이유, 착수 전 파악과 SDK 업그레이드를 나눈 경위

이 Work를 만들면서 기본 Workspace나 실제 채팅 연결은 바꾸지 않았다.
