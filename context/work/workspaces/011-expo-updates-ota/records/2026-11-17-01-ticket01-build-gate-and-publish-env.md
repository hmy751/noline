# Ticket 01 착수: Xcode 26 판단 지점 통과와 발행 환경 정리

2026-11-16 밤부터 11-17 새벽(KST)까지 이어진 두 번째 세션 후반의 기록이다. 사용자가 011 진행을 지시해 Ticket 01을 실제로 실행했다. 단계 1–4의 설정을 넣었고, 판단 지점인 Xcode 26 빌드는 expo-dev-menu 한 줄을 패치해 통과했다. 이어서 단계 5의 발행 방법을 EAS 환경 대응까지 정하고 EAS preview 환경을 채웠다. preview EAS 빌드와 OTA 실제 수신은 아직 하지 않았다. 코드 변경은 커밋하지 않았다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 839–1611행이다. 1203행에 컨텍스트 압축 요약이 있지만, 아래 사실은 요약이 아니라 앞뒤 원문의 도구 결과로 대조했다.

## 착수 지시와 1.1.3 상태

앞 기록에서 사용자는 "파악만" 하라고 범위를 좁혔고 착수는 사용자가 정하기로 했었다. 012 분리를 커밋한 뒤 사용자가 순서를 정했다.

> "일단 011 부터 하고 다되면 병합하자" (841)

Main은 이를 011 구현 착수 지시로 받았다. "병합"은 012 분리 문서 브랜치(`docs/012-sdk-upgrade-split`, 커밋 `3895d44f`)와 011 작업을 011이 끝난 뒤 main에 함께 합친다는 뜻으로 이어졌다(Main 정리, 1237). 구현 브랜치 `feat/011-expo-updates`는 그 문서 브랜치 위에 새로 만들었다(875, 878).

시작 전에 1.1.3 심사 결과를 App Store Connect에서 직접 봤다. 2026-11-16 21시 30분경(KST) 화면은 여전히 "심사 대기 중"이었다(848–875). 거절이 아니라서 Work 008의 대응 없이 011을 진행했다. 심사 결과 자체는 아직 모른다.

## 단계 1: 패키지와 dev-client 정렬

저장소 루트에서 `pnpm --filter @apps/client add expo-updates@~0.25.28 expo-build-properties@~0.12.5 expo-dev-client@~4.0.29`로 설치했다(878). pnpm이 dev-client를 `^4.0.29`로 적어서, SDK 묶음을 벗어나지 않도록 `~4.0.29`로 고쳤다(907).

prebuild 뒤 `Podfile.lock`에는 EXUpdates 0.25.28, EXUpdatesInterface 0.16.2, EXManifests 0.14.3, expo-dev-launcher 4.0.29, expo-dev-menu 5.0.23이 들어갔다(1010). 앞 기록에서 걱정한 "같은 네이티브 모듈이 두 버전으로 섞이는" 상태는 없어졌다. `expo-updates-interface`가 0.16.2 하나로 정리됐다.

## 단계 3·4: 설정

`app.config.js`에 세 가지를 넣었다(908). 각 줄에는 이유를 적은 주석이 함께 들어갔다.
- `runtimeVersion: { policy: 'fingerprint' }`
- `updates: { url: 'https://u.expo.dev/6bb47585-…', fallbackToCacheTimeout: 0 }`
- `['expo-build-properties', { ios: { deploymentTarget: '15.0' } }]`. 012 전까지의 임시 설정이라는 주석을 달았다.

prebuild 결과를 열어 네이티브 값으로 바뀐 것을 확인했다(1010). `Expo.plist`는 `EXUpdatesEnabled` true, `EXUpdatesLaunchWaitMs` 0, `EXUpdatesRuntimeVersion` `file:fingerprint`, `EXUpdatesURL`이 위 주소였다. `Podfile.properties.json`의 `ios.deploymentTarget`은 15.0이었다.

`eas.json`에는 preview·production 프로필에 같은 이름의 `channel`을 넣었다(909–910). development 프로필은 Metro에 붙여 쓰는 dev-client 빌드라 채널을 넣지 않았다(1173). 뒤의 발행 환경 조사로 `environment`도 추가했다(아래 단계 5).

## 단계 2: Xcode 26 판단 지점

로컬 Xcode 26.5, iPhone 15 Pro 시뮬레이터(iOS 26.0)에서 `npx expo run:ios --configuration Release`로 빌드했다(953, 964). Release를 고른 이유는 EAS 운영 빌드와 같은 구성이고, Work 007의 Sentry 문제도 Release에서 드러났기 때문이다(1173). 기존 `apps/client/ios/`(1월 생성, NolineDev)는 지우지 않고 scratchpad로 옮겨 새로 prebuild했다(953). 이 로컬 빌드는 Expo CLI가 `.env.production`을 읽어 운영 이름과 번들 ID `com.ham.noline`으로 만들어졌다. 로그인은 하지 않았다. 하면 운영 서버에 붙는다(1173).

빌드는 두 번 실패한 뒤 성공했다.

| 차례 | 결과 | 원인과 처리 |
| --- | --- | --- |
| 1 | `pod install` 실패, 이어서 xcconfig를 찾지 못해 BUILD FAILED(988–993) | CocoaPods가 `Encoding::CompatibilityError`로 죽었다. 셸 locale이 UTF-8이 아니어서 진짜 오류가 가려졌다. `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`로 실행하니 pod 101개가 설치됐다(997–1003). 로컬 환경 문제이며 EAS에는 해당하지 않는다고 Main이 판단했다(1254) |
| 2 | Swift 컴파일 실패(1057–1092) | `expo-dev-menu` 5.0.23의 `ios/DevMenuViewController.swift` 66행 `let isSimulator = TARGET_IPHONE_SIMULATOR > 0`이 "cannot find 'TARGET_IPHONE_SIMULATOR' in scope"를 냈다. C 매크로를 이 Xcode의 Swift가 읽지 못한다. 같은 로그의 Metro "jest worker SIGINT"는 컴파일 실패에 딸려 난 것으로 봤다. 5.0.23은 5.0.x의 마지막 판이라 버전을 올려 피할 수 없다(1074–1075). 이 매크로를 쓰는 Swift 파일은 이 한 곳뿐이었다(1084–1085) |
| 3 | 성공(1115–1116) | 66행을 같은 뜻의 Swift 표준 방식 `#if targetEnvironment(simulator)`로 `node_modules`에서 임시로 고쳤다(1094). 앱이 설치되고, 다시 실행하자 로그인 화면이 떴다(1135–1140). 앱 묶음에 `main.jsbundle`과 `EXUpdates.bundle`(`app.manifest`, `fingerprint`)이 들어 있었다(1131–1136) |

첫 스크린샷의 "No bundle URL present"는 Release 앱의 문제가 아니었다. 설치 직후 개발용 주소(`exp+noline://expo-development-client/...`)가 열리며 생긴 화면이고, 앱을 다시 띄우자 로그인 화면이 나왔다(1130–1140, 1173). 예전에 dev-client를 6.0.20으로 넣은 것이 이 컴파일 문제를 피하려던 것일 수 있다고 Main이 추정했지만 기록이 없어 확인하지 못했다(1173).

### 판단 지점의 결론과 사용자의 선택

Spec 05의 판단 지점은 "깨지면 SDK 51에 더 투자하지 않고 OTA를 012에 합칠지 다시 판단한다"였다. Main은 막힘이 한 줄이라 분리할 때 걱정한 "SDK 51에 큰 투자"에 해당하지 않는다고 보고, `pnpm patch`로 고정하고 011을 계속하자고 추천했다(1151). 대안은 OTA를 012에 합쳐 SDK 51에서 더 진행하지 않는 것이었다.

사용자는 바로 고르지 않고 먼저 설명을 요청했다.
- "작업한거에 대해서 자세히 설명해줘봐 /explain" (1156): Main이 설정 → 네이티브 값 → 앱의 연결, 각 설정의 실행 의미, fingerprint의 환경 의존, 빌드 세 번의 경위를 설명했다(1173).
- "내가 관련 정보를 잘 몰라서 그런가봐 더 설명해줄래? 아니면 필요한 정보는 나한테 물어봐" (1178): Main이 앱의 두 층, OTA와 runtime의 뜻, dev-client가 무엇이고 왜 한 줄이 막았는지, `pnpm patch`가 무엇인지부터 다시 설명하고 두 선택지를 표로 냈다(1182).
- "011 된거야? 아직 진행중이지?" (1192): 아직 진행 중이며 1단계 로컬 확인만 끝났다고 답했다(1237).
- "아까 에러 낫다하지 않았어? 된거야?" (1248): 에러 두 개의 원인과 처리, 두 번째 수정이 `node_modules`에만 있어 재설치나 EAS 빌드에서 사라지는 "임시"라는 뜻을 설명했다(1254).

그다음 사용자가 답했다.

> "됐으면 진행해 계속 012 는 다른데서 할거고" (1259)

Main은 이를 "패치로 고정하고 011을 계속한다"는 선택으로 받았다. 012는 다른 세션에서 진행한다. 이 대화에서 사용자가 설명을 두 번 더 요청한 것은, 판단 지점의 선택을 맡기기 전에 배경 설명이 먼저 필요했다는 뜻이다.

## 패치 고정과 재확인

`pnpm patch expo-dev-menu@5.0.23`으로 수정을 저장소에 고정했다(1280–1296).
- 루트 `patches/expo-dev-menu@5.0.23.patch`가 생겼다. 66행 한 줄을 `#if targetEnvironment(simulator)` 블록으로 바꾸는 내용이다.
- 루트 `package.json`에 `pnpm.patchedDependencies`가 추가됐고, lockfile의 expo-dev-menu 항목에 `patch_hash`가 붙었다(1309).
- `pnpm install --frozen-lockfile` 뒤에도 `node_modules`에 수정이 적용돼 있었다(1303–1309).
- 같은 Release 빌드를 다시 돌려 exit 0, `error:` 0건이었고 앱이 로그인 화면까지 떴다(1333, 1401–1409, 로그 `ios-release-build-4.log`).

012에서 dev-client가 SDK 54 이후 판으로 올라가면 이 패치는 지운다(1182).

## 단계 5: 발행 방법과 EAS 환경

### fingerprint가 환경값에 따라 바뀐다

`app.config.js`가 환경변수로 설정을 만든다. Sentry plugin은 `SENTRY_ORG`·`SENTRY_PROJECT`가 있을 때만 들어가고, Mapbox plugin은 `MAPBOX_SECRET_ACCESS_TOKEN`을, Google Maps 설정은 `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY`를 읽는다. 그래서 runtime 계산 명령을 가짜 값으로 조건만 바꿔 돌려 봤다(947–948). 같은 조건이면 같은 값이 나왔지만 Sentry 설정 유무, Mapbox 토큰, Google Maps 키, `APP_VARIANT` 중 하나만 달라도 runtime이 달라졌다.

이게 위험한 이유는 다음과 같다. EAS 빌드는 EAS 환경값으로 fingerprint를 계산해 앱에 넣는다. 발행 쪽 runtime이 다른 환경값으로 계산되면, 업데이트가 아무 기기에도 가지 않고 오류도 나지 않는다(1151, 1173). 마이그레이션 같은 위험 변경을 막는 일과 별개로 "발행했는데 아무도 못 받는" 사고를 막아야 한다.

### eas-cli가 환경값을 읽는 방식

Expo 문서 두 쪽은 기본 environment와 우선순위를 답하지 않았다(1386–1396). 그래서 설치된 eas-cli 16.28.0의 코드를 직접 읽었다(1418–1451). 아래는 Main이 코드에서 읽은 내용이며 실제 EAS 빌드로 확인하지는 않았다.
- **빌드의 기본 environment:** 프로필에 `environment`가 없으면 추천 규칙을 쓴다. Main 보고에 따르면 store 배포는 production, `developmentClient`는 development, 그 밖은 preview다(`build/build/evaluateConfigWithEnvVarsAsync.js`).
- **우선순위:** 빌드 프로필의 `env`가 EAS 서버 변수보다 우선한다.
- **`eas update`:** `--environment`를 주면 그 환경의 서버 변수를 config 평가와 runtime 계산에 쓴다(`commands/update/index.js`, `DynamicProjectConfigContextField.js`). 빌드 프로필의 `env`는 읽지 않는다.
- **로컬 `ios/` 폴더:** 있든 없든 runtime이 같았다(1454–1474). 로컬에서 prebuild한 폴더가 발행 runtime을 흔들지 않는다.

### 드러난 문제와 선택

`eas env:list`로 보니 EAS의 production 환경에는 변수 15개가 있었고 preview 환경은 비어 있었다(1343–1344, 1542–1543). 그래서 지금 그대로면 preview 빌드에 Mapbox 토큰·API 주소 등이 빠진다. production 값을 빌려 preview를 발행하면 업데이트의 `APP_VARIANT`가 production이 되어 preview 빌드(`APP_VARIANT=development`)와 runtime이 어긋난다.

Main이 두 방식을 물었다(1479).
- **preview 환경 채우기(추천):** 공통 값을 preview에도 연결하고 preview 전용 값을 추가한다. 빌드와 업데이트가 같은 값을 쓰게 된다. 시험 앱 `com.noline.dev`는 운영 서버를 본다. Expo 계정 설정을 바꾸므로 허락이 필요하다.
- **TestFlight로 시험:** Expo 설정은 안 바꾼다. 대신 production 빌드 위에서 시험 업데이트를 보내므로, 심사 제출 전에 반드시 되돌려야 실제 사용자에게 가지 않는다.

사용자는 "preview 환경 채우기 (추천)"을 골랐다. 실기기 등록 여부는 "모르겠음, 확인해줘"라고 답했다(1480).

### 실제로 바꾼 EAS 환경과 eas.json

사용자 허락에 따라 Expo 계정의 EAS 환경 변수를 바꿨다(1548–1561). 값은 여기 적지 않는다.
- 공통 변수 13개를 production과 preview 양쪽에 연결했다. `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GEONAMES_API_URL`, `EXPO_PUBLIC_GEONAMES_USERNAME`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN`, `EXPO_PUBLIC_SENTRY_DSN`, `MAPBOX_SECRET_ACCESS_TOKEN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`이다. `EXPO_PUBLIC_GEONAMES_API_URL` 하나로 먼저 시험한 뒤 나머지 12개를 연결했다. production의 15개 가운데 이 13개를 뺀 둘이 아래 환경별 값이다. 변수 자체는 새로 만들지 않고 기존 변수의 환경 목록에 preview를 더했다.
- preview 전용으로 `APP_VARIANT=development`와 `EXPO_PUBLIC_SENTRY_ENVIRONMENT=preview`를 plaintext로 새로 만들었다.
- production 전용 `APP_VARIANT`(production)와 `EXPO_PUBLIC_SENTRY_ENVIRONMENT`(production)는 그대로다(1363–1364).

기본 규칙에 기대지 않도록 `eas.json`에 `environment`를 명시했다(1566–1567). preview 프로필은 `"environment": "preview"`, production 프로필은 `"environment": "production"`이다. 그래서 발행 명령은 `eas update --channel <채널> --environment <같은 이름>`으로 정했다. Sentry 소스맵 업로드를 발행에 어떻게 묶을지는 아직 정하지 않았다.

preview 앱 `com.noline.dev`는 운영 서버를 본다. Google·Apple 로그인은 번들 ID가 달라 안 될 수 있다(미확인).

### runtime 계산

`EXPO_NO_DOTENV=1 eas env:exec <환경> 'npx expo-updates runtimeversion:resolve --platform ios'`로 각 환경의 runtime을 계산했다(1576–1577). `EXPO_NO_DOTENV=1`은 로컬 `.env` 파일을 읽지 않게 한다.
- preview: `22d6ec1704327515947073321c14561404788828`. 반복 계산해도 같았다.
- production: `24bdaa2380dcdb0276fd0d44e0ab167d643e3cc6`

이 값은 커밋하지 않은 현재 작업 트리 기준이다. 실제 EAS 빌드가 계산한 runtime과 같은지는 빌드 전이라 아직 모른다.

## 테스트 기기

`eas device:list` 결과 등록된 기기는 0대였다(1492–1510). preview 프로필은 internal 배포라 등록된 기기에만 설치된다. Main은 사용자가 직접 `apps/client`에서 `eas device:create`를 실행해 "Website"(URL·QR)를 고르고, 그 링크를 iPhone Safari에서 열어 프로필을 설치하라고 안내했다(1611). 등록하면 preview EAS 빌드를 시작한다.

## 검사

- **Jest:** `pnpm --filter @apps/client test -- --runInBand`로 78개 파일, 920개 테스트가 모두 통과했다(1035–1036). 바뀐 것이 설정과 네이티브 모듈이라 JS 동작이 그대로라는 근거일 뿐 OTA 확인은 아니다.
- **lint 11건, tsc 6건:** `MyLocationButton.tsx`, `packages/ui/src/index.tsx`(4건), `TimeField.tsx`, `mapbox.ts`와 테스트 파일에서 나왔다(975, 1030–1036). 이번에 손댄 파일은 아니다. main에서 같은 검사를 돌려 비교하지는 않았다.

## 아직 확인하지 않은 것

- EAS(Xcode 26.2)에서의 빌드와 패치 적용
- EAS 빌드의 runtime이 위 계산과 같은지
- preview 빌드로 OTA 받기, 오프라인 시작, 롤백, runtime 분리(완료 판단 1–4)
- 발행 번들의 환경값과 Sentry 소스맵(완료 판단 5). Sentry 업로드 방식은 미정
- preview 앱의 Google·Apple 로그인

## 이 기록으로 고친 current

- Ticket 01: 상태, 단계 1–5의 결과, 판단 지점 결론, 남은 단계 6–7과 주의
- Ticket 02: 발행 환경 불일치를 막을 검사 후보
- Spec 01·03·05: 범위의 패치·EAS 환경, fingerprint 확인 범위와 환경 의존, 설계 표·판단 지점·가정
- state, recover, README, output·source 색인
