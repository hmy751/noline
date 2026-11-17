# 실행 Ticket

순서대로 진행한다. 01의 설정이 있어야 02의 검사 대상(발행 명령)이 생기고, 03은 01·02에서 실제로 확인한 기준을 옮긴다.

- [01 — expo-updates와 iOS 15를 넣고 1.1.4로 낸다](01-expo-updates-and-ios15-build.md): dev-client 정렬과 Xcode 26 빌드 확인(판단 지점), 설치·설정·채널, 발행 방법, preview 확인, 스토어 빌드·심사. 심사 대기 중: preview에서 완료 판단 1–4와 5 일부를 확인했고, 1.1.4(빌드 18)를 main에서 빌드해 제출했다. 심사 결과, ITMS-90068 확인, production OTA 확인이 남음.
- [02 — 위험한 OTA 발행을 막는 장치](02-ota-publish-guard.md): 발행 스크립트와 hook. SDK 버전에 묶이지 않게 만든다. 구현·확인·커밋 완료: 발행 스크립트(변경 검사·env 대조 포함)와 직접 발행 hook을 preview에서 확인. 규칙은 현재대로 두고 확정은 03에서 Project context와 연결해 정함. Codex 확인이 남음.
- [03 — Project context에 반영](03-project-context-reflection.md): OTA 가능·불가 기준과 발행 절차, 02 규칙의 확정. 01·02가 끝난 뒤. 실행 전.

SDK·라이브러리 버전 업그레이드는 이 Work의 Ticket이 아니다. [Work 012](../../../../012-expo-sdk-upgrade/README.md)가 맡는다.
