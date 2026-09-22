# 인증 개선 뒤의 Policy 정리와 분할 검토·커밋

이 기록은 [인증 복잡도 결정](2026-09-19-01-auth-complexity-review-and-decisions.md)·[실패 재현 근거](2026-09-19-02-auth-review-checks.md) 이후, 2026-09-19에 이어진 구현·명명·스타일·분할 검토를 보존한다. 9월 21일의 토큰 분리와 소비 구조 재검토·원복은 [후속 기록](2026-09-21-02-auth-token-separation-consumer-review-and-rollback.md)이 소유한다.

## 기존 구현에서 개선한 범위

정책 기록은 `71c1a028d081a220d654aa7e069fad96f2414925` (`docs: 인증 복잡도 검토와 재로그인 정책 정리`)로 저장됐다. 사용자는 이어서 “그럼 작업 진행해보자”라고 지시했다. 기존 코드를 기반으로 API 요청 처리, 로그인 저장 실패 정합성, 같은 계정 재로그인, Policy·Router 소비 연결, 직접 재현한 DB·sync 결함을 보완했다.

Main은 당시 다음 결과를 보고했다. 자동 갱신 뒤 apiClient 응답이 이중 가공되지 않으며 인증 필요 오류의 의미를 보존했다. 일반 HTTP 요청은 사람이 재로그인할 때까지 보관하지 않는다. 같은 계정 재로그인 저장 실패는 기존 상태와 세션 세대를 유지하고, 적용하지 못한 서버 refresh token은 폐기를 시도한다. 다른 계정 로그인은 DB를 자동 삭제하지 않고 명시적 로그아웃을 안내한다. 공개 Places 요청은 보호 API client와 분리하고, Schedule·Expense child 작업은 호출부의 `tripId`로 Local/Remote를 결정한다.

DB transaction과 독립 sync 작업의 간섭도 보완했다. FAILED sync 작업은 재시도 횟수 3회 미만이면 다시 선택하고 실패가 남은 결과를 전체 완료로 표시하지 않으며, 명시적 로그아웃 손실 확인에 FAILED를 포함했다. 이는 여행별 cleanup 전체의 미전송 판정이 완성됐다는 뜻은 아니다. 최초 후속 구현의 전체 client Jest 결과는 25개 suite·249개 test 통과였다.

## Policy를 줄이는 기준의 정정과 이름 선택

Main은 처음에 현재 소비처가 없다는 이유로 Schedule의 create/read, Expense의 create와 service만 남겼다. 사용자는 다음과 같이 정정했다.

> “이건 추가해도 되지 않나? 이전에 불필요하게 막 scheduel 와 같은 엔티티 말고 마구잡이로 놓어서 그런것 같은데”

핵심 데이터인 Schedule·Expense의 CRUD까지 제거하는 것이 복잡도 감소의 목적은 아니었다. 최종적으로 두 엔티티의 create/read/update/delete 구조를 복원하고, 수정·삭제를 실제 메뉴와 편집 화면에 연결했다. Trip 정책, 소비되지 않는 field 강제 선언, `syncStrategy`와 `uiMode`는 다시 추가하지 않았다. 조회 정책을 정의한 것과 모든 목록 화면에서 소비한 것은 구별한다. 목록의 캐시 표시 제한은 이후 인증 소비 검토에서도 미완료로 확인됐다.

사용자는 수정 전에 이름과 주변 영향부터 설명하도록 요청하고, 제안 이름을 한 번 더 검토한 뒤 적용을 지시했다. 최종 선택은 다음과 같다.

- `SCHEDULE_POLICIES`, `EXPENSE_POLICIES`: 엔티티별 상태에 따른 CRUD 원본 표.
- `OperationPolicy`: 한 동작의 허용 여부·모드·제한 이유. UI의 `permission` 인자도 `policy`로 정리했다.
- `EntityPolicy`: 현재 선택된 엔티티 CRUD 묶음. `EntityPolicyTable`: 상태별 원본 표.
- `AppPolicy`: hook의 결과. 실제 React Context가 아니므로 `AppPolicyContext`를 바꿨다.
- `ServicePolicy`: 지도·검색의 선택 결과. `selectEntityPolicy`: 표에서 현재 CRUD 묶음을 선택하는 함수.

초안의 `TripAvailability`는 인증까지 포함한 여행 이용 가능 여부처럼 읽히므로 채택하지 않고, 네트워크·활성 상태 조합인 `PolicyKey`를 유지했다. `canAccessTripData`도 네트워크를 포함한 전체 허용 판정처럼 보이므로 실제 조건에 맞는 `isDataAccessBlockedByAuth`를 사용했다. `policyNetworkStatus`는 unknown을 제한 모드로 대응시킨 정책표 입력이라는 의미가 있어 유지했다. `validation → fieldRules`는 이름만 바꾸지 않고, 실제 읽는 코드가 없는 선언을 제거했다.

이름 교체만으로 주변 전체를 바꾸는 것은 피했지만, CRUD 정책을 실제 판단에 쓰려면 수정·삭제 버튼과 Drawer 연결이 필요했다. 사용자가 승인한 구현은 그 소비 연결까지 포함한다. 당시 전체 Jest 25개 suite·249개 test가 통과했고 새 타입 오류는 없다고 Main이 보고했다.

## 코드 스타일에 적용한 기준

사용자는 앞선 독립 리뷰의 기준을 직접 전달하며 현재 작업물에 적용하라고 요청했다. 목표는 개행을 늘리거나 파일을 무조건 나누는 것이 아니라, 실제 책임과 완료 범위가 읽히는 코드였다.

formatter가 들여쓰기·따옴표·줄바꿈을 맡고, 빈 줄은 준비·guard·외부 작업·결과의 의미가 바뀌는 곳에 둔다. 짧은 guard에도 중괄호를 사용한다. 주석은 계약·이유·예외를 설명하며 단계 번호, 단순 사용 예시와 코드를 그대로 반복하는 설명을 줄인다. 로그와 주석은 실제보다 강한 최신성·완료·반환값을 주장하지 않는다. 변수명은 실제 범위를 드러내고 테스트는 준비·실행·기대 결과와 경우별 입력이 읽히게 한다.

`void`는 오류 처리가 아니며 일괄 도입하지 않는다. 스타일 변경만을 이유로 await를 추가하거나 기존 호출 시점·오류 처리를 바꾸지 않는다. 캐시 재조회 요청을 재조회 완료처럼 기록하지 않는다. 기존 no-void 규칙을 바꿔 경고를 없애는 방식도 채택하지 않았다.

Main은 인증·로컬 접근·fetcher·로그인·sync·DB·폼과 관련 테스트의 이름·guard·주석·로그를 정리했다. 당시 전체 25개 suite·249개 test, diff 검사를 통과했고 새 타입 오류는 없었다. ESLint 오류 0개·기존 경고 8개를 보고했으나 이후 기본 lint 실행은 Prettier plugin 호환 문제로 중단되기도 했다. 서로 다른 시점의 lint 실행 범위를 통과 한 건으로 합치지 않는다.

## 검토 단위와 실제 커밋

사용자는 “이제 작업한걸 한번에 커밋하지 않고 부분부분 확인하고 커밋하면서 확인할 예정”이라고 했다. Main은 라우팅 → DB 저장 → 인증 흐름 → 동기화·종료 → 화면 Policy 순서를 제안했고, 사용자는 앞의 두 묶음을 순서대로 설명·질문·수정·커밋하도록 진행했다.

여기서 대화의 **1번·2번·3번은 분할 검토 순번이며 Workspace Ticket 01·02·03이 아니다.** 라우팅은 Ticket 06·14, DB 원자성은 14, 다음 인증은 06과 관련된다. 한 파일에 서로 다른 책임의 변경이 섞이면 hunk를 구분해 저장하고, 인증과 Policy·FAILED 재시도 변경을 앞선 커밋에 함께 넣지 않는다.

첫 묶음은 `f0f680ebfa26f5dd93b9931c474a8194c7c0e6d4` (`refactor(client): 대상 여행 기준으로 entity 라우팅`)으로 저장됐다. Schedule·Expense 수정·삭제·일정별 경비 조회는 이미 알고 있는 tripId를 hook·repository·Router에 전달해 Local 선조회를 제거했다. Trip 단건 조회·수정·삭제도 다른 활성 여행의 존재가 아니라 대상 여행을 기준으로 분기한다. 목록·신규 생성은 같은 변경으로 일괄 전환하지 않았다.

설명 과정에서 Router mock 검사만으로 repository 연결까지 보장하지 못함을 확인해, 실제 repository 진입에서 remote/local 선택을 검사하는 회귀 테스트 5개를 추가했다. Main은 Repository·Router 45개 test, 해당 파일 lint, staged diff 독립 검증 통과를 보고했다. 타입 검사는 기존 지도 관련 오류 3개가 남았다. 이전에 실행한 Router·Local 50개 검사는 인증·SQLite 사례도 포함하므로 이 45개와 다른 검사 범위다.

두 번째 묶음은 `99366621293443d9d871d31f45541c7489b0b949` (`fix(client): 로컬 DB 트랜잭션 원자성 보장`)으로 저장됐다. 사용자는 transaction, COMMIT/ROLLBACK, Promise 직렬화를 코드와 연결해 여러 차례 확인한 뒤 변수명 수정과 커밋을 지시했다. `pendingWrites`는 `pendingDatabaseOperation`, `serializeWrite`는 `serializeDatabaseOperation`으로 바꿨다. 실제 범위에 조회와 metadata 작업도 들어가기 때문이다.

[DB 실행 경계](../../../../../apps/client/src/shared/db/index.ts)는 async callback 완료 후 COMMIT하고 오류면 ROLLBACK한다. [utils](../../../../../apps/client/src/shared/db/utils.ts)의 Local transaction·pull upsert, [queue](../../../../../apps/client/src/shared/services/sync/queue.ts)의 독립 조회·상태 변경, [sync metadata](../../../../../apps/client/src/shared/services/sync/storage.ts)·reset을 같은 실행 순서에 연결했다. transaction 내부의 `addToSyncQueue`는 다시 실행 대기열에 넣지 않는다. 자기 transaction이 끝나기를 기다리는 교착을 피해야 하기 때문이다.

## DB·Promise 설명에서 확정한 의미

`addToSyncQueue`는 서버 요청이 아니라 같은 SQLite의 sync_queue INSERT다. 따라서 entity 저장과 함께 BEGIN/COMMIT 사이에 실행되고, 한쪽이 실패하면 SQLite가 그 transaction의 변경을 취소한다. 애플리케이션이 이미 저장한 entity를 찾아 별도로 삭제하는 보상 처리가 아니다.

직렬화의 핵심은 호출자에게 주는 Promise와 다음 작업을 연결할 Promise가 다르다는 점이다.

```ts
const resultA = pendingDatabaseOperation.then(operationA);
pendingDatabaseOperation = resultA.catch(() => undefined);
return resultA;
```

작업 A가 실패하면 호출자는 원래 resultA의 오류를 받는다. catch는 resultA 자체를 성공으로 바꾸지 않고 별도의 성공 Promise를 만들며, 다음 작업 B는 그 뒤에 연결된다. `undefined`는 A의 호출자에게 성공값으로 반환되는 것이 아니다. catch가 정상 종료하면 명시적 return이 없어도 뒤 연결은 진행할 수 있고, 다시 throw하거나 rejected Promise를 반환하면 실패가 이어진다.

이 보장은 같은 앱 프로세스의 직렬화 경계를 거친 작업 사이에서만 성립한다. 지도·경로·일부 활성화의 직접 DB write까지 포괄했다고 설명하지 않는다. Node 메모리 SQLite에서 queue INSERT 실패에 따른 entity rollback과 실패 transaction 뒤 독립 upsert 보존을 검사하고, 관련 검사를 [DB 전용 테스트](../../../../../apps/client/tests/shared/db/transaction-serialization.test.ts)로 분리했다. Main이 보고한 두 번째 커밋 시점 전체 결과는 27개 suite·254개 test 통과다. FAILED 재시도는 queue.ts의 미커밋 작업물로 남겼다.

## 근거와 현재 경계

두 제품 커밋의 전체 해시·제목은 기록 시 Main이 Git 로그에서 직접 확인했다. 당시 테스트 수와 staged 검증은 이 대화의 Main 실행 보고이며 이 문서 작성만을 위해 다시 실행하지 않았다. Native SecureStore, 실제 OAuth·서버 token rotation, 실기기 SQLite와 전체 화면 흐름은 위 검사로 입증하지 않는다.

원문은 Codex task `01a0b4fc-3afa-7462-ae9e-6052b5a9e3c0`의 2026-09-19 11:53–20:06 KST 구간이다. 사용자 지시와 Main 최종 응답을 실제 session 로그에서 다시 대조했다. 관련 최소 원문은 본문에 보존했고, 정책·실패 재현의 앞선 이유는 위 두 9월 19일 기록에서 읽는다. 커밋 후 진행하던 인증 묶음은 아직 커밋·최종 수락되지 않았으며, 그 이후 상태는 다음 기록과 현재 Ticket 06이 소유한다.
