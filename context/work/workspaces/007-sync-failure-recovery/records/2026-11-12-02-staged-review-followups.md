# 2〜7단계의 순차 검토와 후속 보완

[저장 1단계](2026-11-12-01-save-stage-review-and-cleanup.md)의 한정 수정·검증 이후, 사용자는 나머지도 같은 맥락으로 개선하고 **전체 후속 작업이 끝난 뒤 자신이 1단계부터 코드를 다시 리뷰**하겠다고 요청했다. 현재 Main 판단은 **2〜7단계 각각의 high 검토·필요 수정·별도 검증과 마지막 연결 확인 완료**다. 단계별 선택과 수정은 아래에 구별한다. 사용자가 이제 1단계부터 코드를 다시 리뷰할 수 있는 상태이며, 사용자 수락·커밋·배포는 하지 않았다.

## 단계별로 나눈 이유와 수행 계약

사용자 원문은 “같은 맥락으로 나머지 단계들 작업도 다 검토를 그런식으로 맡겨서 개선 시켜줘 그 다음에 1단계 부터 내가 코드를 다시 리뷰해볼게”였다. 이어 “2~7단계도 하는거 좋은데 1단계처럼 단계별로 나눠야 하는건 알지?”라고 순서를 확인했고, Main은 **각 단계 독립 high 검토 → 필요한 수정·코드 정리 → 별도 검증 → 다음 단계**로 진행하겠다고 답한 뒤 실행 승인을 받았다.

각 검토는 흐름 결함뿐 아니라 기존 합의, Personal·Project의 기준, 코드 구조·표현, 기술스택 적합성, 기존 유틸 활용을 함께 본다. 검토자가 제안했다는 이유로 모두 수정하지 않고 Main이 실제 이득과 의미 보존을 판단한다. 마지막에는 단계 사이 전체 연결도 확인해야 한다. FIFO·저장 시 표식 확정과 재전송 재사용·편집 그룹·구버전 호환·삭제·소유권의 기존 약속을 유지한다. 새 지속 제품 약속을 이번 기록에서 만들지 않는다.

## 2단계 — 서버 원본을 받으면서 미전송 입력 보호

high 검토는 서버가 확인한 원본과 화면용 낙관적 표시를 분리하는 현재 구조를 유지했다. 서버 원본 위에 같은 기록의 남은 요청을 순서대로 다시 겹치며, raw 큐 원문을 그대로 보존한다. 공유 `editedMarks`와 공통 reconcile 경계를 사용하고 있으므로 중복 구현을 새로 만들지 않는다. 검토자의 관련 회귀 검사 137/137 통과와 필수 수정 없음은 Main이 회수한 결과다.

순수 overlay helper를 더 분리하는 안도 비교했지만 채택하지 않았다. 현재 조기 반환·ACK·삭제 결과와 이어지는 경계를 다시 연결해야 하는 비용에 비해 책임이 더 분명해진다는 이득이 충분하지 않았다. 단순히 코드를 바꾸기 위해 추출하지 않은 선택이며, 전체 reconcile 구조가 앞으로도 최선이라는 영구 결론은 아니다.

별도 검증은 실제 `pullChanges` → SQLite → ExpenseRepository → QueryObserver 구독을 연결해 **PENDING·FAILED·IN_PROGRESS** 각각을 확인했다. Local 금액 30 USD와 서버 분류 food에서 서버가 transport를 보내면, 세 상태 모두 조회·구독에 **30 USD·transport**가 표시됐고 금액이 25로 돌아가는 중간 구독값도 없었다. 큐 원문과 상태는 그대로 남았다.

또한 SQLite trigger로 화면용 행 UPDATE를 실패시켰다. 서버 원본 저장이 앞서 실행돼도 같은 트랜잭션이 되돌아가 `serverRecords`는 비어 있고 Local 표시·raw 큐·Repository 조회는 기존 값을 유지했다. 별도 검사 4/4 통과를 기록 담당자가 로그와 assertion에서 확인했다. Main은 **2단계 완료, 제품 코드 현행 유지**를 판정했다. 실제 모바일 네이티브 바인딩이나 실기기 화면을 시험한 결과는 아니다.

## 3단계 — 조회 중 쓰기와 늦은 응답의 범위

### 같은 사용자여도 인증 세션이 바뀌면 활성화를 확정하지 않는다

high 검토에서 활성화 트랜잭션 도중 편집 표식 관찰을 기다리는 사이, 같은 사용자 계정이 재인증 필요 상태로 전환되어 세션 식별자가 바뀌어도 트랜잭션이 commit하는 조건을 재현했다. 사용자 ID가 같다는 검사만으로 요청을 시작한 세션의 유효성을 대신할 수 없다. pull에는 끝 시점 보호가 있었지만 활성화도 같은 수신·저장 경계를 지켜야 했다.

Main은 `useActivateTrip`의 트랜잭션에서 살아 있는 여행의 결과를 반환하기 직전, 삭제된 여행으로 null을 반환하기 직전 모두 `isCurrentSession(sessionId)`를 확인하도록 수정했다. 세션이 바뀌었으면 예외를 내어 활성화 상태와 여행·일정·경비·수락 서버 원본을 함께 되돌린다. 삭제 응답을 받았다는 이유로 세션이 지난 응답을 확정하지 않는다. 여행별 조율·기존 사본 수명 ID·현재 서버 판본을 사용하는 구조는 유지했다.

기록 담당자는 두 반환 전 검사 실물을 확인했다. 별도 원재현 검사는 표식 관찰을 대기시킨 뒤 같은 계정의 상태를 `reauth-required`로 바꾸고 새 세션 ID를 넣었다. 활성화 호출은 거절됐고 활성화 행·`serverRecords`는 비어 있으며 여행·일정·경비는 호출 전과 같았다. 지도·경로 다운로드도 시작되지 않았다. 이 원재현 1개와 live/deleted 양쪽을 포함한 response-freshness 36개가 통과했다. Main 자기 확인 36개와 독립 재실행 36개는 동일 범위이므로 별개 제품 사례 72개로 합산하지 않는다.

### 실제 PostgreSQL에서 조회 전에 열린 쓰기도 누락하지 않는다

기존 pull cursor 통합 검사 1개를 다시 실행하고, 독립 검증에서는 **쓰기 트랜잭션에 pull 이전부터 XID가 배정된 조건**을 추가했다. 경비 테이블을 잠가 pull의 읽기 대기를 확인하고 그동안 생성·수정·삭제를 넣었으며, 변경 시각은 모두 오래된 `2001-01-01`로 지정했다. 진행 중 snapshot 응답에는 변경이 없고 다음 cursor는 쓰기 XID 이하였으며, 쓰기가 commit된 뒤 다음 pull에서 세 변경을 모두 받았다. 벽시계 `updatedAt`만으로 조회 범위를 정한 결과가 아니라 snapshot/XID 경계가 열린 쓰기를 보호하는지 확인한 것이다.

기존 PostgreSQL 검사 1개·추가 사전 XID 검사 1개가 각각 통과했다. 기록 담당자는 추가 검사 소스와 최종 로그를 읽었다. **별도 검증 합계는 39개(회귀 36·세션 원재현 1·PostgreSQL 2)**다. Main은 3단계의 수정·별도 검증 완료를 판정했다. 서버 snapshot cursor와 사본 수명 ID는 현행을 유지하며 새 서버 정책을 추가하지 않았다.

## 4단계 — FIFO 전송과 서버 항목별 판정

high 검토에서는 필수 결함을 발견하지 않았고, 직접 수정과 큐 전송이 같은 서버 mutation 함수와 공유 `compareEdits`·편집 그룹·부모 잠금을 쓰는 구조를 유지했다. Main은 `hasNewerOrSameEdit`를 `hasSameOrNewerStoredEdit`로 바꾸었다. 비교식 `compareEdits(edit, currentEdit) <= 0`이 **현재 저장된 표식이 요청과 같거나 더 최신이면 그 항목을 유지**한다는 방향을 이름에 드러낸 정리이며, 채택 순서나 전송 정책을 바꾼 수정은 아니다. 기록 담당자는 실제 변수·조건을 대조했고 서버 타입 검사 통과는 Main 보고다.

별도 PostgreSQL 검사 5개는 표식 순서·동시 수정·동일 요청 재전송을 확인했다. 통합 파일 전체 22개 중 선택한 5개 통과·17개 제외 결과이며 전체 파일 22개 통과로 읽지 않는다. 이어 실제 Local SQLite 큐와 REST/JWT·격리 PostgreSQL을 연결한 별도 검사 1개가 통과했다.

연결 검사는 태블릿의 정오 25 USD를 먼저 직접 저장하고 폰의 오전 9시 25 USD·오전 11시 30 USD·오후 4시 교통 분류를 FIFO에 쌓았다. 첫 요청은 서버 처리 뒤 응답만 유실시켰다. 기기에는 첫 요청 FAILED와 뒤 PENDING 두 건이 남고 payload는 모두 원문 그대로였다. 다음 push에서는 첫 요청부터 원래 값·표식으로 재전송되어 최종 서버 값은 정오의 **25 USD·교통**, 큐는 0건이었다. 같은 값에도 더 뒤의 표식을 보존하며, 그와 동일한 표식에 다른 값·통화를 넣어 다시 보내도 판본과 값이 바뀌지 않는 직접 수정도 확인했다.

Main은 **4단계 완료**로 판정했다. 별도 검증 합계는 PostgreSQL 5개와 실제 큐 연결 1개의 **6개**이며 같은 검사의 반복 재실행을 다시 합산하지 않는다. 기존 FIFO·표식 재사용·항목 병합은 유지한다.

## 5단계 — 응답 반영과 해당 요청의 완료

high 검토는 현재 구조를 유지했다. HTTP 성공 여부만으로 큐를 지우지 않고, 응답 형식·대상 기록·소유권을 검사한 뒤 서버 원본 수락, 남은 입력을 겹친 Local 표시, 해당 큐 행의 ACK를 같은 트랜잭션에서 확정한다. 검토자는 실제 Local 저장으로 후속 35를 만드는 조건과 ACK 실패 rollback 두 사례, 조회 관련 15개 검사를 보고했다. 이 검토 결과는 별도 검증 수와 구별한다.

별도 검증자는 실제 REST 응답을 연결한 6개와 기존 canonical 응답·ACK 경계 3개, 합계 **9개**를 통과시켰다. 기록 담당자는 소스의 assertion과 최종 로그를 직접 확인했다. 30 USD 요청의 서버 응답을 지연하고 그동안 실제 `updateExpenseLocal`로 35 USD를 저장한 뒤 첫 응답을 풀었다. 수락된 서버 원본은 30 USD와 첫 표식이고, Local 표시·구독 Query는 35 USD와 후속 표식을 유지했다. 첫 큐만 사라졌으며 남은 큐는 응답 전의 두 번째 요청 원문과 일치했다. 낙관적 Local version을 크게 만들어도 수신 판본 비교를 대신하지 않는 것을 함께 확인했다.

나머지 5개는 서버가 실제로 처리한 응답을 각각 잘못된 본문·다른 ID·다른 소유자로 바꾸거나 Local UPDATE·큐 DELETE에 trigger 실패를 주입했다. 모두 호출은 미완료 오류로 끝났고 **원문 payload를 가진 요청은 FAILED로 보존**됐다. Local 표시값은 호출 전과 같고 수락 서버 원본도 rollback되어 비어 있었다. 별도 GET에서는 서버가 30 USD와 제출 표식을 이미 반영했음을 확인했다. 서버 처리 성공과 Local 요청 완료 실패를 구별한 검사이며, 이런 실패를 해결 없이 자동 폐기하는 정책을 도입하지 않았다.

Main은 **5단계 완료·현행 유지**로 판정했다. 4·5단계의 연결 확인은 임시 REST 서버와 격리 PostgreSQL, Node SQLite를 사용했다. 실제 모바일 네이티브 바인딩·Keychain 장애·제품 Axios interceptor를 다시 검증한 결과가 아니다.

## 6단계 — 구버전 입력과 삭제의 귀속·안내

### 존재하는 원본과 모순된 삭제 요청은 보존한다

high 검토는 여행 A 삭제의 일괄 정리에서, 실제 원본은 B 여행에 있는데 DELETE payload에는 A가 적힌 요청도 지워지는 반례를 확인했다. Main은 정리 대상 원본을 읽은 뒤 `original && !hasOwnedOriginal`이면 건너뛰도록 수정했다. 원본이 있으면 소유자·여행 귀속을 실제 원본과 맞춰야 하며, payload만 믿고 반대되는 원본을 무시하지 않는다. 원본이 **없는** 유효한 `ownerVersion` 삭제는 검증된 소유자·여행 정보를 사용하는 기존 계약을 유지한다. 정리 범위를 넓힌 새 정책이 아니라 기존 모순 입력 보존 조건을 구현한 것이다.

별도 원재현은 여행·경비 DELETE의 원본 B/payload A 모순에서 큐와 B 원본이 남는 두 조건, 다음 절의 복구 삭제 오류 구별 한 조건의 합계 3개다. 지속 회귀에는 일정까지 세 테이블과 기존 원본 없는 삭제 허용을 대조했다.

### 실제 삭제 반영이 끝난 결과만 삭제 안내로 전달한다

구버전 입력을 다시 저장하다 확정 삭제를 받으면 repository가 Local 삭제와 옛 보류 입력 정리를 마쳤지만, 복구 화면은 일반 실패와 같이 “이전 입력은 보관되어 있어요”라고 안내했다. 이미 없어진 입력이 남아 있다고 알리는 오류다.

공유 `deletedMutationResponse`로 code·id·trip을 검증하고, `applyConfirmedDeletionInTransaction`의 실제 적용 결과를 boolean으로 돌려받는다. 적용이 true일 때만 `APIError`의 하위형 `ConfirmedDeletionError`를 전달한다. 원본 귀속이 달라 false인 경우, 잘못된 삭제 응답, 증거 없는 원시 410은 원래 오류를 유지하고 입력을 지운 것으로 안내하지 않는다. 삭제 적용 함수의 반환값은 HTTP 상태가 아니라 기기 반영이 실제 이루어졌다는 결과다.

복구 화면은 이 오류형에서만 선택 화면을 닫고 “삭제 확인”을 표시한다. 정리된 보류를 다시 삭제하지 않으며, 경비·일정·경로·여행의 영향에 맞는 조회만 갱신한다. 중복 날짜 검증도 기존 데이터 계약과 비교해 제거했다. 서버 처리 후 기기 표식 보관 실패와 일반 실패에는 앞선 보류 입력 보존 안내를 유지한다. 기록 담당자는 오류형·직접 충돌 경계·반영 boolean과 UI 분기 실물을 대조했다. Main은 이 구별을 Project 오류 처리 본문에도 반영했으며 검증자가 코드와 대조했다고 보고했다. 기록 담당자는 Project를 수정하지 않았다.

### 단계6의 별도 검증과 한계

별도 검증은 **82개(원재현 3·client 회귀 53·PostgreSQL 22·실제 REST 연결 4)**가 통과했다. Main 자기 확인 44개와 후속 61개를 이 수치에 다시 더하지 않는다. UI 테스트 렌더러 9개와 실제 typed API 연결 확인은 관련 회귀 범위에 포함되며 별도 독립 사례로 중복 집계하지 않는다.

실제 REST에서는 구버전 혼합 요청 전체가 원문 그대로 기기·서버 보류에 남고 다음 정상 제목 요청이 전송됐다. 서버 분류를 부분 변경하지 않으며 금액 25 USD·기존 분류가 유지됐다. ENTITY_DELETED·TRIP_DELETED 복구 저장은 자기 소유 삭제와 보류 정리 뒤에만 typed 오류가 되었고, 손상 payload는 여행 삭제에도 남았다. 증거 없는 404는 첫 요청 FAILED·후속 PENDING·Local 원본을 보존했다. PostgreSQL에서는 일정 삭제·경비 등록 양쪽 도착 순서의 연결 해제도 확인했다. 기록 담당자는 별도 소스의 assertion과 각 로그 최종 수치를 읽었다.

Main은 **6단계 수정·별도 검증 완료**로 판정했다. 실제 REST/JWT·격리 PostgreSQL과 Node SQLite·UI 테스트 렌더러의 확인이며 네이티브 앱을 다시 실행한 결과는 아니다. 구버전 전체 보류·확정 삭제·일정만 삭제될 때 경비와 금액 보존·모호한 실패 보존의 기존 합의는 유지한다.

## 7단계 — 정상 종결·보류 후 진행·실제 중단의 진단

high 검토에서 서버의 구버전 충돌 409 또는 확정 삭제 410을 받아 Local 종결을 시도하다 실패하고, 이어 큐의 FAILED 상태 기록까지 실패하면 중단 신호가 누락되는 조건을 확인했다. 외부 catch의 중복 방지 표식은 이미 세워졌는데 실제 진단은 실패 상태 기록 뒤에 있어 실행되지 못했다.

Main은 해당 catch에서 `reportSyncSignal`을 `updateTaskStatus`보다 먼저 호출하도록 옮겼다. 기존 일반 오류 분기도 같은 순서이며 중복 방지는 유지한다. 지속 회귀 검사에는 실제 SQLite trigger 두 개로 Local 보류 저장과 FAILED 기록을 동시에 실패시키고, 원문을 가진 IN_PROGRESS와 후속 PENDING이 남으며 blocked는 1회·뒤 요청 전송은 0회임을 확인했다. 원문·상태 저장 실패를 진단 성공으로 감추지 않으며, 진단을 남겼다고 큐를 종결하지도 않는다.

별도 검증은 **13개(원재현 1·새 실제 REST 7·기존 Sentry 필터 4·지속 회귀 1)**가 통과했다. Main 자기 확인 45개는 별도 검증 합계에 더하지 않는다. 실제 REST → `executeSync` → 실제 `reportSyncSignal` → Sentry capture 대역과 `beforeSend` 필터까지 연결했고 결과는 다음과 같았다.

| 실행 조건 | 개별 신호와 전체 실행 결과 |
| --- | --- |
| 정상 PUT·동일 표식 재전송 | blocked/resolved 개별 신호 0회, 실행 completed |
| 구버전 전체 보류·자기 기록 삭제·자기 여행 삭제 | 각각 resolved info 1회, 실행 completed |
| 삭제 증거 없는 404 | server-rejected·404의 blocked warning 1회, FAILED와 후속 PENDING 보존, 실행 failed |
| 409·410 뒤 Local 반영과 FAILED 기록 모두 실패 | local-after-response blocked warning 1회, IN_PROGRESS와 후속 PENDING 보존, 실행 failed |

원시 capture 입력에 민감값이 섞이지 않는지 확인하고, SDK 필터 입력에는 계정·여행·기록 ID·요청 경로·토큰·원문을 강제로 주입해 제거되는지도 검사했다. 필터 후 의미 있는 신호 종류는 유지됐다. 이는 실제 Sentry Cloud 전송·수집 확인이 아니다. 제품 Axios interceptor·실제 Keychain·네이티브 앱을 재실행한 주장도 하지 않는다.

## 최종 전체 검사와 완료 범위

Main은 각 단계를 마친 뒤 마지막 연결 검사까지 완료했다고 판정했다. 기록 담당자는 최종 실행 로그를 직접 대조했다. 단계별 별도 검사 수와 전체 저장소 검사 수를 더해 새로운 총 사례 수를 만들지 않는다.

| 최종 검사 | 결과와 근거 |
| --- | --- |
| client 전체 | 74묶음 847/847, `/tmp/noline-stages2-7/final-client.log` |
| 서버 단위 | 12묶음 73/73, `final-server-unit.log` |
| 실제 격리 PostgreSQL | 5파일 49/49, `final-pg.log` |
| 서버 타입 | 통과, `final-server-types.log` |
| client 기본 타입 | 기존 7개 오류 유지, `final-client-types.log` |
| 이번 관련 lint | 11파일 오류 0·기존 async assertion 경고 3, `final-lint.log` |
| 문서·변경 | 기존 harness 과거 링크 문제 64개 유지, `git diff --check` 통과 보고 |

서버 단위 검사의 최초 EPERM은 권한 환경 실패였고 허용된 환경에서 재실행한 73/73 결과와 구별한다. 3단계 신규 테스트의 비동기 assertion은 결과를 await한 뒤 `AuthRequiredError`를 확인하는 방식으로 강화했고 이후 전체 847개를 확인했다. 그 테스트 정리가 새로운 제품 정책이나 동작 수정은 아니다.

2단계 현행 유지, 3단계 세션 경계 보완, 4단계 의미를 유지한 이름 정리, 5단계 현행 유지, 6단계 모순 삭제 요청 보존과 확정 삭제 안내 구별, 7단계 이중 Local 실패의 진단 누락 보완으로 마무리했다. FIFO·표식 순서/재전송 재사용·그룹·호환·삭제·소유권의 기존 합의를 변경하지 않았다. Project는 Main이 오류 처리의 실제 결과 구별을 반영한 범위이며 기록 담당자는 수정하지 않았다.

임시 PostgreSQL `noline-stages-review-pg`는 Main이 제거했고, 임시 서버는 검증자가 정상 종료 코드 0으로 정리 완료했다고 반환했다. 기존 5432 DB는 유지했다. 이번 결과는 실제 REST/JWT·PostgreSQL과 Node SQLite·React Native 테스트 렌더러의 확인이다. 선행 네이티브/두 기기 검증 근거와 구별하며 네이티브·Keychain 장애·제품 Axios interceptor·Sentry Cloud 수집을 이번에 다시 검증한 결과는 아니다. **사용자 코드 리뷰·수락, 커밋, SQL → 서버 → 앱 배포는 미실행**이다.

## 사용자의 1〜7단계 코드 리뷰 진입

처음부터 코드를 볼 때는 아래 순서로 단계 책임과 해당 근거를 함께 읽는다. 제품 경로의 기준점이며 파일 전체가 이번에 수정됐다는 뜻은 아니다.

| 단계 | 코드 진입과 확인할 책임 |
| --- | --- |
| 1 저장 | [경비 UI](../../../../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx)·[일정 UI](../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx) → [Repository](../../../../../apps/client/src/entities/expense/repository/expense-repository.ts) → [Local](../../../../../apps/client/src/entities/expense/lib/expense-local.ts). 비교 기준·표식·라우팅·원자적 저장은 [1단계 기록](2026-11-12-01-save-stage-review-and-cleanup.md)을 따른다 |
| 2 수신 | [reconcile](../../../../../apps/client/src/shared/services/sync/reconcile.ts)의 서버 원본과 pending 투영 |
| 3 조회 범위 | [서버 pull](../../../../../apps/server/src/routes/sync.ts)·[client pull](../../../../../apps/client/src/shared/services/sync/engine.ts)·[활성화](../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)의 snapshot/cursor·사본 수명·세션 |
| 4 서버 판정 | [entity-mutations](../../../../../apps/server/src/services/entity-mutations.ts)의 항목 표식 비교·공유 그룹·잠금 |
| 5 응답 완료 | [engine의 applyPushResponse](../../../../../apps/client/src/shared/services/sync/engine.ts) → [reconcile](../../../../../apps/client/src/shared/services/sync/reconcile.ts)의 수락·후속 입력·해당 ACK |
| 6 호환·삭제 | [직접 충돌](../../../../../apps/client/src/shared/services/sync/direct-update-failure.ts)·[삭제 반영](../../../../../apps/client/src/shared/services/sync/reconcile.ts)·[복구 UI](../../../../../apps/client/src/features/sync-recovery/LegacyUpdateRecovery.tsx)의 원문 보존·실제 반영·사용자 선택 |
| 7 진단 | [engine](../../../../../apps/client/src/shared/services/sync/engine.ts)·[Sentry](../../../../../apps/client/src/shared/diagnostics/sentry.ts)·[필터](../../../../../apps/client/src/shared/diagnostics/sanitize-sentry-event.ts)의 resolved/blocked·실행 수명·민감값 제외 |

<!-- 코드 재접근 경로 정정: 당시 edit-stamp/legacy-conflict.ts는 후속 저장 경계 정리에서 내용 유지 후 sync/direct-update-failure.ts로 이동했다. 표의 당시 책임 설명은 보존한다. -->

## 원문·실행 근거와 읽은 범위

Main 대화는 `01a1c4a4-3065-7b32-8404-2c5066fcbaf9`다. 같은 세션 원문 `/Users/hammyeong-yeon/.codex/sessions/2026/11/10/rollout-2026-11-10T17-47-37-01a1c4a4-3065-7b32-8404-2c5066fcbaf9.jsonl`에서 직전 반영 4588행 이후 4589〜5825행을 단계별로 읽었다. 사용자 요청은 4635행, 단계별 구분 확인은 4666행, 실행 승인은 4676행이다. 5019행의 Main 진행 보고는 3단계 완료와 4단계 착수를 구별한다. user/assistant 발화와 도구·담당자 결과를 구별했다.

원문에 직접 들어 있지 않은 정확한 결과는 Main이 연결한 `/tmp/noline-stages2-7/progress.md`와 다음 근거에서 확인했다. 기록 담당자가 검사를 다시 실행한 것은 아니다.

- 2단계: `/tmp/noline-stage2-independent/stage2.test.ts`·`stage2.log`의 실제 수신·구독 세 상태와 실패 rollback 4개.
- 3단계: `/tmp/noline-stage3-independent/stage3-session.test.ts`·`original.log`, `freshness.log`, `pull-assigned-xid.test.ts`·`pg-assigned-xid.log`.
- 3단계 기존 PostgreSQL: `/tmp/noline-stage3-pg-verify.log`, Main 자기 확인: `/tmp/noline-stages2-7/stage3-self.log`.

진행 파일에 3단계 별도 검증 진행으로 남아 있던 문구는 이후 Main의 완료 보고와 실제 최종 로그를 우선해 구별했다. 임시 경로만 사라져도 판단을 복원하도록 핵심 조건·관찰·선택 이유는 이 본문에 보존한다. 4·5단계 완료와 6단계 착수는 5313행의 Main 보고 및 별도 최종 결과까지 반영했다. 6단계 수정·별도 검증 완료와 7단계 착수는 5621행의 Main 보고 및 별도 최종 결과까지 반영했다. 7단계 결과와 전체 후속 완료는 5790행의 Main 보고 및 연결된 최종 검사 결과까지 반영했다.

4·5단계의 추가 직접 근거는 `/tmp/noline-stage4-pg-verify.log`, `/tmp/noline-stage4-independent/rest-queue.test.ts`·`rest-queue.log`, `/tmp/noline-stage5-independent/rest-ack.test.ts`·`rest-ack.log`·`canonical-ack.log`다. 진행 요약 파일의 5단계 검토 중 문구는 이후 완료 보고와 최종 검증 로그에 대조해 구별했다. 검증 때 사용 중인 임시 서버 포트는 52540, 격리 PostgreSQL 포트는 55437이며 지속 운영 주소나 배포 결과가 아니다.

6단계 근거는 `/tmp/noline-stage6-independent/deletion.test.ts`·`original.log`·`regression.log`, `rest-recovery.test.ts`·`rest-recovery.log`·`rest-404.log`, `/tmp/noline-stage6-pg-verify.log`다. 임시 로그의 오류 출력은 실패를 주입해 입력 보존을 확인하는 검사와 구별하고 최종 assertion·통과 수치를 대조했다.

7단계 직접 근거는 `/tmp/noline-stage7-independent/{original.test.ts,original.log,rest-diagnostics.test.ts,rest-diagnostics.log,sanitize.log,permanent.log}`다. 임시 자원 정리 완료는 Main과 검증자의 추가 반환으로 구별해 반영했다.
