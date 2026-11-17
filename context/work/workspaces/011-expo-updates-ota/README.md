# 011 — expo-updates(OTA)를 도입해 JS 수정을 심사 없이 내보내기

JS만 바뀐 수정을 App Store 심사 없이 사용자 앱에 보낼 수 있도록 `expo-updates`를 넣는 독립 Work다. 같은 스토어 빌드에 iOS 최소 버전을 15.0으로 올리는 설정(Apple 경고 ITMS-90068)도 함께 싣는다. 도입한 뒤에는 "OTA로 내도 되는 변경과 안 되는 변경"을 Project context에 남기고, 위험한 발행을 hook 같은 장치로 막는 것까지 이 Work의 범위다.

**2026-11-17 현재 Ticket 01을 진행 중이다.** `expo-updates`와 설정을 넣었고, dev-client를 SDK 51용으로 맞춘 조합이 로컬 Xcode 26에서 빌드되는 것을 확인했다. 막힌 한 줄은 pnpm patch로 고쳤다. 발행 방법과 EAS 환경도 정리했다. 이어서 preview 빌드로 실제 iPhone에서 OTA 받기·오프라인 시작·롤백·runtime 분리를 확인했다. OTA 소스맵도 preview에서 확인했다. 발행 절차를 묶은 스크립트 `pnpm ota:publish`도 만들어 커밋했다. 이어 방지 장치의 나머지(변경 검사, env 이름 대조, 직접 발행 hook)도 구현해 preview에서 확인했다. 이 부분도 커밋했고 규칙은 사용자 확인 전이다. 남은 일은 그 확인, production 쪽 확인, 1.1.4 출시, Project 반영이다. 코드 변경은 브랜치 `feat/011-expo-updates`에 커밋했고 main 병합은 011이 끝난 뒤 한다. 1.1.3(빌드 17)은 2026-11-16 밤에도 심사 대기 중이었다. 이 Work의 결과는 다음 스토어 빌드 1.1.4에 실릴 예정이다.

Expo SDK·라이브러리 버전 업그레이드는 이 Work에서 하지 않는다. 같은 날 사용자와 별도 [Work 012](../012-expo-sdk-upgrade/README.md)로 나눴고, 버전의 상세 논의는 012가 맡는다. 012는 다른 세션에서 진행한다.

[재개 안내](recover.md)에서 시작한다. 각 폴더가 맡는 내용은 다음과 같다.
- current: 목표·위험·완료 기준과 남은 Ticket
- source: 논의가 나온 대화 원문과 Apple 메일의 접근점
- output: 실제 결과 위치(코드 커밋, EAS 환경, Sentry)
- records: 논의에서 고른 방향과 그 이유, 착수 전 파악과 SDK 업그레이드를 나눈 경위, Ticket 01 착수와 판단 지점·발행 환경, preview 빌드와 실기기 OTA 확인, preview 앱 Google 로그인 수정, 커밋과 OTA 소스맵 확인, OTA 발행 스크립트, 방지 장치 나머지, 스크립트 재구성, hook의 `.agents/hooks/` 이동

이 Work를 만들면서 기본 Workspace나 실제 채팅 연결은 바꾸지 않았다.
