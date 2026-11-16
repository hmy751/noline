# 현재 상태와 다음 행동

2026-11-16 두 번째 세션이 끝난 시점의 상태다.

**지금까지:** 같은 날 1.1.3(빌드 17)을 Apple 심사에 낸 뒤 expo-updates 도입을 논의하고 이 Work를 만들었다. 사용자는 논의한 방향([Spec](../memory/index.md))에 "그래 좋아"라고 답했다. 두 번째 세션에서는 구현에 들어가지 않고 착수 전 파악만 했다. 사용자가 "바로 시작하지말고 파악만 해봐"라고 범위를 좁혔기 때문이다. Main이 그 전에 해 둔 패키지 설치는 되돌렸고, 저장소 코드 변경은 남지 않았다. 경위는 [파악·분리 기록](../../records/2026-11-16-02-scoping-check-and-sdk-split.md)에 있다.

**파악으로 바뀐 것:**
- **새 막힘, dev-client 충돌:** `expo-dev-client` 6.0.20은 SDK 54 세대라 `expo-updates` 0.25.28(SDK 51용)이 요구하는 `expo-updates-interface`·`expo-manifests`와 버전이 어긋난다. 그래서 Ticket 01의 실제 첫 작업은 dev-client를 `~4.0.29`로 내리는 일이다. 의존성은 확인했지만 빌드는 해 보지 않았다.
- **해소된 미확인:** SDK 51 조합(`expo-updates` 0.25.28)도 fingerprint 정책을 지원한다. 코드로 확인했고 실제 빌드는 미확인이다.
- **설치 명령:** `apps/client`의 `npx expo install`은 pnpm 오류로 실패했다. 저장소 루트의 `pnpm --filter @apps/client add <버전>`은 됐다.

**범위 변경, SDK 업그레이드는 012로:** 사용자가 SDK·라이브러리 업그레이드도 이 Work에서 맡을지 물었다. Main이 과거 기록·현재 의존성·Apple과 Expo의 조건을 분석했다. Apple이 2027년 4월부터 iOS 27 SDK 빌드를 요구하고 SDK 51로는 그 뒤 새 스토어 빌드가 사실상 어렵다는 것이 핵심이다. 사용자는 "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고"라고 답했다. 업그레이드와 버전 상세 논의는 [Work 012](../../../012-expo-sdk-upgrade/README.md)가 맡는다. 011에는 다음 조정이 남았다. 분리 추천에 들어 있던 방향이며 항목별 세부는 구현 때 확정한다.
- SDK 51에 들이는 정리는 dev-client 정렬까지만 한다.
- 1단계에서 SDK 51용 expo-updates와 dev-client 4.0.29가 Xcode 26(EAS 26.2, 로컬 26.5)에서 빌드되는지 먼저 본다. 깨지면 SDK 51에 더 투자하지 않고 OTA를 012에 합칠지 다시 판단한다.
- 방지 장치(Ticket 02)는 SDK 버전에 묶이지 않게 만든다(경로 diff와 fingerprint).
- 1.1.4의 iOS 15.0 설정은 임시 조치다. SDK 56 이상은 최소 iOS 16.4다.
- 업그레이드 릴리스 뒤에는 OTA 받기·오프라인 시작·롤백을 다시 확인해야 한다. 나누면서 받아들인 비용이다.

**아직 하지 않은 것:**
- 구현·빌드·검증은 시작하지 않았다. `apps/client`에는 `expo-updates`·`expo-build-properties`·`runtimeVersion` 설정이 없고 dev-client는 6.0.20 그대로다.
- 방지 장치(Ticket 02)는 형태를 정하지 않았다.
- Project 반영(Ticket 03)은 반영 위치부터 미정이다.

**중요한 미확인:**
- SDK 51용 expo-updates와 dev-client 4.0.29가 Xcode 26에서 빌드되는지 (1단계 판단 지점)
- 1.1.3 심사 결과: Gmail 커넥터 연결이 끊겨 확인하지 못했다
- Expo 무료 플랜의 업데이트 한도
- iOS 13–14 사용자 수

**다음 행동:** 구현 착수는 사용자가 정한다. 착수하면 먼저 1.1.3 심사 결과를 App Store Connect에서 확인한다. 거절됐으면 Work 008의 대응이 먼저다. 그다음 [Ticket 01](../memory/tickets/01-expo-updates-and-ios15-build.md)의 1·2단계, 즉 패키지 설치와 dev-client 정렬, Xcode 26 빌드 확인부터 한다. 2단계의 결과가 011을 계속할지 012에 합칠지를 가른다.

**작업 트리 주의:** 다음 미커밋 수정은 이 Work와 무관하다. 이 Work의 문서를 커밋할 때 함께 올리지 않는다.
- `context/personal/experience/*` 4개
- Work 006의 Ticket 14·state
- `.pnpm-store/`(추적하지 않는 폴더)

기본 Workspace와 host 세션 선택은 바꾸지 않았다.
