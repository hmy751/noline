# Ticket 02 판정 원자료 (2026-11-18)

판정용 앱이 iPhone에서 읽은 결과 보고서의 핵심을 옮겼다. 원래 보고서(`verify-report-online.txt`, `verify-report-offline.txt`)와 판정용 앱 코드는 세션 scratchpad에만 있어 재부팅·정리 때 사라질 수 있다. 계정·여행·레코드 식별자와 위치 좌표 같은 개인 데이터는 옮기지 않았다. 판정과 선택 과정은 [Ticket 02 판정 기록](../records/2026-11-18-06-ticket02-device-verification.md)에 있다.

## 조건

- 기기: iPhone 14 Pro, iOS 27.2.1, USB 연결
- 이전 앱: 1.1.4 preview `com.noline.dev` 빌드 `30c46ce2-39f7-450d-9c1c-bce9b4f2dff6`(SDK 51, expo-sqlite 14, rnmapbox 10.1.33 / native Mapbox v10)
- 판정용 앱: "Noline (판정)", `com.noline.dev`, 1.1.4 / 빌드 90 `3db6fe71-604f-48cc-9073-75aa922aaf14`, 빌드 91 `e9cfd75d-b81d-440f-8c87-dda010258122`. Expo SDK 54(expo 54.0.36 템플릿), RN 0.81.5, React 19.1.0, `newArchEnabled: true`, expo-sqlite ~16.0.10, @rnmapbox/maps 10.3.18(native Mapbox v11). 읽기만 한다(DB 파일이 없으면 열지 않고 SELECT만).

## 덮어 설치 전 기준값 (1.1.4 앱 화면)

- 여행 "도쿄, 일본"(2/1–2/6), 일정 3, 경비 1(JPY 12). 원래 온라인 전용이던 여행을 오프라인 활성화해 "일정, 경비, 경로 다운로드 완료", "오프라인 지도 준비 완료"
- 프로필 저장 공간: 활성화 전 저장된 데이터 160 KB·오프라인 지도 0 B, 활성화 뒤 272 KB·196.3 MB
- 비행기 모드에서 경비 "T02 offline expense" JPY 1500(식사, 2/2) 추가 → 경비 합계 JPY 1512
- 오프라인 일정 지도: 저장 경로(534.1 km) 표시. 확대하면 바다 영역이 칠해짐. 육지 배경은 지도 조작이 되지 않아 미확인

## 판정용 앱이 읽은 값 (빌드 90 온라인 실행, 오프라인 재읽기와 같음)

비행기 모드에서 다시 읽은 결과도 DB·pack 부분이 같았다. 그 보고서 첫 줄의 `airplane: false`는 판정 스크립트의 감지 오류이며, 같은 화면의 접근성 요소에 "에어플레인 모드 켬"이 있었다. 폴더 `Documents/SQLite`가 0.27 MB로 DB 파일 크기와 같아, Main은 `-wal`·`-shm` 파일이 없다고 보았다.

```text
== DB ==
defaultDatabaseDirectory: …/Documents/SQLite
Documents/SQLite/noline.db: 있음 (278528 bytes)
user_version: 0
표 11개
  expenses: 2  legacy_hold_acks: 0  legacy_sync_holds: 0  offline_cities: 0
  routes: 5  schedules: 3  server_records: 7  sync_metadata: 2
  sync_queue: 1  trip_activations: 1  trips: 3
sync_queue 1행: table_name=expenses, action=CREATE, title "T02 offline expense", amount 1500, currency JPY
== 지도 pack ==
offlineManager(v11 TileStore) | offline_city_1850147 | bounds 139.78171,35.7795,139.60171,35.5995
  requiredResourceCount 38, completedResourceCount 38, percentage 100, styleURI mapbox://styles/mapbox/streets-v11
offlineManagerLegacy(v10 방식) | (없음)
== 저장 공간 ==
Documents/SQLite: 0.27 MB
AppSupport/.mapbox: 203.74 MB
  .mapbox/tile_store: 196.99 MB
  .mapbox/map_data: 6.73 MB
  .mapbox/deferred_delivery: 0.02 MB
AppSupport/.expo-internal: 10.91 MB
Caches/com.noline.dev: 2.40 MB
```

v11의 pack `bounds`는 `"neLng,neLat,swLng,swLat"` 문자열이다. 빌드 90은 이것을 잘못 읽어 지도 중심을 못 잡았고, 빌드 91에서 고쳤다.

## 지도 화면 (빌드 91, 비행기 모드)

중심 139.6917, 35.6895, zoom 13에서 신주쿠 일대의 도로·역·지명·POI가 그려졌다(Main이 스크린샷으로 확인, 상태 표시줄의 비행기 아이콘 포함). 판정용 앱은 온라인에서 지도를 연 적이 없다.

## 테스트 도구 (저장소 밖 최소 프로젝트)

jest-expo 54.0.18, jest 29.7.0, @testing-library/react-native 14.1.0, test-renderer 1.3.1, React 19.1.0, RN 0.81.5, expo 54.0.38 조합에서 render·`fireEvent.press`·`changeText`·`waitFor` 비동기 테스트 1개 PASS.

## 목표 버전 관련 npm 정보

nativewind 4.2.7, @rn-primitives 1.5.x, react-native-calendars 1.1314.0의 peer 범위에 React·RN 버전 제한이 없다(공식 지원 보장은 아님).
