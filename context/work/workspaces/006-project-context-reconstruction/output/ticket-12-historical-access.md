# Ticket 12 — 역사 링크 재접근과 원판 보존 공백

2026-10-31의 검사 실패 **63건은 고유 target 29개**를 가리킨다. 27개 target은 옛 exact path의 immutable Git 객체를 확인했고, 2개는 기록 당시 원판의 보존을 확인하지 못했다. 27은 복구 경로가 있는 target 수이며 성공한 링크 수가 아니다. 63개 링크가 존재하는 현재 파일 경로로 자동 복구됐다는 뜻도 아니다.

## 현재 소비와 역사 재접근의 구분

[Workspace collection](../../README.md)은 source의 시점·무결성·재접근 경로와 records의 append-only 경계를 정의한다. Project 경로·책임 변경에서는 default, current generation에 명시적으로 bound된 Workspace와 이번 요청에서 명시한 Workspace의 Recover 선택·current·output을 reconcile한 뒤 역사 Workspace 비동기화 원칙을 적용한다.

Main은 17개 session metadata의 current generation만 확인해 bound 002·006, default 001을 보고했다. 004는 current generation이 없고 003·005 binding은 없었다. 이 관찰은 과거 generation의 원문을 읽거나 현재 binding을 제어한 결과가 아니며 향후에도 같은 상태임을 보장하지 않는다.

| 원문 역할 | baseline occurrence | 이번 처리 |
| --- | ---: | --- |
| records | 25 | 당시 판단·실행의 원문을 유지한다. |
| source | 2 | 선택한 코드 분석의 당시 관찰·분석 기준을 유지한다. |
| current | 26 | 모두 비소비 Workspace 003·004·005의 당시 입력이다. 재개 전 대조 대상으로 남긴다. |
| output | 10 | live 002의 중복 연결 1건을 정리한다. 나머지 9건은 비소비 Workspace의 당시 산출물 지도다. |

001의 실패 2건은 records이고 002의 11건 중 10건은 records/source다. 이들 Workspace가 live라는 사실만으로 역사 근거를 최신 제품 문서로 바꾸지 않는다. 한편 003·004·005의 `current`·`output`은 재개 때 사용될 수 있으므로 영구적으로 무시할 자료도 아니다.

live 002의 `output/index.md`에 있던 “프로젝트 결정 연결” 행은 제거된 실행 기준 호환 stub을 중복 연결했다. 상단에 이미 연결된 [실행 기준의 선택 이력](../../spec-and-tickets/HISTORY.md)을 유지하고 이 중복 행을 제거하는 것이 Main의 해결 범위다. 이 1건을 제거하면 동일 baseline의 남은 역사 링크 occurrence는 62건이다. **62건을 성공·통과로 분류하지 않는다.** 실제 현재 검사 결과는 Main이 별도로 확인한다.

## 재접근 지도

[기계용 상세 지도](ticket-12-historical-links.json)는 baseline 로그 원문·해시, 63개 occurrence의 문서 해시·원래 링크·행·분류, 29개 target의 실제 archive 경로·해시와 Git commit·path·blob을 담는다. source 해시는 002 output의 중복 행을 정리하기 전에 확보했다. 이 지도는 검사기의 예외나 현재 실행 경로를 추가하지 않는다.

아래의 archive는 역사 대조에 사용한다. 안내문이나 상대 링크 보정이 들어간 보존판도 있으므로 정확한 원문 바이트가 필요하면 JSON의 `original_git_object.access`에 있는 `git show <full commit>:<original path>`를 사용한다. Git 객체는 식별한 commit의 바이트를 보장하며 해당 record 작성 당시 미커밋 작업 트리까지 보장하지 않는다. ticket09의 9개, ticket10의 10개, history-integration의 28개 manifest 항목은 전체 SHA-256 일치를 직접 확인했다.

| ID · 원래 target | 역사 재접근 위치 | 원판 Git 객체 |
| --- | --- | --- |
| T01 · `.claude/decisions/2026-09-11-workspace-writing-contract.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-09-11-workspace-writing-contract.md.txt) | `1648540783d1` · 상세 지도에 full commit/path/blob |
| T02 · `.claude/decisions/2026-10-30-development-skill-transition.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-10-30-development-skill-transition.md.txt) | `1648540783d1` · 상세 지도에 full commit/path/blob |
| T03 · `.claude/decisions/2026-09-12-spec-ticket-execution-criteria.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-09-12-spec-ticket-execution-criteria.md.txt) | `1648540783d1` · 상세 지도에 full commit/path/blob |
| T04 · `.claude/decisions/2026-09-18-app-startup-failure-recovery.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2026-09-18-app-startup-failure-recovery.md) | `f466a32ac22b` · 상세 지도에 full commit/path/blob |
| T05 · `apps/client/src/shared/services/auth/session-restoration.ts` | 별도 archive 없음 | **확인 불가** |
| T06 · `.claude/decisions/2026-09-18-device-session-and-local-access.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2026-09-18-device-session-and-local-access.md) | `f466a32ac22b` · 상세 지도에 full commit/path/blob |
| T07 · `apps/client/src/screens/read-query.ts` | 별도 archive 없음 | **확인 불가** |
| T08 · `apps/client/src/features/schedule/create-schedule/useLocationSearch.ts` | 별도 archive 없음 | `ee1c00521946` · 상세 지도에 full commit/path/blob |
| T09 · `.claude/context/policy-architecture.md` | [보존판](../../../../../.claude/_archive/policy-architecture-pre-project-2026-10-30.md) | `c9eb33cac631` · 상세 지도에 full commit/path/blob |
| T10 · `.claude/decisions/2026-10-02-expense-draft-and-schedule-association.md` | [보존판](../../../../../.claude/_archive/expense-association-decision-pre-project-2026-10-31.md) | `cde5f979f002` · 상세 지도에 full commit/path/blob |
| T11 · `.claude/decisions/2026-10-02-expense-date-boundaries.md` | [보존판](../../../../../.claude/_archive/expense-date-decision-pre-project-2026-10-31.md) | `cde5f979f002` · 상세 지도에 full commit/path/blob |
| T12 · `.claude/decisions/2026-10-06-trip-city-time-zone.md` | [보존판](../../../../../.claude/_archive/trip-time-zone-decision-pre-project-2026-10-31.md) | `cde5f979f002` · 상세 지도에 full commit/path/blob |
| T13 · `apps/client/src/features/trip/create-trip/useCreateTripForm.ts` | 별도 archive 없음 | `b4ed41f6e4bb` · 상세 지도에 full commit/path/blob |
| T14 · `.claude/rules/activation-router.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/rules/activation-router.md) | `55dbe0a281a8` · 상세 지도에 full commit/path/blob |
| T15 · `.claude/rules/transaction-sync-queue.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/rules/transaction-sync-queue.md) | `55dbe0a281a8` · 상세 지도에 full commit/path/blob |
| T16 · `.claude/rules/schema-first.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/rules/schema-first.md) | `55dbe0a281a8` · 상세 지도에 full commit/path/blob |
| T17 · `.claude/rules/auth-user-scope.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/rules/auth-user-scope.md) | `55dbe0a281a8` · 상세 지도에 full commit/path/blob |
| T18 · `.claude/guards/README.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/guards/README.md) | `55dbe0a281a8` · 상세 지도에 full commit/path/blob |
| T19 · `.claude/runbooks/README.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-10/runbooks/README.md.txt) | `c6bc416e8c5b` · 상세 지도에 full commit/path/blob |
| T20 · `.claude/context/currency.md` | [보존판](../../../../../.claude/_archive/currency-pre-project-2026-10-31.md) | `6d95e189e6e3` · 상세 지도에 full commit/path/blob |
| T21 · `.claude/context/time.md` | [보존판](../../../../../.claude/_archive/time-pre-project-2026-10-31.md) | `cde5f979f002` · 상세 지도에 full commit/path/blob |
| T22 · `.claude/context/api-data.md` | [보존판](../../../../../.claude/_archive/api-data-pre-project-2026-10-31.md) | `6d95e189e6e3` · 상세 지도에 full commit/path/blob |
| T23 · `.claude/context/error-handling.md` | [보존판](../../../../../.claude/_archive/error-handling-pre-project-2026-10-31.md) | `6d95e189e6e3` · 상세 지도에 full commit/path/blob |
| T24 · `.claude/decisions/2026-09-14-project-context-semantic-and-routing-verification.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-09-14-project-context-semantic-and-routing-verification.md.txt) | `1648540783d1` · 상세 지도에 full commit/path/blob |
| T25 · `.claude/context/selective-activation-architecture.md` | [보존판](../../../../../.claude/_archive/selective-activation-pre-project-2026-10-31.md) | `725e6d583916` · 상세 지도에 full commit/path/blob |
| T26 · `.claude/context/form.md` | [보존판](../../../../../.claude/_archive/form-pre-project-2026-10-31.md) | `cde5f979f002` · 상세 지도에 full commit/path/blob |
| T27 · `.claude/context/README.md` | [보존판](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-08/context/README.md) | `f466a32ac22b` · 상세 지도에 full commit/path/blob |
| T28 · `.claude/context/components.md` | [보존판](../../../../../.claude/_archive/components-pre-project-2026-10-31.md) | `efb59516d84c` · 상세 지도에 full commit/path/blob |
| T29 · `.claude/context/manual-input.md` | [보존판](../../../../../.claude/_archive/manual-input-pre-project-2026-10-31.md) | `cde5f979f002` · 상세 지도에 full commit/path/blob |

## 정확한 원판이 확인되지 않은 두 경로

`apps/client/src/shared/services/auth/session-restoration.ts`는 현재 파일도 exact path의 `git log --all` 이력도 없다. [당시 인증 구현 기록](../../002-code-readability-refactoring/records/2026-09-18-05-auth-session-implementation.md)은 “아래 제품 변경과 실행 기록은 그 커밋 이후의 작업이며 아직 커밋하지 않았다.”고 밝히고, 해당 경로를 “복원 연결”로 연결한다. 따라서 현재 부재만으로 보존 당시 잘못된 링크였다고 단정할 수 없지만 원판이 Git에 보존됐다고도 말할 수 없다. 후속 commit `34fba69`·`62ce226`의 auth 구현·테스트는 이후 결과를 조사하는 자료이며 이 미커밋 원판의 복구 증거가 아니다.

`apps/client/src/screens/read-query.ts`도 현재 파일과 exact path의 전체 Git 이력이 없다. [당시 조회 조합 시험 기록](../../002-code-readability-refactoring/records/2026-09-29-07-read-query-composition-trial.md)은 “Main은 기존 경비 복구 작업을 `ed50ce1`로 저장하고, 제안 중 접근 조건·표시 판단 공통화 하나를 미커밋으로 적용했다.”고 적었다. [후속 배치 기록](../../002-code-readability-refactoring/records/2026-09-29-09-policy-query-ownership-and-migration.md)은 “기존 `screens/read-query.ts`, `features/trip/read-query`와 시험용 `useSchedulesRead`·`useReadQuery` 공개 이름을 제거했다.”고 명시한다. `b4db89d`의 `shared/services/policy-query/useTripReadAccess.ts`, `usePolicyReadQuery.ts`와 feature query 파일에서 채택 결과는 찾을 수 있지만 초기 trial의 정확한 원판은 아니다.

따라서 [Ticket 08 역사 참조 목록](ticket-08-historical-references.md)의 “옛 코드 경로는 기록 시점의 Git 판본으로”라는 안내는 이 두 target에는 입증되지 않는다. 당시 문서를 소급 수정하지 않고 이 정정과 공백을 여기에서 연결한다. 기록의 의미·후속 구현을 재검토하는 것은 가능하지만 초기 코드의 모든 바이트·시험 결과를 재현할 수 있다는 주장은 하지 않는다.

## 검사와 남은 판단

원문 records/source와 비소비 Workspace를 최신화하거나 호환 파일로 되살리지 않는다. strict checker의 링크 검사는 유지하며, 이 지도를 만들었다는 이유로 missing을 통과시키는 allowlist·전역 loader·검사 예외를 추가하지 않는다. 검사 실패와 역사 자료의 의미상 결함은 서로 다른 사실로 보고한다.

남은 실질 공백은 두 미커밋 코드 원판의 부재다. 별도 snapshot이나 당시 작업 트리의 객관적 보존물을 나중에 확보하면 그 바이트·시점·해시를 새 근거로 연결할 수 있다. 현재로서는 보존 확인 불가로 남긴다. 003·004·005를 다시 소비할 때는 binding·Recover 선택·current·output을 현재 Owner와 대조해야 하며 이 날짜의 비소비 판정을 자동 재사용하지 않는다.
