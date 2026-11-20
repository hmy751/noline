# 2026-11-20 — 1.2.0을 갱신 전에 내기로 한 경위와 로컬 빌드·App Store Connect 업로드

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 사용자의 질문 "근데 멤버십 갱신을 왜 해야 빌드 제출할 수 있는거야?"(9303행)부터, Main이 이 기록을 맡겼다고 알린 메시지(9663행)까지다. 중간에 대화 압축(`/compact`, 9339–9342행)이 있었고, 사용자의 진행 답(9359행)은 압축 직후에 있다.

## 갱신을 기다리던 순서가 어디서 왔나

직전 기록에서 Work 012는 "12월 갱신을 기다리는 상태"였다. 사용자가 이 전제를 물었다(9303행).

> 근데 멤버십 갱신을 왜 해야 빌드 제출할 수 있는거야? 그냐앟면 안되나?

Main은 Workspace에서 "멤버십·인증서"가 나오는 곳을 찾아(9311행), 이 순서가 기술적 조건이 아니라 일정에서 왔다고 답했다(9326행). 처음 일정 초안은 "멤버십·인증서 갱신 뒤 1월 초 1.2.0"이었고([출시 축소 기록](2026-11-17-03-release-count-reduction.md)), Ticket 재구성 때 "04는 인증서 갱신 뒤"를 선행 조건으로 적었으며([재구성 기록](2026-11-17-05-ticket-restructure-and-map-data-plan.md)), Spec 05에는 "이 Work의 스토어 빌드는 그 뒤가 될 가능성이 높아 갱신이 먼저다"라고 남아 있었다. 2026-11-19 04의 코드 작업을 앞당길 때도 "1.2.0 스토어 빌드·제출만 12월 갱신을 기다린다"고 설명했고([04 코드 작업 기록](2026-11-19-02-ticket04-newarch-code-and-review.md)), 그 뒤 이 순서는 다시 따져 보지 않은 채 남아 있었다.

Main이 설명한 멤버십과 인증서의 차이는 다음과 같다. Main은 "Apple의 일반 정책 기준이고, 오늘 따로 확인하지는 않았습니다"라고 단서를 달았다.
- **멤버십(12-18까지 유효):** 유효한 동안 빌드·제출·출시를 모두 할 수 있다. 만료되면 앱이 App Store에서 내려가고 제출도 막힌다. 그래서 갱신은 1.2.0과 상관없이 해야 하지만 지금 제출하는 조건은 아니다.
- **배포 인증서(12-30 만료):** 새 빌드에 서명할 때만 필요하다. 지금 인증서로 서명해 스토어에 낸 앱은 만료 뒤에도 계속 받을 수 있고, 영향을 받는 것은 ad hoc preview처럼 직접 설치한 앱이다.

지금 진행할 때 걸리는 것으로는 세 가지를 들었다. EAS 11월 빌드가 이미 16건이라 로컬 production 빌드(`eas build --local`)와 `eas submit`을 쓰거나 12-01 초기화 뒤 EAS로 빌드해야 한다는 점, iPhone과 Apple 로그인은 운영 번들 빌드에서만 제대로 볼 수 있어 TestFlight로 확인한 뒤 심사에 내야 한다는 점, production 채널에 1.2.0 빌드가 생기면 `release/1.1`의 1.1.x OTA가 끝난다는 점(계획된 일)이다. 세 번째는 아래에서 로컬 빌드에는 맞지 않는 것으로 드러났다.

Main은 지금 하는 편이 낫다고 추천했다. 12월 말 Apple 휴가 기간의 심사 지연을 피하고, 반려돼도 인증서가 유효한 동안 다시 빌드할 여유가 있으며, 출시 뒤 1주일 Sentry 관찰도 연말 전에 끝낼 수 있다는 이유였다. 추천 순서는 로컬 production 빌드를 TestFlight에 올리고, TestFlight 빌드로 iPhone 덮어 설치와 Apple 로그인을 본 뒤, 문제가 없으면 심사에 내는 것이었다. 진행하면 Spec의 "04는 갱신 뒤" 조건과 일정도 고치겠다고 했다.

사용자는 이렇게 답했다(9359행).

> 그래 다 진행하자 할거

Main은 이를 추천 순서대로 1.2.0을 지금 진행하라는 승인으로 받았다. 이 답으로 Spec 05의 조건을 바꿨다. 갱신 대기는 선행에서 빠지고, 멤버십 12-18 갱신은 별개의 사용자 일로 남는다. TestFlight 운영 앱으로 기존 사용자 업데이트를 보는 방법은 처음 Main 기본값(preview 앱, 운영 데이터 보호)과 다르다. 이 차이를 사용자가 따로 판단하지는 않았다(기록 담당자 지적).

## 진행한 것

**출시 기준과 설정 확인(9384–9429행).** `eas.json`의 production 프로필(`environment`·`channel` production, `distribution` store, submit의 `ascAppId` 6757186547), `app.config.js`, Project 출시 기준의 release 브랜치 절과 Ticket 04를 읽었다. `release/1.1`에는 1.1.4 커밋 `d160c7b5` 뒤로 새 커밋이 없어(9467행) Main은 1.2.0 전에 1.1.x로 먼저 낼 수정이 없다고 봤다. 같은 호출의 EAS Android 빌드 목록 조회에서 결과가 나오지 않았고, Main은 "EAS에 Android 빌드 기록이 한 번도 없어서" 이번 출시를 iOS만으로 봤다고 알렸다(9551행). 사용자가 이 범위를 따로 확인하지는 않았다.

**버전 커밋(9476–9482행).** `app.config.js`의 `version` 1.1.4→1.2.0, `ios.buildNumber` 18→19만 바꿔 `3ff9832c`("chore(client): 1.2.0 빌드 19 배포 준비")로 커밋했다. 이 Work와 무관한 미커밋 파일은 넣지 않았다. push하지 않았다. Main은 "push는 Render 재배포를 일으키므로 아직 하지 않았습니다. 로컬 빌드에는 push가 필요 없습니다"라고 알렸다(9551행).

**runtime 선계산(9489–9508행).** `pnpm install --frozen-lockfile` 뒤 `EXPO_NO_DOTENV=1 eas env:exec production 'npx expo-updates runtimeversion:resolve --platform ios'`로 production runtime `167224c68c33d159626c09f8e67c74fe5f20c02c`를 얻었다. 처음 두 번은 출력 필터 때문에 값이 보이지 않아 파일로 받아 읽었다.

**디스크와 빌드 준비(9448–9521행).** 남은 공간이 15 GB였다. 다시 만들어지는 `NolineDev-*` DerivedData 3개(각 2.2 GB)를 지워 21 GB가 됐다. 다른 캐시(`ModuleCache.noindex` 11 GB 등)는 두었다. `dist/`가 gitignore 대상인지 확인했다.

**로컬 production 빌드(9523–9574행).** `eas build --platform ios --profile production --local --non-interactive --output ./dist/noline-1.2.0-19.ipa`를 백그라운드로 돌렸다. 로컬 빌드는 EAS production 환경에서 Plain·Sensitive 값만 불러온다(빌드 로그 9533행의 불러온 목록에 `SENTRY_AUTH_TOKEN`이 없다). 그래서 로컬 `apps/client/.env.production`의 `SENTRY_AUTH_TOKEN`을 export해 넘겼다. 03의 시험용 로컬 빌드처럼 `SENTRY_DISABLE_AUTO_UPLOAD`로 끄지 않은 것은 출시 빌드라 소스맵이 필요하기 때문이다. 서명은 EAS 원격 credentials를 썼다(배포 인증서 시리얼 `5B923E47…`, 프로필 `5AFP6CHSWS`, 둘 다 2026-12-30 만료). 약 5분 뒤 exit 0으로 끝났고 ipa는 40,762,651바이트(약 38.9 MB)다.

**ipa 확인(9570–9574행, Main이 직접 풀어 봄).**

| 항목 | 값 |
| --- | --- |
| `CFBundleIdentifier` | `com.ham.noline` |
| 버전(빌드) | 1.2.0 (19) |
| `RCTNewArchEnabled` | true |
| `Expo.plist` 채널 헤더 | `production` |
| `EXUpdates.bundle/fingerprint` | `167224c68c33d159626c09f8e67c74fe5f20c02c` |

fingerprint 값은 선계산 값, 빌드 로그 `CALCULATE_EXPO_UPDATES_RUNTIME_VERSION`(1107행)의 값과 같다.

**Sentry 업로드는 확인하지 못했다(9579–9590행).** 빌드 로그에 "Upload Debug Symbols to Sentry" 단계 실행(2310행)과 그 단계가 매번 돈다는 Xcode 경고만 있고, xcpretty가 sentry-cli 출력을 숨겼다. gym 원본 로그는 없었다. `sentry-cli releases list`는 403(권한 없음), `releases files "com.ham.noline@1.2.0+19" list`는 "Release not found"였다. 이 토큰은 업로드용이라 조회 권한이 없을 수 있어(Main 해석은 대화에 없음, 기록 담당자 추론), 실패만으로 업로드가 안 됐다고 볼 수도 없다. JS 소스맵·dSYM이 올라갔는지는 미확인이다.

**`release/1.2`(9597–9599행).** `git branch release/1.2 3ff9832c`로 로컬에 만들었다. push하지 않았다.

**App Store Connect 업로드(9612–9642행).** `apps/client`에서 `eas submit --platform ios --profile production --path ./dist/noline-1.2.0-19.ipa --non-interactive`가 성공했다. submission `11293d25-6b5d-4c01-805d-29e4745b2e8a`, "Your binary has been successfully uploaded to App Store Connect", Apple 처리 뒤 메일이 온다고 나왔다. 로그에 "Looking up credentials configuration for com.noline.dev"가 찍혔다. submit 프로필에는 `APP_VARIANT`가 없어 `app.config.js`가 dev 번들 ID로 풀린 것으로 보인다(기록 담당자 해석). 실제로는 EAS 서버의 ASC API 키(`[Expo] EAS Submit …`)와 ASC 앱 `6757186547`을 썼고, 올린 ipa는 `com.ham.noline`이다. 심사에는 제출하지 않았다. Main은 "심사 제출은 TestFlight 빌드로 iPhone 덮어 설치와 Apple 로그인을 본 뒤에 하는 것으로 남겨 두겠습니다"라고 했다(9551행).

## 새로 드러난 것: 로컬 빌드는 OTA 발행 기준이 되지 않는다

업로드 뒤 Main이 `eas build:list --platform ios --channel production`을 보니 최신이 여전히 1.1.4 `7033c2ba`(runtime `0367b72f…`, 2026-11-17)였다(9646행). 로컬 빌드는 EAS 빌드 목록에 등록되지 않는다. 같은 호출에서 OTA 발행 스크립트가 `scripts/ota/eas.mjs`의 `listFinishedBuilds`로 채널 빌드 목록을 읽는 것을 확인했다.

기록 담당자가 `checks.mjs`를 읽은 결과, 스크립트는 그 목록의 최신 빌드(runtime이 있는 finished 빌드)를 업데이트 대상으로 삼고 로컬 runtime과 대조한다. 그래서 다음이 따른다(dry-run은 하지 않았다).
- main이나 `release/1.2`에서 1.2.0용 production OTA를 내려 하면 runtime `167224c6…`이 1.1.4와 달라 거부된다. TestFlight 1.2.0의 OTA 받기·롤백 확인과 출시 뒤 1.2.x 핫픽스 OTA가 지금 스크립트로는 막힌다.
- `release/1.1`에서는 여전히 1.1.4와 맞는다.

Project [출시 기준](../../../../project/guidance/app-release-and-ota.md#이미-낸-버전의-수정은-release-브랜치에서-낸다)은 "production 채널에 1.2.0 빌드가 생기면 `release/1.1`에서의 발행도 거부된다"고 적고 있다. EAS 클라우드 빌드를 전제로 한 설명이라 이번 로컬 빌드에는 맞지 않는다. 9326행에서 Main이 든 "1.1.x OTA가 끝남"도 같은 전제였다.

1.2.0을 OTA 대상으로 만드는 방법은 정하지 않았다. Main이 꺼낸 후보는 12-01 EAS 횟수가 초기화된 뒤 EAS 클라우드로 다시 빌드하는 것과, 스크립트가 명시한 runtime을 받도록 고치는 것이다. 이 후보와 비용(클라우드 재빌드 때 빌드 번호·업로드를 다시 하는지 등)은 이 구간 원문에서 사용자에게 아직 제시되지 않았다. Main이 기록 담당자에게 넘긴 정리에 들어 있었다.

## 확인한 것과 확인하지 못한 것

| 구분 | 내용 |
| --- | --- |
| Main이 직접 확인 | `release/1.1` 추가 커밋 없음, 버전 커밋 `3ff9832c`, runtime 선계산 값, 빌드 성공과 ipa 내용(번들 ID·버전·New Architecture·채널·fingerprint), 서명에 쓴 인증서·프로필과 만료일, submit 성공과 submission ID, production 채널 최신 EAS 빌드가 1.1.4 |
| 확인하지 못함 | Sentry 소스맵·dSYM 업로드, Apple 처리 완료와 업로드 메일 경고, TestFlight 설치, iPhone 덮어 설치·Apple 로그인·OTA, Android |
| Main의 지식(당일 재확인 없음) | 멤버십 만료 시 앱이 내려가고 제출이 막힘, 배포 인증서 만료가 스토어 앱에 영향 없음, 12월 말 Apple 심사 지연 |

## 남은 일

이 기록 시점의 남은 일은 [Ticket 04의 남은 일](../current/memory/tickets/04-new-architecture-and-1-2-0.md#남은-일)에 있다. 사용자 결정이 필요한 것은 1.2.0을 OTA 대상으로 만드는 방법과 push(`3ff9832c`를 포함한 main 4커밋과 `release/1.2`, main push는 Render 재배포)다. 사용자 기기·계정이 필요한 것은 Apple 처리·메일 확인, TestFlight 1.2.0의 iPhone 확인, App Store Connect의 버전·출시 노트 입력과 심사 제출이다. 멤버십 갱신(12-18까지)도 사용자가 한다. Main은 이 구간에서 사용자에게 업로드 결과를 아직 알리지 않았고, 기록을 맡긴 뒤 결과를 확인해 정리하겠다고 했다(9663행).
