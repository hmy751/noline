# 4〜7단계 순차 재검토와 마지막 연결 확인

**4〜7단계의 개별 검토·독립 검증·사용자 설명과 마지막 연결 회귀를 마쳤다.** 4단계에서는 같은 값의 새 편집 표식을 보존하는 이유를 주석으로 보완했고, 5·6단계는 현행 구조를 유지했다. 7단계는 다음 요청 조회 실패를 앞 요청의 상태로 잘못 분류하는 진단 결함을 수정했다. Main은 Ticket09의 2〜7단계 개별 재검토·필요 수정·검증 완료를 판정했다. 사용자 최종 수락·커밋·배포와 선행 전체 구현 검증은 구별한다.

## 이어받은 요청과 판단 방식

3단계 설명 뒤 사용자는 “그래 그럼 일단 나머지 단계들도 단계별로 이렇게 진행해봐”라고 승인했다. [1단계 실행 합의](2026-11-12-12-workflow-application-agreement.md)와 [3단계에서 적용한 2단계 새 판단](2026-11-13-05-stage-three-pull-review.md#기존-워크플로에-더해-적용한-판단)을 유지한다. 각 단계에서 요구로부터 보존할 결과를 정하고, 실제 소비자·공식 동작과 대조하여 동작의 필요성과 표현의 적합성을 각각 판단한다. 기존 Main·구현·독립 검토·검증·설명 시점에 적용하며 새 역할이나 체크리스트를 만든 것이 아니다. 사용자가 제외한 마무리·커밋 피드백은 추가하지 않는다. 스킬·Personal·Project는 수정하지 않았다.

Main은 읽기 전용 독립 reviewer와 별도 verifier를 새 컨텍스트에 배정했다. reviewer의 유지 의견은 Main이 실제 소비자와 대조해 채택했고, verifier는 요구의 결과와 실행 근거를 별도로 확인했다. 아래 완료 판정과 사용자 설명 여부는 Main의 보고다. 기록 담당자는 전달받은 원본 검사와 로그를 직접 읽어 보존할 의미와 확인 범위를 대조했으며 제품 검사를 재실행하지 않았다. 새 사용자 발화와 단계별 판단은 같은 대화의 Main 전달이 출처이며, 이 후속 구간의 전체 대화 원문·로컬 rollout 경로는 확인되지 않았다.

## 4단계 — 전송 순서와 서버 채택 판단

기기에 저장한 요청의 원문과 편집 표식을 재시도에도 그대로 보내는 FIFO를 유지했다. 첫 요청이 서버에 반영됐지만 응답이 끊겼다고 뒤 요청을 앞세우거나 표식을 새로 만들면, 다른 기기의 나중 편집보다 오래된 입력이 새 입력처럼 채택될 수 있다. 현재 큐의 rowid 정렬은 새 삽입을 남은 행 뒤에 둔다. 삭제된 행을 포함한 기기 전체 수명의 최대 번호 보존까지는 이 계약에 필요하지 않으므로 AUTOINCREMENT 변경은 하지 않았다.

서버 `mergeEdit`의 구버전 전체 충돌 선판정과 그룹별 비교를 유지했다. 구버전 요청은 한 항목에서라도 충돌하면 전체를 보류해야 하고, 표식이 있는 새 요청은 해당 그룹의 순서를 비교한다. 값이 같더라도 더 새 표식은 저장한다. 정오에 25 USD를 확인한 뒤 오전 11시의 30 USD 입력이 늦게 도착해도 값을 되돌리지 않게 하기 위해서다. [entity-mutations.ts](../../../../../apps/server/src/services/entity-mutations.ts)에 이 이유를 주석 한 줄로 추가했으며 이번 4단계의 유일한 제품 변경이다.

부모 여행부터 자식 순서로 잠그고, 잠근 뒤 대상을 다시 읽는 구조도 유지했다. 처음 읽기는 소유 관계와 잠글 대상을 찾고, 잠금 뒤 읽기는 대기 중 달라졌을 수 있는 상태를 판정하므로 같은 책임의 중복 조회가 아니다. 일정 삭제와 경비 등록처럼 관련 쓰기가 같은 부모 잠금을 사용해야 직렬화가 성립한다. 별도 분리·범용 wrapper·union 추가는 두 소비자의 간단한 guard보다 간접 연결과 타입 조율 비용이 커 채택하지 않았다. 독립 reviewer는 필수 동작 결함 없이 현행 구조 유지 의견을 냈다.

Main은 [PostgreSQL 14 명시적 잠금](https://www.postgresql.org/docs/14/explicit-locking.html)과 [SQLite AUTOINCREMENT](https://www.sqlite.org/autoinc.html)를 실제 사용 조건에 대조했다. 공식 설명을 근거로 현재 잠금 순서와 rowid의 충분성을 판단했으며 정책·schema·인증은 바꾸지 않았다.

| 확인 주체·범위 | 결과와 근거 |
| --- | --- |
| Main 자기 확인 | client 2파일 68개 통과: `/tmp/noline-stage4-client.log`. 서버 타입 검사 exit 0 보고와 빈 로그 `/tmp/noline-stage4-server-types.log` 확인 |
| 독립 기존 검사 재실행 | client 4파일 36개와 orphaned queue 1파일 30개 통과: `/tmp/noline-stage4-existing-client.log`, `/tmp/noline-stage4-queue-fifo.log`. 서버 2파일 39개 통과: `/tmp/noline-stage4-existing-server.log` |
| 독립 실제 HTTP 사건 | 1개 통과: `/tmp/noline-stage4-independent-http.log`. wrapper와 하위 client 실행을 두 사건으로 합산하지 않음 |

독립 사건은 실제 `updateExpenseLocal`로 오전 9시의 25 USD, 오전 11시의 30 USD, 오후 4시의 교통 분류를 Node SQLite에 저장했다. 첫 `pushChanges`가 실제 HTTP를 통해 PostgreSQL에 commit한 뒤 socket을 끊어 실패를 만들었다. 첫 요청은 FAILED, 뒤 두 요청은 PENDING이고 모든 payload가 보존됐다. 그 사이 태블릿의 정오 25 USD와 새 표식을 저장한 뒤 재전송하자, 최초 payload가 그대로 다시 전송되고 다음 두 요청이 순서대로 이어졌다. 최종 서버·Local은 25 USD와 교통 분류였고 큐는 비었다. 원본은 `/tmp/noline-stage4-independent-probe/{client,server}.test.ts`다.

실제 Axios·HTTP·Express·격리 PostgreSQL과 Node SQLite를 연결했지만 JWT 인증·SecureStore·Expo는 대역이고, Axios retry interceptor를 제외한 재시도는 실제 push 재호출이다. 초기 probe 두 실패는 없는 GET trip 경로와 Expo 환경 URL cache를 고쳐 해소한 검사 준비 문제다. 제품 결함 수정으로 세지 않는다. UI·native·Cloud를 확인한 근거는 아니다.

## 5단계 — 응답 수락과 완료 처리

30의 응답이 오는 중 35를 새로 저장했을 때, 서버 확인본은 30으로 수락하되 Local 표시값과 후속 요청은 35로 보존해야 한다. 이를 위해 완료 요청 ID를 제외한 나머지 pending의 투영과 해당 요청 ACK를 `reconcile`의 같은 transaction에서 처리하는 현행 구조를 유지했다. ACK를 engine으로 옮기면 이미 필요한 완료 ID 전달을 줄이지 못하면서 별도 transaction 조율만 늘어난다. 조회 갱신은 별도 읽기 책임이며 새로운 GET 완료를 push 완료 조건에 더하지 않는다. 독립 reviewer 의견을 Main이 채택했고 제품 변경은 없다.

| 확인 주체·범위 | 결과와 근거 |
| --- | --- |
| Main 자기 확인 | client 2파일 46개 통과: `/tmp/noline-stage5-client.log` |
| 독립 기존 검사 재실행 | client 3파일 91개 통과: `/tmp/noline-stage5-existing-client.log`. 조회 갱신 검사는 실제 QueryClient·Observer를 사용 |
| 독립 실제 HTTP 사건 | 1개 시나리오의 7상황 통과: `/tmp/noline-stage5-independent-http.log`. 기존 검사·자기 검사와 중복 합산하지 않음 |

독립 사건에서는 서버가 30을 commit한 뒤 응답을 기다리게 하고 실제 `updateExpenseLocal`로 35를 저장했다. 응답을 풀자 서버 확인본 30.00·Local 35·첫 요청만 ACK·후속 payload와 상태 보존을 확인했고 다음 push가 35를 반영했다. 응답의 ID·소유자·필수 amount를 바꾼 세 상황은 수락하지 않았으며 Local·서버 확인본·요청 원문을 유지했다. SQLite trigger로 `server_records` INSERT, `expenses` INSERT, `sync_queue` DELETE를 각각 실패시킨 세 상황은 본문과 확인본·요청 제거가 함께 rollback되고, trigger 제거 후 재전송으로 완료됐다. 원본은 `/tmp/noline-stage5-independent-probe/{client,server}.test.ts`다.

HTTP는 실제지만 인증·SecureStore·Expo·이 사건의 query refresh는 대역이다. 응답 변조와 SQLite trigger는 인위적으로 만든 경계 실패이며 실기기 장애를 관측했다는 뜻이 아니다. 독립 verifier는 검사 후 engine·reconcile·server-state의 판본을 다시 확인했다고 보고했다.

## 6단계 — 구버전 보류와 삭제 증거

직접 요청의 APIError 처리와 sync의 Axios 오류 처리를 합치지 않았다. 두 경로는 요청 권한·원문 입력·완료를 전달할 상대가 다르며, 공유 schema와 삭제 executor를 이미 재사용한다. 모양이 비슷한 분기를 공통화하는 것보다 각 경로의 책임을 드러내는 편이 적합하다는 독립 reviewer 의견을 Main이 채택했다. 삭제 증거와 원본 귀속이 모순되거나 payload가 손상되면 입력을 보존하며, 구버전 충돌의 전체 보류와 사용자 선택 복구도 유지한다. 제품 변경은 없다.

Main은 보류 정리 뒤 `invalidateQueries`를 기다리므로 일반 조회 실패가 정리 실패로 보일 수 있다는 후보를 확인했다. 설치된 query-core 5.90.5의 기본 `throwOnError: false`와 `catch(noop)`, 호출부에 이를 바꿀 옵션이 없음을 확인해 결함 후보를 철회했다. [QueryClient 공식 문서](https://tanstack.com/query/v5/docs/reference/QueryClient)도 2026-11-13 대조했다. 또한 raw 410의 Date guard를 없애면 parse 예외가 `local-after-response`로 분류되므로 단순한 중복 검증으로 제거하지 않았다. 기존 분기 수를 줄이는 것보다 실제 실패 의미가 같아지는지 확인한 선택이다.

| 확인 주체·범위 | 결과와 근거 |
| --- | --- |
| Main 자기 확인 | client 3파일 41개 통과: `/tmp/noline-stage6-client.log` |
| 독립 기존 검사 재실행 | client 4파일 86개: `/tmp/noline-stage6-existing-client.log`. 서버 2파일 27개: `/tmp/noline-stage6-existing-server.log` |
| 독립 실제 HTTP 사건 | 1개 연결 사건 통과: `/tmp/noline-stage6-independent-http.log` |

독립 사건은 서버의 새 표식 25 USD 위에 구버전 `{30 USD, 교통, originalForm}`을 전송해 409가 나면 클라이언트·서버 양쪽에 전체 원문이 보류되고 분류는 food로 유지됨을 확인했다. 뒤의 정상 title 요청은 계속 전송됐다. proxy로 주입한 raw 404·410에는 원문 task·보류·Local이 남았고, 실제 서버 여행 DELETE 후 증거가 있는 `TRIP_DELETED` 410은 관련 입력을 정리했다. 원본의 trip을 살아 있는 B로 강제 변경하고 A의 삭제 증거를 직접 실패 처리기로 보내면 원래 APIError를 반환하고 B를 삭제하지 않았다. 원본은 `/tmp/noline-stage6-independent-probe/{client,server}.test.ts`다.

기존 검사에는 복구 UI renderer 9개와 PostgreSQL 일정 삭제의 양 순서·동시 CREATE에서 금액 보존·일정 연결 해제가 포함됐다. UI 검사의 Repository·Drawer는 대역이며 화면 조작 확인이 아니다. HTTP 사건도 인증·Expo 대역 및 인위적 오류·귀속 변경의 한계를 유지한다. 자기 확인·기존 검사·새 연결 사건을 합산하지 않는다.

## 7단계 — 다음 요청 조회 실패의 진단 분류 수정

앞 요청을 마친 다음 `getTaskById`가 실패하면 실패 단계 초기화가 늦어 앞 요청의 상태로 분류되는 결함을 Main이 발견했고 독립 reviewer도 동의했다. 앞 요청이 2xx였다면 `local-after-response`, 409·410을 해결한 뒤라면 `response-unconfirmed`로 남지만 실제 실패는 다음 요청을 보내기 전 Local 조회다. engine의 반복문 첫 문장으로 실패 단계 초기화를 옮겨 `local-before-send`로 분류하도록 수정했다. 큐·ACK 정책은 바꾸지 않았다.

`retry.test.ts`에는 첫 전송·ACK 완료 뒤 다음 조회를 실패시키고 후속 상태 유지·blocked 1회와 올바른 단계 분류를 확인하는 회귀를 추가했다. 수정 전 7개 통과·1개 실패(`/tmp/noline-stage7-before.log`), 수정 뒤 관련 4파일 67개 통과(`/tmp/noline-stage7-after.log`)를 확인했다. 진단 생성 시 허용 어휘 제한과 SDK 최종 필터는 서로 다른 책임이므로 유지하며 진단 자체 실패가 동기화 결과를 바꾸지 않아야 한다. 별도 verifier가 실제 HTTP에서 실행 수명·SDK capture·필터까지 확인했고 Main이 7단계 완료 판정과 설명을 마쳤다.

독립 기존 4파일 64개가 통과했다(`/tmp/noline-stage7-existing-client.log`). 추가 1개 연결 사건은 실제 HTTP·PostgreSQL·Node SQLite에서 `executeSync` → 실제 `reportSyncSignal` → SDK 대역 → 실제 `beforeSend`/`beforeSendTransaction`까지 통과했다(`/tmp/noline-stage7-independent-http.log`). 원본은 `/tmp/noline-stage7-independent-probe/{client,server}.test.ts`다. 정상 및 재시도 성공은 개별 경고 없이 completed, 구버전 409·삭제 증거 410 해결은 resolved 1회와 completed, raw 404는 blocked 1회와 failed였다. 409 보류 저장과 FAILED 상태 기록을 모두 trigger로 실패시켜도 blocked 1회·failed이고 IN_PROGRESS 원문이 남았다. SDK가 throw해도 큐·동기화 결과는 유지됐고 오프라인은 skipped·이벤트 0개였다.

새 경계도 2xx·409·410의 정상 처리 뒤 다음 조회를 강제로 실패시킨 세 경로에서 앞선 결과를 보존하며 `local-before-send`의 blocked 1회·failed로 확인했다. 410은 내부 ACK 확인 조회가 있어 초기 probe의 실패 주입 위치를 두 번째에서 세 번째 조회로 고쳤다. 검사 위치 교정이며 제품 불충족이 아니다. 한 실행의 trace 연결과 user·request·extra·payload·tag·breadcrumb의 민감값 제거도 확인했다. 검사 후 engine 판본을 다시 확인했다는 verifier 보고와 로그를 연결한다.

SDK 전송은 대역이므로 실제 Sentry 업로드·Cloud·native·실제 JWT를 입증하지 않는다. 자기검사 67개·독립 기존 64개·추가 연결 사건을 합산하지 않는다.

## 마지막 연결 확인과 남은 범위

단계별 수정 뒤 Main이 전체 회귀를 실행했고 기록 담당자가 로그를 대조했다. client 77묶음 902개(`/tmp/noline-stages4-7-final-client.log`), 서버 12묶음 73개(`/tmp/noline-stages4-7-final-server.log`), 격리 PostgreSQL 5파일 50개(`/tmp/noline-stages4-7-final-pg.log`)가 통과했다. 이는 최신 workingtree의 전체 회귀이며 독립 추가 사건·단계별 검사와 합산하지 않는다.

서버 타입 검사(`/tmp/noline-stages4-7-server-types.log`)는 통과했다. client 타입 결과(`/tmp/noline-stages4-7-client-types.log`)는 3단계 이후 기준선과 파일 diff가 없고 기존 오류 7개가 같다. engine·retry lint 오류·경고 0(`/tmp/noline-stage7-lint.log`), 이번 변경 3파일 포맷 검사와 diff check 통과는 Main이 확인했다.

이번 4〜7단계 제품 delta는 `entity-mutations.ts`의 주석 한 줄, `engine.ts`의 초기화 위치 이동, `retry.test.ts`의 회귀 19줄이다. Main이 시작 시 dirty/untracked 96파일의 hash와 대조한 결과, 기존 제품 파일 중 앞의 두 파일과 담당 007 기록 6개 외의 기존 내용은 같았고 retry 검사는 시작 시 clean이었다. 새 누적 기록은 이 파일 한 개다. 3단계 5파일 변경과 기존 후속 구현·다른 작업의 dirty 내용은 보존했으며 이번 3파일과 혼동하지 않는다.

격리 DB `noline-stages4-7-review`의 55432 사용을 마친 뒤 임시 컨테이너·네트워크를 제거했고 개발 DB 5432는 건드리지 않았다는 Main 보고다. 임시 repository 검사 파일도 제거됐다. native·UI 실제 조작·실제 JWT·실제 Sentry 업로드·Cloud는 이번 후속에서 확인하지 않았다. 검사 대역·인위적 오류 주입의 의미는 각 단계 설명을 따른다.

최신 제품 커밋은 44d2a5ef, 2단계 기록 커밋은 9f3e87f2다. 이번 결과는 미커밋이며 사용자 최종 검토·수락, 선별 커밋, SQL→서버→앱 배포는 별도다. 단계별 결과 설명은 마쳤고 전체 완료와 남은 범위는 Main의 최종 답변으로 전달한다. 스킬·Personal·Project나 009의 완료 상태는 바꾸지 않았다.
