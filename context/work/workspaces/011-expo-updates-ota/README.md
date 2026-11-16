# 011 — expo-updates(OTA)를 도입해 JS 수정을 심사 없이 내보내기

JS만 바뀐 수정을 App Store 심사 없이 사용자 앱에 보낼 수 있도록 `expo-updates`를 넣는 독립 Work다. 같은 스토어 빌드에 iOS 최소 버전을 15.0으로 올리는 설정(Apple 경고 ITMS-90068)도 함께 싣는다. 도입한 뒤에는 "OTA로 내도 되는 변경과 안 되는 변경"을 Project context에 남기고, 위험한 발행을 hook 같은 장치로 막는 것까지 이 Work의 범위다.

**2026-11-16 현재 논의만 마치고 구현은 시작하지 않았다.** 1.1.3(빌드 17)은 Apple 심사 대기 중이며, 이 Work의 결과는 다음 스토어 빌드 1.1.4에 실릴 예정이다.

[재개 안내](recover.md)에서 시작한다. 각 폴더가 맡는 내용은 다음과 같다.
- current: 목표·위험·완료 기준과 남은 Ticket
- source: 논의가 나온 대화 원문과 Apple 메일의 접근점
- output: 실제 결과 위치(아직 없음)
- records: 논의에서 고른 방향과 그 이유

이 Work를 만들면서 기본 Workspace나 실제 채팅 연결은 바꾸지 않았다.
