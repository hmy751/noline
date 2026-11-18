# 2026-11-18 — `render.yaml` 삭제와 Render 서술 정정

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 앞선 발견은 [Render 확인·배포 기록](2026-11-18-04-render-check-and-node24-deploy.md)에 있고, 그 기록의 "남은 판단"이 여기서 처리됐다.

## 요청과 확인

Main이 "render.yaml과 Render 관련 문서를 실제 서비스에 맞게 지금 정리할까요?"라고 물었고(1387행), 바로 앞 안내에서 "정리할 때 `render.yaml`은 실제 서비스에 맞추거나 지우는 방향을 함께 정하겠습니다"라고 했다(1390행). 사용자는 "지금 정리해"(1395행)라고 답했다. Main은 context-update 스킬로 Project·가이드 정정을 진행했다(1402행).

Main이 Render 대시보드의 Blueprints 페이지에서 "You haven't created any Blueprint instances yet."를 확인했다(1418–1432행). `render.yaml`은 어떤 Render 서비스에도 연결돼 있지 않다.

## `render.yaml`을 맞추지 않고 지운 판단

선택지는 실제 서비스에 맞춰 고치기, Blueprint로 전환하기, 삭제였다. Main이 삭제를 골랐다. 근거는 다음과 같다.
- 적용되지 않는 설정 파일이 이미 실제와 어긋나 있었다(서비스 이름, 빌드·시작 명령, `NODE_VERSION`).
- 그 파일이 있다는 이유로 Main 자신도 이번에 `render.yaml`의 `NODE_VERSION`을 바꾸면 배포에 반영된다고 오해했다. 남겨 두면 같은 오해가 반복된다.
- Blueprint가 필요해지면 그때 실제 대시보드 설정에서 새로 만든다.

원문상 이 선택을 사용자와 미리 함께 정하지는 않았다. 1390행에서 "함께 정하겠다"고 했지만, Main이 판단해 적용한 뒤 결과를 알렸다(1502행). 사용자의 "지금 정리해"는 정리 착수에 대한 답이다.

## 실제 수정 (Main, Project·가이드)

| 파일 | 변경 |
| --- | --- |
| `render.yaml` | 삭제(stage됨) |
| `apps/server/README.md` | "배포 전 확인" 절을 대시보드 기준으로 다시 씀: 서비스 `noline`, 설정 원천은 대시보드이고 저장소에 배포 설정 파일이 없음, main On Commit, Node는 `.nvmrc`와 결정 순서, Build/Start Command, 환경 변수 이름, 무료 인스턴스, Rollback 방법, 2026-11-18 확인 범위. 15행 "Node20 대상의 tsup" → "Node24" |
| `context/project/guidance/app-release-and-ota.md` | 67·97행의 `render.yaml` 링크와 `autoDeploy` 서술을 대시보드 Auto-Deploy와 서버 안내의 배포 절 링크로 정정 |
| 루트 `README.md` | 기술 표 "Server · Node 20" → "Node 24" |

`pnpm harness:check`는 기존 Work 기록의 깨진 링크 64건으로 실패하며 이번 수정 파일 관련 실패는 없다(1469–1483행). 별도 검토자는 쓰지 않았다. Main이 사실 정정으로 보고 실제 대시보드 값과 직접 대조했다. 이 수정은 기록 시점에 커밋되지 않았다.
