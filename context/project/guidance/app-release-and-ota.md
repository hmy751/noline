# 앱 변경을 사용자에게 내보낼 때의 기준: 스토어 빌드와 OTA

client 변경을 출시하거나, 출시 경로를 바꾸는 변경을 할 때 읽는다. 출시에는 스토어 빌드와 OTA 업데이트 두 경로가 있다. 출시 경로를 바꾸는 변경에는 기기 DB 구조, 공유 schema·API·동기화 계약, 번들에 들어가는 환경 변수, 네이티브 의존성·설정, `apps/client/package.json`의 scripts, 앱 버전이 있다. 지원·배포 대상은 iOS다.

**OTA로는 JS 번들만 바뀌는 변경을 낸다. 그 변경이 설치된 빌드의 네이티브 층, 기기 DB 구조, 현재 서버 계약과 그대로 맞아야 한다. OTA 발행은 `pnpm ota:publish`로만 한다.** 이 조건을 어기면 업데이트가 어떤 기기에도 가지 않거나, 되돌릴 수 없는 DB 변경이나 옛 서버와 어긋나는 요청이 몇 시간 안에 사용자에게 퍼진다.

| 하려는 일 | 먼저 확인할 관계 |
| --- | --- |
| JS 버그 수정을 빨리 내보낸다 | [OTA로 내도 되는 변경](#ota로-내도-되는-변경을-구별한다), [발행 절차](#ota는-발행-스크립트로만-낸다) |
| 기기 SQLite 구조를 바꾼다 | [DB 구조는 스토어 빌드로만](#ota로-내도-되는-변경을-구별한다), [저장·동기화 기준](data-lifecycle/INDEX.md) |
| schema·API·sync 요청 형식을 바꾼다 | [서버를 먼저 배포한다](#계약을-바꾸면-서버를-먼저-배포한다), [OTA 규칙](#ota로-내도-되는-변경을-구별한다) |
| 네이티브 의존성·`app.config.js`·환경 변수·scripts·버전을 바꾼다 | [runtime이 바뀌는 조건](#runtime이-같은-빌드에만-ota가-간다) |
| 이미 스토어에 낸 버전(지금은 1.1.x)에 수정을 낸다 | [release 브랜치](#이미-낸-버전의-수정은-release-브랜치에서-낸다) |
| 새 버전을 App Store에 낸다 | [스토어 빌드 절차](#스토어-빌드는-main에서-버전을-올려-낸다) |

## runtime이 같은 빌드에만 OTA가 간다

스토어 빌드는 네이티브 층과 JS 번들을 함께 바꾸며 Apple 심사를 거친다. OTA는 expo-updates로 JS 번들만 새로 내려보내고 심사를 거치지 않는다. 앱의 주요 목적을 바꾸지 않는 버그 수정과 UI 다듬기가 대상이다. 심사를 피해 큰 기능을 넣는 데 쓰지 않는다.

업데이트에는 runtime version이 붙고, 기기는 자기 빌드와 runtime이 같은 업데이트만 받는다. runtime은 [app.config.js](../../../apps/client/app.config.js)의 `fingerprint` 정책으로 계산한다. 네이티브 모듈(Mapbox·Sentry·SQLite)이 많아 사람이 버전 올리기를 잊어 맞지 않는 JS가 깔리는 위험을 없애려고 고른 방식이다. 계산에는 다음이 들어간다.

- 네이티브 의존성과 config plugin 소스, `patches/`
- `app.config.js`가 만드는 설정. 환경 변수로 달라지는 값(`APP_VARIANT`, Sentry plugin 유무, Mapbox·Google Maps 키)도 포함한다.
- `apps/client/package.json`의 scripts. 출시와 무관한 script라도 여기에 더하면 runtime이 바뀌어, 다음 스토어 빌드 전까지 기존 빌드로 가는 OTA가 runtime 대조에서 막힌다. 그래서 OTA 발행 명령처럼 앱 빌드와 무관한 명령은 루트 `package.json`에 둔다.
- **앱 버전과 iOS 빌드 번호.** 둘 중 하나만 바꿔도 runtime이 달라진다(2026-11-17 확인).

여기서 따라 나오는 운영 조건이 셋 있다.

- **스토어 빌드마다 runtime이 따로다.** OTA는 버전과 빌드 번호가 정확히 같은 빌드에만 간다. 발행 스크립트는 그 채널의 **최신 빌드와 같은 runtime**에만 발행한다. 그래서 1.1.5 빌드가 생긴 뒤에는 1.1.4 상태의 코드에서 발행해도 "예전 빌드와만 같다"며 거부한다. 지금은 이전 버전 사용자에게만 OTA를 보내는 경로가 없고, 그 사용자에게는 스토어 업데이트로 고친다. 이 경로가 필요해지면 발행 대상 빌드를 지정하도록 스크립트를 넓혀야 한다. 반대로 버전만 올리고 아직 빌드하지 않은 main에서 발행하면 받을 빌드가 없어 멈춘다.
- **발행은 깨끗한 설치와 빌드와 같은 EAS environment에서 한다.** lockfile이 같아도 예전 설치가 남긴 중첩 패키지 사본이 runtime을 바꾼다. 빌드와 다른 환경값으로 계산해도 runtime이 달라진다.
- **runtime이 어긋나면 오류 없이 아무 기기에도 가지 않는다.** 그래서 발행 스크립트는 발행 전후로 runtime을 대조한다.

OTA를 받는 첫 빌드는 1.1.4(빌드 18)다. 1.1.3 이하 사용자는 스토어 업데이트를 받기 전까지 OTA를 받지 않는다. 1.1.4부터 최소 iOS 버전은 15.0이다. 그래서 iOS 13–14 기기에는 1.1.4 이후 버전이 업데이트로 보이지 않는다.

## 앱 시작은 업데이트 확인을 기다리지 않는다

`updates.fallbackToCacheTimeout`은 0이다. 앱은 기기에 저장된 번들(빌드에 내장된 번들이나 이미 받아 둔 업데이트)로 바로 시작하고, 새 업데이트는 뒤에서 내려받아 다음 실행 때 적용한다. 네트워크가 없거나 나쁜 곳에서도 앱이 바로 열려야 한다는 [Selective Local-First](../common/product.md)의 약속 때문이다. 시작할 때 업데이트를 기다리게 바꾸면 이 약속이 깨지므로, 그 선택은 오프라인 시작 약속과 함께 다시 판단한다.

대가로 사용자가 수정을 보려면 보통 앱을 두 번 열어야 한다. 급한 수정을 바로 적용하는 앱 안 안내나 `Updates.reloadAsync()`는 아직 없다.

## OTA로 내도 되는 변경을 구별한다

발행 스크립트는 업데이트를 받을 빌드들의 커밋과 지금 작업 트리를 비교한다. 받을 빌드는 그 채널에서 최신 빌드와 runtime이 같은 모든 빌드다. 규칙의 실제 값은 [rules.mjs](../../../apps/client/scripts/ota/rules.mjs)가 소유한다. 규칙을 바꾸면 그 파일과 이 표를 함께 고친다.

| 변경 | OTA | 이유 | 발행 스크립트의 처리 |
| --- | --- | --- | --- |
| 화면·스타일·문구·JS 로직 수정 | 가능 | JS 번들 안에서 끝나고 기존 네이티브·DB·서버 계약을 그대로 쓴다 | 통과 |
| 기기 SQLite 구조: `apps/client/src/shared/db/`(트랜잭션 도우미 `utils.ts` 제외), 또는 바뀐 번들 소스 파일 내용에 든 `CREATE`·`ALTER TABLE`·`DROP`·`PRAGMA user_version` | 불가. 스토어 빌드로만 | 앱이 시작할 때 바로 적용된다. 업데이트를 롤백해도 이미 바뀐 기기 DB는 되돌아가지 않는다 | 거부. 넘길 플래그가 없다 |
| 서버와 맞춰야 하는 계약: `packages/schema/`, `shared/api/`, `shared/services/sync/`, `entities/*/api/`, 서버 요청 클라이언트(`authAxios`·`apiAxios`·`apiClient`)를 가져다 쓰는 파일 | 서버가 이미 새 계약을 받을 때만 | 앱이 먼저 바뀌면 옛 서버와 어긋난다 | `--server-checked`가 없으면 거부 |
| 네이티브 의존성·권한·아이콘·`app.config.js`의 네이티브 설정·최소 iOS 버전 | 불가 | 네이티브 층이 바뀐다 | runtime이 달라져 4단계에서 거부. 파일이 바뀌었으면 알린다 |
| 코드가 `@env`나 `process.env.EXPO_PUBLIC_*`로 읽는 값 | EAS environment에 그 이름이 있을 때만 | 번들을 만드는 순간 값이 박힌다. EAS에 없으면 발행한 컴퓨터의 `.env` 값이 들어간다 | 이름이 없으면 거부 |

**서버 계약 행은 [아래의 배포 순서](#계약을-바꾸면-서버를-먼저-배포한다)를 OTA에 적용한 것이다.** 스토어 빌드는 심사와 사용자 업데이트에 며칠이 걸리지만, OTA는 몇 시간 안에 기존 사용자에게 퍼진다. 그래서 발행 스크립트가 확인을 요구한다. `--server-checked`는 "서버를 먼저 배포했다" 또는 "이 변경은 서버 변경이 필요 없다"를 사람이 판단했다는 뜻이다. 스크립트는 서버 배포 여부를 직접 확인하지 않는다.

**기기 DB 구조 행은 출시 경로의 규칙이다.** Local 저장·전송·정리의 계약은 [저장·동기화 기준](data-lifecycle/INDEX.md)이 소유한다. 기기 migration을 어떻게 작성하고 실행하는지를 맡는 별도 본문은 아직 없다. 여기서는 그 변경이 언제나 스토어 빌드로 나간다는 점만 정한다.

규칙은 거부 쪽으로 틀리게 만들었다. 다음 경우는 거부한다.
- 받을 빌드의 커밋을 알 수 없거나 그 커밋이 로컬에 없다.
- SQL 문장이 든 파일은 다른 부분만 고쳐도 걸린다. 지금 그런 파일은 모두 `shared/db/` 아래라 경로 규칙과 함께 걸리지만, 그 밖의 파일이라도 주석·문자열에 SQL이 있으면 걸린다.
- 커밋하지 않은 변경과 함께 만든 빌드라면, 이미 빌드에 들어간 변경도 diff에 보여 거부된다.

잘못 막히면 스토어 빌드로 내거나 플래그 한 번으로 지나갈 수 있지만, 잘못 통과하면 기기 DB나 서버 계약을 되돌리기 어렵기 때문이다. 다시 볼 신호는 둘이다. DB와 무관한 수정이 자주 막히는 경우, `--server-checked`를 거의 매번 붙이게 되어 확인이 형식이 되는 경우다.

## 계약을 바꾸면 서버를 먼저 배포한다

앱이 보내는 요청이나 기대하는 응답이 바뀌면, 서버가 새 형식을 받게 된 뒤에 앱을 낸다. 필요하면 DB 구조를 먼저 적용한다. 이 순서는 스토어 빌드와 OTA 모두에 적용된다. 앱을 낸 뒤에도 옛 앱 사용자가 남으므로, 서버는 옛 형식과 새 형식을 함께 받아야 한다. 편집 표식을 도입할 때 이 순서를 따른 사례가 [API 계약](api-contracts.md#큐-작업-재전송에는-이미-반영된-결과로-응답한다)에 있다. 서버가 옛 요청을 어떻게 보류하고 기기가 어떻게 복구하는지는 [편집과 응답 반영](data-lifecycle/edit-reconciliation.md)에 있다.

서버는 main에 push하면 Render 대시보드의 Auto-Deploy 설정으로 배포된다. 저장소에는 배포 설정 파일이 없고, 배포 대상·명령·Node 버전의 결정은 [서버 안내의 배포 절](../../../apps/server/README.md#배포-전-확인)에 있다. 앱을 내기 전에 Render에서 그 커밋의 배포가 Live인지 확인한다. OTA라면 그 확인을 거친 뒤 `--server-checked`를 붙인다.

## OTA는 발행 스크립트로만 낸다

저장소 루트에서 실행한다.

```bash
pnpm ota:publish preview --message "무엇을 고쳤는지"
pnpm ota:publish production --message "..." --confirm-production
```

[publish.mjs](../../../apps/client/scripts/ota/publish.mjs)는 다음 순서로 진행한다. 비용이 큰 재설치 전에 변경 검사를 끝내 빨리 멈추게 했다.
1. 채널과 EAS environment의 짝, 코드 경로의 미커밋 변경, Sentry 토큰을 확인하고, 받을 빌드를 찾아 위 변경 규칙을 대조한다.
2. 깨끗이 다시 설치한다.
3. 빌드 프로필 env와 코드가 읽는 환경 변수 이름을 EAS environment와 대조한다. `eas update`는 `eas.json` 프로필의 env를 쓰지 않고 EAS environment의 값만 쓰기 때문이다.
4. 로컬 runtime을 최신 빌드와 대조한다.
5. 같은 이름의 channel·environment로 발행한 뒤, runtime을 다시 대조하고 Sentry 소스맵을 올린다.

`--dry-run`은 4단계까지만 한다. preview에서 먼저 내부 기기로 확인한 뒤 production에 낸다. preview 시험에는 지금 버전·빌드 번호와 같은 preview 빌드가 있어야 한다([preview 시험 앱](#스토어-빌드는-main에서-버전을-올려-낸다)).

- **Sentry 소스맵:** OTA 번들은 새로 만들어지므로 소스맵을 따로 올려야 오류 위치를 읽을 수 있다. EAS의 업로드 토큰은 SECRET이라 로컬에서 읽을 수 없다. 그래서 토큰을 로컬 `apps/client/.env.production`(gitignore)에 두고 올린다. 같은 토큰을 `.env.development.local`에도 두었다면 바꿀 때 두 곳을 함께 고친다. 설정은 [개발 시작의 Sentry 절](../../../START_GUIDE.md#sentry-오류-수집을-연결할-때)에 있다.
- **직접 실행 차단:** Claude·Codex가 `eas update`를 직접 실행하면 [공통 hook](../../../.agents/hooks/README.md)이 거부하고 이 스크립트로 안내한다. 사람이 자기 터미널에서 치는 명령은 막지 못한다. 보안 경계가 아니라 실수를 막는 장치다.
- **되돌리기:** 두 방법을 다 썼고(2026-11-17 preview), 상황에 맞게 고른다.
  - 정상 커밋으로 돌아간 코드에서 `pnpm ota:publish`로 새로 발행한다. `eas update:republish`는 발행 스크립트의 점검을 거치지 않으므로 쓰지 않는다.
  - `eas update:roll-back-to-embedded --channel <채널> --runtime-version <runtime>`으로 설치된 빌드에 들어 있는 번들로 돌린다.

  빌드에 들어 있는 번들 자체에 알려진 문제가 있으면 다시 발행하는 쪽을 쓴다. 예를 들어 preview 앱의 내장 번들은 Google client 설정이 틀려 있었다. 이때 롤백하면 그 문제가 되살아난다.

## 이미 낸 버전의 수정은 release 브랜치에서 낸다

main은 다음 버전을 만드는 곳이다. SDK·네이티브 의존성처럼 runtime을 바꾸는 변경이 main에 들어가면, 버전·빌드 번호가 그대로여도 main의 runtime은 스토어에 있는 빌드와 달라진다. 그러면 main에서는 그 빌드 사용자에게 OTA를 낼 수 없고, 발행 스크립트가 runtime 대조(4단계)에서 거부한다. 2026-11-19 SDK 54, 2026-11-20 New Architecture가 main에 들어가 지금이 그 상태다([Work 012](../../work/workspaces/012-expo-sdk-upgrade/README.md)).

그래서 스토어에 낸 버전마다 그 빌드를 만든 커밋에서 `release/<주.부 버전>` 브랜치를 만든다. 지금은 1.1.4(빌드 18)의 커밋 `d160c7b5`에서 만든 `release/1.1`이 있다. 1.2.0을 낼 때 `release/1.2`를 만든다.

- **1.1.x 사용자에게 보낼 OTA는 `release/1.1`에서 발행한다.** 깨끗한 설치 조건 때문에 main 작업 트리와 분리된 worktree에서 한다. 그 브랜치의 `.nvmrc`에 맞는 Node(1.1에서는 20.18.1)로 설치하고, gitignore 대상인 `apps/client`의 env 파일(`.env.development`, `.env.development.local`, `.env.production`)을 복사해 둔다. 2026-11-18 이 방식으로 `pnpm ota:publish production --dry-run`이 1.1.4 빌드와 runtime 일치를 통과했다.
- **release 브랜치의 OTA는 다음 버전 빌드가 채널에 생기기 전까지만 쓸 수 있다.** 발행 스크립트는 채널의 최신 빌드를 기준으로 삼으므로, production 채널에 1.2.0 빌드가 생기면 `release/1.1`에서의 발행도 거부된다. 그 뒤 1.1.x 사용자는 [위의 운영 조건](#runtime이-같은-빌드에만-ota가-간다)대로 스토어 업데이트로 고치고, 1.2.x 사용자의 수정은 `release/1.2`에서 OTA로 낸다.
- **로컬 빌드(`eas build --local`)는 채널의 빌드로 잡히지 않는다.** EAS 빌드 목록에 남지 않기 때문이다. 2026-11-20 1.2.0(빌드 19)을 로컬로 만들어 App Store Connect에 올린 뒤에도 production 채널의 최신 빌드는 1.1.4(`7033c2ba`)였다. 그래서 지금 발행 스크립트는 1.2.0을 OTA 대상으로 보지 않는다. main이나 `release/1.2`에서 1.2.0으로 발행하면 runtime 대조에서 거부된다. 1.2.0을 OTA 대상으로 만드는 방법은 아직 정하지 않았다([Work 012](../../work/workspaces/012-expo-sdk-upgrade/README.md)).
- **preview 채널도 최신 빌드 하나만 기준이다.** 지금 preview 채널의 최신 빌드는 main에서 만든 SDK 54 빌드라 `release/1.1`의 preview OTA는 거부된다. release 브랜치의 수정을 preview로 먼저 시험하려면 그 브랜치에서 preview 빌드를 다시 만들어야 하고, 그러면 main 쪽 preview 시험이 다시 막힌다.

release 브랜치에서 고친 내용을 main에 옮기는 방법은 아직 정하지 않았다.

## 스토어 빌드는 main에서 버전을 올려 낸다

1. main에서 `apps/client/app.config.js`의 `version`과 `ios.buildNumber`만 올린 커밋을 만들고 push한다. main push는 [Render](../../../apps/server/README.md#배포-전-확인)의 자동 배포 대상이다. 서버 코드가 그대로면 같은 서버가 다시 배포된다.
2. 깨끗이 설치하고(`node_modules` 삭제 뒤 `pnpm install --frozen-lockfile`) production runtime을 계산해 둔다. `apps/client`에서 `EXPO_NO_DOTENV=1 eas env:exec production 'npx expo-updates runtimeversion:resolve --platform ios' --non-interactive`로 계산하며, 빌드 결과의 runtime과 같아야 한다.
3. `eas build --platform ios --profile production`으로 빌드한다. 빌드 이미지는 `eas.json`에 고정돼 있다. 배포 인증서와 프로필은 EAS가 관리한다. 2026-11-17 빌드 때 EAS는 만료일을 2026-12-30으로 보고했으니, 그 뒤 빌드는 먼저 갱신해야 한다.
   - EAS 월간 빌드 횟수가 모자라면 `--local`로 이 Mac에서 빌드할 수 있다. 이 경우 fastlane이 필요하다. 또 EAS는 Secret 값을 로컬에 넘기지 않으므로, 소스맵을 올리려면 `SENTRY_AUTH_TOKEN`을 `.env.production`에서 꺼내 export한 채로 실행한다. 로컬 빌드는 위의 release 브랜치 절대로 채널의 빌드로 잡히지 않는다. 2026-11-20 1.2.0 빌드에서는 토큰을 넘겼지만, 소스맵이 실제로 Sentry에 올라갔는지는 확인하지 못했다. 로컬로 빌드하면 `--id` 대신 `--path <ipa>`로 4단계 제출을 한다.
4. `eas submit --platform ios --profile production --id <빌드 ID>`로 App Store Connect에 올린다. 처리 완료 메일 외에 경고 메일이 오는지 본다. 1.1.3 업로드 때는 iOS 최소 버전 관련 경고(ITMS-90068)가 왔다.
5. App Store Connect에서 버전을 만들고 빌드를 연결한 뒤 심사에 제출한다. 출시는 심사 통과 뒤 자동 공개로 둔다.
   - "이 버전에서 업그레이드된 사항" 칸에는 이전 버전의 안내가 미리 채워져 있으니 바꿔 쓴다.
   - 설명·키워드·지원 URL이 비어 있으면 제출이 거절된다. 1.1.2 때 실제로 거절됐다.
   - 안내 문구는 사용자가 체감하는 변화만 쓴다. 최소 iOS 버전은 스토어가 호환성 항목에 따로 표시한다.

**preview 채널과 시험 앱:**
- preview 프로필은 개발용 번들 ID(`com.noline.dev`, `APP_VARIANT=development`)의 내부 배포 앱을 만든다. 등록된 기기에만 설치된다.
- 스토어 버전을 올리거나 runtime을 바꾸는 변경이 들어가면 기존 preview 빌드는 main과 runtime이 달라진다. 그 뒤 preview로 OTA를 시험하려면 `eas build --platform ios --profile preview`로 preview 빌드를 새로 만든다. 2026-11-20 현재 preview 채널의 최신 빌드는 SDK 54(New Architecture 전) 빌드 `f8e97f99`라, New Architecture가 들어간 main도 preview 시험 전에 새 빌드가 필요하다. `eas build --local`로 만든 빌드는 채널의 최신 빌드로 잡히지 않는다(production에서 2026-11-20 확인).
- preview 앱은 개발용 Google iOS client를 쓴다. 그래서 서버의 `GOOGLE_IOS_CLIENT_ID`는 운영·개발 client를 쉼표 목록으로 함께 받는다([서버 안내](../../../apps/server/README.md)). preview 앱의 Apple 로그인은 서버 설정이 운영 번들 기준이라 실패할 수 있고, 확인하지 않았다.

## 현재 범위와 다시 확인할 것

- **production OTA:** 아직 한 번도 발행하지 않았다. 발행 스크립트는 스토어 공개가 아니라 EAS의 완료된 빌드를 기준으로 삼는다. 1.1.4 대상 dry-run은 `release/1.1`에서 통과했고(2026-11-18), main에서는 runtime이 달라 거부된다. 실제로 받을 사용자는 1.1.4가 App Store에 공개된 뒤 생긴다. production 번들의 환경값과 소스맵도 그때 처음 확인한다. preview에서는 업데이트 받기, 오프라인 시작, 롤백, runtime 분리, 소스맵 풀림을 실기기로 확인했다.
- **이전 버전 대상 OTA:** 위와 같이 지금 발행 스크립트로는 최신 빌드보다 오래된 버전에만 보낼 수 없다. 필요해지면 대상 빌드 지정 기능을 검토한다.
- **Codex의 hook 처리:** hook의 거부를 Codex가 실제로 처리하는지는 확인하지 않았다. Claude Code에서는 실제로 막았다.
- **Expo 무료 플랜:** 업데이트 사용자 한도는 확인하지 않았다.
- **SDK 업그레이드([Work 012](../../work/workspaces/012-expo-sdk-upgrade/README.md)):**
  - main은 SDK 54·New Architecture이고, 2026-11-20 버전을 1.2.0(빌드 20)으로 올려 로컬 빌드로 App Store Connect에 올렸다. runtime은 스토어의 1.1.4 빌드와 다르다(위 [release 브랜치](#이미-낸-버전의-수정은-release-브랜치에서-낸다)). 같은 코드에서 빌드 번호만 19에서 20으로 올렸을 때도 runtime이 바뀌었다. 위 "앱 버전과 iOS 빌드 번호" 항목이 SDK 54에서도 그대로라는 확인이다.
  - SDK 51에서 `eas fingerprint:compare`가 "SDK 52 이상만" 오류로 막혔던 제한은 SDK 54로 풀렸을 것으로 본다. 실제로 써 보지는 않았다.
  - SDK 54에서 runtime 계산 요소와 발행 스크립트의 대조가 그대로 맞는지는 아직 dry-run으로 확인하지 않았다. 1.2.0 첫 빌드와 발행에서 확인한다. SDK 58은 fingerprint 기본 방식이 `balanced`로 바뀌므로 그때 다시 확인한다.
  - Apple은 2027년 4월부터 iOS 27 SDK로 빌드한 앱만 받는다. 그 뒤로는 SDK 51로 새 스토어 빌드를 내기 어렵다. 이미 설치된 앱과 OTA 전달은 계속된다.

이 기준을 정한 경위와 확인 기록은 [Work 011](../../work/workspaces/011-expo-updates-ota/README.md)의 records에 있다. 변경 규칙을 그대로 쓰기로 한 판단은 [규칙 유지 기록](../../work/workspaces/011-expo-updates-ota/records/2026-11-17-09-keep-rules-and-link-project.md)에, runtime에 버전이 들어간다는 확인은 [1.1.4 제출 기록](../../work/workspaces/011-expo-updates-ota/records/2026-11-17-10-release-1-1-4-submission.md)에 있다.
