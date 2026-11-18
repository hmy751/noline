# 2026-11-18 — Ticket 01 진행: `release/1.1` 기준 커밋, 검사 기준선, `expo install` 실패 원인, Node 24 변경

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 수치와 실패 이름은 [기준선 원자료](../source/ticket-01-baseline-2026-11-18.md)에 있다.

## 시작

사용자가 "012 워크스페이스 파악해봐"(4행)라고 해 Main이 문서를 읽고 현황을 보고했다(107행). 이때 확인한 것은 `release/1.1`이 로컬·원격 어디에도 없다는 것, 2026-11-17 이후 `package.json` 변경은 `4c00153e`의 `ota:publish` 스크립트 경로 하나라 버전 조사가 유효하다는 것이다. 사용자는 "01 시작"(112행)이라고만 답했고, 이 구간에 그 밖의 사용자 선택·정정은 없다. 아래 선택은 모두 Main이 실행하며 정한 것이다.

Ticket 01은 앞선 세션의 기록대로 worktree 세션 카드로 시작하지 않고, 이 세션의 main 작업 트리에서 진행했다. Main이 작업 브랜치 `chore/012-node24`를 만들어 전환했으므로(335행), 012와 무관한 기존 미커밋 수정(`context/personal/experience/*` 4개, Work 006 Ticket 14·state)이 그 브랜치에 함께 따라와 있다. 카드가 아직 남아 있는지는 확인하지 않았다(107행).

## `release/1.1`의 기준 커밋을 `d160c7b5`로 정했다

Ticket은 1.1.4 버전 커밋 `d160c7b5`를 후보로 두고 "실제로 빌드에 쓴 커밋인지 확인하고 정한다"고 했다. Main은 `eas build:list`로 1.1.4 빌드 18(production, `7033c2ba-…`)의 `gitCommitHash`가 `d160c7b5`임을 확인했다(160–161행). 그 뒤 main 커밋은 모두 문서이고 앱 쪽에는 `apps/client/CLAUDE.md` 한 줄뿐이라(137–146행), 빌드에 쓴 코드와 같은 지점에서 브랜치를 만들었다(169행).

이것은 로컬 브랜치다. 원격 push, 그 브랜치에서의 production 빌드, preview OTA 수신은 하지 않았다. EAS 비용과 외부 작업이 걸려 사용자 확인 대상으로 남았다.

## 검사 기준선

Ticket의 명령을 그대로 Node 24.16.0에서 실행했다(192–242행). 결과 요약은 client test·server 전부·schema build 통과, client lint·typecheck·ui lint 실패다. 실패는 prettier 위반과 `packages/ui`를 client tsconfig가 소스로 끌어오는 rootDir 문제, 타입 오류 2건으로 업그레이드와 무관한 기존 상태이며, Ticket 방침대로 고치지 않고 기준으로 남겼다. 이후 단계는 이 수치와 비교해 새 실패만 업그레이드 영향으로 본다.

두 가지가 실행 중에 드러났다.
- **경로 가이드의 client test 명령이 틀렸다.** `apps/client/CLAUDE.md`(77행)의 `pnpm client test --runInBand`는 root 단축 스크립트가 `pnpm --filter @apps/client "test" "--runInBand"`로 펼쳐지면서 pnpm이 `--runInBand`를 자기 옵션으로 읽어 `Unknown option: 'runInBand'`로 실패한다(228행). `pnpm --filter @apps/client run test --runInBand`는 동작했다(241–242행). Ticket 01·공통 규칙 2의 검사 명령은 이 형태로 쓴다. 가이드 수정은 Project·가이드 영역이라 이 기록에서 하지 않았다.
- **Node 20과 서버 결과가 같다.** 서버 Node 전환의 영향을 가르려고 서버·schema를 Node 20.18.1에서도 돌렸다(302–314행). 결과가 같아, 변경 전부터 Node 24로 돌던 로컬과 Node 20인 운영 사이에 서버 검사상 차이는 없었다. integration이 drizzle-kit 0.20.18의 `push:pg`를 실행하므로 오래된 서버 도구 걱정 중 drizzle-kit·tsup·vitest는 Node 24에서 동작을 확인한 셈이다. `tsx`(dev 서버)는 실행하지 않았다.

## `npx expo install` 실패의 원인

011에서 `apps/client`의 `npx expo install`이 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패했고, 2026-11-17에는 루트와 `apps/client`의 pnpm 설정이 같아 원인을 설명하지 못했다. Main은 파일을 바꾸지 않는 방법으로 원인을 좁혔다.

1. `npx -c env`로 보니 npx(npm 11.13.0)가 프로젝트 `.npmrc`의 값을 `npm_config_node_linker=hoisted`, `npm_config_public_hoist_pattern=*` 환경변수로 하위 프로세스에 넘긴다(217–218행). npm은 이 두 설정을 모른다고 경고까지 한다. 그래서 `npx expo install` 안의 `pnpm add`는 이 환경변수를 받은 채 돈다.
2. 같은 환경변수를 주고 `pnpm install --frozen-lockfile`을 돌리자 pnpm이 "The modules directory … will be removed and reinstalled from scratch. Proceed?"를 물었다(247–253행). `node_modules/.modules.yaml`의 `publicHoistPattern`도 `['*']`라 값은 같아 보이지만, 환경변수로 들어온 값을 pnpm이 기존 설정과 다르다고 판단한다는 뜻이다. 정확한 비교 로직은 pnpm 코드로 확인하지 않았다. 이 실행은 비대화형이라 진행되지 않았고, Main이 `node_modules`가 그대로인지(항목 1099개, `.modules.yaml` 유지)와 `pnpm install --frozen-lockfile --offline` 정상 완료를 확인했다(258–265행).
3. `pnpm exec`는 이 환경변수를 넘기지 않는다(275–276행). `apps/client`에서 `CI=1 pnpm exec expo install expo-constants`(이미 SDK 51 버전이 들어 있는 패키지)는 `pnpm add expo-constants@~16.0.2`를 정상 실행했고 파일 변경이 없었다(280–281행).
4. 같은 명령을 `npx`로 돌리자 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`가 재현됐다(288–297행).

**결론:** 원인은 저장소 설정이 아니라 npx가 넘기는 환경변수다. Expo가 고른 버전으로 설치하는 절차는 `apps/client`에서 `pnpm exec expo install <패키지>`다. 2026-11-17의 대체 절차 제안(`--check`로 버전을 얻어 루트에서 `pnpm --filter @apps/client add`)은 필요 없어졌다. `--check`는 설치를 하지 않아 `npx`로도 동작하지만 같은 이유로 `pnpm exec`로 맞추는 편이 안전하다(`pnpm exec`로 `--check`를 따로 실행해 보지는 않았다). 확인한 실행은 `CI=1`을 붙인 비대화형이며, 대화형 셸에서 `pnpm exec expo install`을 실행해 보지는 않았다.

**위험:** 대화형 셸에서 npx 경로로 pnpm 설치가 돌면 위 2의 프롬프트가 떠 `node_modules` 전체를 지우고 다시 받을 수 있다(Main의 해석, 대화형으로 재현하지 않음). 설치 명령을 `npx`로 감싸지 않는 것이 이 절차의 핵심이다.

이 절차를 지속 규칙으로 어디에 둘지(apps/client 가이드나 Project 출시 기준)는 아직 정하지 않았다. 012 안에서는 Ticket 색인 공통 규칙 3과 Spec 05에 반영했다.

## Node 24 변경

Main은 바꿀 위치를 다시 찾은 뒤(318–324행) 브랜치 `chore/012-node24`에서 다음을 바꿨다(335–385행). 커밋하지 않았다.

| 위치 | 변경 | 비고 |
| --- | --- | --- |
| `.nvmrc` | 20.18.1 → 24.16.0 | 로컬에서 이미 쓰던 정확한 버전 |
| `render.yaml` `NODE_VERSION` | 20 → 24 | |
| `apps/server/tsup.config.ts` `target` | `node20` → `node24` | Ticket 목록에 없었으나 Node 20 표기를 찾다 발견 |
| `@types/node` (root·server·ui) | ^20.14.12 → ^24.19.2 | lockfile은 `@types/node` 20.19.23 → 24.19.2와 그에 매달린 항목만 바뀜(146줄) |
| `START_GUIDE.md` | Node 24 안내, nvm의 Node별 전역 도구에 pnpm 9.6.0·eas-cli를 `npm i -g`로 설치하는 방법, 2026-11-18 확인 범위 | |

**pnpm·eas-cli 준비:** corepack 대신 `nvm exec 24.16.0 npm i -g pnpm@9.6.0 eas-cli@16.28.0`으로 Node 24 폴더에 설치했다(343–349행). 새 로그인 셸에서 `nvm use` 뒤 `pnpm`·`eas`가 모두 v24.16.0 폴더를 가리키고 `pnpm -v` 9.6.0, `eas-cli/16.28.0`이 동작했다(404–405행). eas-cli 27.10.0 상향 안내가 나왔지만 버전은 그대로 뒀다.

**일부러 바꾸지 않은 것:**
- `apps/client/eas.json` `base.node` 20.18.1: SDK 51 핫픽스 빌드를 검증되지 않은 Node에 걸지 않으려고 03에서 바꾸기로 한 확정 배치를 따랐다.
- `nixpacks.toml`(`nodejs_20`): Railway 사용 여부를 사용자에게 물어 삭제할지 정하려고 보류했다. 저장소에는 `railway.json`도 있다. `nixpacks.toml`은 2025-12-30 `ce6342c3` "Railway를 위한 설정 추가"로, Render 설정은 2026-02-01 `a0986823`으로 들어왔다(323–324행). `railway.json`도 같은 `ce6342c3`에서 들어왔다(기록 담당자가 `git log`로 확인). 이 이력은 Railway에서 Render로 옮겼을 가능성을 보여 주지만 확정 근거는 아니다.
- `engines`: 03에서 넣는 확정 배치를 따랐다.

변경 뒤 Node 24로 전체 검사를 다시 돌려 기준선과 같은 결과와 server build의 `node24` target을 확인했다(395–396행). 남은 Node 20 표기는 `nixpacks.toml`, `eas.json`, START_GUIDE의 2026-11-16 확인 기록 문장으로 모두 의도한 것이다(404–405행).

`pnpm harness:check`는 실패했다. 실패 64건은 모두 Work 001·002·005 records의 깨진 링크이고 이번 변경과 무관하다(415–416행).

## 사용자 확인으로 남은 것

이 구간에서 Main은 외부 작업이나 운영에 닿는 일을 하지 않았다. 다음은 사용자 확인 뒤 한다.
- `release/1.1` 원격 push, 그 브랜치의 production 빌드와 preview OTA 수신 확인(EAS 비용·외부 작업)
- `nixpacks.toml`·`railway.json` 삭제 여부(Railway 사용 여부)
- `chore/012-node24`의 main 병합·push. Render가 자동 배포해 운영 서버에 바로 닿으므로 이전 배포로 되돌리는 방법을 먼저 확인한다
- 1.1.4 실기기 점검표 실행(사용자 기기), 1.1.4 심사 결과
