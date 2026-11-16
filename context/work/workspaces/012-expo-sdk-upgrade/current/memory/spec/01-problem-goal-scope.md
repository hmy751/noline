# 문제·목표·범위

## 왜 시작했나

2026-11-16, Work 011(expo-updates)을 재개하던 중 사용자가 물었다.

> "하는김에 앱 버전이랑 이런것도 이번 작업에서 맡을까? 기존에 앱 버전 업그레이드 하려고 했는데 안한게 꽤 있거든"

Main이 과거 기록·현재 의존성·외부 요건을 대조한 결과는 다음과 같다. 상세는 [분석 기록](../../../records/2026-11-16-01-separation-from-011-and-version-analysis.md)에 있다.

- **버전 문제를 그때그때 버텨 왔다.** 2025-10부터 SDK 54용 패키지가 섞여 빌드 실패·크래시가 나면 SDK 51용으로 내렸다(expo-sqlite, expo-asset, Mapbox, react). Xcode가 오를 때는 EAS 이미지를 Xcode 26.2로 고정하고(2026-11-02) Sentry를 SDK 51 기대보다 올렸다(2026-11-09).
- **미룬 결정이 사라졌다.** 2026-11-02 "근본 해법은 Expo SDK를 올리는 것, 이번 배포 뒤 별도 작업으로"라는 추천에 사용자가 동의했지만 어느 Work·Ticket에도 남지 않았다. 이 Work는 그 결정을 이어받는다.
- **마감이 생겼다.** Apple은 2027년 4월부터 iOS 27 SDK로 빌드한 앱만 받는다. iOS 27 SDK로 빌드하면 UIScene 실행 구조가 없는 앱은 켜지지 않는데, SDK 51 / RN 0.74에는 이 구조가 없다.

사용자는 011과 분리하기로 했다.

> "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고"

## 목표

1. 2027년 4월 Apple 요건(iOS 27 SDK 빌드) 아래에서도 새 스토어 빌드를 낼 수 있다.
2. 업그레이드 뒤에도 Noline의 핵심 약속, 즉 네트워크가 없어도 앱이 열리고 기기에 준비한 여행 데이터를 쓸 수 있다는 점이 유지된다.
3. 의존성이 대상 SDK의 기대 버전과 맞는다. 기대에서 벗어나는 버전은 이유를 남긴 것만 둔다.
4. 같은 버전 혼선이 다시 쌓이지 않게 설치·확인 방법을 정한다.

목표 1의 마감은 Apple이 "2027년 4월"까지만 밝혔다. 정확한 날짜는 미정이다.

## 범위

포함한다.
- Expo SDK와 React Native, React 버전 상향
- 그에 따라 필요한 New Architecture 전환(SDK 55부터 필수)
- 함께 올려야 하는 라이브러리: expo-router, @rnmapbox/maps, react-native-maps, expo-sqlite·drizzle-orm, reanimated·nativewind, Sentry, safe-area-context 등
- 도구: Node(EAS `base.node`, `.nvmrc`), eas-cli, EAS 빌드 이미지
- 최소 iOS 버전 변경과 그 영향 확인
- 업그레이드한 스토어 빌드와 심사 제출
- 버전 혼선 재발 방지

포함하지 않는다.
- expo-updates 도입·OTA 방지 장치: Work 011이 소유한다. 업그레이드 뒤 OTA가 계속 동작하는지 다시 확인하는 일은 이 Work의 완료 판단에 들어간다.
- Android 배포
- 서버 런타임(Node·Express) 업그레이드: 앱 빌드 도구로서의 Node만 다룬다.
- 새 기능 추가

대상 SDK와 단계는 아직 정하지 않았다. 버전 상세는 이 Work에서 논의한다.
