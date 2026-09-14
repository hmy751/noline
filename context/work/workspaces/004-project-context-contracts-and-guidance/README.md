# Project 계약 합의와 작성 지침 검증

002의 완료 작업을 Project context로 옮기는 과정에서 남은 제품 계약의 미합의와, 작성 지침을 적용해도 반복된 문서 구성 문제를 해결하는 후속 Work다. 제품 계약을 사용자와 구체화해 관련 기준 본문에 반영하고, 다른 세션이 지침을 읽어 적절한 본문을 구성하는지 실제 결과로 확인한다.

현재는 Workspace를 만든 상태다. Project와 일부 `.claude` 문서는 다른 세션이 만든 미커밋 갱신 초안이며 검토에서 오류·누락이 확인됐다. 새 본문을 모두 합의된 계약으로 취급하거나 먼저 수동으로 완성해 지침 검증을 대신하지 않는다.

- 작업 정의와 두 실행: [Spec·Ticket 진입](current/memory/index.md)
- 지금 할 판단: [현재 상태](current/state/index.md)
- 원문과 대조 위치: [선택 자료](source/index.md)
- 결과 위치: [산출물](output/index.md), [생성·검토 기록](records/README.md)

002의 코드 리팩터링과 003의 버그 수정은 별도 Work다. 이 Workspace는 필요한 근거만 단방향으로 참고하며 두 Work의 진행이나 완료를 이어받지 않는다.

저장소 root에서 다음 명령으로 명시적 재진입한다.

```sh
python3 -B -m context.work.harness recover 004-project-context-contracts-and-guidance --json
```

`workspace.json`은 identity, `recover.json`은 Project 입력 선택, `verify.json`은 제한된 기계 검사 계약이다. 사람의 다음 행동은 state에 있고 `status.json`의 초기 값은 Verify 미실행을 뜻한다. 이번 생성은 기본 Workspace와 현재 session binding을 변경하지 않았다. 다른 세션에서 Maintain 연결이 필요하면 그 세션을 대상으로 명시적으로 연결한다.
