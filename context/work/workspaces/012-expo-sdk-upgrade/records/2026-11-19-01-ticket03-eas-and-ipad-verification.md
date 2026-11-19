# 2026-11-18–19 — Ticket 03 마무리: 검사 장치, EAS preview, iPad 실기기 확인

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 2026-11-18 밤에 장치·EAS preview까지 하고, 2026-11-19 낮에 iPad로 실기기 확인을 했다. 앞 단계는 [SDK 54·달라진 것 기록](2026-11-18-08-ticket03-sdk54-and-plan-deviations.md)에 있다.

## 검사 장치와 한 벌 확인 (2026-11-18)

사용자가 "이어서 해"(3747행)라고 해 Main이 Ticket 03의 남은 일을 `feat/012-sdk54`에서 이었다.
- **`7be8f22f`:** `pnpm why`로 보니 react 18.2.0이 하나 남아 있었고, `packages/eslint-config`의 개발 의존성이었다. 지운 뒤 react 19.1.0, react-native 0.81.5, reanimated 3.19.5가 각각 한 벌만 남았다. lint는 client 11·ui 25 errors 그대로다(3807행).
- **`35b21093`:** `apps/client/eas.json`의 `base.node`를 24.16.0으로, 루트 `package.json`에 `engines: { node: ">=24" }`, 루트 script `client:expo-check`(`expo install --check` 실행)를 넣었다. `apps/client`의 scripts에 두면 OTA runtime(fingerprint)이 바뀌므로 루트에 뒀다. `apps/client/CLAUDE.md`의 Commands에서 test 명령을 `pnpm --filter @apps/client run test --runInBand`로 바로잡고 expo-check와 `pnpm exec expo install` 절차를 적었다. exclude(reanimated)의 이유는 커밋과 Work 기록에 둔다(3861행). Ticket 01부터 남아 있던 "client test 명령 오류"와 "설치 절차의 지속 위치" 후보가 이 커밋으로 처리됐다.

**EAS preview 빌드 `f8e97f99`**(커밋 `35b21093`, runtime `2056712165b42d79fa82362609f5ea1bcb23f541`, 채널 preview)가 성공했다. fmt 우회가 적용된 상태로 EAS의 Xcode 26.2 이미지에서도 빌드됐다. 우회 없는 EAS 빌드는 시험하지 않았다. Node 24 사용은 빌드 메타데이터에 나오지 않아 로그로 확인하지 않았다. 이 빌드가 preview 채널의 최신 빌드가 되면서 `release/1.1`에서 preview 채널로 OTA를 시험하는 경로는 막혔다(production 채널은 무관).

## 실기기를 무엇으로 할지

사용자가 "진행해"(3866행)로 실기기 확인에 동의한 뒤 "시뮬레이터론ㄴ 안되나?"(3885행)라고 물었다. Main은 시뮬레이터로는 실제 EAS 빌드, 오프라인 항목, Apple 로그인을 확인할 수 없어 Ticket 03 완료 조건을 다 채우지 못한다며 실기기를 권했다(3895행). 사용자가 "다른 기기도 돼? 아이패드 같은거"(3900행)라고 묻자 Main은 가능하지만 iPhone보다 준비가 많다고 답했다(기기 등록, 빌드 두 개 재생성, 제어 서버 재서명, 3912–3916행).

다음 날 사용자가 iPad를 연결하고 `/device-access-setup`으로 "지금 아이패드 연결했어 준비해줘"(3925행)라고 했다.

## iPad 준비 (2026-11-19)

- **기기:** iPad Air 4(iPad13,2), iPadOS 26.6.2, UDID `00008101-001409902205001E`, USB 페어링. 개발자 모드가 꺼져 있어 사용자가 켰다.
- **EAS 기기 등록:** `eas device:create`는 대화형이라 Main이 터미널 탭에 띄웠고, Apple 로그인은 키체인 정보로 자동 통과했다. Main은 실행 중인 프로그램에 키를 보낼 수 없어 사용자가 "Input" 방식으로 UDID를 입력해 등록했다(4014–4093행).
- **1.1.4 preview 재빌드:** Main이 띄운 비대화형 빌드는 Apple 인증 없이 iPhone만 든 예전 프로필을 써서 빌드 `b6e2d1a8`를 취소했다. 사용자 터미널의 대화형 빌드로 프로필 AN57L8X528에 iPad를 추가해 1.1.4 preview `2814ad7f`(커밋 `d160c7b5`, runtime `92c898f2…`, FINISHED)를 만들었다.
- **iPhone과 왜 다른가:** 사용자가 "잠깐 근데 이해가 안되는게 아이폰이랑 왜 달라?"(4150행)라고 물었다. Main의 설명: 내부 배포 빌드는 설치를 허락한 기기 UDID 목록이 든 서명 프로필을 `.ipa` 안에 담는다. 기존 빌드(`30c46ce2`, `f8e97f99`)는 iPhone만 담고 있어, 프로필을 갱신해도 iPad에 깔려면 다시 빌드해야 한다(4154행).
- **EAS 빌드 횟수:** 사용자가 "이거 프랜이있어서 15번 제한이네?"(4109행)라고 짚었다. 11월 iOS 빌드가 16건(완료 12·실패 2·취소 1·이번 1)으로 제한에 가깝다. 실패·취소가 횟수에 드는지와 기준일은 확인하지 않았다. 사용자는 "아이패드로 로컬 빌드해서 진행해"(4165행)라고 정했다. 그래서 SDK 54 preview는 `eas build --local`(EAS 횟수를 쓰지 않음)로 만들었다.
- **로컬 빌드 준비와 Main이 만든 문제:** `eas build --local`의 iOS 빌드에 fastlane이 필요해 Main이 `brew install fastlane`(2.242.0)을 했다. 이때 Homebrew ruby가 3.4.7 → 4.0.10으로 함께 올라 Homebrew cocoapods가 `ffi` 누락으로 깨졌다. `brew reinstall cocoapods`로 복구했고 CocoaPods가 1.16.2 → 1.17.0이 됐다(4288행).
- **로컬 빌드:** 1차는 `pod --version` 실패(위 문제), 2차는 sentry-cli의 소스맵 자동 업로드가 토큰이 없어 실패했다. `SENTRY_DISABLE_AUTO_UPLOAD=true`로 3차가 성공했다(`sdk54-preview.ipa` 21.7 MB, 프로필에 iPad·iPhone, `RCTNewArchEnabled` false, CocoaPods 1.17.0으로 통과, 4421행). 시험용 빌드라 소스맵은 필요 없다고 봤다.
- **expo doctor 경고 2건(빌드를 막지 않음):** Metro `watchFolders`가 Expo 기본과 다름(모노레포 수동 설정), react-native-safe-area-context 중복(루트 5.6.2와 react-native-calendars가 고정한 4.5.0). 후자는 main(1.1.4)에도 있는 기존 상태라 03에서 고치지 않았다.
- **iPad 제어 서버:** DeviceKit을 `work/iphone-control/build-ipad`에 iPhone 빌드와 분리해 build-for-testing했다. 1차는 UI 테스트용 프로필 누락으로 실패했고 재시도에 성공해 "Server is ready"가 떴다. 가로 방향에서는 홈 화면 스와이프는 됐지만 iPadOS 창 모드로 뜬 iPhone 호환 앱 창 안의 탭이 되지 않았다(화면 요소 목록과 스크린샷의 좌표 기준이 다름, 4495행). 사용자가 세로로 돌리고 회전을 고정한 뒤 스크린샷 좌표를 화면 비율로 바꿔 누르니 탭이 됐다(4557행). 관찰·터치는 USB와 mobilecli의 CLI 경로다.

로그인, 개발자 모드, 회전, 비행기 모드 켜기·끄기는 모두 사용자가 했다.

## iPad 실기기 확인

| 단계 | 내용 | 결과 |
| --- | --- | --- |
| 1.1.4 준비 | `2814ad7f`를 USB 설치, 사용자가 같은 계정(Google)으로 로그인. 도쿄 여행 오프라인 활성화 | 일정·경비·경로·지도 완료. 프로필: 1.1.4, 저장된 데이터 160 KB(값이 갱신되지 않았을 수 있음), 오프라인 지도 77.3 MB(iPhone의 196.3 MB와 다름, 원인 미확인). iPad는 새 기기라 iPhone에 남은 T02 시험 경비와 무관 |
| 미전송 변경 | 비행기 모드에서 경비 "T03 iPad offline" JPY 2500(교통, 2/2) | 합계 JPY 2512 |
| 덮어 설치 | SDK 54 로컬 빌드를 USB로 설치(비행기 모드 중). 첫 실행은 서명 확인에 인터넷이 필요해 사용자가 비행기 모드를 끔 | 두 번째 실행에 열림. 로그인 유지, 도쿄 "준비 완료", 일정 3, JPY 2512.00 |
| 오프라인 | 비행기 모드 다시 켬 | 콜드 스타트 즉시 열림(오프라인 표시), 일정 3개 조회, 지도 확대 시 거리·건물·일본어 지명(75 m 축척), 경로 표시(점선, 11.6 km·2시간 21분), 경비 "T03 SDK54 offline" JPY 300(식사, 2/1) 추가 → JPY 2812 |
| 서버 전송 | 비행기 모드 끔 → 앱 재실행 → 오프라인 해제(로컬 지도·데이터 삭제, 서버 유지) → 온라인 전용으로 서버 데이터 확인 | JPY 2812.00 = 1.1.4에서 만든 미전송 경비와 SDK 54에서 만든 경비 모두 서버에 전송됨 |

앱 재실행 때 위치 권한 시스템 안내가 떴고, Main이 확인에 필요 없는 권한이라 "허용 안 함"을 골랐다(4838행).

**확인하지 않은 것:** Apple 로그인(로그아웃이 필요해 하지 않음, preview 앱의 Apple 로그인은 서버 설정상 실패할 수 있는 기존 제한), iPhone 실기기에서의 SDK 54 빌드, 경로 표시가 업데이트로 바뀌었는지(iPhone 1.1.4는 실선 534.1 km였지만 iPad 1.1.4에서는 지도를 열지 않아 같은 기기 비교가 없음).

## 남은 상태

- iPad에는 SDK 54 로컬 preview 앱이 있고 도쿄 여행은 온라인 전용이다. iPad용 DeviceKit 서버는 이 세션의 백그라운드 작업으로 실행 중이다.
- 시험 경비 두 건(JPY 2500, JPY 300)이 계정의 도쿄 여행에 올라갔다.
- `feat/012-sdk54`의 main 병합은 사용자 확인이 필요하다(main push는 Render 재배포).
