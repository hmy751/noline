# 앱 시작·재인증·종료와 데이터 보존

앱 준비, 재로그인, 로그아웃·탈퇴 또는 로컬 저장의 실행 순서를 바꿀 때 읽는다. **앱을 사용할 준비, 서버에 요청할 자격, 기기에 남아 있는 데이터**를 구별하는 것이 핵심이다.

- **[앱 시작](#앱-시작-진입-조건과-실패-처리):** DB 준비와 세션 복원을 마친 뒤 화면에 진입한다. 두 과정의 실패는 서로 다르게 처리한다.
- **[재인증](#인증-상태와-로컬-접근):** 인증이 만료돼도 같은 계정의 활성 여행을 계속 이용한다. 같은 계정 재로그인은 기존 데이터를 유지하며 인증을 복구한다.
- **[로그아웃·탈퇴](#로그아웃탈퇴-남는-데이터와-후속-상태):** 진행 중 작업을 기다리고 미전송 여부를 확인한다. 명시적 로그아웃으로 정리한 미전송 변경은 복구되지 않는다.

이미 채택된 사용자 흐름과 현재 client 구현의 연결을 설명한다. Activation Router·Policy·조회의 계약은 [여행 접근](../../guidance/travel-access/INDEX.md)이, Local 변경·queue 원자성은 [Transaction rule](../../../../.claude/rules/transaction-sync-queue.md)이 소유한다. 초기 자동 계정 전환을 대체한 결정과 선택 이유·발췌는 [형성 맥락](_background/context.md)에서 찾는다.

## 앱 시작: 진입 조건과 실패 처리

[AppInitialization](../../../../apps/client/src/application/AppInitialization.tsx)은 네트워크 감지를 연결한 뒤 **SQLite 준비 → 기기 세션 복원 → 하위 화면 진입**을 조율한다. 네트워크가 online이 될 때까지 기다리지는 않는다. DB가 준비되지 않으면 인증 정보가 있어도 여행 데이터를 열 수 없으므로 앱 진입을 보류한다.

| 준비 결과 | 화면과 다음 행동 | 데이터·진입 조건 |
| --- | --- | --- |
| DB 열기·스키마 준비 실패 | 앱 준비 실패 화면에서 DB 준비 재시도 | 기존 테이블을 삭제하지 않는다. 인증 복원과 하위 화면은 시작하지 않는다. |
| 세션 기록을 정상적으로 읽었으나 기록 없음 | `signed-out`으로 복원을 마치고 로그인 화면으로 이동 | SQLite에 데이터가 있다는 이유로 세션을 만들지 않는다. |
| 인증 저장소 읽기·해석 실패 또는 DB 소유자 확인 실패 | `restore-failed`로 복원을 마치고 로그인 화면에서 복원 재시도·명시적 기기 정리 제공 | 앱 준비 자체는 끝낸다. 실패만으로 DB나 인증 기록을 지우지 않는다. |
| 세션 복원 성공 | 해당 인증 상태에 맞춰 화면 구성 | 서버 토큰 유효성 확인, 여행 목록 조회·선택, 지도 정리, sync 완료는 기다리지 않는다. |

### 재시도와 화면 해제

- **준비 시도:** 중복 재시도는 합쳐지고, 화면 해제 뒤 늦게 끝난 시도는 다음 준비나 화면 진입에 적용하지 않는다.
- **네트워크 감지:** DB 재시도 동안 유지하며 AppInitialization 해제 시 정리한다.
- **인증 복원:** `restoreSessionOnce`는 완료한 Promise까지 재사용한다. 화면을 다시 붙여도 현재 로그인 상태를 과거 저장값으로 덮지 않으며, 복원 실패의 재시도는 `retrySessionRestore`가 맡는다.

### 화면 연결과 변경할 위치

[Root layout](../../../../apps/client/app/_layout.tsx)은 준비 뒤 Query·Sync Provider와 화면을 연결한다. 같은 파일 안에서 두 역할을 구별한다.

- `AppNavigation`은 인증에 따른 이동을 맡는다. 같은 계정 재로그인 성공 시 돌아갈 화면이 있으면 그 화면으로, 없으면 홈으로 이동한다.
- `AuthenticatedEffects`는 여행 목록 갱신·선택과 정리 hook을 연결한다. `signed-in`과 `reauth-required`에서 유지되며, 이 작업들의 완료를 기다리지 않고 화면을 사용할 수 있다.

**새 필수 준비 단계**는 AppInitialization의 실패·재시도와 함께 바꾼다. **인증 후 실행할 일**은 Root의 연결과 해당 기능 Owner에서 판단한다.

## 인증 상태와 로컬 접근

[Auth Store](../../../../apps/client/src/shared/store/auth.ts)는 기기 세션과 현재 인증 상태의 기준을 맡는다. `signed-in`은 사용할 인증 수단이 있다는 상태이며 서버가 방금 유효성을 확인했다는 보장은 아니다. 인증 저장소는 [token-storage](../../../../apps/client/src/shared/services/auth/token-storage.ts)가 하나의 계정·토큰 기록으로 다룬다. 이전 형식의 부분 기록에서 계정을 추정하지 않는다.

| 상태 | 의미 | 이용 조건·후속 행동 |
| --- | --- | --- |
| `initializing` | 최초 복원 또는 명시적 복원 재시도 중 | 로컬 계정 접근과 인증이 필요한 요청을 허용하지 않는다. |
| `signed-out` | 복원할 세션이 없거나 삭제 완료 | 잔여 DB만으로 로컬 이용 권한을 얻지 않는다. |
| `restore-failed` | 저장된 계정을 확인하지 못함 | 데이터를 보존한다. 복원 재시도 또는 계정 검사를 거치는 로그인으로 해결한다. |
| `signed-in` | 계정에 맞는 로컬 접근과 인증이 필요한 원격 요청의 기본 조건 충족 | 실제 작업에는 여행 활성화·네트워크 등 해당 정책도 적용된다. |
| `reauth-required` | 같은 계정의 활성 여행 Local CRUD 유지 | 인증이 필요한 원격 요청과 새 sync는 막고 재로그인을 안내한다. |

인증 만료에 별도의 로컬 이용 기한을 추가하지 않는다. 여행 활성화 자체의 기한·상태는 기존 [활성화 설명](../../../../.claude/context/activation-system.md)과 [Activation Router](../../../../.claude/rules/activation-router.md)의 책임이다. 화면의 제한·작성 값 유지와 Service Layer 허용 조건은 [Policy 설명](../../guidance/travel-access/INDEX.md)을 따른다.

### 계정 판단과 데이터 소유권의 위치

- **현재 상태로 접근 가능한가:** Store의 `hasLocalSession`·`requireLocalUserId`·`requireRemoteSession`에서 판단한다.
- **이 행이 현재 계정의 활성 여행에 속하는가:** [local-access](../../../../apps/client/src/shared/services/auth/local-access.ts)가 SQL의 소유권·활성 여행 조건을 다룬다.
- **남아 있는 데이터가 로그인하려는 계정에 속하는가:** [local-account](../../../../apps/client/src/shared/services/auth/local-account.ts)가 기기의 테이블과 큐를 검사한다.

큐의 원본 행이나 payload에서 귀속을 확인할 수 없으면 `unresolved`로 보존한다. 다른 계정 데이터라고 단정해 삭제하지 않는다. 로그인 여부만으로 모든 로컬 행에 접근할 수 있는 구조가 아니다.

### 서버의 인증 거부와 통신 실패를 구별한다

일반 API와 sync는 [같은 인증 interceptor](../../../../apps/client/src/shared/services/auth/auth-interceptor.ts)를 사용한다.

1. 첫 401에서는 같은 세션의 토큰 갱신을 공유한다.
2. 갱신에 성공하면 각 원래 요청을 한 번 재전송한다.
3. 갱신 수단이 없거나 갱신의 401/403 거부, 재전송의 401이 확정되면 재인증이 필요하다.

**통신 실패·서버 5xx·기기 저장 실패는 서버의 인증 거부로 바꾸지 않는다.**

재인증 필요는 기기 저장이 끝나기 전에 메모리에 적용해 새 보호 요청을 막는다. 토큰은 Store 내부에 두고 요청 당시의 세션 식별자로 접근한다.

로그아웃이나 같은 계정 재로그인으로 세션이 바뀐 뒤 이전 refresh 결과·성공 응답이 돌아와도 새 세션에 적용하지 않는다. 이 보호는 해당 Store·interceptor 경로의 동작이며 임의의 비동기 작업 전체를 취소하는 장치는 아니다.

일반 HTTP 호출은 사용자 재로그인까지 보관하지 않는다. 호출은 오류로 끝나며 재로그인 뒤 필요한 조회를 새로 실행한다. `sync_queue`는 이미 로컬에 저장한 변경의 미전송 기록이므로 별도로 남는다. 인증 오류로 중단한 push는 해당 작업을 PENDING으로 돌려 후속 sync가 새 요청을 만들게 한다.

## 로그인: 완료 조건과 저장 책임

서버 로그인 성공 뒤 [completeLogin](../../../../apps/client/src/shared/services/auth/login-service.ts)이 세션 변경 절차 안에서 Store의 `saveAndApplySession`을 호출한다. Store는 기존 계정·DB·큐의 소유자를 확인하고 **기기 저장이 성공한 뒤** 새 세션을 공개한다. 같은 계정 재로그인은 기존 DB와 미전송 변경을 유지한다. 다른 계정은 명시적 로그아웃 후 로그인해야 한다.

- **계정 검사·기기 저장 실패:** 기존 로컬 데이터를 자동 폐기하지 않고 호출자에게 실패를 전달한다. 서버가 발급했지만 적용하지 못한 refresh token은 서비스에서 폐기를 시도한다.
- **저장·적용 성공 뒤 query 갱신 실패:** 이미 완료된 로그인을 실패로 되돌리지 않는다. 조회 실패만으로 로그인 성공 여부를 다시 추정해서는 안 된다.

### 두 실행 큐가 보호하는 범위

| 담당 | 순서를 보존하는 작업 |
| --- | --- |
| Auth Store의 저장 큐 | 복원·계정 검사·토큰 갱신·인증 저장·삭제 |
| [session-lifecycle](../../../../apps/client/src/shared/services/auth/session-lifecycle.ts)의 큐 | 로그인·로그아웃·탈퇴 전체 절차와 DB·백그라운드 작업의 조율 |

Store action은 공개돼 있으므로 전체 절차를 서비스로만 호출하도록 타입이 강제하는 것은 아니다. 화면 진입은 [LoginScreen](../../../../apps/client/src/screens/LoginScreen.tsx)과 [ProfileScreen](../../../../apps/client/src/screens/ProfileScreen.tsx)에서 이 서비스를 연결한다.

## 세션 변경: 대기 순서와 보호 범위

`withSessionChange`는 아래 순서로 작업을 잠시 막고 이미 진행 중인 일을 기다린다. 이 순서는 sync·cleanup이 마무리에 DB 쓰기를 사용할 수 있기 때문에 필요하다. DB transaction부터 막으면 앞선 작업이 정상적으로 마무리되지 못한다.

1. **sync:** [withSyncPaused](../../../../apps/client/src/shared/services/sync/lifecycle.ts)가 새 실행을 막고 진행 중인 sync의 성공·실패 종료를 기다린다.
2. **pending cleanup:** [withPendingCleanupsPaused](../../../../apps/client/src/shared/services/sync/cleanup-job.ts)가 새 pending cleanup을 막고 시작한 정리의 종료를 기다린다. 정리가 실패해도 종료 절차를 계속할 수 있다.
3. **DB 저장:** [withDatabaseTransactionsPaused](../../../../apps/client/src/shared/db/index.ts)가 새 transaction을 거절하고 이미 접수된 DB 작업을 기다린다. 이후 계정 검사·미전송 확인·세션 저장 또는 DB reset을 수행한다.
4. **해제:** 절차가 성공·실패·보류 중 어느 결과로 끝나도 각 일시 중단을 해제한다. 이후 실제 작업 가능 여부는 그때의 인증·DB 준비·네트워크 조건으로 다시 판단한다.

### DB 실행의 원자성과 일시 중단

DB의 `withTransaction`은 entity 변경과 sync_queue 추가를 하나로 처리하는 [원자성 계약](../../../../.claude/rules/transaction-sync-queue.md)의 구현 경로다. async callback 완료 뒤 COMMIT하고 실패 시 ROLLBACK하며, sync upsert 같은 `runDatabaseOperation`과 같은 실행 큐를 사용한다. 실패한 local transaction의 rollback이 동시에 시작한 sync 쓰기를 지우지 않도록 순서를 맞춘다.

`runDatabaseOperation` 자체가 transaction은 아니며 여러 호출 전체의 원자성을 보장하지 않는다.

이 일시 중단은 모든 DB 읽기나 직접 `getDatabase()` 호출을 막지 않는다. `getDatabase()`는 준비된 DB만 반환하지만 이미 반환한 객체를 취소하지도 않는다. 새 저장 경로를 추가한다면 기존 transaction과 계정 검사를 통과하는지 확인해야 이 조율에 포함된다.

### 실행 종료를 기다렸다는 것과 동기화 성공은 다르다

[SyncProvider](../../../../apps/client/src/shared/services/sync/provider.tsx)와 수동 요청은 `executeSync`를 공유한다. DB 준비, signed-in, 실제 online, 표시용 override 해제와 일시 중단 여부를 실행 순간 확인하고 중복 실행을 막는다. Provider는 조건 충족과 세션 변화에 반응하며 주기 sync는 기본 활성화돼 있지 않다. 결과는 `completed`·이유가 있는 `skipped`·`failed`로 구별한다.

**종료 대기는 실행 중인 sync가 끝났다는 뜻이다.** 성공까지 강제하거나 새 sync를 시작해 큐를 비우는 절차는 아니다. 로그아웃은 대기 뒤 큐를 다시 검사한다.

엔진은 인증 중단과 남은 FAILED·IN_PROGRESS를 오류로 전달한다. `completed`도 그 실행의 push/pull이 끝났다는 결과이며, 그 뒤 추가된 모든 변경·모든 지도 정리·모든 화면 갱신 완료까지 뜻하지 않는다.

## 로그아웃·탈퇴: 남는 데이터와 후속 상태

[종료 서비스](../../../../apps/client/src/shared/services/auth/logout-service.ts)는 위 대기를 마친 뒤 PENDING·IN_PROGRESS·FAILED를 모두 손실 가능한 미동기화 변경으로 계산한다. 일반 종료는 하나라도 남으면 보류한다. 사용자가 폐기를 명시적으로 확인한 경우의 `force`는 이 보류만 건너뛰며 sync·cleanup·DB 대기는 유지한다. 로그인 화면의 기기 정리도 손실 안내와 확인 뒤 같은 강제 종료를 사용한다.

| 실패·완료 지점 | 남는 데이터·인증 | 후속 상태·행동 |
| --- | --- | --- |
| 일반 종료에서 미동기화 변경 발견 | 세션과 데이터 유지 | 서버 종료·DB 삭제 전에 보류하고 일시 중단 해제 |
| 서버 로그아웃 요청 실패 | 로컬 종료 계속. 서버 토큰 폐기 성공은 보장하지 않음 | 로컬 종료 결과로 판단 |
| 서버 계정 삭제 요청 실패 | 로컬 DB와 세션 유지 | 탈퇴 실패 반환 |
| DB reset 실패 | 테이블·큐 삭제와 재생성 transaction을 rollback. 인증은 삭제하지 않음 | DB 준비 상태 해제. 보존 데이터에 접근하려면 DB 재준비 필요 |
| DB reset 성공 뒤 인증 저장소 삭제 실패 | DB·선택 여행·query cache는 비움. 이전 토큰의 메모리 사용 차단 | 기존 로컬 세션이 있었다면 `reauth-required`로 남아 종료 재시도 허용 |
| 정상 종료 완료 | 로컬 DB·큐·기기 인증·선택 여행·query cache를 비움 | 재로그인해도 미전송 변경은 복구되지 않으며 서버에 남은 데이터만 다시 받을 수 있음 |

**서버·SQLite·SecureStore 전체가 하나의 transaction은 아니다.** DB reset은 SQLite 내부에서 원자적으로 수행하지만 서버 계정 삭제 성공 뒤 로컬 정리가 실패할 수 있다.

종료 도중 앱이 강제 종료된 뒤 정리를 재개하는 복구 절차는 마련돼 있지 않다. DB reset이 Mapbox가 보유한 모든 지도 파일까지 삭제한다는 보장도 없다.

## 정리 작업의 한계

세션 종료가 기다리는 cleanup은 `processPendingCleanups`로 공유되는 실행이다. 별도 [지도 만료 정리 hook](../../../../apps/client/src/shared/services/offline-map/useOfflineMapCleanup.ts)은 예약 전 해제 시 타이머를 취소하지만 이미 시작한 전체 지도 작업을 이 세션 조율이 기다리는 구조는 아니다. pending cleanup 뒤의 캐시 재조회도 정리 완료와 별개다.

데이터 보존 판정은 경로마다 차이가 있다.

- **여행별 미전송 검사:** 로그아웃은 세 가지 미동기화 상태를 모두 보지만, `hasPendingTasksForTrip`은 현재 PENDING만 대상으로 Trip의 recordId 또는 일정·경비 payload의 tripId를 확인한다.
- **cleanup 처리 수:** 미전송 때문에 실제 삭제를 건너뛴 여행도 포함될 수 있다. 이 수치나 세션 종료 보호만으로 여행별 cleanup 전체가 안전하게 완료됐다고 판단할 수 없다.
- **vacuum의 원본 보존:** 큐가 일정·경비 원본을 참조하면 상태와 무관하게 보존해 재전송·계정 검사를 가능하게 한다.

여행별 미전송 판정·처리 수 개선과 중단된 IN_PROGRESS의 재개 정책은 별도 제품 작업으로 남아 있다.

## 확인 근거와 갱신

2026-10-30 현재 소스와 기존 테스트 본문을 대조했다.

| 근거 | 확인하는 범위 |
| --- | --- |
| [앱 준비 검사](../../../../apps/client/tests/app/layout.test.tsx) | 화면 연결 |
| [세션과 sync 종료 검사](../../../../apps/client/tests/shared/services/sync/logout-sync.test.tsx) | 제어된 비동기 종료 |
| [로컬 보존 검사](../../../../apps/client/tests/shared/services/auth/local-preservation.test.ts) | Node 메모리 SQLite와 실제 Drizzle SQL |

SecureStore·네트워크·native 모듈 대역은 실제 기기 저장소·OAuth·서버 token rotation·앱 강제 종료 복구를 입증하지 않는다. 구체적인 실행 결과는 [작업 기록](../../../work/workspaces/005-context-based-code-improvement/records/2026-10-30-11-app-runtime-context.md)에서 찾는다.

앱 진입 조건, 인증 상태의 의미, 세션 변경 순서, DB 실행 경로 또는 cleanup 보호가 바뀌면 해당 구현의 변경 책임자가 이 본문과 client 진입 안내를 함께 대조한다. 구성과 관리 경계는 [이 주제의 안내](README.md), 전체 구현 위치는 [현재 구조](../architecture.md)에서 찾는다.
