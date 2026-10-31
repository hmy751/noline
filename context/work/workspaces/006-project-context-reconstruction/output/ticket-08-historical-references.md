# 전체 Harness의 남은 역사 참조

2026-10-31 Ticket 08에서 `node scripts/check-harness.mjs`를 실행한 결과다. 현재 제품 진입점의 누락은 수정했고, 아래 **47건**은 과거 Work records/source 또는 현재 default·explicit-bound consumer가 아닌 003·004·005의 문서에서 발생한다. 002가 live여도 그 records/source는 당시 근거다. 이 결과를 검사 통과나 제품 이관 미완료 전체와 혼동하지 않는다.

검사기는 변경하지 않았다. 기록의 원문·당시 판단을 현재 답으로 바꾸거나 옛 정본을 복원하지 않았다. 따라서 전체 Harness와 그것을 사용하는 001 Verify는 여전히 통과를 주장할 수 없다. 001 evidence의 존재 누락을 고친 것과 명령 자체의 실패는 별개다. 옛 코드 경로 중 Git 원판이 존재하는 것은 해당 immutable 객체로, 옛 문서는 주제별 보존판으로 역사 조사한다. 다만 session-restoration.ts와 screens/read-query.ts는 당시 미커밋 시도로 기록됐고 exact path의 Git 원판이 확인되지 않는다. 후속 구현을 그 원판이라고 대체하지 않는다. Ticket 12의 [재접근 지도](ticket-12-historical-access.md)가 최신 범위와 확인 한계를 설명한다. 이 표의 문자열은 현재 제품 읽기 링크가 아니다.

현재 default는 001, current-generation binding metadata에서 확인한 Workspace는 002·006이다. 향후 003·004·005를 재개하면 Recover 선택 본문과 current/output의 읽기 경로를 먼저 대조해야 한다. 이 목록은 그 재개의 처리 입력이며 해당 Workspace를 지금 활성화하거나 동기화하지 않았다.

| 원문 위치 | 당시 참조 | 분류 |
| --- | --- | --- |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-09-18-02-app-initialization-and-style.md` | `../../../../../.claude/decisions/2026-09-18-app-startup-failure-recovery.md` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-09-18-05-auth-session-implementation.md` | `../../../../../apps/client/src/shared/services/auth/session-restoration.ts` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-09-19-01-auth-complexity-review-and-decisions.md` | `../../../../../.claude/decisions/2026-09-18-device-session-and-local-access.md` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-09-29-07-read-query-composition-trial.md` | `../../../../../apps/client/src/screens/read-query.ts` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-10-01-01-schedule-create-provisional-review.md` | `../../../../../apps/client/src/features/schedule/create-schedule/useLocationSearch.ts` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-10-02-03-expense-time-decisions-and-verification.md` | `../../../../../.claude/context/policy-architecture.md` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-10-02-03-expense-time-decisions-and-verification.md` | `../../../../../.claude/decisions/2026-10-02-expense-draft-and-schedule-association.md` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-10-02-03-expense-time-decisions-and-verification.md` | `../../../../../.claude/decisions/2026-10-02-expense-date-boundaries.md` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/records/2026-10-06-01-city-time-zone-commits-and-original-bug-continuity.md` | `../../../../../.claude/decisions/2026-10-06-trip-city-time-zone.md` | 보존 records/source |
| `context/work/workspaces/002-code-readability-refactoring/source/codebase-analysis/components.md` | `../../../../../../apps/client/src/features/trip/create-trip/useCreateTripForm.ts` | 보존 records/source |
| `context/work/workspaces/003-bug-investigation-and-fixes/current/memory/tickets/09-map-search-route-behavior.md` | `../../../../../../../apps/client/src/features/schedule/create-schedule/useLocationSearch.ts` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/003-bug-investigation-and-fixes/records/2026-09-13-02-major-feature-category-investigation.md` | `../../../../../apps/client/src/features/schedule/create-schedule/useLocationSearch.ts` | 보존 records/source |
| `context/work/workspaces/003-bug-investigation-and-fixes/records/2026-09-13-02-major-feature-category-investigation.md` | `../../../../../apps/client/src/features/trip/create-trip/useCreateTripForm.ts` | 보존 records/source |
| `context/work/workspaces/003-bug-investigation-and-fixes/source/codebase-analysis/components.md` | `../../../../../../apps/client/src/features/trip/create-trip/useCreateTripForm.ts` | 보존 records/source |
| `context/work/workspaces/004-project-context-contracts-and-guidance/current/memory/project-context.md` | `../../../../../../.claude/context/currency.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/004-project-context-contracts-and-guidance/current/memory/project-context.md` | `../../../../../../.claude/context/time.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/004-project-context-contracts-and-guidance/current/memory/project-context.md` | `../../../../../../.claude/context/api-data.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/004-project-context-contracts-and-guidance/current/memory/tickets/01-product-contract-agreements.md` | `../../../../../../../.claude/context/error-handling.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/project-context.md` | `../../../../../../.claude/context/policy-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/project-context.md` | `../../../../../../.claude/context/error-handling.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/project-context.md` | `../../../../../../.claude/context/selective-activation-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/project-context.md` | `../../../../../../.claude/context/form.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/project-context.md` | `../../../../../../.claude/context/README.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/tickets/02-policy-query-composition.md` | `../../../../../../../.claude/context/policy-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/tickets/05-network-read-context.md` | `../../../../../../../.claude/context/policy-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/tickets/05-network-read-context.md` | `../../../../../../../.claude/context/selective-activation-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/tickets/05-network-read-context.md` | `../../../../../../../.claude/context/policy-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/tickets/05-network-read-context.md` | `../../../../../../../.claude/context/error-handling.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/tickets/06-draft-input-context.md` | `../../../../../../../.claude/context/form.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/current/memory/tickets/06-draft-input-context.md` | `../../../../../../../.claude/context/form.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/output/index.md` | `../../../../../.claude/context/policy-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/output/index.md` | `../../../../../.claude/context/error-handling.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/output/index.md` | `../../../../../.claude/context/selective-activation-architecture.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/output/index.md` | `../../../../../.claude/context/form.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/output/index.md` | `../../../../../.claude/context/components.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/output/index.md` | `../../../../../.claude/context/manual-input.md` | 현재 live consumer가 아닌 Workspace의 당시 current/output |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-07-impact-and-context-reassessment.md` | `../../../../../.claude/decisions/2026-09-18-device-session-and-local-access.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-07-impact-and-context-reassessment.md` | `../../../../../.claude/context/policy-architecture.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-07-impact-and-context-reassessment.md` | `../../../../../.claude/context/selective-activation-architecture.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-13-network-read-context.md` | `../../../../../.claude/context/policy-architecture.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-13-network-read-context.md` | `../../../../../.claude/context/error-handling.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-13-network-read-context.md` | `../../../../../.claude/context/selective-activation-architecture.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-14-save05-and-review06.md` | `../../../../../.claude/context/form.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-14-save05-and-review06.md` | `../../../../../.claude/context/components.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-15-draft-input-context.md` | `../../../../../.claude/context/form.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-15-draft-input-context.md` | `../../../../../.claude/context/components.md` | 보존 records/source |
| `context/work/workspaces/005-context-based-code-improvement/records/2026-10-30-15-draft-input-context.md` | `../../../../../.claude/context/manual-input.md` | 보존 records/source |

옛 제품 자료의 보존 위치와 현재 Owner는 [Ticket 08 결과](ticket-08-result.md) 및 [앞선 주제별 이관 결과](index.md)에서 찾는다.
