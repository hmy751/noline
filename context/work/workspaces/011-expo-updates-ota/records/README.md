# 기록

현재 기준은 [Spec](../current/memory/index.md)이, 남은 일은 [Ticket](../current/memory/tickets/index.md)이 소유한다. 이 색인은 그 기준이 어떻게 정해졌는지 다시 확인할 기록을 묶는다.

- [2026-11-16 — expo-updates 논의와 Work를 만든 경위](2026-11-16-01-discussion-and-work-creation.md): 1.1.3 배포가 논의를 부른 맥락, 각 추천(fingerprint, 시작 시 기다리지 않음, DB·서버 계약·환경값 규칙, iOS 15 동반)의 이유, 넣지 않은 것, hook과 Project 반영을 열린 판단으로 둔 이유. 추천을 바꾸거나 규칙을 확정할 때 읽는다.
- [2026-11-16 — 착수 전 파악과 SDK 업그레이드를 012로 분리한 경위](2026-11-16-02-scoping-check-and-sdk-split.md): "파악만" 정정으로 되돌린 설치, 파악에서 확인한 것(SDK 51 버전 조합, fingerprint 지원, dev-client 충돌, `expo install --check`의 어긋남 10개), 과거 업그레이드 사례와 Apple 2027년 4월 조건 분석, 012로 나눈 이유와 비용, 011에 남긴 조정. dev-client 정렬이나 012 분리의 근거가 필요할 때 읽는다.
- [2026-11-17 — Ticket 01 착수: Xcode 26 판단 지점 통과와 발행 환경 정리](2026-11-17-01-ticket01-build-gate-and-publish-env.md): 착수 지시, 설치·설정과 prebuild 결과, Release 빌드 두 번의 실패와 `expo-dev-menu` 패치, 사용자가 설명을 거쳐 011 계속을 고른 경위, fingerprint의 환경 의존과 eas-cli의 environment 규칙, EAS preview 환경을 채운 선택과 변경 내역, runtime 계산, 테스트 기기 0대. 발행 명령·EAS 환경을 다루거나 판단 지점의 근거가 필요할 때 읽는다.
- [2026-11-17 — preview 빌드와 실기기 OTA 확인](2026-11-17-02-preview-build-and-device-ota-check.md): iPhone 등록, 첫 preview 빌드의 runtime 불일치와 원인(오래된 `node_modules`의 중첩 사본)을 찾은 과정, `fingerprint:compare`의 SDK 52 제한, 두 번째 빌드, 실기기에서 완료 판단 1–4를 확인한 절차와 사용자 관찰, 번들 환경값 확인, Sentry 토큰 제약, eas-cli 기본 environment 매핑의 확정. 발행·빌드 전 runtime을 맞출 때나 완료 판단의 근거가 필요할 때 읽는다.
- [2026-11-17 — preview 앱 Google 로그인: 원인과 수정](2026-11-17-03-preview-google-login-fix.md): Google Cloud Console의 OAuth 클라이언트 셋, preview가 운영 client를 공유해 막힌 원인, 서버 audience 검사, 서버 수정(`99235878`)·EAS 분리·preview OTA·Render 값 변경과 그 순서의 이유, 해시 대조, 운영·시험 앱 로그인 확인, 변수 이름 비교, Apple 로그인 제한. EAS나 서버의 Google 설정을 바꿀 때 읽는다.
