# 2026-11-18 — Render 되돌리기 확인과 Node 24 운영 배포: 서비스가 `render.yaml`을 쓰지 않는다는 발견

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. Render 문서와 대시보드는 Main이 내장 브라우저로 읽기만 했고 설정은 바꾸지 않았다.

## 시작

Node 24 변경을 `chore/012-node24`에 커밋한 뒤 Main은 main 병합·push 전에 Render에서 이전 배포로 되돌리는 방법을 확인해 달라고 했다(965행). 사용자는 "니가 확인해"(970행)라고 Main에게 맡겼다. 대시보드는 로그인이 필요해 사용자가 내장 브라우저에서 로그인했고("로그인했어", 1054행), 이후 Main이 대시보드를 읽었다.

## 문서에서 확인한 것

- **되돌리기**(render.com/docs/rollbacks): 서비스의 Deploys 페이지에서 이전 성공 배포의 Rollback을 누르면 그 배포의 빌드 결과물·환경변수·시작 명령으로 다시 배포한다. 대시보드에서 Rollback하면 자동 배포가 꺼져, 고친 뒤 Settings에서 다시 켜야 한다. 플랜에 따라 남는 이전 빌드 수가 정해져 있다(1049행).
- **Node 버전 결정 순서**(render.com/docs/node-version): 대시보드의 `NODE_VERSION` 환경변수 > `.node-version` > `.nvmrc` > `package.json` `engines`(1049행).

## 대시보드에서 확인한 것

| 항목 | 실제 서비스 | `render.yaml` |
| --- | --- | --- |
| 서비스 이름 | `noline` (`srv-d5v1siggjchc7390ietg`, 무료 인스턴스, `https://noline-d6hy.onrender.com`) | `noline-server` |
| 빌드 명령 | `NODE_ENV=development pnpm install && pnpm --filter @repo/schema build && pnpm --filter @apps/server build` | `pnpm install && …` (NODE_ENV 없음) |
| 시작 명령 | `pnpm --filter @apps/server start` | `cd apps/server && pnpm start` |
| `NODE_VERSION` | 환경변수에 없음 | 20 → 이번에 24 |
| 자동 배포 | 브랜치 main, Auto-Deploy "On Commit" | `autoDeploy: true` |

이름과 명령이 다르므로 이 서비스는 `render.yaml`을 동기화하는 Blueprint 서비스가 아니라 대시보드에서 직접 설정한 서비스로 판단했다(1163행). 따라서 `render.yaml`은 실제 배포에 반영되지 않고, 이번 `render.yaml`의 `NODE_VERSION` 24 변경도 배포에 영향이 없다. 대시보드에 `NODE_VERSION`이 없고 저장소에 `.node-version`도 없으므로 실제 Node는 `.nvmrc`가 정한다. 병합 전 운영은 `.nvmrc`의 20.18.1로 돌았을 것으로 보지만, 무료 플랜 로그가 최근 1시간만 검색돼 이전 배포의 Node 버전 줄은 찾지 못했다(1159행).

Deploys 목록의 이전 배포들(1.1.4 시점 `d160c7b` 포함)에 Rollback 버튼이 있어, 되돌리기는 바로 쓸 수 있다고 판단했다. 실제 Rollback은 하지 않았다.

## 병합·push와 배포

사용자가 "병합·push 해줘"(1168행)라고 해 Main이 main을 `chore/012-node24`로 fast-forward(`26c1fecf..c60224ee`)하고 push했다(origin `7433276e..c60224ee`, 1174–1175행).

Render 자동 배포 `dep-dbum5fajnfac73bo70b0`(커밋 `c60224e`)의 로그와 결과(1186–1278행):
- `Using Node.js version 24.16.0 via /opt/render/project/src/.nvmrc`, `Installing Node.js version 24.16.0`
- 서버 tsup `Target: node24`, `Build successful`, `Your service is live`, `API listening at http://0.0.0.0:3000 (production)`
- 상태 Deploy succeeded / Live, 2분 16초

`curl https://noline-d6hy.onrender.com/api/health`가 HTTP 200 `{"status":"ok"}`를 돌려줬다(2026-11-18T08:35Z, 1279–1281행). 운영 앱에서 로그인·여행 조회·동기화는 아직 확인하지 않았다(사용자 기기 필요).

## 남은 판단

`render.yaml`과 실제 서비스가 다르다는 사실은 012 밖의 문서에도 걸린다. Project [출시 기준](../../../../project/guidance/app-release-and-ota.md)은 서버 배포를 "main push → `render.yaml`의 `autoDeploy`"로 설명하고, `apps/server/README.md`도 `render.yaml`이 빌드·시작을 정의한다고 쓴다. `render.yaml`을 실제 서비스에 맞출지, Blueprint로 바꿀지, 지울지와 이 문서들의 정정은 정하지 않았다. 012의 기록 범위 밖이라 Main의 Project 반영 판단으로 남겼다. 그 판단 전까지 Render의 Node 기준은 `.nvmrc`이고, 012의 이후 Node 변경도 `.nvmrc`가 실제 배포를 바꾼다는 점을 전제로 한다.
