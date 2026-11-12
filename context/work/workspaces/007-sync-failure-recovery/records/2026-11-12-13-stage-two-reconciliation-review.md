# 2단계 서버 수신 검토와 미사용 upsert 진입 정리

사용자가 “그럼 진행해보자 2단계 부터”라고 요청해 [Ticket 09](../current/memory/tickets/09-staged-code-review-and-refinement.md)의 서버 변경 수신을 다시 검토했다. [실행 합의](2026-11-12-12-workflow-application-agreement.md)를 적용해 Main이 실제 수신 코드와 소비자·공식 동작을 대조하고, 별도 검토자가 선택과 정리 범위를 다시 확인했다. 이번 범위는 2단계이며 3〜7단계를 새로 검토·완료한 결과가 아니다.

## 무엇을 유지하고 무엇을 줄였는가

Main은 `reconcile.ts`·`server-state.ts`·DB 유틸뿐 아니라 engine의 pull·응답 반영, 활성화, 여행 Local 조회의 호출 관계와 관련 검사를 확인했다. 선행 구현을 그대로 유지한다는 결론부터 시작하지 않고 다음 선택의 실제 이유를 다시 판단했다.

| 선택 | 이번에 확인한 이유와 결과 |
| --- | --- |
| 서버 확인본과 화면 표시값 분리 | Local `version`은 낙관적 저장에서도 증가하므로 서버 응답의 선후 기준으로 대신 쓸 수 없다. 수락한 서버 원본 위에 아직 전송하지 않은 변경을 반영하는 구조를 유지한다. |
| raw queue의 미전송 변경 투영 | 수신 단계에서 요청 schema로 저장된 입력을 다시 정규화·strip해 표시 의미를 바꾸거나 검증 실패를 이유로 요청을 종결하지 않는다. 큐 원문도 그대로 보존한다. 표시 투영과 전송 검증의 책임을 구별한다. |
| 독립 수신과 기존 트랜잭션 안 수신의 두 진입 | 단일 수신과 pull·응답 반영 등 소비자별 원자성 범위가 다르다. `reconcileServerRecord`와 `reconcileRecordInTransaction`을 모양이 비슷하다는 이유로 합치지 않는다. |
| 서버 본문과 판본·삭제 증거의 다른 수명 | 본문 정리가 수락 판본이나 삭제 증거까지 버려도 된다는 뜻은 아니다. 늦은 응답 판정에 필요한 책임을 유지한다. |
| `upsertTrips`·`upsertSchedules`·`upsertExpenses` | production 참조가 없고 테스트만 쓰던 배열 wrapper였다. 실제 수신 경로와 별개의 공개 진입을 남길 이유가 없어 제거한다. |

독립 검토자도 핵심 수신 구조는 유지하고 미사용 wrapper는 제거하도록 권고했다. 서버 원본 없이 표시 행을 재사용하면 이전 pending 값이 ACK 뒤에도 남을 수 있고, 수신은 손상·구버전 입력을 채택하거나 폐기할 시점이 아니라는 이유를 들었다. wrapper 제거는 공개 API 세 개뿐 아니라 Local DB 타입으로 서버 입력을 표현하는 중복 계약과 `db/utils → sync/reconcile` 의존도 줄인다. 이 반환은 코드 읽기 분석이며 독립 실행 검증이 아니다. Main은 관찰을 실제 호출 관계와 대조해 채택했다. 이번 변경에서 핵심 reconcile·server-state나 공유 schema·제품 정책은 고치지 않았다.

## 공식 동작을 이번 선택에 연결한 근거

Main은 Drizzle [insert](https://orm.drizzle.team/docs/insert)·[update](https://orm.drizzle.team/docs/update)와 SQLite [UPSERT](https://www.sqlite.org/lang_upsert.html)·[transaction](https://www.sqlite.org/lang_transaction.html) 공식 문서, 실제 설치된 `drizzle-orm` 0.30.10·`expo-sqlite` 14.0.6 소스를 함께 대조했다. ORM upsert는 충돌한 행의 삽입/수정을 표현하지만 여러 행·큐·확인본·화면 표시의 원자성이나 미전송 변경 투영을 대신 제공하지 않는다. 따라서 SQL 표현을 간단히 하는 것만으로 수신 도메인의 책임을 제거할 수 없다.

설치된 Drizzle Expo adapter의 `session.js` transaction 구현은 callback의 반환을 await하지 않고 commit한다. 비동기 callback을 사용하는 현재 코드에서 기존 `runDatabaseTransaction`의 필요성을 확인했고, 일반적인 ORM transaction으로 대체하지 않았다. 실제 접근점은 root `node_modules/drizzle-orm/expo-sqlite/session.js`의 31〜43행이며, `sqlite-core/dialect.js`의 `buildUpdateSet`과 `utils.js`의 `mapUpdateSet`도 대조했다. 이는 실제 설치본 대조에 근거한 판단이다. [Expo SDK 51 문서 URL](https://docs.expo.dev/versions/v51.0.0/sdk/sqlite/)은 최신 문서로 redirect됐으므로 SDK 51 문서를 직접 읽은 근거로 취급하지 않는다.

## 실제 변경과 판본

이번 3파일 변경은 시작 시점 사본 `/tmp/noline-stage2-before/apps/…`와 비교한다. HEAD와의 전체 diff에는 앞선 2〜7단계 구현도 있으므로 이번 변경량으로 오해하지 않는다.

- [DB 유틸](../../../../../apps/client/src/shared/db/utils.ts): 위 세 wrapper와 reconcile 의존 import를 제거했다. `withTransaction`과 날짜 변환은 유지했다.
- [트랜잭션 직렬화 검사](../../../../../apps/client/tests/shared/db/transaction-serialization.test.ts): 제거한 `upsertSchedules` 대신 실제 `reconcileServerRecord`를 호출한다. 다른 트랜잭션 실패가 별도 수신을 지우지 않아야 한다는 기대값은 유지했다.
- [날짜·시각 Local 계약 검사](../../../../../apps/client/tests/entities/temporal-local-contracts.test.ts): 제거한 `upsertTrips` 대신 실제 수신 진입을 사용한다. 서버 도시 시간대의 삽입·갱신과 기존 날짜 계약의 기대값은 유지했다.

시작 HEAD는 문서 커밋 **2a624553**(`docs(context): 단계별 검토 적용 합의와 재개 근거 기록`)다. 따라서 앞선 합의 문서 7개는 커밋된 상태로 이번 작업을 시작했다. [12번 기록](2026-11-12-12-workflow-application-agreement.md)의 권한 오류는 그 기록 시점의 실제 실패로 보존한다. 제품 코드의 마지막 분리 커밋은 여전히 8f94af5c(경로 부모 a527e977)이며 이번 정리·제품 작업부를 새로 커밋하지 않았다.

## 확인 결과와 남은 범위

Main 자기검사에서 reconciliation·response-freshness·transaction-serialization·temporal-local-contracts **4묶음 121개가 통과**했다(`/tmp/noline-stage2-tests.log`). 변경 3파일 lint는 오류·경고 0이며(`/tmp/noline-stage2-lint.log`), client 타입 검사의 기존 오류 7개는 수정 전후 출력이 같다(`/tmp/noline-stage2-types-before.log`, `/tmp/noline-stage2-types-after.log`). 이 수치는 해당 변경 범위의 검사이며 전체 client·server·PostgreSQL·native를 다시 실행한 결과가 아니다.

추가 독립 검증 **7/7이 통과**했고 Main이 probe와 결과를 직접 확인했다(`/tmp/noline-stage2-independent/stage2-independent.test.ts`, `/tmp/noline-stage2-independent/result.log`). 위 121개의 재실행 수치로 합치지 않는다.

- 같은 `createdAt`·역순 ID 조건에서 `PENDING` 30 → `FAILED` 35 → `IN_PROGRESS` 40의 큐 순서를 따라 화면 금액은 40, 서버 원본은 25가 됐다. 서버의 `transport` 분류는 표시에도 반영됐고 raw 큐 전체 행은 보존됐다. 중간 task만 ACK한 뒤 앞뒤 task도 보존됐다.
- 세 상태 각각의 빈 제목·`030.00` 입력이 요청 schema 정규화 없이 표시로 투영되고 서버 원본은 별도로 유지됐다.
- `server_records` INSERT, `expenses` INSERT, `sync_queue` DELETE의 세 지점에 trigger 실패를 주입했을 때 서버 원본·표시 행·큐 snapshot이 각각 실패 전과 같았다.
- 실제 `useGetTripExpenses`의 queryFn → Repository → Activation Router → Local → SQLite 경로에서 표시값 40·분류 `transport`를 확인했다. 다만 `useQuery`는 options를 추출하는 mock이므로 React Query 실제 구독·캐시 수명·렌더링을 확인한 결과가 아니다.

독립 probe는 `reconcileServerRecord`를 직접 실행했고 HTTP 실호출을 하지 않았다. 기존 121개에 포함된 engine pull/push·activation·trip-local 결과와 변경 3파일 lint는 재사용했으며 타입 오류 7개의 전후 동일함과 바꾼 두 검사의 기대값 보존을 대조했다. 실행 환경은 Node 메모리 SQLite·Drizzle이며 Expo adapter·HTTP·Keychain 등은 대체했다. native·실서버·프로세스 재시작은 미확인이다.

Main은 미사용 수신 wrapper 제거의 이득과 이 검증 근거를 채택해 **2단계의 개별 검토·정리·독립 검증을 완료**로 판정했다. 사용자 설명은 이번 결과 전달에 연결하며 기록 시점에는 사용자 수락을 확인하지 않았다. 다음은 3단계 조회 범위·cursor·사본 수명이고 이번에는 착수하지 않았다. 전체 Ticket 09나 3〜7단계 후속 완료는 아니다. push·배포·새 native 실행은 하지 않았다.

## 기록의 입력과 확인 한계

현재 Main thread는 `6af5baae-f82c-8191-adfd-9abf1a9860b7`이며 해당 로컬 rollout은 확인되지 않은 상태다. 이번 사용자 요청은 Main이 정확한 원문으로 전달한 위 한 문장이고, 판단·실행 결과는 같은 Main이 기록 담당에게 전달한 수행 내용이다. 기록 담당은 현재 문서와 HEAD, 시작 사본 대비 3파일 delta, 121개 검사 로그와 독립 7개 결과 로그를 직접 대조했다. 공식 문서 조사·제품 검사·독립 리뷰를 기록 담당이 재실행한 것은 아니며, 기록 담당의 문서 확인과 제품 검증을 구별한다.
