# 코드 디테일 정리의 독립 요구 충족 검증

판정: 이번 변경 범위에서 **충족 근거 있음**. 기존 기능·정책·합의를 바꾼 회귀 또는 소비자 연결 누락을 발견하지 못했다. 필수 수정 0건이다. 사람이 읽는 데 필요한 추적을 줄였다는 구체 근거와 동작 보존 근거를 함께 확인했으며, 테스트 통과만으로 가독성의 최적 상태를 선언하지 않는다.

## 대상과 독립성

HEAD 8ab15b33의 기존 dirty 전체가 아니라 `/tmp/noline-readability-20261113/before/`에서 현재 작업까지의 delta를 검증했다. 제품·지속 테스트·정본 문서를 수정하지 않았다. 검증 수행·근거 기준, client/server/schema 가이드, 사용자 원문이 든 review-brief와 Main 채택 판단, data-lifecycle 계약 및 실제 request/schema·호출자·검사를 직접 읽었다. 구현자의 자기 확인은 검증할 주장으로 받고 아래 독립 대조를 실행했다.

- 원래 검토 대상 128파일의 여섯 coverage는 각각 128행, 누락/추가 0, 모두 full 표시다. 이는 각 검토자가 반환한 전수 확인 기록의 완결성 확인이며, 검증자가 같은 여섯 관점의 128파일 전체를 다시 읽었다는 뜻은 아니다.
- 최종 manifest 85파일 SHA256은 현재 실물과 모두 일치한다. 원래 manifest 안에서 달라진 84파일과 공유 fixture 1파일이며 누락이 없다. 인접 shared UI 2파일은 이번 delta에서 유지됐다.
- 시작판→visual-stage 128파일을 별도 작성한 AST/SQL 공백 정규화로 다시 대조해 차이 0을 확인했다. normalize는 제어문 단일 statement의 block과 migration 문자열 공백만 허용한다. 새 block에서 선언 scope 변화가 가려지지 않도록 statement 종류도 확인했다(추가분은 expression/return/throw).
- visual-stage→현재는 AST 차이가 있는 42파일과 주석/표현 차이 전체를 구분한 뒤 실질 delta 전체를 대조했다. 추가 fixture도 원본 사본과 대조했다. 마지막 3파일의 기존 formatter 정리는 현재 hash에 포함됐다.

독립 재현: `verify-independent.cjs`, 결과 `verification-normalization.json`; coverage 확인 `verification-coverage.json`.

## 보존 조건별 근거

| 경계 | 직접 확인과 판정 |
| --- | --- |
| Activation transaction·삭제·세션 | 별도 AST 추출로 옛 transaction callback과 현재 helper의 callback이 완전히 같음을 assert했다. parse→대상 포함 확인→helper await→null이면 transaction 밖 throw→지도/경로 비대기 요청이다. session 검사, 현재 사용자 확인, Trip 반영 뒤 삭제 null 반환, 새 준비 ID, 활성 상태와 자식 반영 순서가 같다. null은 정상 commit하며 세션 실패는 rollback한다. response-freshness의 삭제·세션 변경 사례와 assertion도 대조했다. |
| 확정 삭제 queue·410 | queue 정리 helper의 completedTaskId 제외, 상태/표 검사, JSON parse, 대상·DELETE 증거, CREATE 보호, 원본/문서 귀속, 저장 가능성, 삭제 순서를 전후 대조했다. 호출은 기존 transaction 안에서 원본/자식 처리 다음, hold 정리 전이다. helper가 DB를 다시 읽지만 resetDatabase와 transaction이 같은 serializeDatabaseOperation을 거쳐 실행되므로 그 await 중 reset으로 DB가 교체되지 않는다(db/index.ts 직접 확인). engine의 410 최소 guard는 null 반환, strict parse는 예외인 구분이 그대로이며, strict parse 이후에만 귀속 helper를 호출한다. runDatabaseTransaction→task 잔존 검사→분류 반환과 일반 catch·진단·FAILED 기록·finally 위치가 같다. reconciliation의 invalid-date/빈 ID와 date-only/invalid ULID를 서로 다른 진단 stage로 기대하는 실제 검사도 확인했다. |
| Legacy 보류·ACK | 수신 전 ID snapshot, GET 404/405, response parse/귀속 확인→transaction→변경 시 notify→ACK 전송이 같다. helper 반환 boolean이 transaction commit 뒤 notify를 결정한다. ACK tombstone은 입력 재등장을 막고 DELETE 404/405 처리와 onStage 순서가 같다. preserve의 void화는 미소비 반환만 제거하며 id 기본값 평가 위치·insert·표식 관찰·notify·예외를 보존했다. serverBacked 옵션의 실제 소비자 전부 연결됐다. |
| Queue 보호 predicate | 이전 배열의 length>0와 새 boolean을 독립 VM에서 240조합으로 실행했다. 표 4종, record 귀속 3종, JSON 정상/다른 여행/null/손상 등 5종, Local child 유무, hold 유무를 조합했고 결과와 4개 조회 순서가 전부 같다. some의 순수 payload 판정 단락만 바뀌었다. cleanup/비활성화의 transaction 안 재검사, DB cleanupPending, 지도·서버 후처리 순서가 같다. 합성 HELD 배열이 보존 정책의 근거였던 것은 아니며 실제 보호 결과를 유지한다. |
| 폼 제출·수명 | 두 valid/invalid handler 입구가 RHF resolver 완료 뒤 호출되는 기존 중계 guard와 같고, handleSubmit의 Promise는 계속 await한다. 저장 후 mounted 검사와 catch guard가 남으며 일정의 경로 준비는 기존대로 저장 후 mounted 검사 앞이다. offline-values의 expense/schedule×valid/invalid 지연 resolver 4사례와 이전 저장 성공/실패가 다음 편집 회차에 영향을 주지 않는 assertion을 읽었다. 실제 mutation의 isSubmitting/취소 거부/성공 후 한 번 닫기 검사도 유지됐다. |
| Server mutation·잠금 | 별도 AST 대조에서 선언 집합은 같고 lockOwnedTrip 외 모든 선언은 채택한 개명/반환 소비 정규화 뒤 완전히 동일했다. lockOwnedTrip은 동일한 SELECT·사용자 ownership·for(update) 후 같은 404/410을 반환하며 성공 payload만 undefined로 줄였다. 5소비부는 같은 위치에서 오류를 반환한다. helper의 뒤 배치는 초기화 중 호출을 만들지 않는다. requiresWrite는 같은 값 새 표식에도 true가 되는 기존 조건이다. query/lock/transaction 순서는 바뀌지 않았다. |
| Trip 날짜 | 실제 POST의 legacyCreateTripRequest와 PUT updateTripRequest는 tripEntity의 isoDateTime을 사용한다. 이는 string datetime + finite Date.parse이고 update는 optional이며 nullable이 아니다. 제거한 null/NaN 분기는 schema 성공 후 도달하지 않는다. 날짜범위·시간대와 기존 행 조합 검증은 남았다. 공유 schema/runtime/wire를 바꾸지 않았다. |
| Fixture·SQLite adapter | 원본 두 server suite의 상수/row/기대 표현 15값을 VM에서 현재 공유 fixture와 JSON 값으로 대조해 모두 동일했다(Date 포함). response suite의 timeZone:null override도 같다. 기존 SQLite helper는 동일한 memory DB·raw row 순서/columns 변환·run 결과를 제공하며 새 FK 설정이나 suite reset 변경이 없다. 정상 assertion·실패 주입도 유지된다. |
| 이름·반환 소비 | source/tests 전체에서 제거/개명한 심벌을 검색해 잔존 소비 0을 확인했다. addToSyncQueue와 preserve 반환, checkPendingSync.failedCount, 비활성화의 제거한 속성, 다운로드 결과·map 통계의 제거한 속성을 실제 호출부에서 소비하지 않음을 확인했다. requestPreparation은 여전히 Promise이고 await를 추가하지 않았다. |
| Queue ownership 검사 | recoverInterruptedTasks mock으로 앞 단계가 정상 완료하며 getQueueOwner가 해당 q에 도달했는지, AuthRequiredError인지까지 검사한다. 임의 예외만 받아 우연히 통과하던 공백을 줄였다. HTTP와 상태쓰기 0 기대를 유지한다. |

독립 실행 근거는 `verification-probes.cjs` / `verification-probes.json`(activation 동일, server 선언 동일, queue 240조합)와 `verification-fixtures.cjs` / `verification-fixtures.json`(15값)이다. 임시 probe의 준비 중 발견한 오류는 probe의 shorthand 정규화와 가짜 query builder 부재였고, 제품 실패가 아니다. 완성된 probe를 성공 실행했다.

## 읽기 부담과 검사 근거

주요 flow는 활성화 입수→기기 반영→백그라운드 준비, 보류 수신→알림→ACK, 410 분류→엄격검증→삭제효과로 읽을 수 있다. helper는 같은 파일의 좁은 책임으로 한정돼 상세로 이동할 때 새 모듈이나 정책기계를 배울 필요가 없다. 합성 queue 행, 미사용 반환, callback 중계, 중복 표시 타입, 불가능한 날짜 분기를 제거해 독자가 존재 이유를 추측할 요소를 줄였다. 의미 경계의 빈 줄과 명시 block을 유지하면서 기존 formatter와 충돌한 여섯 조건은 원래 표현으로 복구했다. 이 구체 이득은 Main의 채택 이유 및 실제 delta와 양립한다.

Main의 최신 실행 원본을 재사용했다. 같은 전수 명령을 반복하지 않았다.

- `client-tests-after.log`: 명시한 37 suites / 505 tests 모두 통과. 실제 선택 목록에 수명·reconciliation·response-freshness·SQLite·directions·ownership 검사가 포함된다.
- `server-tests-after.log`: 12 files / 73 tests 통과. DB mock HTTP 경계를 확인한 결과이며 실제 PostgreSQL로 확대 해석하지 않는다.
- `server-types-after.log`: 오류 없음. `client-types-before.log`와 `client-types-after.log`는 전체 텍스트가 같으며 기존 7오류만 있다. mapbox tuple 1, OfflinePack 속성 2, UI rootDir/include 4다.
- `lint-before.json`과 `lint-after.json`: 현재 대상 client 66파일, 양쪽 모두 오류 0·경고 39. 새 설정/ignore로 회피한 근거는 없다.

## 미확인·남은 영향

Expo 실제 기기 SQLite, Mapbox native, 실제 PostgreSQL 동시 실행 및 중단 복구를 이번에 새로 실행하지 않았다. 이번 delta에서 SQL 내용·DB adapter·query/lock 순서·transaction 경계·준비 ID 정책이 유지된 것을 독립 대조했고, 기존 mock/Node SQLite 회귀가 변경 경계를 확인하므로 이번 동작 보존 판정을 막는 추가 실행으로 보지 않는다. 이 결과로 해당 실제 환경의 전체 기능이나 1~7단계의 모든 과거 구현까지 새로 인증하지 않는다.

Main이 Project data-lifecycle의 과거 식별자 `processedCount`를 “반환 처리 수”로 바꾼 현재 본문을 직접 확인했다. 기존 수의 의미와 부분 실패 한계를 유지하는 표현 정정이며, 제품 계약 변화는 없다. 이 문서 1행 정정은 위 코드 manifest 85파일과 구별한다. 검증자는 정본을 수정하지 않았다.

최종 판정은 이 manifest 판본에 유효하다. 의미 있는 추가 수정이 생기면 해당 경계의 근거를 다시 확인해야 한다.
