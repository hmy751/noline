# Noline Work context

이 디렉터리는 Noline에서 진행 중인 작업을 지속 가능한 Workspace로 운영하는 상위 경계다. Product common context는 [`../project/`](../project/)가, 제품 코드와 상세 rules·runbooks는 기존 Owner가 계속 소유한다.

- [`workspaces/`](workspaces/): 작업 identity, 현재 context, 선택한 source, goal output, records와 machine 계약
- [`harness/`](harness/): Workspace를 Recover·Maintain·Verify하고 Harness 자체를 검증하는 제거 가능한 실행 경계

Harness는 Workspace의 goal·사람 판단·Project 기준을 소유하지 않는다. Harness를 제거해도 각 Workspace는 자기 README와 `current/`을 읽어 재진입할 수 있어야 한다.

명령은 Noline Project root에서 실행한다.

```sh
python3 -m context.work.harness recover
python3 -m context.work.harness maintain bootstrap <workspace_id>
python3 -m context.work.harness verify
```

작업 지침과 session activation 정책은 [`AGENTS.md`](AGENTS.md), Workspace 생성·전환은 [`workspaces/CREATE-AND-TRANSITION.md`](workspaces/CREATE-AND-TRANSITION.md), Harness 내부 경계는 [`harness/README.md`](harness/README.md)에서 시작한다.
