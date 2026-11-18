# 01 — 준비: 검사 기준선, 실기기 점검표, `release/1.1`, Node 24

**상태:** 진행 중 (2026-11-18 시작). 기준선, `release/1.1`(원격, 빌드·OTA 확인), Node 24 설정 변경과 Railway 설정 삭제(`7413b343`, main 병합·push 완료), Render의 Node 24 운영 배포와 운영 앱 확인, 설치 절차 확정까지 했다. 남은 일은 실기기 점검표와 1.1.4 심사 결과 확인이다. 결과는 아래 [현재 상태와 실제 결과](#현재-상태와-실제-결과)에 있다. 일정은 11월(02와 같은 달)이다.

## 맡은 결과와 범위

업그레이드를 시작하기 전에 "깨졌는지 알아챌 수 있고, 깨져도 1.1.x 사용자를 지킬 수 있는" 상태를 만든다. 그리고 SDK와 무관한 Node 전환을 먼저 끝낸다. 이 Ticket이 끝나면 다음이 달라진다.

1. **비교 기준이 생긴다.** 지금(SDK 51, 1.1.4) 검사 결과와 실기기 동작이 기록돼, 이후 단계에서 실패가 업그레이드 때문인지 원래 있던 것인지 가를 수 있다.
2. **매 단계 같은 실기기 확인을 할 수 있다.** 점검표가 정해지고 1.1.4에서 한 번 실행한 결과가 있다.
3. **핫픽스 경로가 분리된다.** `release/1.1`에서 1.1.x 핫픽스 빌드와 OTA를 낼 수 있음을 확인했으므로, main은 업그레이드에 쓸 수 있다. `release/1.1`은 1.2.0이 출시되기 전까지 쓰는 브랜치다.
4. **서버와 로컬이 지원 중인 Node 24로 돈다.** 운영 서버가 Node 24로 배포돼 앱의 API·동기화가 동작한다. 로컬에서 Node 24로 바꿔도 pnpm 9.6.0과 eas-cli를 그대로 쓸 수 있다.
5. **Expo가 고른 버전으로 패키지를 넣는 절차가 정해진다.** `npx expo install`이 이 저장소에서 동작하거나, 같은 버전을 넣는 대체 절차가 확정돼 03부터 공통 규칙 3을 지킬 수 있다.

Spec과의 연결: [완료 판단](../spec/04-quality-and-completion.md)의 8(기존 검사 기준선), 10(Node 정합 중 서버·로컬 부분)을 맡는다. 오프라인 약속(4)의 점검표를 만든다. EAS 빌드의 Node(`eas.json` `base.node`)는 SDK 51 핫픽스 빌드를 지키려고 **03에서** 바꾼다. 서버 라이브러리(Express 5, drizzle 최신, zod 4)와 PostgreSQL은 012 범위 밖이다([범위](../spec/01-problem-goal-scope.md)).

출시: 서버 배포만 한다. 앱 스토어 심사는 없다.

## 실행 맥락과 접근

**선행:** 없음. 1.1.4(빌드 18) 심사 결과는 01을 막지 않지만, `release/1.1`의 기준 커밋을 정할 때 확인한다.

**순서: `release/1.1`을 가장 먼저 만든다.** 1.1.4에 OTA를 보내거나 반려 뒤 다시 제출하려면 1.1.4와 같은 상태의 코드가 필요하다. 그래서 `release/1.1`을 만들기 전에는 012의 어떤 변경도 main에 병합하지 않는다. 이미 제출·승인된 스토어 빌드는 업로드한 바이너리라 브랜치나 worktree 분리의 영향을 받지 않는다. 버전과 빌드 번호는 `app.config.js`에서 브랜치마다 따로 올리며, `release/1.1`은 1.1.x, main은 1.2.0으로 구분한다(Main 판단, 2026-11-18).

**1. 검사 기준선.** 각 경로 가이드의 명령을 그대로 실행하고 통과·실패 수와 실패 이름을 남긴다. 실패가 있어도 지금 고치지 않고 기준선으로 기록한다.
- client: `pnpm client lint`, `pnpm --filter @apps/client run test --runInBand`, `pnpm client test:typecheck`. 경로 가이드의 `pnpm client test --runInBand`는 pnpm 9.6.0에서 `Unknown option: 'runInBand'`로 실패한다(2026-11-18 확인).
- server: `pnpm run server typecheck`, `pnpm run server build`, `pnpm run server test`, `pnpm run server test:integration`(docker의 postgres 필요)
- schema: `pnpm schema build`(test·typecheck script는 없다)
- ui: `pnpm --filter @repo/ui lint`(이 패키지에는 lint만 있다)
- 함께 남길 것: `expo install --check`의 현재 출력(SDK 51 기준 어긋남 목록). 03 이후의 `--check`와 비교한다.

**2. 실기기 점검표.** 매 단계 같은 항목을 같은 순서로 본다. 확정 구성의 공통 규칙에서 정한 항목이다.

| 항목 | 확인할 것 |
| --- | --- |
| 오프라인 시작 | 비행기 모드에서 앱이 바로 열린다 |
| 활성 여행 조회·변경 | 비행기 모드에서 활성 여행의 일정·경비를 보고, 하나를 추가·수정한다 |
| 동기화 | 네트워크를 켜면 위에서 바꾼 것이 서버에 반영된다 |
| 로그인 | Google·Apple 로그인과 로그인 유지 |
| 오프라인 지도 | 받아 둔 도시 지도가 비행기 모드에서 그려진다 |
| 경로 표시 | 저장된 경로가 지도에 표시된다 |

실행 기기는 iPhone 14 Pro 실기기 1대(iOS 27.2.1로 해석)다. 운영 앱(1.1.4)에서 실행할지 preview 앱에서 실행할지 정해 결과에 적는다. preview 앱의 Apple 로그인은 서버의 `APPLE_CLIENT_ID`가 운영 번들이라 실패할 수 있다(011에서 알려진 제한, 미확인). 이 점검은 1.1.4(SDK 51 빌드)가 iOS 27에서 동작하는지에 대한 실기기 근거도 된다([개념과 계약](../spec/03-concepts-and-contracts.md)의 가정).

**3. `release/1.1`.** 1.1.4로 출시한 코드에서 브랜치를 만든다. 기준 커밋은 1.1.4 버전 커밋 `d160c7b5`다. 2026-11-18 1.1.4 빌드 18의 `gitCommitHash`가 이 커밋임을 EAS에서 확인하고 로컬 브랜치를 만들었다. 그 브랜치에서 다음을 확인한다.
- **핫픽스 빌드:** production 프로필로 빌드가 만들어지는지. 스토어 제출까지 할 필요는 없다.
- **OTA:** `pnpm ota:publish`로 preview 채널에 발행해 기기가 받는지. (2026-11-18 결과와 production 빌드를 대체한 근거는 아래 결과 표 3번과 [빌드·OTA 확인 기록](../../../records/2026-11-18-03-release-1-1-build-and-ota-check.md)) 발행 스크립트는 채널의 **최신 빌드와 runtime이 같을 때만** 발행한다. 그래서 `release/1.1`의 OTA는 production 채널에 1.2.0 빌드가 생기기 전까지만 유효하다.
  - **1.2.0이 승인·출시된 뒤에는 1.1.x 스토어 빌드도 낼 수 없다.** App Store는 새로 제출하는 버전 번호가 이미 승인된 버전보다 높아야 한다(Main의 지식, 이번 대화에서 Apple 문서로 다시 확인하지 않음). 그래서 1.2.0 뒤 1.1.x 사용자를 고치는 길은 1.2.x로 업데이트하게 하는 것뿐이고, 1.2.0 사용자의 핫픽스는 `release/1.2`에서 낸다. `release/1.1`의 쓰임새는 1.2.0 출시 전까지의 1.1.4 심사 반려 시 재제출, 1.1.5 핫픽스, 1.1.4 runtime으로의 OTA다. 2026-11-17에 "1.2.0 뒤 1.1.x는 스토어 빌드로만"이라고 적었던 것은 틀렸다([정정 기록](../../../records/2026-11-18-01-release-branch-correction-and-worktree.md)).
  - 이것은 012가 새로 정할 판단이 아니다. Project [출시 기준](../../../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)이 이미 "이전 버전 사용자에게만 OTA를 보내는 경로가 없고, 그 사용자에게는 스토어 업데이트로 고친다"는 운영 정책을 정해 두었고 012는 이를 따른다. 이전 버전 사용자에게 OTA를 보내야 할 필요가 생기면 발행 대상 빌드를 지정하도록 스크립트를 넓히는 일이며, 그 정책 변경은 Project 쪽 판단이다.

**4. Node 24.** 로컬은 이미 v24.16.0으로 돌고 있다. 바꿀 곳은 [전수 조사](../../../records/2026-11-17-01-version-inventory-and-server-scope.md)와 [버전 표](../spec/05-constraints-design-assumptions.md#node와-도구-앱서버-공통)에 있다.
- `.nvmrc` 20.18.1 → 24.x, `render.yaml` `NODE_VERSION` 20 → 24 (`render.yaml`은 실제 서비스가 쓰지 않아 뒤에 삭제)
- `@types/node` ^20 → ^24(root·server·ui)
- `nixpacks.toml`(Railway): 지금 쓰는지 확인하고, 안 쓰면 지우고 쓰면 `nodejs_24`로
- `START_GUIDE.md`의 "Node.js 20" 안내. 아래 pnpm·eas-cli 준비 방법도 함께 적는다.
- `engines`는 03에서 넣는다(확정 구성의 배치).
- **pnpm·eas-cli 준비.** 2026-11-17 Main 확인으로, pnpm 9.6.0은 nvm의 Node v20.18.1 폴더에만 설치돼 있다(`which -a pnpm` → `~/.nvm/versions/node/v20.18.1/bin/pnpm` 하나). 지금 셸은 Node v24.16.0인데 PATH 덕에 v20 폴더의 pnpm과 eas-cli 16.28.0을 쓰고 있다. `.nvmrc`를 24로 바꾸고 `nvm use`를 하면 둘이 PATH에서 빠질 수 있다. 그래서 Node 24 쪽에 pnpm 9.6.0(corepack 또는 전역 설치)과 eas-cli를 준비하고, 그 방법을 `START_GUIDE.md`에 적는다. 2026-11-18 Node 24 폴더에 `npm i -g pnpm@9.6.0 eas-cli@16.28.0`으로 설치하는 방식을 택했다.

Render는 루트에서 `pnpm install`을 실행해 client 의존성까지 Node 24로 설치한다. 지금은 SDK 51 의존성이라 문제를 예상하지 않지만 배포 로그로 확인한다. drizzle-kit 0.20 등 오래된 서버 도구의 Node 24 동작은 미확인이다.

**운영 서버 배포 주의.** Node 24 서버 배포는 1.1.4 사용자가 지금 쓰는 운영 서버에 바로 적용된다. worktree와 상관없이 실제 사용자에게 닿는 유일한 변경이다. Render는 main에 push하면 자동 배포되므로 병합·push는 사용자 확인 뒤에 한다. 2026-11-18 확인으로 자동 배포는 대시보드 설정(Auto-Deploy On Commit)에서 오고, 쓰이지 않던 `render.yaml`은 지웠다. 배포 전에 Render에서 이전 배포로 되돌리는 방법을 확인하고, 배포 뒤 운영 앱으로 확인한다(Main 판단).

**5. `npx expo install` 실패의 원인 찾기 또는 대체 절차.** 011에서 `apps/client`의 `npx expo install`이 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패해 루트의 `pnpm --filter @apps/client add`로 설치했다([011 Ticket 01](../../../../011-expo-updates-ota/current/memory/tickets/01-expo-updates-and-ios15-build.md)). 2026-11-17에는 루트와 `apps/client`의 pnpm 설정이 같아 원인을 설명하지 못했다.
- **2026-11-18 원인 확정:** npx(npm 11)가 프로젝트 `.npmrc` 값을 `npm_config_public_hoist_pattern=*` 등의 환경변수로 하위 프로세스에 넘기고, `expo install` 안의 `pnpm add`가 이를 기존 modules 디렉터리의 설정과 다르다고 판단한다. `pnpm exec`는 이 환경변수를 넘기지 않는다.
- **절차:** `apps/client`에서 `pnpm exec expo install <패키지>`. 2026-11-17의 대체 절차 제안(`--check`로 버전을 얻어 루트에서 `pnpm --filter @apps/client add`)은 쓰지 않는다. 설치 명령을 `npx`로 감싸면 같은 환경변수 때문에 pnpm이 `node_modules` 전체 재설치를 물을 수 있다.

**실행하며 정할 것:** 점검표를 운영 앱에서 돌릴지 preview에서 돌릴지. nixpacks는 2026-11-18 사용자가 Railway를 쓰지 않는다고 해 지웠다. 기준 커밋(`d160c7b5`), pnpm·eas-cli 준비 방식(Node 24 폴더에 `npm i -g`), 설치 절차(`pnpm exec expo install`)는 2026-11-18에 정했다.

## 완료 조건과 확인 방법

- 4개 패키지의 검사 결과(명령, 통과·실패 수, 실패 이름)와 `expo install --check` 출력이 이 Ticket 또는 record에 남아 있다.
- 점검표 6항목을 1.1.4에서 실행한 결과(기기, iOS 버전, 앱 종류, 항목별 결과)가 남아 있다.
- `release/1.1`이 원격에 있고, 그 브랜치에서 만든 빌드 ID와 preview 채널 OTA 수신 결과가 남아 있다. `release/1.1`은 1.2.0 출시 전까지만 쓰며, 그 뒤 1.1.x 사용자는 1.2.x로 업데이트해야 고칠 수 있다는 운영 조건이 적혀 있다.
- 서버 검사 네 가지와 schema build가 Node 24에서 기준선과 같거나 더 낫다.
- Render 배포 로그에 Node 24가 쓰였고, 배포 뒤 운영 앱에서 로그인·여행 조회·동기화가 된다. 이전 배포로 되돌리는 방법을 확인해 적었다.
- `.nvmrc`·`render.yaml`이 같은 24를 가리키고 nixpacks가 정리돼 있다. EAS `base.node`는 아직 20.18.1이다(의도). (2026-11-18: 운영 Node는 `.nvmrc`가 정해 `render.yaml`은 삭제했으므로 `.nvmrc` 24와 nixpacks 정리로 판정한다.)
- `nvm use`로 Node 24를 쓴 새 셸에서 `pnpm -v`가 9.6.0, `eas --version`이 동작하고, 그 준비 방법이 `START_GUIDE.md`에 있다.
- `npx expo install`이 `apps/client`에서 동작하거나, 대체 절차가 확정돼 tickets/index의 공통 규칙 3과 [제약](../spec/05-constraints-design-assumptions.md)에 반영돼 있다.

## 현재 상태와 실제 결과

2026-11-18 이 세션의 main 작업 트리에서 시작했다(worktree 카드로 시작하지 않음). 사용자는 "01 시작"만 지시했고, 아래 선택은 Main이 실행하며 정했다. 과정과 근거는 [Ticket 01 진행 기록](../../../records/2026-11-18-02-ticket01-baseline-node24-and-expo-install.md), 수치와 실패 이름은 [기준선 원자료](../../../source/ticket-01-baseline-2026-11-18.md)에 있다.

| 맡은 결과 | 현재 | 남은 것 |
| --- | --- | --- |
| 1 검사 기준선 | **완료.** Node 24, commit `26c1fecf`. client test 78 suites/920 통과, client lint 11 errors·254 warnings, client typecheck 6 errors, server typecheck·build 통과, server test 89·integration 50 통과, schema build 통과, ui lint 25 errors·7 warnings. 실패는 기존 상태로 고치지 않았다. `expo install --check`는 9개 어긋남(2026-11-16의 10개에서 dev-client 빠짐). 서버·schema는 Node 20에서도 같은 결과 | — |
| 2 실기기 점검표 | 점검표는 정해져 있다 | 1.1.4에서 실행(사용자 기기). 운영 앱/preview 선택 |
| 3 `release/1.1` | **완료(production 빌드는 대체 근거).** 1.1.4 빌드 18(`7033c2ba-0dc7-46e6-96cf-bfcc7044b881`)의 `gitCommitHash`가 `d160c7b5`임을 확인하고 그 커밋에서 만들어 사용자의 "push 해줘"로 원격에 올렸다(`origin/release/1.1` = `d160c7b5`, main push가 아니라 Render 배포와 무관). 사용자의 "빌드·OTA 진행"에 따라 worktree `.claude/worktrees/012-release-1.1`(Node 20.18.1)에서 확인했다. preview 빌드 `30c46ce2-39f7-450d-9c1c-bce9b4f2dff6`(1.1.4/18, `d160c7b5`, runtime `92c898f2…`)를 iPhone에 덮어 설치했고, 시험 문구 업데이트(그룹 `dedf8fc0-46ae-4ac8-8f68-2d9e98e51c59`)를 기기가 받았다("붙어 보여"). 깨끗한 코드로 다시 발행(그룹 `0272f0e0-c752-4a36-b502-26c900986079`)해 원래 문구로 돌아왔다("원래대로 돌아왔어"). production 빌드는 Main 판단으로 새로 만들지 않았다. 같은 커밋의 `7033c2ba`가 이미 성공했고, 새 빌드가 채널의 최신 빌드가 되면 1.1.4로 가는 OTA 대상이 바뀔 수 있어서다. 대신 production dry-run에서 로컬 runtime `0367b72f…`가 `7033c2ba`와 같음을 확인했다. Main이 사용자에게 알렸고 사용자는 이의 없이 진행했다 | production 프로필의 새 빌드 성공은 직접 확인하지 않음(대체 근거). worktree를 지울지 미정 |
| 4 Node 24 | **완료.** main에 병합·push했고 Render가 Node 24.16.0으로 배포했으며, 운영 앱에서 동작을 확인했다. 사용자의 "커밋해줘"로 `7413b343`(아래 변경 전부와 두 Railway 파일 삭제)에 커밋했고, 이 Work의 문서는 `4c83ef5f`로 따로 커밋했다. `.nvmrc` 24.16.0, `render.yaml` `NODE_VERSION` 24, `apps/server/tsup.config.ts` target `node24`, `@types/node` ^24.19.2(root·server·ui, lockfile은 `@types/node`만 바뀜), `START_GUIDE.md`의 Node 24·도구 준비·확인 범위. 변경 뒤 Node 24 재실행 결과가 기준선과 같고 server build target이 node24다. Node 24 폴더에 pnpm 9.6.0·eas-cli 16.28.0을 `npm i -g`로 설치했고, 새 셸의 `nvm use` 뒤 둘 다 Node 24 폴더를 가리킨다. `eas.json` `base.node` 20.18.1은 의도대로 유지(03). Main이 "Railway를 아직 쓰나요?"라고 묻자 사용자가 "안 써, 지워"라고 답해, 같은 브랜치에서 `nixpacks.toml`과 `railway.json`(NIXPACKS 빌더, 2025-12-30 `ce6342c3`에서 추가)을 삭제했다(`7413b343`에 포함). context/work·_archive 밖에 두 파일을 참조하는 곳은 없다. 되돌리기는 사용자가 "니가 확인해"로 Main에게 맡겼고, Main이 Render 문서와 대시보드에서 확인했다: Deploys의 이전 성공 배포에 Rollback이 있고(1.1.4 시점 `d160c7b` 포함), Rollback하면 자동 배포가 꺼져 다시 켜야 한다. 대시보드의 실제 서비스(`noline`)는 `render.yaml`과 이름·빌드·시작 명령이 달라 `render.yaml`을 쓰지 않고, `NODE_VERSION`이 없어 Node는 `.nvmrc`가 정한다. 그래서 `render.yaml`의 24 변경은 배포에 영향이 없다. 사용자의 "병합·push 해줘"로 main을 `c60224ee`로 fast-forward해 push했고, 배포 `dep-dbum5fajnfac73bo70b0`가 `Using Node.js version 24.16.0 via …/.nvmrc`, tsup `Target: node24`로 Live가 됐다. `/api/health`가 HTTP 200. 경위는 [Render 확인·배포 기록](../../../records/2026-11-18-04-render-check-and-node24-deploy.md)에 있다. 배포 약 10분 뒤(2026-11-18T08:43Z) health도 다시 200이었다. Main이 "운영 앱(1.1.4)에서 로그인, 여행 조회, 동기화가 되는지" 봐 달라고 하고 "운영 앱에서 로그인·여행 조회·동기화가 잘 되나요?"라고 묻자 사용자가 "잘 돼"라고 답했다. 사용자가 앱 버전을 따로 말하지는 않았고, 항목별 결과도 하나의 답으로 받았다 | — |
| 5 설치 절차 | **확정.** 실패 원인은 npx(npm 11)가 `.npmrc` 값을 `npm_config_public_hoist_pattern=*` 환경변수로 넘기는 것이다. `apps/client`에서 `pnpm exec expo install <패키지>`가 동작한다. 공통 규칙 3과 Spec 05에 반영했다 | 대화형 셸 실행은 확인 전. 지속 규칙의 위치(가이드·Project)는 미정 |

완료 조건 대비: 기준선과 `--check` 출력, 서버·schema의 Node 24 결과, 새 셸의 pnpm·eas와 START_GUIDE, 설치 절차는 충족 근거가 있다. Node 설정·START_GUIDE는 main(`c60224ee`)에 있다. Render 배포 로그에 Node 24.16.0이 쓰였고 되돌리는 방법(대시보드 Rollback)을 확인해 적었다. `.nvmrc`는 24이고 nixpacks는 정리됐다. 실제 서비스가 쓰지 않던 `render.yaml`은 지웠다([삭제 기록](../../../records/2026-11-18-05-render-yaml-removal.md)). `release/1.1`은 원격에 있고 그 브랜치의 빌드 ID와 OTA 수신 결과가 있다(production 빌드는 같은 커밋의 기존 빌드와 dry-run으로 대체). 배포 뒤 운영 앱의 로그인·여행 조회·동기화도 사용자가 확인했다("잘 돼"). 남은 것은 점검표 6항목 실행이다.

`pnpm harness:check`는 Work 001·002·005 records의 깨진 링크 64건으로 실패한다. 이번 변경과 무관한 기존 상태다.
