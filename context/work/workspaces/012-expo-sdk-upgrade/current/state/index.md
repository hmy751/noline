# 현재 상태와 다음 행동

2026-11-16 기준 상태다.

**이 Work가 생긴 경위:** Work 011을 재개하던 중 사용자가 SDK·라이브러리 업그레이드를 함께 맡을지 물었다. Main이 과거 사례·현재 의존성·Apple과 Expo의 요건을 분석해 별도 Work를 추천했고, 사용자가 "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고"라고 답했다. 분석과 선택 이유는 [기록](../../records/2026-11-16-01-separation-from-011-and-version-analysis.md)에 있다.

**011과의 순서:** 011(SDK 51 위에서 expo-updates, 1.1.4)을 먼저 끝내고 이 Work로 넘어간다. 011 1단계에서 SDK 51용 expo-updates·dev-client 4.0.29가 Xcode 26에서 빌드되지 않으면, SDK 51에 더 투자하지 않고 OTA를 이 Work에 합치는 쪽으로 다시 판단한다. 그 판단 지점은 011이 소유한다.

**아직 하지 않은 것:**
- 버전 상세 논의: 대상 SDK(추천 58), 단계(추천 51→54→New Architecture→58), 중간 단계 출시 여부, 최소 iOS 16.4 수용, 목표 일정
- 라이브러리별 RN 0.88·New Architecture 지원 조사
- 구현·빌드·검증 전부
- Ticket 분해

**중요한 미확인:**
- Mapbox·nativewind·react-native-maps·drizzle의 대상 버전 지원
- iOS 15.x–16.3 사용자 수
- Apple 요건의 정확한 날짜(4월로만 공지)
- 업그레이드 전 기준선: client lint·test·typecheck 현재 결과

**다음 행동:** 사용자와 버전 상세를 논의한다. 이 Work의 결정이 011 진행 중에 필요해지면(예: dev-client 정렬이 막힘) 그때 앞당긴다. 논의 전에 Expo 최신 SDK와 Apple 요건이 바뀌지 않았는지 다시 확인한다.

**작업 트리 주의:** 다음 미커밋 수정은 이 Work와 무관하다. 이 Work의 문서를 커밋할 때 함께 올리지 않는다.
- `context/personal/experience/*` 4개
- Work 006의 Ticket 14·state

기본 Workspace와 host 세션 선택은 바꾸지 않았다.
