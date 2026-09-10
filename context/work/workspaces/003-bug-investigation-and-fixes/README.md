# 발견한 버그 확인·수정

기존 코드베이스 분석과 추가 조사에서 나온 동작 문제를 근거 수준에 맞게 확인하고 수정하는 독립 Work다. 실제 재현한 결함, 소스에서 확인한 불일치, 기대 동작이나 발생 조건이 더 필요한 후보를 구별한다.

- [Spec·전체 후보·Ticket](current/memory/index.md)
- [현재 상태와 다음 행동](current/state/index.md)
- [원자료와 재현 실험](source/index.md), [제품 산출물](output/index.md), [기록](records/README.md)

**현재는 Workspace 구성 단계이며 제품 수정과 실행 Ticket은 없다.** 사용자는 리팩토링부터 진행하기로 했으므로 이 Work는 후보와 근거를 보존한 준비 상태다. 직접 리팩토링을 막는 결함이 생기면 그 범위의 선행 관계를 판단한다.

같은 분석에서 코드 가독성 리팩토링 Work `002-code-readability-refactoring`를 함께 만들었다. 그 Work의 current를 먼저 읽거나 자동 추종하지 않는다. `001-noline-context-harness-application`의 이식 결과·검증 성공은 이 Work의 제품 증거가 아니다.

`workspace.json`은 identity, `recover.json`은 Project context 선택, `verify.json`은 제한된 고정 검증 계약이다. 사람의 다음 행동은 state가, 마지막 Verify 결과와 receipt는 `current/state/status.json`이 소유한다. 초기 `ready_for_verification`은 미실행 기계 상태이며 모든 후보가 수정 준비됐다는 뜻이 아니다.

명시적 재진입: `python3 -B -m context.work.harness recover 003-bug-investigation-and-fixes --json`

생성만 수행했으므로 active 기본값과 현재 session binding은 변경하지 않았다.
