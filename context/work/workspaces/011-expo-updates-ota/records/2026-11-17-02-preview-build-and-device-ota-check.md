# preview 빌드와 실기기 OTA 확인

2026-11-17 0시 55분경부터 1시 50분경(KST)까지의 기록이다. 두 번째 세션의 마지막 구간이다. 사용자의 iPhone을 테스트 기기로 등록하고 EAS preview 빌드를 만들었다. 첫 빌드는 runtime 불일치로 실패했고, 원인을 찾아 고친 뒤 두 번째 빌드가 성공했다. 이어서 실기기에서 [완료 판단](../current/memory/spec/04-quality-and-completion.md)의 1–4를 확인했고, 5는 일부만 확인했다. 코드 변경은 여전히 커밋하지 않았다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 1611–2268행이다. 실기기에서 본 화면은 사용자가 관찰해 알려 준 것이다. Main은 화면을 직접 보지 않았고 발행·빌드·계산만 실행했다.

## 기기 등록

사용자가 "어떻게 해야돼?"(1640)라고 물었다. Main은 터미널 탭에서 `eas device:create`를 시작했다. 셸에서 `eas`를 찾지 못해 nvm 경로로 다시 실행했다(1661–1673). Apple 로그인부터는 사용자가 직접 진행했다(1682). Main은 Website 방식을 고르고 iPhone Safari로 프로필을 설치하라고 안내했다.

처음에는 프로필을 내려받기만 해서 등록되지 않았다(1687–1697). 사용자가 "설치했어 확인해봐"라고 한 뒤 등록 기기가 1대가 됐다(1716–1720). 기기는 iPhone 14 Pro다(1992).

## 첫 preview 빌드: runtime 불일치로 실패

`eas build --profile preview --platform ios`를 실행했다(1748). 빌드 로그에는 preview 환경 변수 14개와 프로필 `env`의 `APP_VARIANT`가 실렸다. 두 곳에 모두 있는 `APP_VARIANT`는 프로필 값을 쓴다고 나왔다(1752). 이로써 앞 기록에서 코드로 읽은 "프로필 `env`가 서버 변수보다 우선"이 실제 빌드에서도 확인됐다. 이 과정에서 EAS에 `preview` 채널과 브랜치가 새로 생겼다.

credentials 설정에서 사용자가 Apple 로그인을 하고, 프로필에 넣을 기기를 확인했다(1766–1777). 배포 인증서는 기존 것을 다시 썼고 2026-12-30에 만료된다. ad hoc 프로필은 AN57L8X528이며 만료일이 같다(1791).

첫 빌드 `8316db33-4696-4ea3-93f5-74095d6e5e89`는 `CONFIGURE_EXPO_UPDATES` 단계에서 실패했다(1791–1830). 로그에 "Runtime version mismatch"가 있었다. 로컬이 계산한 값은 `22d6ec17…`, EAS가 계산한 값은 `54a96787…`이었다. 이대로 빌드됐다면 로컬에서 발행한 업데이트가 이 빌드에 가지 않았을 것이다. EAS 빌드가 그 불일치를 실패로 알려 준 것이다.

### 원인을 찾은 과정

- **`eas fingerprint:compare`:** "SDK 52 이상만" 계산할 수 있다는 오류로 쓸 수 없었다(1837–1838). 앞 기록에서 Ticket 02의 검사 후보로 적은 명령이지만 SDK 51에서는 동작하지 않는다.
- **깨끗한 복사본에서 재현:** `git ls-files -co --exclude-standard`로 고른 파일을 scratchpad에 `rsync`로 복사하고 `pnpm install --frozen-lockfile`로 설치했다(1858). 그 복사본에서 계산하니 EAS와 같은 `54a96787…`이 나왔다(1869–1870).
- **차이 비교:** 두 계산의 fingerprint 소스를 비교했다(1876–1877). 로컬에만 `ios` 디렉터리가 있었다. EAS 쪽에만 `node_modules`의 `tempy`, `crypto-random-string`, `locate-path`, `p-locate` 파일이 `expoConfigPlugins` 이유로 들어 있었다.
- **`ios/`는 원인이 아니었다:** 로컬 `ios/`를 치우고 다시 계산해도 `22d6ec17…`였다(1881–1887).
- **진짜 원인, 중첩 사본:** 두 설치의 `node_modules` 목록을 비교했다(1892–1893). 로컬에는 예전 설치가 남긴 중첩 패키지 사본이 40개쯤 더 있었다. 예로 `@expo/image-utils/node_modules/tempy`, `.../crypto-random-string`이 있다. 패키지 버전은 같았지만, 위치가 달라 config plugin이 가리키는 소스 파일 경로가 바뀌었다. 그래서 fingerprint의 `expoConfigPlugins` 소스가 달라졌다. Main의 해석이다. 브리프에 나온 `find-up/node_modules/locate-path`는 이 원문의 출력에서 직접 확인하지 못했다. 출력이 잘려 목록의 일부만 보였다.
- **해결:** `node_modules`를 모두 지우고 `pnpm install --frozen-lockfile`로 다시 설치했다(1899–1905). 로컬 계산도 `54a96787…`이 됐고 dev-menu 패치도 그대로 적용돼 있었다. `ios/`를 되돌려 놓은 뒤에도 값이 같았다(1911–1913).

여기서 얻은 교훈은 이렇다. 같은 lockfile이어도 오래된 로컬 `node_modules`는 runtime을 바꿀 수 있다. 그래서 발행 전에 깨끗한 설치와 대상 빌드와의 runtime 비교가 필요하다(Main 정리, 1960). [Ticket 02](../current/memory/tickets/02-ota-publish-guard.md)의 검사 후보로 옮겼다.

## 두 번째 preview 빌드: 성공

두 번째 빌드 `f610d9b5-3c04-46d5-b191-e50efac28247`은 계정의 동시 빌드 한도 때문에 대기열을 거쳐 FINISHED가 됐다(1912–1974). runtime은 `54a96787…`, 채널은 preview다. EAS(Xcode 26.2)에서도 dev-menu 패치를 포함해 빌드가 된다는 것도 이것으로 확인됐다.

## 실기기 확인 (iPhone 14 Pro)

### 앱 시작과 Google 로그인

사용자가 앱을 설치해 열었다.

> "설치했고 앱을 키는데 로그인하는데 오류나고 꺼졌어" (1981)

Main이 기기의 시스템 crash log를 봤지만 Noline 항목은 없었다(1994–2002). 기기에는 운영 앱 `com.ham.noline`(1.1.2, 빌드 16)과 시험 앱 `com.noline.dev`(1.1.3, 빌드 17)가 함께 있었다. Main이 Mac에서 앱을 다시 실행하고 콘솔을 받았다(2026–2031). 사용자가 다시 시도한 결과는 다음과 같았다.

> "액세스차단됨이고 지금 앱 켜졌네 자 ㄹ되는것 같아" (2043)

"액세스 차단됨"은 Google 로그인 화면의 오류다. Main은 Google 쪽에 시험 앱의 번들 ID `com.noline.dev`가 등록되지 않은 탓으로 판단했다. Google OAuth 설정은 확인하지 않았으므로 추정이다. OTA와는 무관하며, OTA 시험은 로그인 화면만으로 진행했다. 첫 시도에서 앱이 "꺼진" 원인은 확인하지 못했다.

### 완료 판단 1–4

시험용 변경은 커밋하지 않았다. 발행할 때만 넣고 바로 되돌렸으며, 되돌린 뒤 로컬 runtime이 `54a96787…`인 것을 확인했다(2064–2065, 2128–2139).

| 판단 | 한 일 | 사용자 관찰 |
| --- | --- | --- |
| 1 업데이트 받기 | 로그인 화면 문구에 "· OTA 시험 1"을 붙여 `eas update --channel preview --environment preview --platform ios`로 발행했다. 그룹 `9889e7f4-7b16-4d1c-9081-04d2481e50bb`, runtime `54a96787…`(2048–2059). 앱을 한 번 열어 받게 하고, 다시 열어 적용을 봤다 | "잘 나오네" (2074) |
| 2 오프라인 시작 | 비행기 모드에서 앱을 완전히 종료했다가 다시 열었다 | "비행기 모드에서도 바로 열리고 문구도 그대로야" (2088). 기다리지 않고 바로 열렸고, 받아 둔 업데이트도 유지됐다 |
| 3 롤백 | `eas update:roll-back-to-embedded --channel preview --runtime-version 54a96787…`로 그룹 `4c567056-dd84-4da2-b7b5-e5bb154aa014`를 발행했다(2098–2099). 완료 판단 문구의 `eas update:rollback` 대신 빌드에 들어 있는 번들로 되돌리는 명령을 썼다 | "원래 문구로 돌아왔어" (2113) |
| 4 runtime 분리 | `app.config.js`의 iOS `infoPlist`에 임시 키를 넣어 runtime을 `63918ede…`로 바꾸고, "· OTA 시험 2" 문구와 함께 발행했다. 그룹 `dee2e1d6-f231-4ec8-bcfb-551f423e4b71`(2118–2130). 네이티브 설정이 바뀌면 runtime이 달라지는 것과, 기존 빌드가 그 업데이트를 받지 않는 것을 함께 본 시험이다. 새 runtime으로 빌드를 따로 만들지는 않았다 | "원래 문구 그대로야" (2148) |

2026-11-17 현재 preview 채널에서 runtime `54a96787…`의 최신 업데이트는 rollback-to-embedded다. runtime `63918ede…`의 시험 업데이트도 preview 브랜치에 남아 있지만, 그 runtime의 빌드가 없어서 받을 기기는 없다.

### 완료 판단 5 (일부)

발행한 번들에 어느 환경값이 들어갔는지 로컬 `dist/`에서 셌다(2158–2176). `dist/`는 gitignore 대상이다. 센 대상은 마지막으로 내보낸 번들, 즉 "OTA 시험 2"의 `hbc`이며 이 번들도 `--environment preview`로 만들었다.
- preview EAS 환경의 `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_ENVIRONMENT`, `EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` 값이 각각 1번씩 들어 있었다.
- 로컬 `.env.development`의 http API 주소는 0번이었다.

그래서 `--environment`로 발행하면 로컬 `.env`가 아니라 EAS 환경값이 번들에 들어간다는 것을 preview로 확인했다. 완료 판단 5가 요구하는 production 채널 번들의 값은 아직 보지 않았다.

뒤에 Main이 이 결과가 나온 구조를 확인했다(2235–2248). `apps/client/babel.config.js`는 `react-native-dotenv`로 `@env` 모듈을 만든다. 읽는 파일은 `APP_VARIANT`가 production이면 `.env.production`, 아니면 `.env.development`다. 그런데도 번들에 EAS 값이 들어간 것을 Main은 이렇게 설명했다. 발행 명령이 넣은 `process.env` 값이 파일 값보다 우선한다. 코드가 `@env`로 가져오는 이름은 다섯 개다. `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GEONAMES_API_URL`, `EXPO_PUBLIC_GEONAMES_USERNAME`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`이며 모두 EAS 환경에 있다. 다만 EAS에 없는 이름을 `@env`로 새로 쓰면, 로컬에서 발행할 때만 로컬 `.env` 파일 값이 번들에 섞일 수 있다. [Ticket 02](../current/memory/tickets/02-ota-publish-guard.md)에 주의로 남겼다.

Sentry 소스맵은 아직 하지 않았다. `SENTRY_AUTH_TOKEN`은 EAS에서 SECRET 등급이다. 로컬 CLI가 불러온 preview 변수 목록에는 Plain text와 Sensitive만 있고 이 토큰은 없었다(1752, 1838). 업로드 방법은 미정이다. 로컬에 토큰을 두는 방법과 EAS Workflows처럼 서버 쪽에서 발행하는 방법이 후보로 나왔다(Main 정리).

## 이 세션의 마지막: Google 로그인 확인 방법 질문

Main이 1–4 확인 결과와 남은 일을 정리했다(2197). Sentry 업로드 후보로는 로컬 토큰과 EAS Workflows를 들었다. Workflows는 토큰 문제와 함께 이번에 겪은 로컬 `node_modules` 차이도 없앨 수 있어서, 방지 장치와 함께 정하자고 했다. 이어서 사용자가 물었다.

> "구글 그거 어디서 어떻게 구체적으로 확인하지?" (2211)

Main은 Google 로그인 코드(`src/shared/services/auth/google-auth.ts`, `expo-auth-session` Google provider)와 `babel.config.js`를 읽었다. iOS·Web client ID가 같은 Google Cloud 프로젝트 번호에 속한다는 것을 확인했다(2225–2254). 이 기록의 원문 끝(2268)까지 Main의 구체적인 안내는 아직 나오지 않았다. Google OAuth 설정은 여전히 확인 전이다.

## 앞 기록의 미확인 정정

[착수 기록](2026-11-17-01-ticket01-build-gate-and-publish-env.md)에는 eas-cli의 기본 environment 매핑을 Main 보고로 적었다. 원문 1425행의 도구 결과에 `resolveSuggestedEnvironmentForBuildProfileConfiguration` 함수 본문이 그대로 있다. 이를 대조해 확정한다. `distribution === 'store'`이면 production, `developmentClient`이면 development, 그 밖은 preview다.

## 이 기록으로 고친 current

- Ticket 01: 단계 2의 EAS 빌드 확인, 단계 6의 결과(1–4 확인, 5 일부), Sentry 소스맵이라는 남은 일, 로컬 `node_modules` 주의
- Ticket 02: runtime 불일치 사례, `fingerprint:compare` 사용 불가, 깨끗한 설치와 runtime 비교 후보
- Spec 05 가정: runtime 일치와 preview 로그인
- state, recover, records·source 색인
