# 현재 산출물

2026-11-18 Ticket 01에서 생긴 결과는 다음과 같다.
- **`release/1.1`** 브랜치(원격 `origin/release/1.1`): 1.1.4 빌드 18의 커밋 `d160c7b5`에서 만들어 2026-11-18 push했다. 1.2.0 출시 전까지의 1.1.x 핫픽스용이다. 이 브랜치에서 만든 preview 빌드 `30c46ce2-39f7-450d-9c1c-bce9b4f2dff6`(1.1.4/18, runtime `92c898f2…`)가 iPhone의 `com.noline.dev`에 설치돼 있고, preview 채널의 최신 업데이트는 깨끗한 코드의 그룹 `0272f0e0-c752-4a36-b502-26c900986079`다(시험 문구 그룹 `dedf8fc0-…`은 이것으로 대체됨). production 채널에는 새 빌드·발행을 하지 않았다.
- **worktree `.claude/worktrees/012-release-1.1`**: `release/1.1` checkout, gitignore 대상 env 파일 3개를 main에서 복사, Node 20.18.1로 `node_modules` 설치. 핫픽스·Ticket 02용으로 남겨 두었고 지울지는 미정이다.
- **Node 24 변경이 main에 들어갔다** (`chore/012-node24`를 fast-forward, main `c60224ee` push). 커밋 `7413b343`에 `.nvmrc`, `render.yaml`, `apps/server/tsup.config.ts`, `@types/node`(root·server·ui), `pnpm-lock.yaml`, `START_GUIDE.md`, 그리고 `nixpacks.toml`·`railway.json` 삭제가 들어 있다. 이 Work의 문서 변경은 `4c83ef5f`·`c60224ee`로 따로 커밋했다. 그 뒤 `render.yaml` 삭제와 `apps/server/README.md`·`context/project/guidance/app-release-and-ota.md`·루트 `README.md`의 Render·Node 정정은 커밋 `a22873b1`에 있다([삭제 기록](../records/2026-11-18-05-render-yaml-removal.md)). 운영 서버 배포는 Render 서비스 `noline`(`srv-d5v1siggjchc7390ietg`)의 `dep-dbum5fajnfac73bo70b0`(Node 24.16.0, Live)다. 되돌릴 때는 대시보드 Deploys의 이전 배포 Rollback을 쓴다. 배포 뒤 운영 앱의 로그인·여행 조회·동기화는 사용자가 확인했다. 그 뒤의 커밋 `1174c5c1`(Render 확인·배포 기록), `e10c8c4f`(운영 앱 확인 기록), `a22873b1`(`render.yaml` 삭제와 서버 README·출시 기준·루트 README 정정), `b38729b4`(그 Work 기록)는 2026-11-18 push했고, Render가 `b38729b`로 다시 배포했다(Live, health 200). 이 Work와 무관한 미커밋 수정(`context/personal/experience/*`, Work 006)은 커밋하지 않고 같은 작업 트리에 남아 있다.

2026-11-18 Ticket 02의 판정용 산출물은 저장소 밖에 있다. 세션 scratchpad라 재부팅·정리 때 사라질 수 있고, 읽은 값은 [판정 원자료](../source/ticket-02-verification-2026-11-18.md)에 옮겼다.
- **판정용 앱 `verify-02`**: 세션 scratchpad(`…/scratchpad/verify-02`). "Noline (판정)", `com.noline.dev`, EAS 프로필 `verify02`(채널 없음). EAS 빌드 90 `3db6fe71-604f-48cc-9073-75aa922aaf14`, 빌드 91 `e9cfd75d-b81d-440f-8c87-dda010258122`는 EAS에 남는다. main에 들어가지 않았다.
- **테스트 도구 확인 `rntl-check`**와 판정 보고서(`verify-report-online.txt`, `verify-report-offline.txt`), 기기 스크린샷: 같은 scratchpad.
- **기기**: iPhone의 Noline Dev 자리에 판정용 앱 빌드 91이 설치돼 있다(원복 전). 시뮬레이터에는 이번에 잘못 빌드된 운영 번들 `com.ham.noline` 1.1.4가 남아 있다(열지 않음).

2026-11-18 Ticket 03의 결과는 작업 브랜치에 있다(push·main 병합 전).
- **worktree `.claude/worktrees/012-sdk54`, 브랜치 `feat/012-sdk54`**: main `ff51ecd9`에서 분기. 커밋 `8bfe21e1`(SDK 52), `668d4e73`(SDK 53), `3902bf7f`(SDK 54). 임시 우회 `apps/client/plugins/with-fmt-consteval-off.js`가 이 브랜치에만 있다. 단계별 검사·빌드 로그는 세션 scratchpad(`baseline/sdk52`…`sdk54c`, `sdk54-sim-build*.log`)에 있어 사라질 수 있고, 수치는 [Ticket 03](../current/memory/tickets/03-sdk54-legacy.md#현재-상태와-실제-결과)에 옮겼다.

내용과 남은 일은 [Ticket 01](../current/memory/tickets/01-preparation-baseline-and-node24.md#현재-상태와-실제-결과)에 있다. 설치 절차(`pnpm exec expo install`)는 지금 이 Work의 [공통 규칙 3](../current/memory/tickets/index.md)에만 있다.

결과가 생기면 실제 위치를 여기에 연결한다. 예정된 결과는 다음과 같다.
- `apps/client/package.json`·`app.config.js`·`eas.json`, `.nvmrc`, `pnpm-lock.yaml` 변경과 그에 따른 코드 수정
- 서버 Node 변경: `render.yaml`, `nixpacks.toml` 정리, `@types/node`, `START_GUIDE.md`의 Node 안내와 Render 배포
- 저장소 의존성 선언 정리: root `package.json`의 react, `packages/ui`·`packages/eslint-config`
- 업그레이드 스토어 빌드와 심사 제출(1.2.0, 1.3.0 두 번)
- 1.2.0 출시 전까지의 1.1.x 핫픽스용 `release/1.1` 브랜치
- 설치·확인 방법(재발 방지)의 위치
