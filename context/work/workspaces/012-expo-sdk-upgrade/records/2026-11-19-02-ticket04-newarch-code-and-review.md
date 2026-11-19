# 2026-11-19 — Ticket 04 코드 작업: New Architecture 전환, fmt 우회 삭제, 독립 검증이 찾은 지도 스타일 문제

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 이 구간 앞부분에 컨텍스트 압축(5060–5063행)이 있었다. 이 기록은 그 뒤 원문과 브랜치의 실제 커밋·파일을 대조해 썼다.

## 04를 지금 시작한 이유

push와 기록을 마친 뒤 사용자가 "그럼 다음 작업은 뭐고 지금 usb 뺏는데 계속 조종이 가능한거야?"(5159행)라고 물었다. Main은 USB를 뺀 iPad를 조종할 수 없다고 확인했다. Mac의 `devicectl`은 Wi-Fi로 iPad를 connected로 보지만 화면 읽기·터치 도구(mobilecli)는 USB 기기만 찾아 "Device not found"였다. 무선 제어는 제어 서버 설정을 따로 바꿔야 해 지금은 필요 없다고 봤다(5197행). iPad 쪽 DeviceKit 서버는 계속 실행 중이다.

사용자가 "그럼 심ㅅ 기다려야 한다는거지"(5202행)라고 묻자, Main은 심사를 기다리는 것은 Ticket 01의 두 항목(1.1.4 심사 결과, 운영 앱 점검표)뿐이고, 04의 코드 작업·테스트·로컬 빌드 확인은 지금 할 수 있으며, 1.2.0 스토어 빌드·제출만 12월 갱신(멤버십 2026-12-18, 인증서 2026-12-30)을 기다린다고 답했다(5206행). 2025-11에 Mapbox가 깨진 지점이라 미리 문제를 찾아 두면 출시가 빨라진다는 이유도 들었다(5197행). 사용자는 "그래 쭉 해봐 다시"(5211행)라고 했다. Ticket 04 문서는 "1월에 한다"였지만, 이로써 코드·시뮬레이터·로컬 확인을 앞당겼다. 스토어 빌드 시점은 그대로다.

## 작업 위치와 커밋

main `307ae37b`에서 분기한 worktree `.claude/worktrees/012-newarch`, 브랜치 `feat/012-newarch`. main에는 병합하지 않았다.

**`6c6b5524` New Architecture 전환**
- `newArchEnabled: true`
- react-native-reanimated ~4.1.7 + react-native-worklets 0.5.1. `babel.config.js`의 reanimated plugin 등록과 `expo.install.exclude`를 지웠다(Ticket의 바꿀 묶음대로, 버전은 4.1.1 대신 Expo가 고른 ~4.1.7).
- @rnmapbox/maps ~10.3.18(native Mapbox v11). Ticket 02가 실기기로 지도 보존을 확인한 버전이다.
- `packages/ui`의 reanimated peer를 `>=4.1.0`으로 좁혔다. `>=3.10.0`이면 ui 아래에 3.19.5가 한 벌 더 설치됐기 때문이다(5401행).
- Mapbox v11에서 진행률 `percentage`가 null로 올 수 있어 그 알림을 건너뛰게 하고 테스트를 하나 더했다. 기존 코드도 `Math.round(null)`이 0이라 실제 동작은 같았고 타입을 맞춘 수정이다. `encodePolyline`은 튜플 타입으로 고쳤다.
- `MyLocationButton`이 쓰는 `useSharedValue`·`withRepeat`·`withTiming`·`useAnimatedStyle`은 reanimated 4에도 그대로 있어 코드를 바꾸지 않았다(5503행).

**`beee6373` fmt consteval 우회 삭제.** 03부터 "SDK를 올릴 때마다 빼고 빌드해 본다"고 한 임시 plugin을 빼고 시뮬레이터 Release 빌드를 돌리자 0 errors였다(5515행). New Architecture에서는 RN 0.81이 fmt·folly를 미리 빌드된 ReactNativeDependencies로 받아 Pods에 fmt 소스가 없어서다. 그래서 plugin 파일과 등록을 지웠다. 빌드 경고로 `RNMapboxMapsDownloadToken`이 deprecated이고 `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` 환경 변수를 권한다는 안내가 나왔다. 첫 커밋에 fmt 등록 삭제가 섞여 Main이 두 커밋으로 다시 나눴다(5651행).

**`fb73bb25` 오프라인 지도 스타일 수정(독립 검증자 발견).** 아래 절.

## 검사와 시뮬레이터

- Jest 79 suites / 923 tests 통과(스타일 수정 테스트 포함). client typecheck 4개(기존 ui 경로 TS6059·TS6307, SDK 54 때 5), lint 11 errors / 254 warnings(기준선과 같음), `expo-check` up to date, reanimated 한 벌.
- 시뮬레이터(iPhone 15 Pro, Release, New Architecture): 기존 데이터(파리, 일정 6, EUR 219) 유지, 일정 지도(react-native-maps)의 마커·경로, 내 위치 버튼(reanimated) 동작, 프로필에서 이전 빌드(Mapbox v10)가 받은 오프라인 지도를 161.2 MB로 표시, 경비 추가·달력 시트(react-native-calendars)·nativewind 스타일 정상(5537–5625행).
- 확인하지 않은 것: 비행기 모드의 오프라인 지도, 실기기, 1.1.4 위 덮어 설치. 셋 다 기기 빌드가 필요하다.

## 독립 검증과 지도 스타일 문제

구현에 참여하지 않은 검증자에게 Mapbox v10→v11 사이 바뀐 API의 사용처와 검사를 맡겼다. 검증자는 P1 문제 하나를 찾았다(5689행).

- **문제:** 일정 검색의 `OfflineMapView`가 `MapboxGL.StyleURL.Street`를 썼다. 이 값은 native 상수라 v10에서는 streets-v11, v11(MapboxMaps 11.33.1)에서는 streets-v12를 가리킨다. 오프라인 pack은 streets-v11로 받으므로, v11 앱이 비행기 모드에서 받지 않은 스타일을 요청해 지도가 빌 수 있다. TS 쪽 상수는 여전히 v11이라 코드만 읽어서는 보이지 않았고, Main의 시뮬레이터 확인은 온라인이라 잡지 못했다(5785행).
- **수정:** `shared/lib/mapbox.ts`에 `OFFLINE_MAP_STYLE_URL = 'mapbox://styles/mapbox/streets-v11'`을 두고 `download.ts`·`OfflineMapView`·`MapboxScheduleMapView`가 같은 값을 쓰게 했다. 받는 스타일과 그리는 스타일이 같은지 지키는 테스트를 추가했고, 예전 코드로 되돌리면 실패함을 확인했다(5761–5766행).
- **재검증:** 같은 검증자가 수정 뒤 충족을 확인했다(5802행). 검증자가 함께 본 R1(v10 pack을 v11이 읽는가)은 Ticket 02의 iOS 실기기 판정이 덮는다고 정리했다. 미확인으로 남은 것은 Android와, 수정된 실제 앱으로 실기기 비행기 모드에서 `OfflineMapView`를 보는 것이다. 후자는 출시 빌드 확인에 한 장면으로 넣는다.

## 검증자가 함께 찾은 기존 문제 (이번 변경으로 생긴 것 아님, 처리하지 않음)

- **(a) `createPack`이 다운로드 시작 직후 resolve한다.** Main이 `node_modules/@rnmapbox/maps/ios/RNMBX/Offline/RNMBXOfflineModule.swift`의 `createPack`을 직접 확인했다(5803–5804행). 그래서 `download.ts`가 다운로드가 끝나기 전에 `mapDownloaded = true`를 기록할 수 있다. Ticket 04 완료 조건의 "'준비됨'인데 빈 지도가 없다"와 직접 닿는다. 테스트 mock은 "완료 뒤 resolve"로 모델링돼 이 차이를 가렸다. 04에서 다룰지는 사용자 결정이 필요하다(Main이 기록 뒤 묻기로 함, 5837행).
- **(b)** `download.ts`가 `'size' in pack`·`'tileCount' in pack`으로 읽는 값이 pack에 없어 늘 0·null로 저장된다.
- **(c)** `requiredResourceCount = 0`인 진행 이벤트에서 NaN이 날 수 있다(저우선).
