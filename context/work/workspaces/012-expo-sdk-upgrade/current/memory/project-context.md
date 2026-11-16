# 선택한 Project 맥락

업그레이드에서 깨지면 제품 약속이 무너지는 Project 본문과 그 이유다. 2026-11-16 Work를 만들 때 Main이 이 본문들을 다시 읽지는 않았다. 위험 판단은 커밋 이력·의존성 점검·과거 Work 기록에서 나왔다. 해당 영역을 업그레이드하거나 확인할 때 아래 본문을 처음부터 읽는다.

| 본문 | 이 Work에서 쓰는 부분 |
| --- | --- |
| [제품 기준](../../../../../project/common/product.md) | 네트워크가 없어도 계속 쓸 수 있다는 약속. 업그레이드 뒤 확인할 동작의 기준이다 |
| [데이터 수명](../../../../../project/guidance/data-lifecycle/INDEX.md) | 기기 SQLite, `withTransaction`과 `sync_queue`의 원자성. expo-sqlite·drizzle을 올릴 때 지켜야 할 계약이다 |
| [앱 실행·세션·데이터 보존](../../../../../project/current/app-runtime/INDEX.md) | 앱 준비 순서와 마이그레이션 실행 시점. AppDelegate·splash·UIScene 변경이 이 순서에 닿는다 |
| [지도 준비·공유·경로 표시](../../../../../project/guidance/offline-maps-and-routes/INDEX.md) | 오프라인 지도 pack과 저장 경로. Mapbox를 New Architecture로 옮길 때 확인할 동작이다 |
| [UI 책임](../../../../../project/guidance/development-boundaries/ui.md) | `packages/ui`와 client의 경계. nativewind·reanimated를 올릴 때 영향 범위를 볼 때 읽는다 |
| [오류 전달](../../../../../project/guidance/error-handling.md) | Sentry 연결과 신호 해석. Sentry SDK를 올릴 때 읽는다 |
| [현재 구조](../../../../../project/current/architecture.md) | 코드 영역과 검사 기반. 업그레이드 뒤 Project에 남길 지원 사실의 후보 위치다 |

Project에는 Expo SDK·React Native 버전이나 빌드 도구를 소유하는 본문이 없다. 버전 사실은 루트 README와 `apps/client/package.json`에 있다. 업그레이드 뒤 무엇을 Project에 남길지는 [Project 관리 계약](../../../../../project/MAINTENANCE.md)으로 판단하며, Work 011 Ticket 03(릴리스·OTA 반영 위치)과 겹치므로 함께 본다.
