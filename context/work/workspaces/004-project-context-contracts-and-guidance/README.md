# Project 계약 합의와 작성 지침 검증

002의 완료 작업을 Project context로 옮기는 과정에서 남은 제품 계약의 미합의와, 작성 지침을 적용해도 반복된 문서 구성 문제를 해결하는 후속 Work다. 제품 계약을 사용자와 구체화해 관련 기준 본문에 반영하고, 다른 세션이 지침을 읽어 적절한 본문을 구성하는지 실제 결과로 확인한다.

현재 Project 제품 문서의 사실·기존 의미·읽기 경로를 보완해 통화·날짜·API와 관련 current·guidance를 현재 기준으로 채택했다. 01에는 날짜의 장기 의미, 금액 정밀도·`주 통화` 라벨과 서버 오류 계약의 사용자 선택이 남아 있다. 02의 최소 지침 수정은 반영했고 다음 독립 Project 갱신에서 효과를 확인한다.

- 작업 정의와 두 실행: [Spec·Ticket 진입](current/memory/index.md)
- 지금 할 판단: [현재 상태](current/state/index.md)
- 원문과 대조 위치: [선택 자료](source/index.md)
- 결과 위치: [산출물](output/index.md), [생성·검토 기록](records/README.md)

002의 코드 리팩터링과 003의 버그 수정은 별도 Work다. 이 Workspace는 필요한 근거만 단방향으로 참고하며 두 Work의 진행이나 완료를 이어받지 않는다.

저장소 root에서 다음 명령으로 명시적 재진입한다.

```sh
python3 -B -m context.work.harness recover 004-project-context-contracts-and-guidance --json
```

`workspace.json`은 identity, `recover.json`은 Project 입력 선택, `verify.json`은 제한된 기계 검사 계약이다. 사람의 다음 행동은 state에 있고 `status.json`의 초기 값은 Verify 미실행을 뜻한다. 현재 session은 004에 binding generation 1로 명시 연결돼 있다. 다른 세션의 연결은 이어받지 않으므로 필요하면 그 세션을 대상으로 다시 명시한다.
