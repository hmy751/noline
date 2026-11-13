# 산출물과 읽을 이유

최신 제품 커밋은 **44d2a5ef**, 2단계 기록 커밋은 **9f3e87f2**다. [3단계 정리](../records/2026-11-13-05-stage-three-pull-review.md)와 [4〜7단계 수행·검증](../records/2026-11-13-06-stages-four-through-seven-review.md)의 산출물은 유지한다. 이번 [원문 재대조와 정정](../records/2026-11-13-07-review-depth-and-completion-correction.md)에서 세부 품질까지 충분히 적용했다는 포괄적 완료 판단을 거뒀으며 주요 유지 판단의 표현·책임 설계 보완 검토가 남는다. 이번에는 문서만 보완했다.

4〜7단계 제품 delta는 entity-mutations의 표식 보존 이유 주석, engine의 다음 요청 전 실패 단계 초기화, retry 회귀 19줄이다. client902·서버73·PG50 통과는 당시 판본의 유효한 동작 회귀 근거이며 표현 품질의 충분성까지 증명하지 않는다. 제품 후속은 미커밋이고 사용자 최종 수락·선별 커밋·배포는 별도다.

| 산출물 | 상태 | 언제 읽는가 |
| --- | --- | --- |
| [schedules.ts](../../../../../apps/server/src/routes/schedules.ts), [expenses.ts](../../../../../apps/server/src/routes/expenses.ts)의 생성·삭제 route | 커밋 `ba91d1a3`. Ticket 01 | 재전송 응답의 현재 구현을 확인할 때 |
| [route 단위 테스트](../../../../../apps/server/tests/routes/replay.idempotency.test.ts), [PostgreSQL 통합 테스트](../../../../../apps/server/tests/integration/replay.idempotency.test.ts), [테스트 DB 대역](../../../../../apps/server/tests/support/test-app.ts) | 커밋 `ba91d1a3`. 생성·삭제·여행 삭제 재전송 | Ticket 01의 확인 근거를 다시 실행할 때 |
| [queue.ts](../../../../../apps/client/src/shared/services/sync/queue.ts), [engine.ts](../../../../../apps/client/src/shared/services/sync/engine.ts) | 커밋 `437cc5c7`. Ticket 02 | 큐 되돌림·재시도 선택의 현재 구현을 확인할 때 |
| [local-access.test.ts](../../../../../apps/client/tests/shared/services/auth/local-access.test.ts), [retry.test.ts](../../../../../apps/client/tests/shared/services/sync/retry.test.ts) 외 sync 테스트 2개 | 커밋 `437cc5c7` | Ticket 02의 확인 근거를 다시 실행할 때 |
| [API 계약의 큐 작업 재전송 절](../../../../project/guidance/api-contracts.md#큐-작업-재전송에는-이미-반영된-결과로-응답한다), [데이터 수명의 push 절](../../../../project/guidance/data-lifecycle/INDEX.md#push를-바꾸면-전송-상태와-두-종류의-재시도를-구별한다) | 커밋 `7f8cb819`. Ticket 01·02의 Project 반영. 간격 재시도 보류 문장은 `c8ab78b2` | 1단계 뒤의 지속 계약을 확인할 때 |
| [데이터 수명의 형성 자료](../../../../project/guidance/data-lifecycle/_background/README.md), [API 계약의 형성 자료](../../../../project/guidance/_background/api-contracts/README.md) | 재시도 한도 제거·IN_PROGRESS 되돌림·간격 재시도 보류와 재전송 응답의 선택 이유·근거. 2026-11-03 보완, 커밋 `74a402a4` | 위 계약을 바꾸거나 선택을 다시 판단할 때 |
| [Ticket 06의 관측 기준과 완료 확인](../current/memory/tickets/06-stalled-sync-visibility.md) | 최종 앱·서버의 staging 이벤트와 실행 trace 수신. [이번 릴리스 확인 기록](../records/2026-11-10-02-diagnostics-review.md#최종-수정판의-staging-대시보드-확인) | 로컬 사건을 서버 응답과 구별하는 기준, 오프라인·계정 전환에서 확인할 범위를 찾을 때 |
| [앱 진단](../../../../../apps/client/src/shared/diagnostics/sentry.ts), [서버 진단](../../../../../apps/server/src/services/sentry.ts), [연결 안내](../../../../../START_GUIDE.md), [Release 빌드와 로컬 수신 기록](../records/2026-11-09-01-sentry-local-receiver.md) | 최초 로컬 수신 확인 뒤 [재점검과 수정판 검증](../records/2026-11-10-02-diagnostics-review.md)에서 앱 테스트 702개·변경 lint, 서버 테스트 73개·타입 검사·빌드 통과 | 로컬 수신기에서 관측한 수치와 실제 Sentry 운영에 남은 확인을 구별할 때 |
| [실제 Sentry 프로젝트 시험과 설정](../records/2026-11-10-01-sentry-staging.md) | staging 앱·서버 수신, TypeError의 원래 JS 파일·행 복원, 두 프로젝트에 기본 Error 알림 적용. 반복 Warning 규칙 미설정. 신규 이벤트의 IP는 보이지 않으나 도시는 표시됨. 운영 배포·EAS 설정은 별도 | 실제 이슈·알림 링크, 초기 이벤트의 IP 저장과 설정 변경의 적용 범위를 볼 때 |
| [Ticket 08 격리·삭제 소유권의 Project 기준](../../../../project/guidance/data-lifecycle/INDEX.md), [계정 판단과 로그아웃](../../../../project/current/app-runtime/INDEX.md), [여행 목록 갱신](../../../../project/guidance/travel-access/INDEX.md), [선택 이유](../../../../project/guidance/data-lifecycle/_background/context.md) | 격리 및 새 DELETE 소유자 기록은 커밋 `89bf4fd8`에 반영 | 격리 기록을 로그인·전송·정리에서 어떻게 다루는지, 원본 없이 보낼 수 있는 새 DELETE의 조건을 확인할 때 |
| [Ticket 08 계정 검사](../../../../../apps/client/src/shared/services/auth/local-account.ts), [queue 처리](../../../../../apps/client/src/shared/services/sync/queue.ts), [client DB schema](../../../../../apps/client/src/shared/db/schema.ts), [공유 queue 상태 정의](../../../../../packages/schema/src/sync/sync-queue.ts), [로그아웃 검사](../../../../../apps/client/src/shared/services/auth/logout-service.ts), [vacuum](../../../../../apps/client/src/shared/services/sync/cleanup-job.ts) | 3종 QUARANTINED 구현은 로컬 커밋 `06cebd6f`·미배포. 2026-11-07 새 여행·일정·경비 DELETE에 검증된 `userId`를 원자적으로 저장하고 계정 검사에 사용하는 후속 구현과 회귀 검사를 로컬 커밋 `30783ccb`에 저장. 11-09 구버전 DELETE 격리 유지·여행 비활성화 시 보존·기기 DB 전체 초기화 시 폐기로 확정. 구현 추가 변경 없음 | 원본 없는 큐 작업의 보존·전송 제외·계정 보호와 새 DELETE 소유권 근거를 확인할 때 |
| [Ticket 08 회귀 검사](../../../../../apps/client/tests/shared/services/auth/orphaned-queue.test.ts), [기존 계정 회귀 검사](../../../../../apps/client/tests/shared/services/auth/local-access.test.ts), [sync 회귀 검사](../../../../../apps/client/tests/shared/services/sync/retry.test.ts)와 관련 sync 테스트 | 격리 보완 뒤 client 677개가 통과했다. 소유자 저장 구현 뒤에는 실제 SQLite에서 소유자 기록·다른 계정 차단·저장 실패 rollback을 확인하고 client 691개와 iOS 개발 번들이 통과했다고 Main이 보고. 이어 iPhone 15 Pro 시뮬레이터에서 일정의 기기 원본만 제거한 뒤 저장된 `userId`로 로컬 개발 서버 PostgreSQL에 삭제를 반영하고 큐가 0건이 되는 경로를 확인했으며 691개 테스트도 다시 통과. 11-09 마무리 시 격리·로그아웃 동기화·정리 수명 검사 3개 묶음 48개 통과. 전체 typecheck에는 기존 오류 8개가 남고, 실제 1.0.1 업데이트·물리 기기 UI·다른 계정 실제 로그인 전환은 미확인 | Ticket 08의 공유 schema 일치, 격리·소유권 근거 동작과 확인 한계를 다시 판단할 때 |
| [배포 SQL](../../../../../apps/server/sql/) | 적용 전 · SQL → 서버 → 앱 배포가 남음 | field edits·서버 보류 입력 저장소를 운영 DB에 먼저 준비할 때 |
| [mutation 서비스](../../../../../apps/server/src/services/entity-mutations.ts), [편집 표식 계약](../../../../../packages/schema/src/sync/field-edits.ts), [충돌 응답](../../../../../packages/schema/src/responses/mutation-conflict.ts) | Ticket 07 로컬 구현·미배포 | 표식 병합·호환 충돌·소유 삭제·관계 정리를 확인할 때 |
| [서버 보류 입력 저장](../../../../../apps/server/src/services/legacy-update-holds.ts), [계정별 조회·해제 route](../../../../../apps/server/src/routes/legacy-holds.ts) | 구버전 직접 요청도 계정 서버에 원문 저장, 다른 새 앱 복구·해제 | 요청 기기가 종료돼도 입력을 되찾는 경계와 배포 SQL 필요를 확인할 때 |
| [기기 reconcile](../../../../../apps/client/src/shared/services/sync/reconcile.ts), [보류 입력](../../../../../apps/client/src/shared/services/sync/legacy-holds.ts), [복구 UI](../../../../../apps/client/src/features/sync-recovery/) | Ticket 07·003-12 공동 개발·검증 완료 · 배포 별도 | 후속 pending 보존·옛 입력 복구와 해제 조건을 확인할 때 |
| [공동 구현·검증 기록](../records/2026-11-10-04-conflict-pull-implementation.md) | PostgreSQL·두 시뮬레이터 결과, 실제 UI·최종 독립 재검증 완료 | 최신 검증 범위와 배포 전 남은 확인을 판단할 때 |
| [verify.json](../verify.json)과 [Verify receipt](../records/receipts/verify/) | Ticket 03. 서버 재전송 route 단위 테스트의 claim, 2026-11-03 `verification_passed` | 서버 재전송 경로가 Verify 뒤에 바뀌었는지 Recover로 확인하거나 다시 실행할 때 |

배포 경과와 결과는 [배포 기록](../records/2026-11-03-08-release-deploy-and-build-13.md)에 있다. 새 산출물이 생기면 이 표에 canonical 경로를 연결하며 복제하지 않는다.

이 표에 있다는 사실은 검증 통과나 사용자 수락을 뜻하지 않는다. 진행은 [state](../current/state/index.md)를 따른다.

선행 전체 Ticket의 후속 보완과 완료 근거는 [추가 독립 검토·최종 검증](../records/2026-11-10-05-conflict-pull-review-fixes.md)에서 확인한다. 최종 저장소 검사 수치는 client 797/797·서버 73/73·PostgreSQL 49/49이며, 배포는 미실행이다.

저장 1단계의 한정 결과는 [11월 12일 검토·코드 정리](../records/2026-11-12-01-save-stage-review-and-cleanup.md)에서 읽는다. client 828/828·독립 92개가 통과했고, 폼/회차 보호·기존 조회 갱신·순수 helper·Local 반환·서버 처리 후 기기 준비 실패를 보완했다. 이 검사 수치를 선행 서버·PostgreSQL·네이티브 전체 재실행 결과로 사용하지 않는다. 배포는 미실행이다.

2〜7단계 후속과 전체 연결 확인을 완료했다. [단계별 선택·검증과 1〜7단계 코드 리뷰 진입](../records/2026-11-12-02-staged-review-followups.md)에서 사용자 리뷰를 시작한다. 최종 client 847/847·서버 73/73·PostgreSQL 49/49, 서버 타입 통과이며 기존 client 타입 오류 7개·문서 링크 문제 64개는 남는다. 네이티브·Keychain·제품 Axios interceptor·Cloud 재수집은 이번 확인 범위 밖이다. 사용자 수락·커밋·배포는 미실행이다.

선행 제출 상태 정리는 [RHF 제출 상태와 사용자 이벤트 정리](../records/2026-11-12-05-rhf-submitting-and-user-events.md)를 따른다. [경비 Drawer](../../../../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx)·[일정 Drawer](../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)는 각 폼의 isSubmitting으로 저장·닫기를 제어하고 이전 응답의 새 입력 보호는 유지한다. 공통 저장 잠금 훅은 삭제했으며 순차 사용자 동작·강제 전환 뒤 독립 입력 보호를 확인했고 별도 전체 client 853/853이 통과했다. 관련 39개는 전체에 포함되며 실제 Drawer의 콜백 계약 검사는 네이티브 제스처 확인으로 확대하지 않는다. 선행 852/12·표현 정리 42개는 당시 근거다. 네이티브 수정창 확인도 여전히 남는다.

선행 저장 UI 후속은 [제출값 저장 성공 후 닫기와 UI 간결화](../records/2026-11-12-07-success-close-and-mounted-guard.md)다. 사용자가 추가 입력 보존 대신 성공 후 닫기를 선택했고 성공 reset·일정 기준 재설정은 제거했다. 초기 snapshot·isMounted 수명 보호는 유지한다. 관련 두 묶음 41개가 Main·독립 실행에서 각각 통과했다. 네이티브 수정창·수락·커밋·push·배포는 미실행이다.

최신 후속은 [일정 경로 범위·캐시 정리](../records/2026-11-12-08-route-preparation-scope-and-cache.md)다. [공통 downloader](../../../../../apps/client/src/shared/services/directions/route-downloader.ts)·[구간/캐시 matcher](../../../../../apps/client/src/shared/services/directions/route-plan.ts)·[migration](../../../../../apps/client/src/shared/db/migrations/route-inputs.ts)·[지도 표시](../../../../../apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx)를 함께 본다. 이번 한정 구현·검토·독립 검증은 완료했다. 전체 client 877개 이후 추가한 두 실패 주입은 engine/migration 20개에서 확인했고 전체 879 재실행은 아니다. native Mapbox/live Directions는 미실행이다.

경로 두 파일은 후속 표현 정리로 보조 함수 배치와 `isSameRouteSegment` 비교만 간결화했다. 관련 3묶음 24개가 통과했고 lint 오류/경고는 0, 기존 타입 오류 7개는 동일하다. 조회·캐시·세션·트랜잭션 동작과 위 미확인 범위는 유지하며 전체 검사를 다시 실행한 결과는 아니다.

최신 저장 경계는 [Repository 단일 준비와 Local/API 내부 입력](../records/2026-11-12-09-route-commit-and-save-boundaries.md)을 따른다. [PreparedEdit](../../../../../apps/client/src/shared/services/edit-stamp/index.ts)·[직접 수정 실패 처리](../../../../../apps/client/src/shared/services/sync/direct-update-failure.ts)와 CRUD 네 data 훅을 본다. 전체 892개와 관련 독립36개로 한정 수정·검증을 마쳤으며 이번 변경은 미커밋이다. 두 수치를 합산하지 않으며 lint 오류/경고 0·기존 타입7을 구별한다. 경로 분리 커밋 a527e977(코드/테스트15·분리판726)은 별도이며 push는 하지 않았다.

1단계 클라이언트 저장은 **8f94af5c**로 분리 커밋했다([53파일의 범위·분리판 검사](../records/2026-11-12-10-stage-one-isolated-commit.md)). 앞선 저장 경계 전체 판에서 직접 실패/구버전·삭제·응답/pull 조합은 제외해 미커밋으로 유지했다. 이 분리판 client789·독립37·기존 서버73은 전체 workingtree892·독립36과 구별한다. push·배포는 하지 않았다.

앞선 [007 Ticket 09](../current/memory/tickets/09-staged-code-review-and-refinement.md)는 [선언적 수신 흐름 재구성](../records/2026-11-13-01-declarative-reconcile-flow.md)의 수정·검토·검증을 완료했다. 실제 수정 대상은 [reconcile.ts](../../../../../apps/client/src/shared/services/sync/reconcile.ts)이며 서버 판단·저장, Local 판단·반영, ACK의 범위를 본문에 드러내고 개행을 정리한다. 최신 자기검사 158개·독립 9개, Airbnb 기반 변경 lint·빈 줄 추가 규칙 오류/경고 0, 기존 타입 오류 7개의 전후 일치를 확인했다. 이번 harness는 아직 재실행하지 않았고 native 등 미확인은 남는다. 첫 [책임 분리](../records/2026-11-12-14-reconcile-refinement-and-preserved-behavior.md)의 158개·독립 3개와 이번 실행을 구별한다. 이 정리 당시 제품 변경은 미커밋이었고, 이후 2단계는 44d2a5ef로 분리 커밋했다. 3단계·스킬 수정·009 완료·사용자 수락은 별도다.

사용자는 10171행에서 미검토 코드 작업부는 커밋하지 않고 기록·티켓·재개 안내 등 문서만 선별 커밋하도록 승인했다. 마지막 제품 코드 기준은 44d2a5ef이며 1단계 기준은 8f94af5c(경로 부모 a527e977)다. 새 세션은 실제 HEAD와 diff를 재확인하되 후속 3〜7단계 제품 코드는 검토 후로 남기고 일괄 stage·commit하지 않는다. 문서 커밋의 hash를 제품 코드 검증 기준으로 대신 사용하지 않는다.
