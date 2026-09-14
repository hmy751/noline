# 시험 제품 초안 원복

날짜: 2026-09-14

사용자는 Ticket 02의 지침 보강과 재시험을 확인한 뒤 원복 전 시험이 만든 제품 초안을 되돌리도록 요청했다. Main은 004의 생성 기록과 Git diff를 대조해 시험 산출물만 exact 목록으로 한정했다.

기준 HEAD 상태로 복원한 tracked 파일은 다음 10개다.

- `.claude/context/README.md`
- `.claude/context/api-data.md`
- `.claude/context/currency.md`
- `.claude/context/time.md`
- `context/project/README.md`
- `context/project/common/README.md`
- `context/project/common/product.md`
- `context/project/current/README.md`
- `context/project/current/architecture.md`
- `context/project/guidance/README.md`

시험에서 새로 만든 다음 4개 미추적 파일은 삭제했다.

- `context/project/common/currency.md`
- `context/project/common/date-and-time.md`
- `context/project/guidance/api-contracts.md`
- `context/project/guidance/behavior-preserving-refactoring.md`

Ticket 02가 채택한 `MAINTENANCE.md`, `REFERENCE`, 읽기·갱신 skill, 후속 decision과 Workspace 기록은 원복 대상이 아니다. 002의 별도 변경과 `.pnpm-store/`도 수정하지 않았다. 삭제한 초안의 문제 문구와 판정 근거는 기존 source·01/02 record 및 기준 commit 접근 경로에 남아 있다.

삭제된 본문을 선택하던 004 `recover.json`은 현재 존재하는 Project README와 제품 의미 본문만 선택하도록 맞췄다. 같은 초안을 선택하던 002의 `recover.json`과 사람용 Project 선택도 다른 내용을 바꾸지 않고 기존 Owner로 되돌렸다. 01은 기존 `.claude` 통화·시간·API/Data Owner와 source·코드에서 다시 시작하며, 새 Project 본문이 합의·작성되기 전에는 Owner 이동이 완료됐다고 보지 않는다.

과거 002 날짜별 record 한 곳에는 당시 존재하던 `context/project/common/currency.md` 링크가 남아 있다. append-only 근거를 현재 경로로 고쳐 당시 상태를 바꾸지 않았으며, 현재 Owner는 이 기록과 004 state에서 `.claude/context/currency.md`로 명시한다. 이 때문에 전체 Harness link 검사는 해당 역사 링크 한 건을 계속 보고할 수 있고, 002·004의 실제 Recover 성공과는 구별한다.

## 원복 확인

- tracked 초안 파일 10개가 HEAD와 같은지 확인했다.
- 새 초안 파일 4개가 존재하지 않는지 확인했다.
- 002·004 명시 Recover와 id 없는 기본 Recover가 모두 성공했다.
- `git diff --check`가 통과했다.
- `node scripts/check-harness.mjs`는 위 002 append-only record의 제거된 통화 초안 링크 한 건만 보고했다.
