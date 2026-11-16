# 현재 상태와 다음 행동

2026-11-16 기준 상태다.

**이 Work가 생긴 경위:** 같은 날 1.1.3(빌드 17)을 Apple 심사에 냈다. 상태는 "심사 대기 중", 승인 후 자동 출시로 설정했다. 배포 직후 사용자와 expo-updates 도입을 논의했고, 같은 날 온 Apple 경고 메일(ITMS-90068, iOS 13.4 대상)까지 묶어 이 Work를 만들었다. 논의에서 정한 방향은 [Spec](../memory/index.md)에 있다. 사용자는 이 방향에 "그래 좋아"라고 답했다.

**아직 하지 않은 것:**
- 구현, 빌드, 검증은 하나도 시작하지 않았다. `apps/client`에는 아직 `expo-updates`, `expo-build-properties`, `runtimeVersion` 설정이 없다.
- 방지 장치(Ticket 02)는 형태를 정하지 않았다.
- Project 반영(Ticket 03)은 반영 위치부터 미정이다.

**중요한 미확인:**
- `expo-dev-client` ^6과 SDK 51의 호환
- Expo 무료 플랜의 업데이트 한도
- iOS 13–14 사용자 수
- 1.1.3 심사 결과

**다음 행동:** [Ticket 01](../memory/tickets/01-expo-updates-and-ios15-build.md)의 1단계(패키지 설치와 호환 확인)부터 시작한다. 시작 전에 1.1.3 심사 결과를 App Store Connect에서 확인한다. 거절됐으면 Work 008의 대응이 먼저다.

**작업 트리 주의:** 다음 미커밋 수정은 이 Work와 무관하다. 이 Work의 문서를 커밋할 때 함께 올리지 않는다.
- `context/personal/experience/*` 4개
- Work 006의 Ticket 14·state

기본 Workspace와 host 세션 선택은 바꾸지 않았다.
