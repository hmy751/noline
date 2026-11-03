# API·오류의 선택과 정정 근거

[API 계약](../../api-contracts.md)·[오류 처리](../../error-handling.md)와 [형성 맥락](context.md)의 근거다. 과거 원문과 현재 관찰을 구분한다.

- 2025-12-23 Auth Axios Factory 결정: “두 개의 독립적 인스턴스”로 “authAxios: 인터셉터 없음 (auth 전용)”, “apiAxios: 인터셉터 적용 대상”을 정했다. 순환 참조로 런타임 오류가 났다는 당시 기록이다. Dynamic import·전역 Axios·dependency injection을 대안으로 비교했으며 선택 이유와 비용은 형성 맥락에 보존했다. 현재 파일 배치나 전체 import graph의 무순환을 이 기록으로 보장하지 않는다.
- 2026-09-18 device-session 결정: “일반 API와 sync는 첫 401 뒤 같은 갱신 경로를 사용한다”, “그 문서의 sync 전용 무갱신 401 처리는 이 결정으로 대체한다.” 전송의 현재 근거는 [auth-interceptor](../../../../../apps/client/src/shared/services/auth/auth-interceptor.ts)·[auth-transport](../../../../../apps/client/src/shared/services/auth/auth-transport.ts)·[sync API](../../../../../apps/client/src/shared/services/sync/api.ts)다. session·Local 접근의 전체 계약은 [앱 실행](../../../current/app-runtime/INDEX.md)에서 찾는다.
- 002 [Expense API Ticket](../../../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/04-expense-api.md)은 “요청 검증과 응답 검증은 서로 다른 경계이므로 중복으로 삭제하지 않는다”고 정했다. 재전파 catch 제거는 조회 로그 감소를 포함했으며 fetcher mock 검사는 실제 interceptor와 화면을 확인하지 않았다.
- 002 [Schedule 응답 기록](../../../../work/workspaces/002-code-readability-refactoring/records/2026-09-14-01-schedule-serialization-and-response-contract.md)·[접근 기록](../../../../work/workspaces/002-code-readability-refactoring/records/2026-09-14-03-schedule-access-boundary.md)은 serializer·envelope와 부모 접근·scoped mutation의 근거다. 이를 모든 entity의 완료로 넓히지 않는다.
- 옛 오류 가이드의 “서버 라우터/미들웨어에서는 기존 AppError/errorHandler 흐름을 따른다”, “사용자에게 보여줄 문구에는 민감 정보, 원본 토큰, 내부 SQL/stack trace를 넣지 않는다”는 기준을 보존했다. 반면 async 함수의 AppError throw 예시는 실제 중앙 전달과 ownership을 설명하지 못했다.
- 2026-10-31 source 관찰: [http-errors](../../../../../apps/server/src/utils/http-errors.ts)는 원래 error.message를 details로, [sync pull](../../../../../apps/server/src/routes/sync.ts)은 message로 공개한다. [중앙 handler](../../../../../apps/server/src/middleware/errorHandler.ts)의 unknown 응답은 고정 문구다. [fetcher](../../../../../apps/client/src/shared/api/fetcher.ts)는 최상위 message/code를 읽으며 API 함수의 별도 Zod parse는 이 변환 밖이다.
- 같은 시점 [Expense routes](../../../../../apps/server/src/routes/expenses.ts)·[Trip routes](../../../../../apps/server/src/routes/trips.ts)의 최외곽 응답 검사·부모 연결·mutation scope는 Schedule과 다르다. 본문의 차이는 직접 코드 대조이며 실제 PostgreSQL 공격·경합 재현으로 보고하지 않는다.

현재 본문을 적용하는 데 옛 제품 문서나 보존판을 다시 읽을 필요는 없다. 역사 식별자와 발췌는 선택·정정을 재검토할 최소 근거이며 구체 실행 결과·한계는 006 결과 기록이 소유한다.

## 큐 작업 재전송 응답의 근거 (2026-11-03)

- **사고 관찰:** 서버 DB의 경비 행은 큐 등록 1초 뒤 생성됐고, 앱의 같은 CREATE는 FAILED·retryCount 3으로 남았다. 시각별 사실은 Workspace 007의 [관찰 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-02-01-simulator-sync-block-observation.md)에 있다.
- **수정 전 증상의 재현:** 라우트 두 파일만 잠시 이전 판본으로 되돌리자 PostgreSQL 통합 검사 12개가 `duplicate key … pkey`의 500, 동시 요청 `[201, 500]`, 삭제 재전송 404로 실패했다. 이 재현은 구현한 Main만 했고 별도 검증자는 다시 하지 않았다([구현 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-03-03-stage-one-implementation.md)).
- **현재 근거:** 구현은 커밋 `ba91d1a3`의 [Schedule](../../../../../apps/server/src/routes/schedules.ts)·[Expense](../../../../../apps/server/src/routes/expenses.ts) route다. [route 단위 검사](../../../../../apps/server/tests/routes/replay.idempotency.test.ts)와 [PostgreSQL 통합 검사](../../../../../apps/server/tests/integration/replay.idempotency.test.ts)가 응답 표를 고정한다. 별도 검증자가 같은 검사를 다시 실행했고, 실제 앱에서도 막힌 CREATE가 200으로 끝났다([실제 앱 확인 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-03-05-stage-one-real-app-verification.md)).
- **대안 비교와 개선 검토:** 앱 쪽 간주·선행 조회와의 비교는 [설계 판단 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-03-01-sync-failure-design-decisions.md#3-응답을-못-받은-요청을-다시-보낼-때)에, body 비교 생략·0행일 때만 조회한 선택을 별도 검토자가 유지로 판정한 내용은 [개선 검토 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-03-04-stage-one-improvement-review.md)에 있다.

운영 서버에는 아직 배포하지 않았다(2026-11-03). 실제 응답 유실은 재현하지 않았고, 서버에 행을 미리 넣어 흉내 냈다.
