# 동작과 구별해야 할 사례

업그레이드는 새 동작을 만들지 않는다. 사용자가 보는 동작은 그대로 두고 그 아래의 플랫폼을 바꾼다. 그래서 이 문서는 "무엇이 그대로여야 하는가"와 "어디가 깨지기 쉬운가"를 구별한다. 라이브러리별 상세 대응은 버전 논의 뒤에 채운다.

## 그대로여야 하는 동작

- 네트워크가 없어도 앱이 열리고, 활성 여행은 기기 SQLite에서 조회·변경된다.
- 기존 사용자가 스토어 업데이트로 새 빌드를 받아도 기기 DB와 미전송 `sync_queue`가 보존되고, 로그인 상태가 유지된다.
- 준비해 둔 오프라인 지도 pack과 저장 경로가 계속 표시된다.
- 011이 넣은 OTA가 새 빌드에서도 업데이트를 받고, 업데이트를 기다리지 않고 시작한다.

## 깨지기 쉬운 영역 (2026-11-16 관찰, 확정 아님)

| 영역 | 왜 위험한가 | 근거 |
| --- | --- | --- |
| Mapbox (`@rnmapbox/maps`) | 2025-11에 New Architecture에서 문제가 나 10.2.6 → 10.1.33으로 내리고 `newArchEnabled: false`로 껐다. SDK 55부터는 끌 수 없다 | 커밋 `7ed7ac54` |
| 기기 DB (`expo-sqlite`·`drizzle-orm`) | 사용자 데이터가 있는 기기에서 업데이트된다. 2025-10에 SDK 54용 expo-sqlite 16을 14로 내린 이력이 있다. drizzle Expo adapter의 transaction 동작도 Work 007에서 문제가 됐다 | 커밋 `ffa7069f`, Work 007 기록 |
| 네비게이션 (`expo-router`) | 3.5에서 여러 메이저를 건너뛴다. 사용 파일 21개 | 2026-11-16 grep |
| 스타일·애니메이션 (nativewind 4, reanimated 3) | reanimated 최신 메이저는 New Architecture 전용이고 nativewind 호환이 함께 걸린다 | 확인 필요 |
| 앱 시작 (`AppDelegate`, splash) | iOS 27 SDK는 UIScene 생명주기를 요구한다. splash-screen은 지금도 SDK 54용이 섞여 있다 | Apple TN3187, `expo install --check` |
| Sentry | Xcode 26에서 SDK 51 기대 버전이 컴파일되지 않아 6.22로 올렸다. 소스맵 업로드 절차는 미확인이다 | Work 007 기록 2026-11-09 |

사용 파일 수는 `apps/client/src`·`app`과 `packages/ui/src`에서 import를 센 값이다(expo-router 21, drizzle-orm 28, @rnmapbox/maps 8, react-native-maps 4, expo-sqlite 1).
