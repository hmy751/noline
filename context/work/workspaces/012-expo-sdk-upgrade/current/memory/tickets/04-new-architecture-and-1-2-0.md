# 04 — New Architecture로 바꾸고 1.2.0을 낸다

**상태:** 시작 전 (2026-11-17 확정). 03이 끝나고 멤버십·인증서를 갱신한 뒤 1월에 한다. 2026-11-18 02 판정으로 지도 대응은 필요 없다(아래).

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

**fmt consteval 우회(03에서 넣음).** `apps/client/plugins/with-fmt-consteval-off.js`가 RN 0.76–0.81의 fmt 11.0.2를 Xcode 26 clang에서 빌드되게 한다. SDK 54(03)에서도 필요했다. New Architecture를 켜면 빌드 구성이 바뀌므로 이 Ticket에서도 등록을 빼고 빌드해 보고, 없이 되면 지운다. 출시 빌드(EAS)에 들어가는지는 03 끝 EAS preview에서 먼저 확인한다. 경위는 [SDK 54·달라진 것 기록](../../../records/2026-11-18-08-ticket03-sdk54-and-plan-deviations.md)에 있다.

**실행하며 정할 것:** 엔진 버전 표시만 미리 남길지(지도 대응은 02 판정으로 필요 없음), 업데이트 확인에 쓸 앱, 출시 노트 문구.

## 완료 조건과 확인 방법

- New Architecture preview 빌드에서 실기기 점검표 6항목이 기준선과 같다. 특히 Mapbox 지도·오프라인 pack·경로 표시, reanimated를 쓰는 `MyLocationButton`, nativewind 스타일 화면을 실기기로 본다.
- 이전 빌드(1.1.4)에 데이터와 지도를 넣은 상태에서 1.2.0 빌드를 덮어 설치해 데이터가 보존된다. 지도는 남거나, 대응이 들어갔다면 첫 실행에서 "다시 받기 필요"로 바뀌고 안내가 뜨며 활성 여행에서 다시 받을 수 있다. "준비됨"인데 빈 지도가 없다.
- 1.2.0 빌드에서 OTA 받기, 업데이트를 기다리지 않는 시작, 롤백이 된다. 1.1.4 빌드와 runtime이 달라 이전 업데이트를 받지 않는다.
- 업로드 메일에 경고가 없고 심사를 통과했다. `release/1.2`가 있다.
- 출시 뒤 1주일의 Sentry 관찰 결과가 남아 있다. 새 크래시가 있으면 05 출시 전에 처리한다.

## 현재 상태와 실제 결과

시작 전.
