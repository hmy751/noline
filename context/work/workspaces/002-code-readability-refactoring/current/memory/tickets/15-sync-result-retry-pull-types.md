# 15 — Sync 결과·재시도·pull 타입

## 맡은 결과와 범위

sync push·pull·cleanup의 전부 성공, 부분 실패, 인증 중단과 재시도 결과가 타입과 반환값으로 호출부까지 이어지고 UI의 완료 표시가 그 의미와 일치하게 한다. sync 전용 HTTP retry의 횟수·간격을 한 계약으로 읽을 수 있게 하고, pull response의 schema 검증 결과를 `as never[]` 없이 local upsert까지 전달한다. 정책의 `syncStrategy`와 sync auth helper 선언도 실제 실행 연결과 대조해 사용·계획·미사용 중 의미를 드러낸다.

범위는 `shared/services/sync/engine.ts`, `api.ts`, `provider.tsx`, 관련 queue·policy 코드와 sync auth helper, shared sync schema와 test다. [14번](14-local-mutation-router-transaction.md)의 queue·transaction 계약이 선행한다. 서버가 Schedule 날짜를 생산하는 책임은 [05번](05-schedule-response.md)에 남기고 이 Ticket은 client의 parse와 typed consumption만 맡는다.

## 실행 맥락과 접근

정적 코드 대조에서 개별 push task 실패는 `FAILED`로 바뀌지만 `pushChanges`가 성공으로 돌아오고, `syncData`는 pull 뒤 full completion을 기록한다. provider도 이 결과를 성공 시각으로 표시할 수 있다. retry 조건도 첫 5xx에서 `_retry`를 세우므로 다음 5xx가 조건을 통과하지 못하는 것으로 보이지만 실제 Axios 요청 횟수는 아직 실행으로 확인하지 않았다. 최초 조사에서 pull은 response schema 없이 `as never[]`로 upsert했으나, 시간 후속 `d823b41`에서 아래와 같이 입수 계약을 적용했다. 후속 06 구현에서 sync API의 공통 인증 interceptor 설치와 갱신 공유를 확인했다. `syncStrategy`는 현재 src의 실행 소비를 찾지 못했다. 이 선언의 유지·제거 판단과 전체 sync 결과 연결은 아직 남는다.

부분 실패의 정상 반환과 FAILED·IN_PROGRESS 제외는 [003-11](../../../../003-bug-investigation-and-fixes/current/memory/tickets/11-sync-retry-recovery.md)에서 분리 재현했고, 해당 Ticket이 실패·재시도·중단 복구를 맡는다. Axios retry 횟수·간격과 동시 trigger의 실제 요청 검증은 여전히 남아 있다. 일반 API와 sync의 공통 인증 갱신은 [06번](06-app-startup-lifecycle.md)의 구현·보완을 재사용하고 [003-02](../../../../003-bug-investigation-and-fixes/current/memory/tickets/02-auth-account-recovery.md)는 기존 근거로 연결한다. cursor·미전송 수정 충돌 정책은 [003-12](../../../../003-bug-investigation-and-fixes/current/memory/tickets/12-pull-consistency.md)의 책임이다. 이 Ticket의 typed pull 소비를 그 정책 해결로 확대하지 않는다.

schema parse와 상태 모델의 구조는 독립적으로 조사할 수 있지만, 실패가 성공으로 표시되거나 retry 계약과 실제 횟수가 다르면 sync 완료 의미를 달성했다고 할 수 없다. 14의 queue 계약과 003의 직접 필요한 결과를 사용하고 같은 코드의 동작 수정을 중복 수행하지 않는다. [06번](06-app-startup-lifecycle.md)은 DB·auth 준비, 실제 confirmed online, debug 쓰기 차단과 동시 trigger를 조합한 provider 시작·중복 실행 방지를 맡는다. 이 Ticket은 그 결과를 재사용하고 engine의 push·pull·queue 재시도·결과 해석과 provider의 결과 표시에 집중한다. 06의 시작 차단을 sync 내부 실패 복구 완료로 해석하지 않는다. 미사용 설정·helper는 자동 삭제하거나 계획 기능을 자동 구현하지 않는다.

## 완료 조건과 확인 방법

- 전부 성공, 일부 task 실패, `AuthRequiredError`, malformed pull, pull 실패, cleanup 실패 결과가 서로 구별돼 caller와 UI에 전달된다.
- 미전송 실패 task가 남았을 때 full success나 성공 `lastSyncedAt`으로 표시되지 않는다.
- retry 횟수와 backoff가 하나의 타입·조건으로 표현되고 재시도 없음·1회·최대 횟수 fixture에서 실제 요청 횟수와 시간이 계약과 맞는다.
- pull response는 `@repo/schema`에서 검증되며 그 결과 타입이 Trip/Schedule/Expense upsert에 이어진다. 단언 제거 자체가 아니라 잘못된 shape의 거부와 정상 저장을 확인한다.
- `syncStrategy`와 sync auth helper는 실제 선언·setup·실행 consumer를 대조해 사용 중, 계획만 존재, 미사용 중 하나로 판정하고 코드·주석·설정의 의미를 맞춘다.
- fake timer·mock Axios/queue를 사용한 Jest와 schema build, client typecheck를 실행하고 실제 네트워크·서버 DB 미확인을 남긴다.

## 현재 상태와 실제 결과

sync engine은 PENDING과 retryCount 3 미만의 FAILED를 FIFO로 전송한다. 한도에 도달한 FAILED 또는 남은 IN_PROGRESS를 건너뛰어 뒤 작업을 전송하지 않는다. 일반 실패는 retryCount를 올려 FAILED로 남기고 뒤 작업을 중단하며, 남은 FAILED·IN_PROGRESS는 SyncIncompleteError로 lifecycle에 실패를 전달한다.

인증 오류는 현재 작업을 PENDING으로 되돌린 뒤 오류를 호출자까지 전달한다. 활성 여행이 없어 pull이 생략되는 경우에도 completed를 반환하지 않으며 성공 시각을 갱신하지 않는다. 큐 원본과 payload의 계정 및 pull 응답의 userId도 현재 계정과 대조한다. 실제 engine·lifecycle을 연결한 인증 중단 검사, 실패 재전송·뒤 작업 중단 검사와 Node SQLite의 재시도 한도 뒤 작업 보존 검사를 추가했다.

HTTP 5xx 재시도는 인증 커밋에서 일반 요청 책임으로 수정했다. 실제 Axios adapter와 fake timer로 최초 요청을 포함해 총 4회 호출(재시도 3회)을 확인했다. 저장된 큐의 다음 실행 재시도와 별개다. 화면 Policy의 미사용 syncStrategy·uiMode 선언은 화면 정책 커밋에서 제거했다.

시간 후속 `d823b41`에서 pull 전체 response/entity/serverTime을 첫 Local 쓰기 전에 검증하고 `as never[]`를 제거했다. malformed envelope·시점과 checkpoint 선반영 방어를 검사했다. 이번 실앱 경비 확인에서는 Local CREATE/UPDATE가 개발 PostgreSQL에 반영되고 해당 큐가 비워지는 제한된 정상 흐름까지 Main이 확인했다. [세션 기록](../../../records/2026-10-02-03-expense-time-decisions-and-verification.md)의 자동 검사와 실앱 범위를 구별한다.

cleanup 부분 실패의 typed result, 중단된 IN_PROGRESS의 명시적 재개, pull 전체 원자성·충돌·cursor 정책과 전체 실패 시나리오는 여전히 남는다. 정상 경비 두 건의 관찰을 Ticket 전체 완료나 사용자 수락으로 확대하지 않는다.
