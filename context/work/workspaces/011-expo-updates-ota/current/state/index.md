# 현재 상태와 다음 행동

2026-11-17 오후 2시 25분경, 두 번째 세션에서 Ticket 02의 발행 스크립트를 만들고 preview 발행으로 확인한 시점의 상태다.

**지금까지:** 2026-11-16 1.1.3(빌드 17)을 심사에 낸 뒤 expo-updates 도입을 논의해 이 Work를 만들었다([Spec](../memory/index.md)). 두 번째 세션은 처음에 "파악만" 했고, 그 과정에서 SDK 업그레이드를 [Work 012](../../../012-expo-sdk-upgrade/README.md)로 나눴다([파악·분리 기록](../../records/2026-11-16-02-scoping-check-and-sdk-split.md)). 그 뒤 사용자가 "일단 011 부터 하고 다되면 병합하자"로 착수를 지시해 [Ticket 01](../memory/tickets/01-expo-updates-and-ios15-build.md)을 실행했다. 경위와 근거는 [착수 기록](../../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)과 [실기기 확인 기록](../../records/2026-11-17-02-preview-build-and-device-ota-check.md)에 있다.

**Ticket 01에서 된 것:**
- **설치·설정(단계 1·3·4):** `expo-updates`·`expo-build-properties`를 넣고 dev-client를 SDK 51용 4.0.29로 내렸다. `app.config.js`에 fingerprint runtime, `updates.url`, `fallbackToCacheTimeout: 0`, iOS 15.0을, `eas.json`의 preview·production에 `channel`과 `environment`를 넣었다.
- **판단 지점 통과(단계 2):** 로컬 Xcode 26.5 Release 빌드에서 `expo-dev-menu` 5.0.23의 Swift 한 줄이 막았다. 이를 고치면 빌드되고 앱이 로그인 화면까지 뜬다. 막힘이 작아 012에 합치지 않았다. 사용자는 "됐으면 진행해 계속 012 는 다른데서 할거고"라고 답했다. 수정은 루트 `patches/`의 pnpm patch로 고정했고, 다시 설치한 뒤 같은 빌드로 확인했다. 012는 다른 세션에서 진행한다.
- **발행 방법(단계 5):** fingerprint가 환경값에 따라 달라지므로, 발행은 `eas update --channel <채널> --environment <같은 이름>`으로 한다. 사용자 허락을 받아 비어 있던 EAS preview 환경을 채웠다. 공통 변수는 production과 함께 쓰고, preview 전용으로 `APP_VARIANT=development`와 Sentry 환경값을 두었다. Sentry 소스맵 방식은 뒤에 정했다(아래).
- **preview 빌드와 실기기 확인(단계 6):** iPhone 14 Pro를 등록하고 preview 빌드를 만들었다. 첫 빌드는 runtime 불일치로 실패했다. 원인은 로컬 `node_modules`에 남은 예전 중첩 사본이었고, 깨끗이 다시 설치해 맞췄다. 두 번째 빌드 `f610d9b5…`(runtime `54a96787…`)으로 실기기에서 완료 판단 1–4를 사용자가 확인했다: 업데이트 받기, 오프라인 시작, 롤백, runtime 분리. 5는 preview 번들의 환경값만 확인했다. 이어서 Google client 수정 업데이트 `a86d1596…`를 발행했다(현재 최신 업데이트는 아래 Sentry 항목).
- **preview 앱 Google 로그인 수정(이 Work 밖의 서버 변경 포함):** 시험 앱의 "액세스 차단됨"은 preview가 운영용 Google iOS client를 공유한 탓이었다. 사용자 지시("그럼 다 진행하자…", "그냥 니가 env확인해서 처리해주라…")에 따라 다음 순서로 고쳤다.
  - EAS의 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`를 환경별로 나눴다.
  - 서버가 iOS client 목록을 받게 고쳐 main에 커밋했다(`99235878`). Render 배포가 Live가 됐다.
  - Render의 `GOOGLE_IOS_CLIENT_ID`를 운영·개발 두 값으로 바꿨다. 순서가 중요했다. 값을 먼저 바꾸면 옛 코드에서 운영 로그인이 깨진다.
  - 사용자가 운영 앱과 시험 앱 모두 로그인된다고 확인했다("둘 다 로그인 잘 돼").
  - 경위는 [Google 로그인 기록](../../records/2026-11-17-03-preview-google-login-fix.md)에 있다.

- **커밋:** 011 작업을 브랜치에 커밋했다. 아래 브랜치와 커밋 절에 있다.
- **Sentry 소스맵(단계 5·6):** 로컬 토큰 방식으로 정했다. 사용자 선택에 따라 `.env.development.local`의 토큰을 `apps/client/.env.production`(gitignore)에도 복사했다. 업로드 명령은 `eas update` 다음의 `expo-upload-sourcemaps.js dist`다. preview 시험 업데이트 `8c8eb6e9…`에서 낸 오류가 Sentry에서 `LoginScreen.tsx` 144:133으로 풀렸다. 시험 코드는 정리 업데이트 `f40c0676…`로 뺐고, 사용자가 "원래 문구로 돌아옴"을 확인했다. 그 뒤 발행 스크립트 시험으로 같은 내용의 `0a0a6db0…`를 냈다. 지금 preview 채널의 최신 업데이트는 이것이다(runtime `54a96787…`, 번들은 `f40c0676…`와 같다). 경위는 [소스맵 기록](../../records/2026-11-17-04-commit-and-ota-sourcemap.md)에 있다.

**Ticket 02에서 된 것:**
- **발행 스크립트:** `pnpm ota:publish <preview|production> --message "..."`를 만들었다(`apps/client/scripts/ota-publish.mjs`, 루트 `package.json`). 순서는 사전 점검 → 깨끗한 재설치 → EAS 환경값 대조 → runtime 대조 → `eas update` → 소스맵 업로드다. 막혀야 할 경우가 막히는 것과 실제 preview 발행(그룹 `0a0a6db0…`)을 확인했고, 별도 검증도 거쳤다.
- 실행 명령을 루트 `package.json`에 둔 이유가 있다. fingerprint가 `apps/client/package.json`의 scripts까지 해시에 넣기 때문이다. 그곳에 두자 runtime이 `6cfec56f…`로 바뀌었다. 경위는 [발행 스크립트 기록](../../records/2026-11-17-05-ota-publish-script.md)에 있다.

**다음 행동:** 남은 일은 아래와 같다. 1.1.4와 방지 장치 나머지 사이의 순서는 아직 정하지 않았다.
1. 1.1.4(빌드 18)를 production으로 빌드해 심사에 낸다. 인증서와 ad hoc 프로필이 2026-12-30에 만료되므로 그 전에 한다. production runtime은 다시 설치한 뒤 계산하지 않았다. 빌드 전에 깨끗한 설치 상태에서 다시 계산한다. `pnpm ota:publish production --dry-run`은 그 빌드가 생긴 뒤에 통과할 수 있다. 업로드 메일에 ITMS-90068이 다시 오지 않는지도 본다(완료 판단 7).
2. production 번들의 환경값과 소스맵을 확인한다(완료 판단 5의 남은 부분).
3. Ticket 02의 나머지를 정한다: 마지막 스토어 빌드 커밋과의 경로 diff 검사, 서버 계약 변경의 통과 방법, `@env` 이름과 EAS 변수 대조, 스크립트 밖의 `eas update`를 막는 hook.
4. Project 반영(Ticket 03)을 한다. 011이 끝나면 브랜치를 main에 병합한다.

[Spec 05](../memory/spec/05-constraints-design-assumptions.md)의 순서는 방지 장치를 1.1.4 스토어 빌드보다 앞에 둔다. Main이 앞서 밝힌 다음 행동은 OTA 확인 뒤 바로 1.1.4였다. 1.1.4 자체는 OTA 발행이 아니어서 장치 없이도 낼 수 있다. 다만 장치 전에 production 채널로 OTA를 발행하지 않는다는 조건이 필요한지 함께 정해야 한다.

**아직 하지 않은 것:**
- production 쪽 확인(완료 판단 5의 남은 부분), 1.1.4 출시
- 방지 장치(Ticket 02)의 나머지: 경로 diff 검사, 서버 계약 변경 처리, `@env` 대조, hook
- Project 반영(Ticket 03): 반영 위치부터 미정. 서버의 Google iOS client 목록 설정, scripts가 runtime을 바꾼다는 점, 발행 절차가 후보로 더해졌다.

**중요한 미확인:**
- 1.1.3 심사 결과: 2026-11-16 밤 App Store Connect에서 아직 "심사 대기 중"이었다. 거절되면 Work 008의 대응이 먼저다.
- preview 앱(`com.noline.dev`)의 Apple 로그인: 서버 `APPLE_CLIENT_ID`가 운영 번들이라 실패할 수 있다. 시도하지 않았고 이번 범위 밖이다. Google 로그인은 고쳤다(아래).
- Expo 무료 플랜의 업데이트 한도, iOS 13–14 사용자 수

**브랜치와 커밋:** 011 작업은 브랜치 `feat/011-expo-updates`에 커밋했다(2026-11-17). 이 브랜치는 012 분리 문서 커밋 `3895d44f` 위에 있고, 서버 수정이 든 main(`99235878`)을 병합한 뒤(`cad1ec8f`) 다음 커밋들을 올렸다. 브랜치는 아직 main에 병합하지 않았다(사용자 지시: 011이 끝나면 병합).
- `3592a538` feat(client): expo-updates·dev-client 정렬·dev-menu patch·iOS 15.0·eas.json channel/environment
- `ba06e62a` docs(context): 이 Work의 기록
- `bb459027` docs(context): 이 Work 문서의 커밋 상태 서술을 고침
- `ceb7a7b7` feat(client): 발행 스크립트 `pnpm ota:publish`
- `24a3938b` docs(context): 소스맵 확인과 발행 스크립트 기록

사용자 요청으로 Work 기록의 토큰·식별자 세부를 줄이면서, push 전이던 이 브랜치의 이력에서도 그 값을 지웠다(2026-11-17). 그래서 앞선 기록에 `233e0a17`·`212040c2`로 적힌 커밋은 지금 `ba06e62a`·`bb459027`이다. 최종 파일 내용은 고치기 전과 같다.

EAS 환경 변수 변경은 저장소 밖의 Expo 계정에 이미 반영돼 있다. Render의 `GOOGLE_IOS_CLIENT_ID` 변경도 운영 서버에 반영돼 있다. Expo에는 이번 시험으로 preview 채널·브랜치와 시험 업데이트 세 개(그룹 `9889e7f4…`, `4c567056…`, `dee2e1d6…`), Google client 수정 업데이트 `a86d1596…`, 소스맵 시험 업데이트 `8c8eb6e9…`, 정리 업데이트 `f40c0676…`, 발행 스크립트 시험 업데이트 `0a0a6db0…`가 생겼고, Apple에는 등록 기기 1대와 ad hoc 프로필이 생겼다. runtime `63918ede…`의 시험 업데이트도 preview 브랜치에 남아 있지만, 그 runtime의 빌드가 없어 받을 기기는 없다. 시험용 코드 변경은 모두 되돌렸고, `dist/`는 gitignore 대상이다.

**작업 트리 주의:** 다음 미커밋 수정은 이 Work와 무관하다. 011을 커밋할 때 함께 올리지 않는다.
- `context/personal/experience/*` 4개
- Work 006의 Ticket 14·state
- `.pnpm-store/`(추적하지 않는 폴더)

기본 Workspace와 host 세션 선택은 바꾸지 않았다.
