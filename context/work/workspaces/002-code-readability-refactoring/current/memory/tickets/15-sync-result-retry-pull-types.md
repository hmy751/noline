# 15 — Sync 결과·재시도·pull 타입

## 맡은 결과와 범위

sync push·pull·cleanup의 전부 성공, 부분 실패, 인증 중단과 재시도 결과가 타입과 반환값으로 호출부까지 이어지고 UI의 완료 표시가 그 의미와 일치하게 한다. sync 전용 HTTP retry의 횟수·간격을 한 계약으로 읽을 수 있게 하고, pull response의 schema 검증 결과를 `as never[]` 없이 local upsert까지 전달한다. 정책의 `syncStrategy`와 sync auth helper 선언도 실제 실행 연결과 대조해 사용·계획·미사용 중 의미를 드러낸다.

범위는 `shared/services/sync/engine.ts`, `api.ts`, `provider.tsx`, 관련 queue·policy 코드와 sync auth helper, shared sync schema와 test다. [14번](14-local-mutation-router-transaction.md)의 queue·transaction 계약이 선행한다. 서버가 Schedule 날짜를 생산하는 책임은 [05번](05-schedule-response.md)에 남기고 이 Ticket은 client의 parse와 typed consumption만 맡는다.

## 실행 맥락과 접근

정적 코드 대조에서 개별 push task 실패는 `FAILED`로 바뀌지만 `pushChanges`가 성공으로 돌아오고, `syncData`는 pull 뒤 full completion을 기록한다. provider도 이 결과를 성공 시각으로 표시할 수 있다. retry 조건도 첫 5xx에서 `_retry`를 세우므로 다음 5xx가 조건을 통과하지 못하는 것으로 보이지만 실제 Axios 요청 횟수는 아직 실행으로 확인하지 않았다. pull은 response schema를 parse하지 않고 raw data를 `as never[]`로 upsert한다. 후속 06 구현에서 sync API의 공통 인증 interceptor 설치와 갱신 공유를 확인했다. `syncStrategy`는 현재 src의 실행 소비를 찾지 못했다. 이 선언의 유지·제거 판단과 전체 sync 결과 연결은 아직 남는다.

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

기존 12를 15로 옮겼으며 이 Ticket 자체의 제품 구현·검증·수락은 남아 있다. 06의 공통 인증 갱신과 14·003-11·12의 관련 결과를 사용한다. 부분 실패는 재현 근거가 있으나 sync 전용 5xx retry 횟수·실제 엔진 동시 실행은 미확인이다. 공통 인증 갱신 공유 검사의 통과를 이 검증까지 확대한 것으로 보지 않는다.

현재 sync API는 공통 인증 interceptor를 설치하며 동시 갱신 공유가 연결돼 있다. 일반 HTTP 호출을 재로그인까지 보관하지 않는 정책과 sync_queue 보존을 구분한다. 인증 오류로 PENDING에 돌린 작업은 이후 다시 전송하지만 FAILED까지 재로그인만으로 모두 복구된다고 보장하지 않는다. 큐 소유권 오류를 재로그인만 하면 풀리는 인증 만료와 같은 안내로 처리하지 않게 오류 의미를 확인한다. lifecycle의 completed는 현재 엔진 Promise resolve를 뜻하므로 모든 전송 성공으로 확대하지 않는다. `syncStrategy`·`uiMode`는 현재 src에서 실행 소비를 찾지 못한 선언이며 정책 표의 값만으로 실행을 설명하지 않는다.
