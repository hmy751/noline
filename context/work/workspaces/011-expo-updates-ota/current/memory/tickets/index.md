# 실행 Ticket

순서대로 진행한다. 01의 설정이 있어야 02의 검사 대상(발행 명령)이 생기고, 03은 01·02에서 실제로 확인한 기준을 옮긴다.

- [01 — expo-updates와 iOS 15를 넣고 1.1.4로 낸다](01-expo-updates-and-ios15-build.md): dev-client 정렬과 Xcode 26 빌드 확인(판단 지점), 설치·설정·채널, 발행 방법, preview 확인, 스토어 빌드·심사. 진행 중: 단계 1–4 완료, 판단 지점은 패치로 통과, 실기기에서 완료 판단 1–4 확인. Sentry 소스맵·production 확인과 1.1.4 출시가 남음.
- [02 — 위험한 OTA 발행을 막는 장치](02-ota-publish-guard.md): 발행 스크립트와 hook. SDK 버전에 묶이지 않게 만든다. 형태 미정, 실행 전.
- [03 — Project context에 반영](03-project-context-reflection.md): OTA 가능·불가 기준과 발행 절차. 01·02가 끝난 뒤. 실행 전.

SDK·라이브러리 버전 업그레이드는 이 Work의 Ticket이 아니다. [Work 012](../../../../012-expo-sdk-upgrade/README.md)가 맡는다.
