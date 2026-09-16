# 코드 가독성 리팩토링

작은 코드 요소부터 의도를 읽기 쉽게 다듬고, 기존 제품 동작을 보존하는 Work다. 사용자는 버그 수정에 앞서 이 작업을 진행하며 큰 구조보다 함수 내부 표현과 가독성에 집중하기를 원했다.

- [Spec·전체 후보·Ticket](current/memory/index.md)
- [현재 상태와 다음 행동](current/state/index.md)
- [원자료](source/index.md), [제품 산출물](output/index.md), [기록](records/README.md)

현재 작업 단계와 다음 행동은 [state](current/state/index.md), 작업 범위와 진행 방식은 [Spec](current/memory/spec/05-constraints-design-assumptions.md), 실행 후보는 [Ticket 색인](current/memory/tickets/index.md)에서 확인한다. 합의의 이유와 과정은 [기록](records/README.md)에 남긴다.

같은 분석에서 [버그 확인·수정 Work](../003-bug-investigation-and-fixes/README.md)를 함께 만들었다. 두 Work는 독립된 Spec과 상태를 가지며 다른 Work의 current를 먼저 복구할 필요가 없다. 버그의 상세 재현 근거만 필요한 시점에 해당 원자료를 선택한다. 이후 사용자는 [Ticket 06](current/memory/tickets/06-app-startup-lifecycle.md)의 네트워크 관측·정책 연결에 직접 필요한 수정은 이 Work에서 함께 수행하기로 했다. 이 범위의 예외와 나머지 담당 경계는 Spec·Ticket에 명시했다. 기존 `001-noline-context-harness-application`은 Context Harness 이식 작업이며 제품 리팩토링의 predecessor로 간주하지 않는다.

`workspace.json`은 identity, `recover.json`은 Project context 선택, `verify.json`은 제한된 고정 검증 계약이다. 사람의 다음 행동은 state가, 마지막 Verify 결과와 receipt는 `current/state/status.json`이 소유한다. 초기 `ready_for_verification`은 미실행 기계 상태이며 제품 준비 완료·사용자 수락이 아니다.

명시적 재진입: `python3 -B -m context.work.harness recover 002-code-readability-refactoring --json`

초기 생성 당시에는 active 기본값과 session binding을 변경하지 않았다. 이후 session 연결·전환은 [session binding 계약](../../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 따른다. 문서 구성은 activation이나 제품 검증 실행을 뜻하지 않는다.
