# Noline Work context

이 디렉터리는 Noline에서 진행 중인 작업을 지속 가능한 Workspace로 운영하는 상위 경계다. Product common context는 [`../project/`](../project/)가, 제품 코드와 상세 rules·runbooks는 기존 Owner가 계속 소유한다.

- [`workspaces/`](workspaces/): 작업 identity, 현재 context, 선택한 source, goal output, records와 machine 계약
- [`harness/`](harness/): Workspace를 Recover·Maintain·Verify하고 Harness 자체를 검증하는 제거 가능한 실행 경계

Harness는 Workspace의 goal·사람 판단·Project 기준을 소유하지 않는다. Harness를 제거해도 각 Workspace는 자기 README와 `current/`을 읽어 재진입할 수 있어야 한다.

<!-- evidence-collector:start -->
## 선택적 증거 수집 연결

이 Work의 Workspace 작업에는 로컬 설치가 있을 때 독립 증거 수집기(`../../evidence-collector/README.md`)를 선택적으로 연결한다. 개인 설치는 Git clone으로 전달되지 않으며 없는 체크아웃에서는 기존 Maintain이 동작한다. Maintain은 Workspace 연결과 지속 context 갱신을, 수집기는 당시 자료와 회고 단서 보존을 맡는다. 연결 어댑터만 양쪽 실행 구현을 알고 확정된 요청 귀속을 전달한다. 수집 기록은 Workspace의 현재 판단이나 평가 결론을 대신하지 않는다.

Main의 참여 범위와 활성 조건은 [Work 운영 지침](AGENTS.md#증거-수집-연결)이 소유하고, 수집 상세와 기록·상태 접근은 수집기 운영 안내가 소유한다. 수집 연결을 제거해도 Workspace와 기존 Harness의 의미·책임은 유지된다.
<!-- evidence-collector:end -->

명령은 Noline Project root에서 실행한다.

```sh
python3 -m context.work.harness recover
python3 -m context.work.harness maintain bootstrap <workspace_id>
python3 -m context.work.harness verify
```

작업 지침과 session activation 정책은 [`AGENTS.md`](AGENTS.md), Workspace 생성·전환은 [`workspaces/CREATE-AND-TRANSITION.md`](workspaces/CREATE-AND-TRANSITION.md), Harness 내부 경계는 [`harness/README.md`](harness/README.md)에서 시작한다.

Workspace의 Work당 Spec 하나, 실행할 Ticket과 Main·Maintain의 유지 관계는 [Spec·Ticket 계약](workspaces/spec-and-tickets/README.md)을 따른다.
