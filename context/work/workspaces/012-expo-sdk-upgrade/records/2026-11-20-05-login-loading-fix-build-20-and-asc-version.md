# 2026-11-20 — TestFlight 빌드 19 확인, Apple 로그인 로딩 수정과 빌드 20, 1.2.0 심사 제출

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 이번 구간은 사용자의 "로그인 잘 되고 문제 없어보여 기록할거 하고 제출 해줘"(9744행)부터 Main이 빌드 20 업로드 뒤 이 기록을 처음 맡긴 지점(10119–10120행)까지이고, 후속 호출로 Main이 빌드 20을 연결해 심사에 제출하고 다시 기록을 맡긴 지점(10387행)까지 더했다. 앞선 맥락으로 직전 기록 범위 뒤에 있던 Main의 업로드 결과 보고(9732행)도 읽었다. 그 사이 Main의 Project 출시 기준 수정(10139–10140행)은 Main이 맡은 일이라 결과만 적는다.

## 사용자가 빌드 19로 본 것과 요청

직전에 Main은 빌드 19 업로드 결과를 보고하면서 사용자에게 할 일을 넷 적었다(9732행). Apple 처리·경고 메일 확인, iPhone에서 TestFlight로 1.1.4 위에 덮어 설치해 Apple 로그인과 데이터 보존 보기, 문제가 없으면 App Store Connect에서 1.2.0 버전을 만들고 출시 노트를 바꿔 심사에 제출, 12-18까지 멤버십 갱신이다. 같은 메시지에서 1.2.0 OTA 방법 두 가지(12-01 뒤 EAS 클라우드로 다시 빌드하되 "빌드 번호 20으로 한 번 더 올려야" 함, 스크립트에 대상 runtime 지정 옵션 추가)를 처음 사용자에게 제시했고, 기록 커밋과 push 여부를 물었다.

사용자는 이렇게 답했다(9744행).

> 로그인 잘 되고 문제 없어보여 기록할거 하고 제출 해줘
> 근데 하나 잡아줘 애플로그인 하는데 로딩이 구글 버튼에 잡혀

이 답에서 확인되는 것은 TestFlight 빌드 19에서 로그인이 됐고(Apple 로그인을 실제로 했다는 것이 로딩 관찰에서 드러난다) 사용자가 문제를 보지 못했다는 것, 그리고 기록과 심사 제출을 맡긴다는 것이다. 1.1.4 위 덮어 설치였는지, 데이터·오프라인 지도·미전송 변경 보존을 따로 봤는지, 경고 메일을 봤는지는 원문에 없다. OTA 방법과 push 질문에는 답하지 않았다.

## Apple 로그인 중 로딩이 Google 버튼에 뜨던 원인과 수정

**원인(9756–9772행, Main이 코드를 읽음).** `apps/client/src/screens/LoginScreen.tsx`가 Google 로그인, Apple 로그인, 로그아웃(데이터 지우고 로그아웃)에 `isLoading` 하나를 같이 썼고, Google 버튼은 `isLoading`이 켜지면 아이콘·문구 대신 스피너를 그렸다. 그래서 Apple 로그인 중에도 Google 버튼에 스피너가 떴다. 1.1.4 커밋 `d160c7b5`의 같은 파일 190행에도 같은 `{isLoading ? (`가 있어, New Architecture 전환이 만든 문제가 아니라 1.1.4부터 있던 버그다.

**수정 `378287a6`**("fix(client): Apple 로그인 중 로딩이 Google 버튼에 표시되던 문제를 고친다", 2 files).
- 진행 중인 동작을 `pendingAction: 'google' | 'apple' | 'logout' | null`로 따로 들고, `isLoading`은 `pendingAction !== null`로 계산한다. 버튼 비활성화 조건은 그대로 `isLoading`을 쓴다.
- Google 버튼의 스피너는 `pendingAction === 'google'`일 때만 그리고, `accessibilityLabel` "Google 로그인 진행 중"을 붙였다.
- Apple 버튼은 iOS가 그리는 네이티브 버튼(`AppleAuthenticationButton`)이라 안에 스피너를 넣을 수 없다. 그래서 `pendingAction === 'apple'`일 때 버튼 위에 검은 바탕(`absolute inset-0 bg-black`)과 흰 스피너("Apple 로그인 진행 중")를 덮었다.
- 이 오버레이가 실기기에서 어떻게 보이는지는 Main이 보지 않았다. 빌드 20 TestFlight에서 사용자가 보는 것으로 남았다(아래).

**검사(9798–9841행).**
- 새 테스트 `apps/client/tests/screens/login-loading.test.tsx`(2개): Apple 로그인 중에는 Apple 쪽 표시만 있고 Google 스피너가 없으며 "Google로 계속하기"가 그대로인지, Google 로그인 중에는 Google 스피너만 있는지 본다. 수정 전 `LoginScreen.tsx`로 되돌려 돌리면 2개 모두 실패했고(9814행), 수정 코드에서 통과한다.
- 처음 `pnpm client lint`가 12 errors였다. 늘어난 하나는 `LoginScreen.tsx`의 prettier 형식 오류라 prettier로 고친 뒤 11 errors / 254 warnings(기준선과 같음)가 됐다. 파일 두 개만 `npx eslint`로 돌린 시도는 eslint 내부 오류로 끝나 결과로 쓰지 않았다.
- client typecheck 4 errors, 모두 기존 ui 경로 TS6059·TS6307이다(prettier 수정 전에 실행).
- prettier 수정 뒤 전체 Jest 81 suites / 930 tests 통과.

## 수정을 빌드 20으로 심사에 넣은 판단

Main은 수정 뒤 바로 `app.config.js`의 `ios.buildNumber`를 19→20으로 올려 `92c1766c`("chore(client): 1.2.0 빌드 20 배포 준비")로 커밋하고, 로컬 `release/1.2`를 `92c1766c`로 옮긴 뒤(`git branch -f`) 로컬 production 빌드를 시작했다(9846–9859행). 사용자에게는 이렇게 설명했다(9894행).

> 1.2.0에는 아직 OTA를 보낼 수 없어서, 이 수정을 나중에 OTA로 보낼 수 없습니다. 그래서 수정을 넣은 빌드로 심사에 내는 편이 낫다고 판단했습니다.

즉 로컬 빌드가 EAS 빌드 목록에 남지 않아 1.2.0이 OTA 대상이 아니라는 직전 발견([1.2.0 빌드·업로드 기록](2026-11-20-04-release-1-2-0-local-build-and-upload.md#새로-드러난-것-로컬-빌드는-ota-발행-기준이-되지-않는다)) 때문에, 출시 뒤 OTA로 고치는 대신 수정을 스토어 빌드에 넣었다. 이 선택은 Main 판단이며 사용자가 따로 고르지 않았다. 사용자의 "잡아줘"와 "제출 해줘"를 함께 받은 것이다.

받아들인 비용은 사용자가 확인한 빌드(19)와 심사에 낼 빌드(20)가 다르다는 점이다. Main은 같은 메시지에서 "바뀐 것은 로그인 화면뿐"이라 빌드 19의 확인을 이어받는다고 하고, "빌드 20이 TestFlight에 올라오면 Apple 로그인 화면만 한 번 더 봐 주시면 좋겠습니다"라고 요청했다. 동시에 App Store Connect에 로그인되면 "버전을 만들고 빌드 20을 연결해 제출까지 하겠습니다"라고 해, 사용자의 빌드 20 확인을 제출의 선행 조건으로 두지는 않았다. 코드 차이가 로그인 화면뿐이라는 점은 `3ff9832c..92c1766c`가 `LoginScreen.tsx`·새 테스트·`buildNumber` 한 줄이라는 것과 맞는다.

같은 메시지의 "runtime도 같습니다"는 틀렸다. 아래처럼 빌드 번호만 바꿔도 runtime이 바뀐다. Main은 제출 결과를 보고하면서 이 말이 틀렸고 빌드 19와 20의 runtime이 다르다고 사용자에게 정정해 알리기로 했다(Main이 기록 담당자에게 전달, 이 기록 시점의 원문에는 그 보고 메시지가 아직 없다).

## 빌드 20과 업로드

**출시 노트 확인.** Main은 출시 노트를 앱스토어에 공개되는 문구라 먼저 확인받겠다며 두 줄을 제안했고(9894행), 사용자가 "그 문구로"라고 답했다(9906행).

> - 앱의 기반 기술을 최신 버전으로 업데이트했어요.
> - Apple로 로그인할 때 로딩 표시가 Google 버튼에 잘못 나오던 문제를 고쳤어요.

**로컬 production 빌드.** 빌드 19와 같은 방법(`apps/client/.env.production`의 `SENTRY_AUTH_TOKEN` export, `eas build --platform ios --profile production --local --non-interactive --output ./dist/noline-1.2.0-20.ipa`)으로 만들었고 "Build successful"로 끝났다(10018행). Sentry 업로드 여부는 이번에도 보지 않았다.

**ipa 확인(10025–10045행, Main이 직접 풀어 봄).**

| 항목 | 값 |
| --- | --- |
| `CFBundleIdentifier` | `com.ham.noline` |
| 버전(빌드) | 1.2.0 (20) |
| `RCTNewArchEnabled` | true |
| `EXUpdates.bundle/fingerprint` | `c4fc18bb87be563ecadc87afde5936b605ab266d` |
| 수정 포함 | Hermes 번들(`main.jsbundle`)에 "Apple 로그인 진행 중"·"Google 로그인 진행 중"이 UTF-16으로 들어 있다. 빌드 19 번들에는 없다. |

처음 `grep`·`strings`로 찾았을 때는 0건이었다. Hermes 번들의 문자열이 UTF-16이라 바이트 검색으로 다시 찾아 확인했다.

**업로드(10050–10115행).** `eas submit --platform ios --profile production --path ./dist/noline-1.2.0-20.ipa --non-interactive`가 성공했다. submission `bc7c857f-af61-4f23-b4fd-09a66e095a60`, "Your binary has been successfully uploaded to App Store Connect!"였다.

## 새로 드러난 것: 빌드 번호도 runtime에 들어간다

ipa의 fingerprint가 빌드 19(`167224c6…`)와 달라, Main이 빌드 20 커밋에서 `EXPO_NO_DOTENV=1 eas env:exec production 'npx expo-updates runtimeversion:resolve --platform ios'`를 다시 돌려 빌드 19 때 저장한 결과와 fingerprint source를 하나씩 비교했다(10032–10040행). 다시 계산한 값은 `c4fc18bb…`로 ipa와 같았고, 다른 source는 `expoConfig` 하나였다. 두 커밋 사이에 앱 설정에서 바뀐 것은 `ios.buildNumber`뿐이므로, 빌드 번호가 `app.config.js`가 만드는 설정을 통해 runtime에 들어간다는 뜻이다. `LoginScreen.tsx` 같은 JS 변경은 runtime에 들어가지 않는다.

Project [출시 기준](../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)은 이미 "앱 버전과 iOS 빌드 번호. 둘 중 하나만 바꿔도 runtime이 달라진다(2026-11-17 확인)"라고 적고 있었다. 이번 비교는 그 내용이 SDK 54·New Architecture에서도 그대로라는 확인이고, 위 "runtime도 같습니다"가 이 기준과 어긋났다는 뜻이기도 하다.

이 확인에서 따라 나오는 것은 다음과 같다(앞의 둘은 위 비교의 직접 결과, 뒤의 둘은 기록 담당자 추론이며 확인하지 않았다).
- 빌드 19(TestFlight에만 있음)와 빌드 20은 runtime이 다르다. 1.2.0 사용자가 받을 빌드 20의 runtime은 `c4fc18bb…`다.
- 1.2.x에서 빌드 번호를 올린 스토어 빌드를 낼 때마다 runtime이 새로 생긴다.
- 9732행에서 Main이 제시한 "12-01 뒤 EAS 클라우드로 다시 빌드"는 빌드 번호를 올린 새 빌드를 전제로 했다. 그 빌드의 runtime은 사용자가 설치한 빌드 20과 다르므로, 그 빌드를 다시 스토어에 내지 않는 한 빌드 20 사용자를 OTA 대상으로 만들지 못한다. 같은 커밋에서 빌드 번호 20 그대로 EAS 클라우드 빌드를 만들면(제출은 하지 않음) 채널 최신 빌드의 runtime이 `c4fc18bb…`가 될 수는 있지만, 시도하지 않았다.
- 스크립트에 대상 runtime을 지정하는 방법이라면 지정할 값은 `c4fc18bb…`다.

## App Store Connect에서 1.2.0 버전 준비와 심사 제출

사용자가 앱 안 브라우저에서 로그인한 뒤(9894행에서 Main이 로그인을 요청, 10:01 무렵 로그인된 화면 확인) Main이 진행했다(9910–10101행).
- **버전 생성:** iOS 앱 버전 메뉴의 추가 버튼으로 "새 버전" 창을 열어 1.2.0을 만들었다. 상태는 "제출 준비 중"이다.
- **출시 노트:** "이 버전에서 업그레이드된 사항"에 위 두 줄을 넣고 저장했다.
- **이어받은 값:** 설명·키워드·저작권 칸은 글자 수 표시로 볼 때 채워져 있었다. 지원 URL도 이어받았다고 Main이 보고했다(페이지 텍스트에는 값이 나오지 않아 기록 담당자가 직접 확인하지는 못함).
- **출시 설정(기존 값 그대로, 바꾸지 않음):** 자동으로 버전 출시(심사 통과 뒤 자동 공개), 모든 사용자에게 즉시 업데이트 출시(7일 점진적 출시는 끔), 기존 평가 유지. 앱 심사 정보의 "로그인 필요"는 체크돼 있지 않다. 점진적 출시를 쓸지는 대화에서 다루지 않았다.
- **보인 안내(손대지 않음):** 연령 등급 응답 업데이트(위치 공유 및 데이팅, 2027-01-15까지), 중국 본토 배포용 보안 평가와 AIGC 서비스 신고(기존 앱은 2027-01-31까지).
- **빌드 연결과 제출(10187–10387행):** 처음 빌드 고르는 창을 열었을 때는 빌드 19만 고를 수 있었다(10181행). Apple 처리가 끝난 뒤 Main이 "빌드 추가"에서 빌드 20을 골라 1.2.0 버전에 연결하고 저장했다. "심사에 추가"를 누르자 "제출 초안" 창에 "iOS 앱 1.2.0, 1.2.0 (20)" 한 항목이 떴고, Main은 "심사를 위해 제출"을 눌렀다(10347행, 사용자의 "제출 해줘"에 따른 것). 버전 페이지에는 "이 앱 버전이 심사에 추가되었습니다"가 나왔고, 앱 심사 페이지의 제출 목록 맨 위가 "오늘 오후 7:13 · iOS 1.2.0 · 1개의 항목 · 심사 대기 중"(2026-11-20)이다. 출시 설정은 위 값 그대로 바꾸지 않았다. 빌드 20의 경고 메일은 보지 않았다.

## 커밋·브랜치 상태

`378287a6`·`92c1766c`가 main에 더해져 main은 origin보다 6커밋 앞선다(`a44f1993`·`69bfa8eb`·`7e0f0d99`·`3ff9832c`·`378287a6`·`92c1766c`). 로컬 `release/1.2`는 이제 빌드 20을 만든 `92c1766c`를 가리킨다(이전에는 `3ff9832c`). 둘 다 push하지 않았다. 직전 기록 이후의 Work 기록 수정은 아직 커밋되지 않았고, Main은 제출이 끝난 뒤 기록과 커밋을 한꺼번에 하겠다고 했다(9894행). 제출 뒤에는 012 기록과 출시 기준만 골라 커밋하겠다고 했다(10394행).

Main은 같은 날 Project [출시 기준](../../../../project/guidance/app-release-and-ota.md)도 고쳤다(작업 트리, 미커밋). SDK 업그레이드 항목에 main이 1.2.0(빌드 20)으로 올라 로컬 빌드로 App Store Connect에 올렸다는 것과, 빌드 번호만 19→20으로 올려도 runtime이 바뀌어 "앱 버전과 iOS 빌드 번호" 항목이 SDK 54에서도 그대로라는 확인을 넣었다. 로컬 빌드 안내에는 4단계 제출을 `--id` 대신 `--path <ipa>`로 한다는 것을 더했다.

## 확인한 것과 남은 것

| 구분 | 내용 |
| --- | --- |
| 사용자가 확인 | TestFlight 빌드 19에서 로그인(Apple 포함), 문제 못 봄. 출시 노트 문구 승인 |
| Main이 직접 확인 | 버그 원인과 1.1.4에도 있었다는 것, 새 테스트가 수정 전 실패·수정 후 통과, Jest·lint·typecheck, ipa 내용과 번들의 수정 문자열, runtime 재계산과 source 비교(`expoConfig`만 다름), submit 성공, ASC 1.2.0 버전 생성·출시 노트 저장과 출시 설정 값, 빌드 20 연결과 제출 뒤 앱 심사 페이지의 "심사 대기 중" |
| 확인하지 못함 | Apple 버튼 로딩 오버레이의 실기기 모습, 빌드 20의 업로드 경고 메일, 빌드 20 TestFlight 확인, 빌드 19 확인의 범위(덮어 설치·데이터·지도·미전송 변경), Sentry 업로드 |
| 완료 | 빌드 20을 1.2.0 버전에 연결하고 심사에 제출(2026-11-20 오후 7:13, 심사 대기 중) |
| 대기 중 | Apple 심사 결과. 통과하면 자동 출시 설정이라 모든 사용자에게 바로 나간다 |
| 사용자 결정 미응답 | 1.2.0을 OTA 대상으로 만드는 방법, 기록 커밋과 main·`release/1.2` push |

현재 남은 일은 [Ticket 04의 남은 일](../current/memory/tickets/04-new-architecture-and-1-2-0.md#남은-일)에 있다.
