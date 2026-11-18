# 현재 산출물

2026-11-18 Ticket 01에서 생긴 결과는 다음과 같다.
- **`release/1.1`** 브랜치(원격 `origin/release/1.1`): 1.1.4 빌드 18의 커밋 `d160c7b5`에서 만들어 2026-11-18 push했다. 1.2.0 출시 전까지의 1.1.x 핫픽스용이다. 이 브랜치에서 만든 preview 빌드 `30c46ce2-39f7-450d-9c1c-bce9b4f2dff6`(1.1.4/18, runtime `92c898f2…`)가 iPhone의 `com.noline.dev`에 설치돼 있고, preview 채널의 최신 업데이트는 깨끗한 코드의 그룹 `0272f0e0-c752-4a36-b502-26c900986079`다(시험 문구 그룹 `dedf8fc0-…`은 이것으로 대체됨). production 채널에는 새 빌드·발행을 하지 않았다.
- **worktree `.claude/worktrees/012-release-1.1`**: `release/1.1` checkout, gitignore 대상 env 파일 3개를 main에서 복사, Node 20.18.1로 `node_modules` 설치. 핫픽스·Ticket 02용으로 남겨 두었고 지울지는 미정이다.
- **Node 24 변경이 main에 들어갔다** (`chore/012-node24`를 fast-forward, main `c60224ee` push). 커밋 `7413b343`에 `.nvmrc`, `render.yaml`, `apps/server/tsup.config.ts`, `@types/node`(root·server·ui), `pnpm-lock.yaml`, `START_GUIDE.md`, 그리고 `nixpacks.toml`·`railway.json` 삭제가 들어 있다. 이 Work의 문서 변경은 `4c83ef5f`·`c60224ee`로 따로 커밋했다. 운영 서버 배포는 Render 서비스 `noline`(`srv-d5v1siggjchc7390ietg`)의 `dep-dbum5fajnfac73bo70b0`(Node 24.16.0, Live)다. 되돌릴 때는 대시보드 Deploys의 이전 배포 Rollback을 쓴다. 배포 뒤 운영 앱의 로그인·여행 조회·동기화는 사용자가 확인했다. 그 뒤의 기록 커밋 `1174c5c1`은 main에 로컬로만 있고 push하지 않았다(main push는 Render 재배포). 이 Work와 무관한 미커밋 수정(`context/personal/experience/*`, Work 006)은 커밋하지 않고 같은 작업 트리에 남아 있다.

내용과 남은 일은 [Ticket 01](../current/memory/tickets/01-preparation-baseline-and-node24.md#현재-상태와-실제-결과)에 있다. 설치 절차(`pnpm exec expo install`)는 지금 이 Work의 [공통 규칙 3](../current/memory/tickets/index.md)에만 있다.

결과가 생기면 실제 위치를 여기에 연결한다. 예정된 결과는 다음과 같다.
- `apps/client/package.json`·`app.config.js`·`eas.json`, `.nvmrc`, `pnpm-lock.yaml` 변경과 그에 따른 코드 수정
- 서버 Node 변경: `render.yaml`, `nixpacks.toml` 정리, `@types/node`, `START_GUIDE.md`의 Node 안내와 Render 배포
- 저장소 의존성 선언 정리: root `package.json`의 react, `packages/ui`·`packages/eslint-config`
- 업그레이드 스토어 빌드와 심사 제출(1.2.0, 1.3.0 두 번)
- 1.2.0 출시 전까지의 1.1.x 핫픽스용 `release/1.1` 브랜치
- 설치·확인 방법(재발 방지)의 위치
