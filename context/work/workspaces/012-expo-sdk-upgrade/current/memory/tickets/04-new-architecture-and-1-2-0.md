# 04 — New Architecture로 바꾸고 1.2.0을 낸다

**상태:** 진행 중 (2026-11-19 코드 작업 시작, 같은 날 iPad 실기기 확인과 지도 수정까지 마침. 2026-11-20 코드를 main에 병합·push). 계획은 1월이었지만 사용자의 "그래 쭉 해봐 다시"로 코드·시뮬레이터·로컬 확인을 앞당겼다. 1.2.0 스토어 빌드·제출은 그대로 멤버십(2026-12-18)·인증서(2026-12-30) 갱신 뒤다. 2026-11-18 02 판정으로 지도 대응은 필요 없다(아래). 결과는 아래 [현재 상태와 실제 결과](#현재-상태와-실제-결과)에 있다.

## 맡은 결과와 범위

SDK 54에서 New Architecture를 켜고, 바뀐 앱이 지금과 똑같이 동작하는 것을 확인한 뒤 1.2.0으로 스토어에 낸다. 이 단계는 2025-11에 Mapbox가 깨진 지점이며, reanimated 4와 Mapbox v11이 함께 바뀐다. 출시 2번 가운데 첫 번째다.

이 Ticket이 끝나면 다음이 성립한다.
- `newArchEnabled: true`인 1.2.0이 심사를 통과해 사용자에게 나갔다.
- 기존 사용자가 1.1.4에서 1.2.0으로 업데이트해도 로그인·여행 데이터·미전송 변경이 보존된다.
- 오프라인 지도가 남거나, 남지 않으면 사용자가 그 사실을 알고 다시 받을 수 있다. "준비됨"인데 지도가 비는 상태는 남지 않는다.
- 1.2.0에 OTA가 간다. 1.2.0 핫픽스를 낼 `release/1.2`가 있다.
- 출시 뒤 1주일 동안 Sentry에 새 크래시가 없는지 보고, 05의 출시 여부를 판단할 근거가 있다.

Spec과의 연결: [완료 판단](../spec/04-quality-and-completion.md)의 3(기존 사용자 업데이트), 4(오프라인), 5(위험 영역 중 Mapbox·reanimated·nativewind), 7(OTA)을 1.2.0에서 확인한다.

## 실행 맥락과 접근

**선행:** 02(지도 판정), 03(SDK 54 Legacy). 스토어 빌드 전에 Apple Developer 멤버십 갱신(2026-12-18)과 배포 인증서·프로비저닝 갱신(2026-12-30 만료)이 끝나야 한다. 멤버십 갱신은 사용자가 직접 한다.

**바꿀 묶음**([라이브러리 호환 조사](../../../source/library-compatibility-2026-11-17.md)의 "SDK 54 + New Arch" 열, 02에서 확정한 표 우선)
- `newArchEnabled: true`
- reanimated ~4.1.1 + react-native-worklets 0.5.1. `apps/client/babel.config.js`의 `'react-native-reanimated/plugin'` 줄을 지운다(babel-preset-expo가 대신 설정). `expo.install.exclude`의 reanimated도 지운다.
- rnmapbox 10.3.x(native Mapbox v11). react-native-maps 1.20.1, screens 4.16은 03에서 맞춘 값을 확인한다.

**02 판정 결과(2026-11-18): 지도 대응은 하지 않는다.** 1.1.4(rnmapbox 10.1.33)에서 받은 도쿄 pack을 rnmapbox 10.3.18(native v11)이 목록·저장 공간·비행기 모드 화면까지 그대로 썼다. 1.1.4도 이미 TileStore 방식이었다. 한계는 확인한 조합이 rnmapbox 10.3.18 하나, 기기 1대, 도시 하나라는 점이라, 04에서 다른 rnmapbox 버전을 쓰면 아래 기존 사용자 업데이트 확인에서 지도까지 다시 본다. 엔진 버전 표시만 미리 남길지는 이 Ticket에서 정한다. 근거는 [02 판정 기록](../../../records/2026-11-18-06-ticket02-device-verification.md)에 있다.

**별도 발견(열린 판단):** 02에서 1.1.4의 `offline_cities`가 0행이었다. 업데이트 손실이 아니라 1.1.4가 행을 쓰지 않은 것으로 보이며(원인 미확인, `download.ts`의 등록 트랜잭션 확인 필요), 지도 대응을 하지 않으므로 이 Ticket의 필수 범위는 아니다. 012 안에서 다룰지 따로 다룰지는 정하지 않았다.

**지도 대응(02 판정이 실패일 때만, 방향은 확정, 2026-11-18 판정으로 쓰지 않음).** 사용자가 제안하고 Main이 다듬은 방향이다. 경위와 사용자 원문은 [재구성·지도 대응 기록](../../../records/2026-11-17-05-ticket-restructure-and-map-data-plan.md)에 있다.
- 새로 받는 도시 지도 기록에 엔진 버전 표시(`mapEngine: v11` 같은 값)를 남긴다.
- 업데이트 뒤 첫 실행에 한 번 정리한다. 이 표시가 없는 옛 기록은 `mapDownloaded`를 내리고 "지도 다시 받기 필요" 상태로 바꾼다. 옛 pack 파일도 지운다(02에서 지울 수 있는지 확인한 방법으로).
- 첫 실행에 바로 안내한다. 활성 여행은 기존 재시도 경로(`apps/client/src/shared/services/offline-map/download.ts`)로 "지도만 다시 받기", 비활성 여행은 다음 활성화 때 새로 받는다. 비활성화를 권하지 않는 이유는 기기 사본 정리와 미전송 변경 보호까지 건드리기 때문이다.
- 출시 노트에도 적는다.
- DB 구조를 바꾸므로 OTA로는 낼 수 없고 1.2.0 스토어 빌드에 넣는다.
- 지도가 그대로 읽히면 대응은 하지 않는다. 그때 엔진 버전 표시만 미리 남길지는 이 Ticket에서 정한다.

화면의 "준비됨" 배지는 실제 pack이 아니라 `mapDownloaded`만 본다([Project 지도 기준](../../../../../../project/guidance/offline-maps-and-routes/INDEX.md)). 지도 대응을 고칠 때는 이 Project 본문과 [map-packs](../../../../../../project/guidance/offline-maps-and-routes/map-packs.md)의 공유·반납 규칙을 처음부터 읽는다.

**출시.** [출시 기준](../../../../../../project/guidance/app-release-and-ota.md)의 스토어 빌드 절차를 따른다. 버전은 1.2.0이다. 출시하면서 `release/1.2`를 만든다. production 채널에 1.2.0 빌드가 생기면 `release/1.1`의 OTA는 더 이상 발행되지 않는다. 1.2.0이 승인된 뒤에는 App Store 버전 규칙상 1.1.x 스토어 빌드도 낼 수 없으므로, 1.1.x 사용자는 1.2.x로 업데이트해야 고칠 수 있다. 1.2.0 사용자의 핫픽스는 `release/1.2`에서 낸다([01](01-preparation-baseline-and-node24.md)). 그래서 1.2.0 출시 전에 1.1.x로 꼭 내야 할 수정이 남아 있는지 확인한다.

**기존 사용자 업데이트 확인.** 02에서 먼저 확인했고 여기서 실제 출시 빌드로 다시 확인한다. 어느 앱에서 확인할지는 아직 정하지 않았다. Main 기본값은 운영 데이터를 지키려고 preview 앱(`com.noline.dev`)에서 이전 빌드에 데이터를 넣고 새 빌드를 덮어 설치하는 것이다. 사용자가 이 기본값을 따로 확인하지는 않았다.

**fmt consteval 우회(03에서 넣음).** `apps/client/plugins/with-fmt-consteval-off.js`가 RN 0.76–0.81의 fmt 11.0.2를 Xcode 26 clang에서 빌드되게 한다. SDK 54(03)에서도 필요했다. New Architecture를 켜면 빌드 구성이 바뀌므로 이 Ticket에서도 등록을 빼고 빌드해 보고, 없이 되면 지운다. **2026-11-19 지웠다**(`beee6373`, 아래 결과). 출시 빌드(EAS)에 들어가는지는 03 끝 EAS preview에서 먼저 확인한다. 경위는 [SDK 54·달라진 것 기록](../../../records/2026-11-18-08-ticket03-sdk54-and-plan-deviations.md)에 있다.

**빌드 횟수와 확인 기기(03에서 생긴 조건).** EAS 플랜의 월간 iOS 빌드 수가 제한돼 있고(사용자 말: 15회, 2026-11은 이미 16건이라 실패·취소 포함 여부와 기준일은 미확인), 03의 SDK 54 preview는 `eas build --local`로 만들었다. 로컬 빌드에는 fastlane이 필요하고 시험용이면 `SENTRY_DISABLE_AUTO_UPLOAD=true`로 소스맵 업로드를 끈다. 이 Ticket의 preview·출시 빌드를 EAS와 로컬 중 무엇으로 낼지 횟수를 보고 정한다. iPad Air 4(iPadOS 26.6.2)도 EAS 기기로 등록돼 서명 프로필 AN57L8X528에 iPhone과 함께 들어 있어 확인 기기로 쓸 수 있다. 다만 등록 전 빌드(예: `f8e97f99`)는 iPad에 깔리지 않고, iPad에서는 앱이 iPhone 호환 창으로 떠 세로·회전 고정이어야 기기 조작이 된다. 경위는 [EAS·iPad 확인 기록](../../../records/2026-11-19-01-ticket03-eas-and-ipad-verification.md)에 있다.

**실행하며 정할 것:** 엔진 버전 표시만 미리 남길지(지도 대응은 02 판정으로 필요 없음), 업데이트 확인에 쓸 앱, 출시 노트 문구.

## 완료 조건과 확인 방법

- New Architecture preview 빌드에서 실기기 점검표 6항목이 기준선과 같다. 특히 Mapbox 지도·오프라인 pack·경로 표시, reanimated를 쓰는 `MyLocationButton`, nativewind 스타일 화면을 실기기로 본다.
- 이전 빌드(1.1.4)에 데이터와 지도를 넣은 상태에서 1.2.0 빌드를 덮어 설치해 데이터가 보존된다. 지도는 남거나, 대응이 들어갔다면 첫 실행에서 "다시 받기 필요"로 바뀌고 안내가 뜨며 활성 여행에서 다시 받을 수 있다. "준비됨"인데 빈 지도가 없다. 이 조건은 SDK 업그레이드가 지도에 주는 영향(스타일·pack 호환, 옛 pack 처리)을 본다. 업그레이드 전부터 있던 "다운로드가 끝나기 전에 준비됨이 켜지는" 문제는 Work 008이 맡는다(아래 (a), 2026-11-19 사용자 결정).
- 1.2.0 빌드에서 OTA 받기, 업데이트를 기다리지 않는 시작, 롤백이 된다. 1.1.4 빌드와 runtime이 달라 이전 업데이트를 받지 않는다.
- 업로드 메일에 경고가 없고 심사를 통과했다. `release/1.2`가 있다.
- 출시 뒤 1주일의 Sentry 관찰 결과가 남아 있다. 새 크래시가 있으면 05 출시 전에 처리한다.

## 현재 상태와 실제 결과

2026-11-19 코드 작업을 시작했고, 같은 날 iPad 실기기에서 1.1.4 위 덮어 설치와 비행기 모드를 확인하다 찾은 일정 지도 차이 두 개를 고쳤다. 작업 위치는 main `307ae37b`에서 분기한 worktree `.claude/worktrees/012-newarch`, 브랜치 `feat/012-newarch`였고, 2026-11-20 사용자의 "병합하고 push"로 main에 병합했다(아래 [main 병합](#main-병합-2026-11-20)). 이 Ticket의 코드 부분은 main에 들어갔고, 남은 것은 실기기 미확인 항목과 12월 갱신 뒤의 1.2.0 출시다. 과정과 원문은 [04 코드 작업 기록](../../../records/2026-11-19-02-ticket04-newarch-code-and-review.md)과 [iPad 실기기 확인·지도 수정 기록](../../../records/2026-11-19-04-ticket04-ipad-verification-and-schedule-map-fix.md)에 있다.

**커밋**
- `6c6b5524`: `newArchEnabled: true`, reanimated ~4.1.7 + worklets 0.5.1(babel plugin 등록과 `expo.install.exclude` 삭제), @rnmapbox/maps ~10.3.18(native v11), `packages/ui` reanimated peer `>=4.1.0`(`>=3.10.0`이면 ui 아래 3.19.5가 한 벌 더 설치됨), Mapbox v11 진행률 `percentage` null 처리, `encodePolyline` 튜플 타입. `MyLocationButton`은 reanimated 4에서도 같은 API라 바꾸지 않았다.
- `beee6373`: fmt consteval 우회 plugin 삭제. New Architecture에서는 RN 0.81이 fmt·folly를 미리 빌드된 ReactNativeDependencies로 받아 Pods에 fmt 소스가 없다. 우회 없이 시뮬레이터 Release 빌드 0 errors. 빌드 경고: `RNMapboxMapsDownloadToken` deprecated, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` 환경 변수 권장.
- `fb73bb25`: 오프라인 지도 스타일 고정. `OfflineMapView`가 쓰던 `MapboxGL.StyleURL.Street`는 native 상수라 v10은 streets-v11, v11(MapboxMaps 11.33.1)은 streets-v12를 가리켜, streets-v11로 받은 pack과 어긋나 비행기 모드에서 지도가 빌 수 있었다(독립 검증자 발견 P1). `shared/lib/mapbox.ts`의 `OFFLINE_MAP_STYLE_URL`로 `download.ts`·`OfflineMapView`·`MapboxScheduleMapView`를 통일하고, 되돌리면 실패하는 테스트를 넣었다.
- `c5fdbbdc`: 일정 Mapbox 지도(`MapboxScheduleMapView`)의 마커 번호와 처음 위치를 1.1.4와 같게 한다. iPad 실기기에서 찾은 차이다(아래). 마커는 자식 뷰를 한 번 이미지로 찍는 `PointAnnotation` 대신 뷰를 그대로 그리는 `MarkerView`로 바꿨다. 카메라는 `getCameraTarget`이 좌표가 있는 선택 일정이면 그 일정 중심 zoom 15, 아니면 그날 좌표가 있는 일정 전체 범위를 정하고, 처음 위치는 `defaultSettings`로, 이후 이동은 그 값으로 만든 key가 바뀔 때만 한다. 빌드용 임시 커밋 두 개(`ae097b24`, `b2bfb0cb`)를 `129e5321`로 합친 뒤, 새 테스트 파일의 prettier 형식 오류를 고쳐 같은 커밋을 `c5fdbbdc`로 고쳐 썼다. 제품 코드는 실기기에서 본 마지막 빌드(`b2bfb0cb`)와 같다.

**검사:** `fb73bb25`까지 Jest 79 suites / 923 tests 통과, client typecheck 4(기존 ui 경로 TS6059·TS6307, SDK 54 때 5), lint 11 errors / 254 warnings(기준선과 같음), `expo-check` 통과, reanimated 한 벌. 지도 수정에서는 `schedule-map-markers-camera.test.tsx`(5개)를 넣었다. 이 5개는 `fb73bb25` 코드에서 모두, 첫 수정(`ae097b24`)에서 재렌더·좌표 없는 날 2개가 실패하고 지금 코드에서 모두 통과한다. 최종 코드에서 전체 Jest 80 suites / 928 tests 통과, client typecheck 4(기존 ui 경로), client lint 11 errors(기준선)다. 다시 돌린 lint가 처음에 12 errors였고 늘어난 하나는 새 테스트 파일의 prettier 형식 오류라 고쳤다. Jest·typecheck는 형식만 다른 `129e5321`에서, lint와 `tests/shared/components` 11개 통과는 고친 `c5fdbbdc`에서 봤다. 앞서 보고된 926은 첫 수정(새 테스트 3개) 때 숫자다. 이 테스트들은 컴포넌트가 Mapbox에 넘기는 값을 보며 실제 그려진 번호는 실기기로 확인했다.

**시뮬레이터(iPhone 15 Pro, Release, New Architecture):** 기존 데이터(파리, 일정 6, EUR 219) 유지, 일정 지도(react-native-maps)의 마커·경로, 내 위치 버튼(reanimated), 프로필의 오프라인 지도 161.2 MB(이전 Mapbox v10 빌드가 받은 것), 경비 추가·달력 시트·nativewind 정상.

**독립 검증:** 구현에 참여하지 않은 검증자가 P1(스타일)을 찾았고 수정 뒤 재검증에서 충족을 확인했다. v10 pack을 v11이 읽는지는 02의 iOS 실기기 판정과 이번 iPad 확인이 덮는다. 지도 수정도 코드를 쓰지 않은 검증자가 봤다. P1은 없었고, P2로 첫 수정이 만든 회귀(첫 일정에 좌표가 없는 날로 바꾸면 카메라가 이전 날에 남음), 예전부터 있던 P3(이동 수단 버튼·경로 조회 같은 재렌더가 사용자가 옮긴 지도를 선택 일정으로 되돌림), 원인을 "New Architecture 때문"으로 단정한 주석(아키텍처와 rnmapbox 10.1→10.3이 함께 바뀜)을 짚었다. 셋 다 `c5fdbbdc`에 반영했고 주석은 "New Architecture·rnmapbox 10.3 빌드에서 관찰"로 낮췄다. 반영 뒤 검증자 재검증은 하지 않았고 Main의 테스트와 실기기 확인으로 봤다.

**iPad 실기기(iPad Air 4, 2026-11-19).** 1.1.4 preview(`2814ad7f` ipa, 프레임워크 구성으로 옛 빌드임을 확인)를 새로 깔고 도쿄 여행을 오프라인 활성화한 뒤, 비행기 모드에서 미전송 경비 "T04 114 offline" JPY 400을 만들고 `fb73bb25`의 로컬 preview(`eas build --local`, `RCTNewArchEnabled` true)를 덮어 설치했다.
- **보존:** 로그인, "준비 완료", 일정 3개, 경비 합계 JPY 3212.00, 저장 데이터 208 KB, 오프라인 지도 196.3 MB가 그대로였다. v10에서 받은 pack을 v11이 인식했다. 앱 버전 표시는 버전을 올리지 않아 1.1.4다.
- **비행기 모드:** 새 빌드에서 경비 "T04 newarch offline" JPY 500 추가(합계 JPY 3712), 오프라인 타일·지명·경로 정상. 비행기 모드 첫 콜드 스타트에서 검은 화면이 1분 가까이 이어진 일이 한 번 있었고 이후 세 번은 4초 안에 열렸다. 재현하지 못했고 원인은 모른다.
- **온라인:** Google 일정 지도의 마커 번호 정상, 내 위치 버튼(reanimated)이 눌려 "권한 필요" 모달(위치 거절 상태, 이전과 같음).
- **찾아서 고친 것:** 일정 Mapbox 지도에서 마커 번호가 빠지고(초록 원만), 선택한 일정 대신 그날 전체 범위(도쿄 2곳·오사카, 약 200 km 축척)로 열렸다. 1.1.4에서는 번호가 보이고 선택한 일정에서 열렸다. 수정 빌드로 다시 보니 번호 "1"·"2"가 보이고 카드를 넘기면 선택 마커가 바뀌며 선택 일정에서 열렸다. 마지막 빌드에서는 지도를 옮긴 뒤 도보→자전거로 바꿔도 위치가 남고(경로 정보 12.4 km·47분), 일정 없는 2/2는 빈 상태, 2/1로 돌아오면 1번 일정에서 열렸다.
- **서버:** 온라인에서 오프라인 해제 뒤 서버 기준 합계 JPY 3712로 두 경비가 모두 서버에 있었다. 지금 iPad의 도쿄 여행은 온라인 전용이고 Noline Dev는 `c5fdbbdc`와 제품 코드가 같은 빌드다. 시험 경비 두 건(JPY 400, 500)이 계정의 도쿄 여행에 남아 있다.
- **보지 못한 것:** 첫 일정에 좌표가 없는 날로 바꾸는 경우(시험 데이터 없음, 테스트로만), `OfflineMapView`(일정 추가는 오프라인에서 검색이 꺼져 지도가 나오지 않음), 마커가 많을 때 `MarkerView`의 겹침·성능, 확대 조작(iPhone 호환 창에서 핀치·두 번 탭이 먹지 않음, 카드 넘기기는 됨). 이 확인은 preview 로컬 빌드이며 1.2.0 출시 빌드가 아니다.

**아직 확인하지 않은 것:** iPhone 실기기, Android, Apple 로그인, `OfflineMapView`의 실기기 오프라인 화면, 첫 일정에 좌표가 없는 날의 실기기 화면(테스트로만 확인), 1.2.0 출시 빌드에서의 덮어 설치와 OTA(받기·기다리지 않는 시작·롤백). 03에서 넘긴 확인(EAS 빌드 실기기 설치, EAS Node 24 로그, iPhone 덮어 설치)도 남아 있다.

**아직 정하지 않은 것:** 이번 iPad 확인(preview 로컬 빌드, iPad 한 대)을 위 완료 조건의 "New Architecture preview 빌드에서 실기기 점검표 6항목"을 채운 것으로 볼지, 출시 빌드 확인에 어느 앱을 쓸지. 둘 다 Main이 2026-11-19 사용자에게 열린 판단으로 알렸고 사용자가 답하지 않았다.

### main 병합 (2026-11-20)

2026-11-19 Main이 남은 일을 설명하며 "`feat/012-newarch`를 지금 main에 병합할까요?"라고 묻자, 사용자가 2026-11-20 "병합하고 push"를 골랐다. 경위는 [main 병합 기록](../../../records/2026-11-20-01-ticket04-main-merge-and-push.md)에 있다.
- **병합:** main에서 `git merge --no-ff feat/012-newarch`로 머지 커밋 `6d34c44b`를 만들었다. 들어간 것은 `6c6b5524`·`beee6373`·`fb73bb25`·`c5fdbbdc` 네 커밋(client·`packages/ui`·lockfile 14개 파일)이다.
- **검사를 다시 돌리지 않은 근거:** `git diff c5fdbbdc 6d34c44b -- apps packages pnpm-lock.yaml package.json pnpm-workspace.yaml`이 비어 있다. 병합 뒤 main의 코드가 위 검사·실기기 확인을 거친 `c5fdbbdc`와 같으므로 Main은 병합 뒤 검사 재실행을 이 대조로 대신했다. main 쪽에만 있던 커밋은 Work 기록 문서뿐이었다.
- **서버 영향:** lockfile에서 바뀐 hunk는 `apps/client`·`packages/ui` importer와 그 패키지 항목뿐이고 `apps/server` importer는 그대로다. main push는 Render 재배포를 일으키지만 서버 코드·의존성은 바뀌지 않는다.
- **push와 운영 서버:** `git push origin main`으로 `195b62ee..6d34c44b`를 올렸다. 확인 대상은 `https://noline-d6hy.onrender.com/api/health`다. push 직후부터 20초 간격으로 8분간(2026-11-20 15:46:37–15:54:26 KST) health가 24번 모두 200(0.23–0.61초)이었고 끊긴 구간은 없었다. 다만 health 응답에 커밋·버전 정보가 없고 Render 대시보드·GitHub deployment 상태는 보지 않아, `6d34c44b` 배포가 실제로 Live가 됐는지는 확정하지 못했다. 서버 코드와 lockfile의 `apps/server` importer가 바뀌지 않아 배포 여부와 무관하게 서버 동작은 같다고 본다(Main 판단).
- **main push는 OTA 발행이 아니다.** 운영 앱(1.1.4)에는 아무것도 가지 않았다. 다만 main의 앱이 이제 SDK 54·New Architecture라 OTA 발행 기준이 바뀌었다(바로 아래).

**병합 뒤 OTA 발행 주의.** runtime은 `fingerprint`로 계산되고 발행 스크립트는 채널의 최신 빌드와 runtime이 같을 때만 발행한다([출시 기준](../../../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)). main은 앱 버전·빌드 번호가 여전히 1.1.4/18이지만 네이티브 층이 달라, 기록 담당자가 그 기준에서 읽은 결과는 다음과 같다(dry-run으로 확인하지 않았다).
- production 채널의 최신 빌드는 SDK 51의 1.1.4(`7033c2ba`)다. main에서 `pnpm ota:publish production`을 실행하면 runtime 대조에서 거부된다. 1.1.4 사용자에게 보낼 OTA·핫픽스는 `release/1.1`(worktree `.claude/worktrees/012-release-1.1`)에서만 낸다. Ticket 01이 `release/1.1`을 먼저 만든 이유가 이 상황이다. SDK 54가 들어간 03 병합(`ae97809e`) 때부터 이미 그랬고, 이번 병합으로 바뀐 것은 아니다.
- preview 채널의 최신 빌드는 03의 SDK 54 Legacy preview `f8e97f99`다. New Architecture가 들어간 main은 그 빌드와도 runtime이 달라, main에서 preview OTA를 시험하려면 main에서 EAS preview 빌드를 새로 만들어야 한다. 04에서 만든 iPad용 preview는 `eas build --local`이라 EAS의 채널 최신 빌드로 잡히는지는 확인하지 않았다.
- 1.2.0 스토어 빌드는 main에서 버전을 올려 만들고, 그 빌드가 생기면 main의 production OTA 대상이 된다. 그 전까지 main에서 production OTA를 낼 일은 없다.

**함께 찾은 기존 문제 (이번 변경으로 생긴 것 아님, 012에서 처리하지 않음)**
- **(a) `createPack`이 다운로드 시작 직후 resolve한다**(Main이 `RNMBXOfflineModule.swift`를 직접 확인). 그래서 `download.ts`가 다운로드 완료 전에 `mapDownloaded = true`를 기록할 수 있다. 테스트 mock은 완료 뒤 resolve로 모델링돼 가려졌다. **2026-11-19 결정: 012에서는 고치지 않고 [Work 008](../../../../008-exception-notice-rules/README.md)(예외 안내 규칙)로 넘긴다.** 사용자는 다른 Ticket에 이미 기록돼 있으면 012에서는 넘어가자고 했다. Main은 처음에 이 문제를 기록한 곳으로 [003 Ticket 05](../../../../003-bug-investigation-and-fixes/current/memory/tickets/05-offline-map-readiness.md)를 확인했다(2026-09-13 조사에서 pack 생성 promise가 타일 완료를 뜻하지 않음을 확인, 완료 조건에 생성·진행·완료·실패 구별과 iOS 비행기 모드 대조, 미완료). 사용자는 003이 아니라 예외처리 Workspace인 008로 하자고 했다. 008에는 이 문제가 기록돼 있지 않아 넘겨받은 과제로 새로 추가했다([008 현재 상태](../../../../008-exception-notice-rules/current/state/index.md)). Project [map-packs](../../../../../../project/guidance/offline-maps-and-routes/map-packs.md)와 [지도 기준 INDEX](../../../../../../project/guidance/offline-maps-and-routes/INDEX.md)는 이 동작을 현재 동작으로 적고 있다. 그래서 위 완료 조건은 업그레이드의 영향으로만 본다. 경위와 사용자 원문은 [소관 결정 기록](../../../records/2026-11-19-03-createpack-ownership-decision.md)에 있다.
- (b) `download.ts`가 `'size'`·`'tileCount' in pack`으로 읽는 값이 늘 0·null로 저장된다. Project [map-packs](../../../../../../project/guidance/offline-maps-and-routes/map-packs.md)가 이미 이 값을 신뢰할 근거가 없다고 적고 있고(용량 화면은 `pack.status()`를 따로 읽음), 003 Ticket 05의 완료 조건 "flag와 용량 표시가 실제 자원 상태를 반영"과도 가깝다. 008로 넘긴 (a)와 같은 `download.ts` 저장 경로이지만 이번 결정의 대상이 아니었고 소관은 정하지 않았다(저우선).
- (c) `requiredResourceCount = 0`인 진행 이벤트에서 NaN이 날 수 있다(저우선). 003 Ticket 05의 진행 처리(진행률 0·10%의 ready 처리, 생성·진행·완료 구별)와 가깝고 (a)와 같은 다운로드 진행 경로이지만, 이번 결정의 대상이 아니었고 소관은 정하지 않았다.

**남은 일:** 실기기 미확인 항목(`OfflineMapView` 오프라인 화면, 첫 일정에 좌표가 없는 날, iPhone·Android·Apple 로그인), 위 두 열린 판단, 12월 갱신(멤버십 2026-12-18, 인증서 2026-12-30) 뒤 1.2.0 출시 빌드·제출과 그 빌드의 OTA·덮어 설치 확인, `release/1.2` 생성, 출시 뒤 1주일 Sentry 관찰. 병합으로 다 쓴 `feat/012-newarch` 브랜치와 worktree `.claude/worktrees/012-newarch`는 정리 후보이며 지울지는 사용자가 정한다(아직 지우지 않았다).
