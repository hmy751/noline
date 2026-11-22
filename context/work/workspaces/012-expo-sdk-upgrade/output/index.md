# 현재 산출물

2026-11-18 Ticket 01에서 생긴 결과는 다음과 같다.
- **`release/1.1`** 브랜치(원격 `origin/release/1.1`): 1.1.4 빌드 18의 커밋 `d160c7b5`에서 만들어 2026-11-18 push했다. 1.2.0 출시 전까지의 1.1.x 핫픽스용이다. 이 브랜치에서 만든 preview 빌드 `30c46ce2-39f7-450d-9c1c-bce9b4f2dff6`(1.1.4/18, runtime `92c898f2…`)를 iPhone의 `com.noline.dev`에 설치했었고(그 뒤 Ticket 02 판정용 앱으로 덮음, 아래), preview 채널의 최신 업데이트는 깨끗한 코드의 그룹 `0272f0e0-c752-4a36-b502-26c900986079`다(시험 문구 그룹 `dedf8fc0-…`은 이것으로 대체됨). production 채널에는 새 빌드·발행을 하지 않았다.
- **worktree `.claude/worktrees/012-release-1.1`**: `release/1.1` checkout, gitignore 대상 env 파일 3개를 main에서 복사, Node 20.18.1로 `node_modules` 설치(2026-11-22 Node 24 셸에서 한 번 다시 설치됐다가, 같은 날 Main이 Node 20.18.1로 다시 설치했다). 2026-11-22 OTA 스크립트 커밋 6개를 이 브랜치에 옮겨 push했다(아래). 1.1.4가 2026-11-17 출시됐고 1.1.x OTA·핫픽스는 여기서만 낼 수 있어 남긴다(2026-11-20 Main 판단). 발행 방법은 Project 출시 기준의 [release 브랜치 절](../../../../project/guidance/app-release-and-ota.md#이미-낸-버전의-수정은-release-브랜치에서-낸다)에 있다.
- **Node 24 변경이 main에 들어갔다** (`chore/012-node24`를 fast-forward, main `c60224ee` push). 커밋 `7413b343`에 `.nvmrc`, `render.yaml`, `apps/server/tsup.config.ts`, `@types/node`(root·server·ui), `pnpm-lock.yaml`, `START_GUIDE.md`, 그리고 `nixpacks.toml`·`railway.json` 삭제가 들어 있다. 이 Work의 문서 변경은 `4c83ef5f`·`c60224ee`로 따로 커밋했다. 그 뒤 `render.yaml` 삭제와 `apps/server/README.md`·`context/project/guidance/app-release-and-ota.md`·루트 `README.md`의 Render·Node 정정은 커밋 `a22873b1`에 있다([삭제 기록](../records/2026-11-18-05-render-yaml-removal.md)). 운영 서버 배포는 Render 서비스 `noline`(`srv-d5v1siggjchc7390ietg`)의 `dep-dbum5fajnfac73bo70b0`(Node 24.16.0, Live)다. 되돌릴 때는 대시보드 Deploys의 이전 배포 Rollback을 쓴다. 배포 뒤 운영 앱의 로그인·여행 조회·동기화는 사용자가 확인했다. 그 뒤의 커밋 `1174c5c1`(Render 확인·배포 기록), `e10c8c4f`(운영 앱 확인 기록), `a22873b1`(`render.yaml` 삭제와 서버 README·출시 기준·루트 README 정정), `b38729b4`(그 Work 기록)는 2026-11-18 push했고, Render가 `b38729b`로 다시 배포했다(Live, health 200). 이 Work와 무관한 미커밋 수정(`context/personal/experience/*`, Work 006)은 커밋하지 않고 같은 작업 트리에 남아 있다.

2026-11-18 Ticket 02의 판정용 산출물은 저장소 밖에 있다. 세션 scratchpad라 재부팅·정리 때 사라질 수 있고, 읽은 값은 [판정 원자료](../source/ticket-02-verification-2026-11-18.md)에 옮겼다.
- **판정용 앱 `verify-02`**: 세션 scratchpad(`…/scratchpad/verify-02`). "Noline (판정)", `com.noline.dev`, EAS 프로필 `verify02`(채널 없음). EAS 빌드 90 `3db6fe71-604f-48cc-9073-75aa922aaf14`, 빌드 91 `e9cfd75d-b81d-440f-8c87-dda010258122`는 EAS에 남는다. main에 들어가지 않았다.
- **테스트 도구 확인 `rntl-check`**와 판정 보고서(`verify-report-online.txt`, `verify-report-offline.txt`), 기기 스크린샷: 같은 scratchpad.
- **기기**: iPhone의 Noline Dev 자리에 판정용 앱 빌드 91이 설치돼 있다(원복 전). 시뮬레이터에는 이번에 잘못 빌드된 운영 번들 `com.ham.noline` 1.1.4가 남아 있다(열지 않음).

Ticket 03의 결과는 2026-11-19 main에 머지 커밋 `ae97809e`로 병합됐고, 사용자의 "push 해줘"로 `195b62ee`까지 push했다. Render가 다시 배포했고 health가 200이다(05:38Z). 작업 브랜치·worktree와 Node 24·문서용 브랜치 `chore/012-node24`·`docs/012-sdk-upgrade-split`은 2026-11-20 사용자의 "쭉 다해줘"로 지웠고, 커밋은 main 이력에 있다.
- **(삭제됨) worktree `.claude/worktrees/012-sdk54`, 브랜치 `feat/012-sdk54`(마지막 `35b21093`)**: main `ff51ecd9`에서 분기. 커밋 `8bfe21e1`(SDK 52), `668d4e73`(SDK 53), `3902bf7f`(SDK 54). 임시 우회 `apps/client/plugins/with-fmt-consteval-off.js`는 이 브랜치로 main에 들어갔다가 04의 `beee6373`에서 지웠다. 단계별 검사·빌드 로그는 세션 scratchpad(`baseline/sdk52`…`sdk54c`, `sdk54-sim-build*.log`)에 있어 사라질 수 있고, 수치는 [Ticket 03](../current/memory/tickets/03-sdk54-legacy.md#현재-상태와-실제-결과)에 옮겼다.

- 같은 브랜치의 `7be8f22f`(react 한 벌), `35b21093`(EAS Node 24, `engines`, `client:expo-check`, client 가이드 명령).
- **EAS 빌드:** SDK 54 preview `f8e97f99`(커밋 `35b21093`, preview 채널 최신, iPhone만 든 프로필). iPad 포함 프로필의 1.1.4 preview `2814ad7f`(커밋 `d160c7b5`). 취소한 `b6e2d1a8`.
- **로컬 빌드:** SDK 54 preview `sdk54-preview.ipa`(21.7 MB, iPad·iPhone 프로필)는 세션 scratchpad의 `local-build`에 있어 사라질 수 있다. iPad에 설치돼 있다.
- **iPad 제어 서버:** DeviceKit iPad용 빌드가 `~/Documents/Codex/2026-11-06/new-chat/work/iphone-control/build-ipad`에 iPhone 빌드와 따로 있다.

2026-11-19 Ticket 04의 코드 작업은 2026-11-20 사용자의 "병합하고 push"로 main에 머지 커밋 `6d34c44b`로 병합됐고 `195b62ee..6d34c44b`로 push했다. 병합 뒤 코드는 `c5fdbbdc`와 같다. push 뒤 8분간 health는 24번 모두 200이었지만, 응답에 커밋 정보가 없고 Render 대시보드를 보지 않아 `6d34c44b` 배포가 Live가 됐는지는 확정하지 못했다. 작업 브랜치와 worktree는 2026-11-20 지웠다. 그 뒤의 `a44f1993`(Work 기록)·`69bfa8eb`(Project 출시 기준에 release 브랜치 OTA 절 추가)는 2026-11-20 사용자의 "push해줘"로 1.2.0 커밋들과 함께 push했다(`6d34c44b..8b45fea6`).
- **(삭제됨) worktree `.claude/worktrees/012-newarch`, 브랜치 `feat/012-newarch`**: main `307ae37b`에서 분기. 커밋 `6c6b5524`(New Architecture·reanimated 4·Mapbox v11), `beee6373`(fmt 우회 삭제), `fb73bb25`(오프라인 지도 스타일 상수 `OFFLINE_MAP_STYLE_URL`), `c5fdbbdc`(일정 Mapbox 지도의 마커 번호·처음 위치). 내용은 [Ticket 04](../current/memory/tickets/04-new-architecture-and-1-2-0.md#현재-상태와-실제-결과)에 있다.

2026-11-20 Ticket 04의 1.2.0 출시 빌드를 만들어 App Store Connect에 올렸다. 내용은 [Ticket 04](../current/memory/tickets/04-new-architecture-and-1-2-0.md#120-빌드와-app-store-connect-업로드-2026-11-20)에 있다.
- **버전 커밋 `3ff9832c`**(main, 2026-11-20 push): `app.config.js`의 `version` 1.2.0, `ios.buildNumber` 19.
- **ipa `apps/client/build/noline-1.2.0-19.ipa`**(38.9 MB, gitignore, 2026-11-22 `dist`에서 옮김): `eas build --local` production, `com.ham.noline` 1.2.0(19), runtime `167224c68c33d159626c09f8e67c74fe5f20c02c`. EAS 빌드 목록에는 없다.
- **App Store Connect 업로드(빌드 19):** EAS submission `11293d25-6b5d-4c01-805d-29e4745b2e8a`, ASC 앱 `6757186547`의 TestFlight. 사용자가 iPhone에서 로그인 확인에 썼고 심사에는 내지 않는다.

같은 날 사용자가 빌드 19에서 찾은 Apple 로그인 로딩 표시를 고쳐 빌드 20을 만들었다. 내용은 [Ticket 04의 빌드 20 절](../current/memory/tickets/04-new-architecture-and-1-2-0.md#apple-로그인-로딩-수정과-빌드-20-2026-11-20)에 있다.
- **수정 커밋 `378287a6`**(main, 2026-11-20 push): `apps/client/src/screens/LoginScreen.tsx`, 새 테스트 `apps/client/tests/screens/login-loading.test.tsx`.
- **버전 커밋 `92c1766c`**(main, 2026-11-20 push): `ios.buildNumber` 20.
- **브랜치 `release/1.2`**(원격 `origin/release/1.2`는 `92c1766c`, 2026-11-20 push): 1.2.x 핫픽스용. 처음 `3ff9832c`에서 만들었다가 빌드 20 커밋으로 옮겼다. 2026-11-22 OTA 스크립트 커밋 7개를 더해 `3aa5f7f0`까지 push했다(아래).
- **ipa `apps/client/build/noline-1.2.0-20.ipa`**(gitignore, 2026-11-22 `dist`에서 옮김): `eas build --local` production, `com.ham.noline` 1.2.0(20), New Architecture, runtime `c4fc18bb87be563ecadc87afde5936b605ab266d`. EAS 빌드 목록에는 없고, 2026-11-22 로컬 빌드 장부에 등록했다(아래).
- **App Store Connect 업로드(빌드 20):** EAS submission `bc7c857f-af61-4f23-b4fd-09a66e095a60`. 심사에 낼 빌드다.
- **App Store Connect iOS 버전 1.2.0:** 출시 노트 두 줄, 빌드 20 연결, 출시 설정은 자동 출시·모든 사용자에게 즉시·기존 평가 유지. 2026-11-20 오후 7:13 심사에 제출했고 앱 심사 페이지에 "심사 대기 중"으로 나온다.


2026-11-22 1.2.0을 OTA 발행 스크립트의 대상으로 만들려고 발행 점검을 고쳤다. 내용은 [Ticket 04의 OTA 발행 점검 절](../current/memory/tickets/04-new-architecture-and-1-2-0.md#ota-발행-점검이-로컬-빌드를-다루게-고침-2026-11-22), 과정은 [기록](../records/2026-11-22-01-ota-script-local-build-ledger-and-older-builds.md), 현재 사용법은 Project [출시 기준](../../../../project/guidance/app-release-and-ota.md#ota는-발행-스크립트로만-낸다)에 있다. 이 구간의 커밋은 기록 커밋 `113ff1db`와 함께 2026-11-22 사용자의 "push 해줘"로 main(`8b45fea6..113ff1db`), `release/1.1`(`d160c7b5..0c6c7855`), `release/1.2`(`92c1766c..3aa5f7f0`)를 push했다.
- **main 커밋:** `e7d94641`(`apps/client/scripts/ota/builds.mjs`·`register-local-build.mjs`, `checks.mjs`·`publish.mjs`·`config.mjs`·`eas.mjs`·`terminal.mjs` 수정, 루트 `package.json`의 `ota:register-local-build`), `47704e25`(장부 `apps/client/scripts/ota/local-builds.json`에 1.2.0 빌드 20 등록), `30c0ae03`, `89184f23`, `5c88d610`, `5007102b`, `4c8a8010`(검증 지적 처리), `e8e53692`(Project 출시 기준). 기록 커밋 `113ff1db`(Spec 정정과 Node 20 확인 결과 포함)까지 push돼 main과 origin이 같다.
- **장부 기록:** ios production `com.ham.noline` 1.2.0(20), runtime `c4fc18bb…`, 빌드 커밋 `92c1766c`.
- **`release/1.1`(로컬 `0c6c7855`):** 스크립트 커밋 6개 `d9997d02`·`80532cf0`·`03c483be`·`001fd726`·`62239a5d`·`0c6c7855`. 장부 등록 커밋은 넣지 않았다(장부는 다른 브랜치 ref에서 읽는다).
- **`release/1.2`(로컬 `3aa5f7f0`):** 장부 등록을 포함한 7개 `e8b6b375`·`6d5253ba`·`0d7047c8`·`e318f7c6`·`810d9235`·`1fe24bec`·`3aa5f7f0`. scratchpad의 임시 worktree에서 옮기고 그 worktree는 지웠다.

내용과 남은 일은 [Ticket 01](../current/memory/tickets/01-preparation-baseline-and-node24.md#현재-상태와-실제-결과)에 있다. 설치 절차(`pnpm exec expo install`)는 지금 이 Work의 [공통 규칙 3](../current/memory/tickets/index.md)에만 있다.

결과가 생기면 실제 위치를 여기에 연결한다. 예정된 결과는 다음과 같다.
- `apps/client/package.json`·`app.config.js`·`eas.json`, `.nvmrc`, `pnpm-lock.yaml` 변경과 그에 따른 코드 수정
- 서버 Node 변경: `render.yaml`, `nixpacks.toml` 정리, `@types/node`, `START_GUIDE.md`의 Node 안내와 Render 배포
- 저장소 의존성 선언 정리: root `package.json`의 react, `packages/ui`·`packages/eslint-config`
- 업그레이드 스토어 빌드와 심사 제출(1.2.0, 1.3.0 두 번). 1.2.0은 빌드 20으로 2026-11-20 심사에 제출했다(심사 대기 중, 위)
- 1.2.0 출시 전까지의 1.1.x 핫픽스용 `release/1.1` 브랜치
- 설치·확인 방법(재발 방지)의 위치
