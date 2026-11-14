# 현재 제품 산출물

최신 한정 산출물은 [재활성화·공유지도 수정 기록](../records/2026-11-14-01-reactivation-and-shared-city-map-fixes.md)에 있다. f5cb9564의 예약 취소/삭제 직전 확인과 c8004d6e의 공유지도5파일이 빌드 16에 포함됐다. 실제native pack·B 오프라인 도로/마커 관찰과 마지막 반납 삭제는 본문에 값으로 보존했다. 화면은 [B의 오프라인 지도](B-offline-map.jpg), 원시 JSON은 기록의 임시경로를 따른다. 전체 920개·예약 6개 성공이며 물리 iPhone·실제 서버 재전송은 구별한다.

[Ticket 12](../current/memory/tickets/12-pull-consistency.md)는 007-07과 공동 개발·검증 완료이며 이후 코드는 build 16 배포판에 포함됐다. 전체 통합 사용 검증과 구별한다. 전체 Work 완료를 뜻하지 않는다.

| 산출물 | 읽을 이유 |
| --- | --- |
| [서버 pull](../../../../../apps/server/src/routes/sync.ts), [공유 pull 계약](../../../../../packages/schema/src/sync/sync-status.ts), [앱 cursor 저장](../../../../../apps/client/src/shared/services/sync/storage.ts) | snapshot·트랜잭션 ID 경계와 계정·활성 여행별 cursor를 확인한다 |
| [기기 reconcile](../../../../../apps/client/src/shared/services/sync/reconcile.ts), [upsert](../../../../../apps/client/src/shared/db/utils.ts) | 미전송 입력 보호와 삭제 확인 뒤 정리의 동일한 반영 경계를 확인한다 |
| [실제 PostgreSQL 조회 중 쓰기 검사](../../../../../apps/server/tests/integration/pull-cursor.test.ts), [앱 회귀 검사](../../../../../apps/client/tests/shared/services/sync/reconciliation.test.ts) | 변경 무누락과 pending 보존을 다시 검증한다 |
| [공동 검증 기록](../../007-sync-failure-recovery/records/2026-11-10-04-conflict-pull-implementation.md) | 실행 근거·검사 수치·시뮬레이터 결과와 확인 한계를 확인한다 |

현재 진행과 남은 수행은 [state](../current/state/index.md), 작업 정의는 [현재 Spec](../current/memory/index.md)이 소유한다.

선행 전체 Ticket의 후속 보완과 완료 근거는 [추가 독립 검토·최종 검증](../../007-sync-failure-recovery/records/2026-11-10-05-conflict-pull-review-fixes.md)에서 확인한다. 최종 저장소 검사 수치는 client 797/797·서버 73/73·PostgreSQL 49/49이며, 배포는 미실행이다.

저장 1단계의 한정 결과는 [11월 12일 검토·코드 정리](../../007-sync-failure-recovery/records/2026-11-12-01-save-stage-review-and-cleanup.md)에서 읽는다. client 828/828·독립 92개가 통과했고, 폼/회차 보호·기존 조회 갱신·순수 helper·Local 반환·서버 처리 후 기기 준비 실패를 보완했다. 이 검사 수치를 선행 서버·PostgreSQL·네이티브 전체 재실행 결과로 사용하지 않는다. 배포는 미실행이다.

2〜7단계 후속과 전체 연결 확인을 완료했다. [단계별 선택·검증과 1〜7단계 코드 리뷰 진입](../../007-sync-failure-recovery/records/2026-11-12-02-staged-review-followups.md)에서 사용자 리뷰를 시작한다. 최종 client 847/847·서버 73/73·PostgreSQL 49/49, 서버 타입 통과이며 기존 client 타입 오류 7개·문서 링크 문제 64개는 남는다. 네이티브·Keychain·제품 Axios interceptor·Cloud 재수집은 이번 확인 범위 밖이다. 사용자 수락·커밋·배포는 미실행이다.

선행 제출 상태 정리는 [RHF 제출 상태와 사용자 이벤트 정리](../../007-sync-failure-recovery/records/2026-11-12-05-rhf-submitting-and-user-events.md)를 따른다. [경비 Drawer](../../../../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx)·[일정 Drawer](../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)는 각 폼의 isSubmitting으로 저장·닫기를 제어하고 이전 응답의 새 입력 보호는 유지한다. 공통 저장 잠금 훅은 삭제했으며 순차 사용자 동작·강제 전환 뒤 독립 입력 보호를 확인했고 별도 전체 client 853/853이 통과했다. 관련 39개는 전체에 포함되며 실제 Drawer의 콜백 계약 검사는 네이티브 제스처 확인으로 확대하지 않는다. 선행 852/12·표현 정리 42개는 당시 근거다. 네이티브 수정창 확인도 여전히 남는다.

선행 저장 UI 후속은 [제출값 저장 성공 후 닫기와 UI 간결화](../../007-sync-failure-recovery/records/2026-11-12-07-success-close-and-mounted-guard.md)다. 사용자가 추가 입력 보존 대신 성공 후 닫기를 선택했고 성공 reset·일정 기준 재설정은 제거했다. 초기 snapshot·isMounted 수명 보호는 유지한다. 관련 두 묶음 41개가 Main·독립 실행에서 각각 통과했다. 네이티브 수정창·수락·커밋·push·배포는 미실행이다.

최신 후속은 [일정 경로 범위·캐시 정리](../../007-sync-failure-recovery/records/2026-11-12-08-route-preparation-scope-and-cache.md)다. [공통 downloader](../../../../../apps/client/src/shared/services/directions/route-downloader.ts)·[구간/캐시 matcher](../../../../../apps/client/src/shared/services/directions/route-plan.ts)·[migration](../../../../../apps/client/src/shared/db/migrations/route-inputs.ts)·[지도 표시](../../../../../apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx)를 함께 본다. 이번 한정 구현·검토·독립 검증은 완료했다. 전체 client 877개 이후 추가한 두 실패 주입은 engine/migration 20개에서 확인했고 전체 879 재실행은 아니다. native Mapbox/live Directions는 미실행이다.

경로 두 파일은 후속 표현 정리로 보조 함수 배치와 `isSameRouteSegment` 비교만 간결화했다. 관련 3묶음 24개가 통과했고 lint 오류/경고는 0, 기존 타입 오류 7개는 동일하다. 조회·캐시·세션·트랜잭션 동작과 위 미확인 범위는 유지하며 전체 검사를 다시 실행한 결과는 아니다.

최신 저장 경계는 [Repository 단일 준비와 Local/API 내부 입력](../../007-sync-failure-recovery/records/2026-11-12-09-route-commit-and-save-boundaries.md)을 따른다. [PreparedEdit](../../../../../apps/client/src/shared/services/edit-stamp/index.ts)·[직접 수정 실패 처리](../../../../../apps/client/src/shared/services/sync/direct-update-failure.ts)와 CRUD 네 data 훅을 본다. 전체 892개와 관련 독립36개로 한정 수정·검증을 마쳤으며 이번 변경은 미커밋이다. 두 수치를 합산하지 않으며 lint 오류/경고 0·기존 타입7을 구별한다. 경로 분리 커밋 a527e977(코드/테스트15·분리판726)은 별도이며 push는 하지 않았다.

1단계 클라이언트 저장은 **8f94af5c**로 분리 커밋했다([53파일의 범위·분리판 검사](../../007-sync-failure-recovery/records/2026-11-12-10-stage-one-isolated-commit.md)). 앞선 저장 경계 전체 판에서 직접 실패/구버전·삭제·응답/pull 조합은 제외해 미커밋으로 유지했다. 이 분리판 client789·독립37·기존 서버73은 전체 workingtree892·독립36과 구별한다. push·배포는 하지 않았다.

다음 세션의 실행 입구는 [007 Ticket 09](../../007-sync-failure-recovery/current/memory/tickets/09-staged-code-review-and-refinement.md)다. 단계2〜7 코드 맵·최소 근거·첫 행동·완료 조건은 이 Ticket이, 1단계 전제/실험/선택·남은 아쉬움은 [새 판단 기록](../../007-sync-failure-recovery/records/2026-11-12-11-stage-one-judgment-and-next-tickets.md)과 중앙 원문이 맡는다. 코드 후속은 미착수이며 선행 정책·검증을 취소하지 않는다. 009 루프 개선을 기다리는 의존은 없다.

사용자는 10171행에서 미검토 코드 작업부는 커밋하지 않고 기록·티켓·재개 안내 등 문서만 선별 커밋하도록 승인했다. 마지막 제품 코드 기준은 8f94af5c(경로 부모 a527e977)이며 이후 문서 전용 커밋으로 현재 HEAD는 달라질 수 있다. 새 세션은 실제 HEAD와 diff를 재확인하되 후속 2〜7단계 제품 코드는 검토 후로 남기고 일괄 stage·commit하지 않는다. 문서 커밋의 hash를 제품 코드 검증 기준으로 대신 사용하지 않는다.
