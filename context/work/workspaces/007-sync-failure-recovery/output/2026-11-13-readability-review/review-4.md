# 관점 4 — 판단에 따른 실제 효과 추적

2026-11-13, 지정 workingtree(HEAD 8ab15b33)를 읽기 전용으로 검토했다. manifest의 생산 75·검사/설정 51·인접 UI 2, 총 128파일을 전체 읽었다. 파일별 실제 판단과 유지/후보는 coverage-4.json에 남겼다. 출력이 잘린 곳은 해당 파일·구간을 다시 열었다. 다른 관점의 보고서나 Main의 이번 decisions는 읽지 않았다. 제품·검사·정본·Git을 수정하지 않았고 설치·실행 검사도 하지 않았다.

주요 수신·저장 흐름은 현재 구성을 유지할 근거가 있다. 특히 reconcile의 정상 preserve와 예외 rollback, 특정 요청 ACK와 삭제 증거에 따른 다른 입력 정리는 실제 코드·검사에서도 구별된다. 개선 후보는 아래 여섯 건이다. 보안 심각도 순위가 아니라 읽기·수정 부담과 근거의 강도로 구분한다. 01은 검사가 의도한 조건에 도달하지 못하는 문제이며, 02~06은 동작을 보존하는 표현 후보다.

## E4-01 — 소유권 거절 검사가 실제 소유권 판정에 도달했는지 드러내야 한다

- 위치: apps/client/tests/shared/services/sync/queue-ownership.test.ts:12, :47; apps/client/src/shared/services/sync/engine.ts:109.
- 관찰: queue mock이 recoverInterruptedTasks를 내보내지 않는다. 현재 pushChanges는 제일 먼저 이를 호출하므로 TypeError로 거절돼도 `rejects.toThrow`, HTTP 미호출, 상태변경 미호출, 일반 Error 로그라는 현재 assertion을 모두 만족할 수 있다. `getQueueOwner`에 'b'/null을 넣었다는 배치가 실제 거절 이유를 증명하지 않는다. 실행하지 않았지만 현재 import·mock·첫 호출 순서로 직접 도출되는 경로다.
- 구체 대안: mock에 정상 완료하는 recoverInterruptedTasks를 추가하고, 준비한 task로 getQueueOwner가 호출됐음을 확인한다. reject는 AuthRequiredError 또는 현재 계정으로 전송할 수 없다는 구체 오류를 확인한다. HTTP 0·상태쓰기 0 기대는 유지한다. 테스트 이름과 실제 조건·효과가 한 줄씩 연결된다.
- 보존: 전송 전 소유권 거절은 IN_PROGRESS/FAILED로 바꾸지 않고 원문을 보존한다. 잘못된 mock 때문에 생산 동작을 바꾸면 안 된다.
- 이득/비용: fixture 1개와 1~2개 assertion으로 다른 이유의 거절이 통과하는 빈틈을 없앤다. 새 helper·제품 타입·인자는 필요 없다. 적용범위는 이 검사 파일이다. 제품의 소유권 검사가 고장났다는 주장은 아니다.

## E4-02 — 경로 계산의 null과 빈 배열이 정반대 캐시 효과를 낸다는 사실을 명시한다

- 위치: apps/client/src/shared/services/directions/route-downloader.ts:67, :127, :158.
- 관찰: readCurrentSegments는 없는/다른 소유 여행 또는 비활성이면 null, 삭제 여행 또는 유효 구간이 없으면 []를 반환한다. 두 refresh transaction은 null에서는 사본 캐시를 보존하고 []에서는 pruneCache가 모든 기존 경로를 지운다. `RouteSegment[] | null`과 `segments === null`만 보면 이 차이가 자료 부재인지 정상 보존 결정인지 정의부·세 반환·pruneCache까지 역추적해야 한다.
- 구체 대안: 같은 파일 안에서 반환을 `{kind:'preserve-cache'}`와 `{kind:'refresh-cache',segments: RouteSegment[]}`로 표현하고 두 쓰기 경계에서 kind를 검사한다. 전송 전 최신 인접검사도 refresh-cache의 segments만 읽는다. 별도 파일/정책 helper는 만들지 않는다. 규모가 과하면 최소안은 반환 계약에 `null은 기존 캐시 보존, []는 현재 구간 없음으로 기존 캐시 정리`를 정확히 적는 것이다. 권장 비교는 두 안의 실제 diff를 보고 작은 쪽을 고르는 것이다.
- 보존: 삭제 여행의 []는 null로 바꾸지 않는다. 비활성/다른 소유/없는 여행의 null도 []로 바꾸지 않는다. 시작·전송 전·저장 직전의 Local 재판정과 세션 검사, Directions 네트워크가 transaction 밖이라는 순서, 일부 profile 실패·기존 유효 profile 재사용은 그대로 둔다.
- 이득/비용: destructive cache 정리와 정상 보존의 차이를 호출부에서 직접 읽는다. union·객체 포장과 세 소비부 접근이 늘어나는 비용이 있다. helper 추출 자체는 이득이 아니며 계약 주석만으로 충분하면 union은 미채택할 수 있다. route-cache의 inactive preserve·deleted clear·late response·all profiles failed 검사가 보존 대조점이다.

## E4-03 — cleanup의 반환 숫자를 실제 정리 완료 건수처럼 읽지 않게 한다

- 위치: apps/client/src/shared/services/sync/cleanup-job.ts:35, :78, :82, :122.
- 관찰: processCleanupForTrip은 미전송 입력 때문에 즉시 return하거나 transaction 재검사에서 false여도 정상 반환한다. runPendingCleanups는 그 직후 processedCount를 올린다. 이 숫자는 사본 삭제 완료·지도 정리 성공 수가 아니다. Project data-lifecycle:116이 이미 문서화한 현재 한계이며 이번에 새로 발견한 기능 결함으로 다루지 않는다.
- 구체 대안: 현 숫자와 invalidation 조건을 그대로 유지하면서 내부 변수를 handledTripCount로 바꾸고 공개 함수의 반환 설명에 `예외 없이 검사를 마친 여행 수이며 미전송 보호로 건너뛴 여행도 포함`을 적는다. `cleanedCount`로 바꾸거나 실제로 정리한 때만 증가시키는 수정은 이 표현 정리와 구별한다.
- 보존: 후보를 찾은 순서, 미전송 입력의 두 번 확인, 보존 branch의 정상 return, 개별 오류 뒤 다음 여행 진행, 후보 0이면 vacuum 생략, 지도·vacuum 오류 무시, 반환 >0일 때만 현재 캐시 후처리 실행을 바꾸지 않는다.
- 이득/비용: 숫자의 의미를 알기 위해 private 함수 조기 return까지 따라가야 하는 부담을 줄인다. 로컬 이름·계약 설명만의 비용이다. 반환값을 받는 생산 호출자는 engine와 usePendingCleanups이며 둘 다 수를 소비하지 않는다. count를 실제 완료 수로 재정의하는 정책/효과 변경은 자동 채택하지 않는다.

## E4-04 — push의 finally 조건을 서버 변경 사실이 아니라 재조회 필요로 표현한다

- 위치: apps/client/src/shared/services/sync/engine.ts:104, :149, :159, :210.
- 관찰: hasServerChanges는 2xx를 받으면 Local 반영 전에 true, 409 legacy 보류/410 삭제를 종결해도 true가 된다. 같은 표식 재전송이나 legacy-held는 엔티티 값을 새로 바꾸지 않아도 조회가 필요하다. 현재 이름만으로는 flag가 실제 서버 write 확인인지, 후처리 실행 의도인지 다시 두 대입을 찾아 판단해야 한다.
- 구체 대안: 내부 flag를 shouldRefreshQueries 또는 needsQueryRefresh로 바꾸고 기존 대입·finally 위치는 보존한다. 상태를 새로 추가하거나 서버 diff를 계산하지 않는다.
- 보존: 성공 HTTP 이후 Local/ACK 실패해도 refresh 시도, 일부 성공 뒤 다음 FIFO 실패해도 refresh, 409/410 해결 뒤 refresh, 성공 쓰기 없는 빈 push에서는 생략. cancelQueries 실패는 현재 local-after-response 신호와 throw로 이어지고 invalidate의 완료는 기다리지 않는 기존 계약을 유지한다.
- 이득/비용: finally가 왜 실행되는지를 변수 자체로 읽는다. 같은 파일의 이름 세 곳만 바뀌고 타입·인자 비용은 없다. 응답을 확인했다고 모두 서버 내용이 바뀌었다고 말하지 않게 한다. 관점3의 이름 후보와 중복되면 한 건으로 통합하면 된다.

## E4-05 — 편집 시계 읽기 helper의 메모리 보존 효과를 드러낸다

- 위치: apps/client/src/shared/services/edit-stamp/index.ts:25, :56, :68.
- 관찰: readObservedClock는 SecureStore 읽기보다 먼저 unpersistedClock을 바꾼다. 이 효과는 읽기 실패 뒤에도 받은 표식을 다음 발급에 남기는 핵심 보존 장치다. 단순 read로 분류해 순수 helper로 옮기거나 메모리 갱신을 await 뒤로 보내면 보존 의미가 달라진다.
- 구체 대안: helper를 retainAndReadObservedClock처럼 효과가 보이는 이름으로 바꾸거나, 짧은 retainObservedMarks(marks) 호출과 저장 시계 읽기를 같은 withEditClock 블록 안에서 명시한다. 현재 크기에서는 이름 변경을 우선 비교한다. 별도 모듈·새 상태는 만들지 않는다.
- 보존: 메모리 관찰이 저장소 get보다 먼저, 두 동작 모두 기존 직렬화 큐 안에서, set 성공 뒤에만 unpersistedClock 해제. submittedAt 캡처는 큐 대기 전이며 기존 edit은 재발급하지 않는다. 뒤에 접수한 관찰이 이미 대기하던 저장 순서를 바꾸지 않는 조건도 유지한다.
- 이득/비용: 실패해도 남아야 하는 비DB 상태의 효과를 호출 이름에서 읽는다. 참조 두 곳의 개명 비용만 있다. helper 분리안은 새 탐색비가 있어 이름 변경보다 특별한 이득이 없으면 미채택한다. edit-stamp.test의 read/write 실패와 later-observation 검사가 대조점이다.

## E4-06 — 계정 검사 호출이 영속 격리도 수행한다는 계약을 입구에 둔다

- 위치: apps/client/src/shared/services/auth/local-account.ts:24, :48; 범위 밖 호출자 apps/client/src/shared/store/auth.ts:105, :163.
- 관찰: inspectLocalAccount는 조회 결과를 계산할 뿐 아니라 inspectAndQuarantine을 통해 원본 없는 큐 상태를 QUARANTINED로 쓰고 진단을 보낸다. 이후 invalid를 만나 unresolved로 끝나도 앞서 실행한 격리는 남는다(runDatabaseOperation은 transaction이 아니다). 현재 외부 이름·입구 주석은 검사라고만 말해 로그인 실패 시에도 어떤 효과가 남는지 내부 loop와 실행기를 따라야 한다.
- 구체 대안: 공개 이름 전체를 길게 바꾸기보다 입구 계약에 `원본 없는 요청을 원문 그대로 영속 격리한 뒤 계정을 판단하며, 뒤의 판단 실패가 앞선 격리를 rollback하지 않는다`를 적는다. 사용자에게 필요한 경우 prepareLocalAccountForLogin 같은 행동 이름을 비교할 수 있으나 이 이름은 계정 수락까지 끝났다는 인상을 주지 않아야 한다.
- 보존: 진짜 다른 소유자/invalid는 차단, 원본 없는 정상 action 격리, 미지원 table/action invalid 구별, payload·retryCount·기존 격리 보존, 격리 후 로그인/정상 FIFO를 계속 허용. transaction으로 감싸거나 throw로 바꾸는 것은 이 제안이 아니다.
- 이득/비용: auth 호출자는 실패 이후 DB 불변을 잘못 예상하지 않는다. 주석 한 곳이면 충분하며 불필요한 계층/반환 타입은 만들지 않는다. orphaned-queue의 로그인·복원·quarantine 유지 검사가 현재 효과를 보여 준다.

## 유지가 적절한 주요 선택과 비교한 대안

- reconcileRecordInTransaction의 prepare → 서버 수락 → 서버 저장 → Local 판단/반영 → completedTask ACK는 유지한다. `preserve`를 예외로 바꾸면 손상 pending을 보존하면서 서버 확인본·현재 요청 완료를 확정하는 정상 경로가 rollback된다. projectPendingChanges는 clone에만 투영하고 DB 쓰기는 applyLocalDecision이 수행한다. read/decide라는 이름 아래 SQLite 쓰기를 숨기지 않는다. 서버 판본 재사용과 수락은 구별하고, Local 낙관 version으로 응답 선후를 결정하지 않는다.
- confirmed-deletion의 completedTaskId 제외와 confirmedTaskId 검사 증거는 서로 다른 책임이다. ACK를 일괄 삭제 helper로 합치면 2xx 요청 1회 ACK와 410 관련 입력 정리가 섞인다. 현재 payload 해석 실패→보존, 개별 CREATE 보존, 원본/저장귀속 모순 보존, schema+저장가능성 검증 뒤 삭제라는 순서를 유지한다. 단순 조건 결합/조기 validation 공통화는 보존 우선순위를 바꿀 수 있다.
- engine의 nested catch는 길지만 HTTP 거절을 해결하는 동안의 Local 실패와 원래 요청 실패를 구별한다. 410의 최소 맥락 미충족은 null(원래 server-rejected), 맥락을 인식한 엄격 parse 실패는 local-after-response라는 기존 진단 계약이다. 무조건 safeParse로 치환하거나 catch를 하나로 합치는 안은 미채택한다. 실패 신호를 FAILED 쓰기 전에 남겨 두 쓰기가 모두 실패해도 중단을 알리는 순서도 유지한다.
- pull은 HTTP 밖에서 요청 범위/판본을 받고, 같은 SQLite transaction 안에서 현재 준비ID·Local·checkpoint를 대조한다. 살아 있는 자식은 현재 준비에서만, 확정 삭제와 여행 메타데이터는 준비가 바뀌어도 반영한다. 모든 응답을 stale 한 번으로 묶어 버리는 공통 guard는 현재 선택을 훼손한다. checkpoint 조건을 transaction 밖으로 옮기지 않는다.
- 서버 mutation은 저장 가능성 검사 → 소유 원본으로 부모ID 확인 → 부모 잠금 → 자식 재조회/잠금 → 삭제 판정 → 편집 merge 순서다. 마지막 행 재조회는 중복조회처럼 보여도 잠금 전/후의 책임이 다르다. validateExpense/Schedule의 PostgreSQL cast를 순수 schema 검사로 대체하지 않는다. mergeEdit의 값 같음과 새 표식 저장, 구버전 whole-request hold, 원문 보존은 유지한다.
- 수정폼의 snapshot·key 장착·RHF isSubmitting·isMounted는 다른 사실이다. save Promise를 끝까지 기다려 제출 상태를 연결하고, route 준비는 저장 뒤 독립 시작하며, unmount 뒤에는 안내/닫기만 막는다. DB 작업/경로 준비 자체를 mounted 조건 아래로 옮기면 저장 완료 후 처리가 달라진다. 성공 reset·추가 draft 보호·새 잠금을 제안하지 않는다.
- activate의 transaction 안 null 반환은 이미 받은 삭제 증거는 commit하고 바깥에서 활성화 실패를 알리기 위한 선택이다. 안쪽 throw로 단순화하면 삭제 수신도 rollback된다. 이미 활성 경로, 신규 입수, 백그라운드 지도/경로 완료는 계속 구별한다. deactivate는 Local commit 뒤 지도/서버 알림 오류를 무시하는 명시적 순서다.
- legacy-holds의 clear/preserve는 transaction 안에서 notify를 요청하지만 실제 유일 구독자는 query invalidation이고 listLegacyHolds가 DB 실행 큐에 접수되어 현재 transaction 뒤 읽는다. notifier가 commit 보장이라는 확대 해석은 피해야 하나, post-commit 알림을 위해 모든 삭제·수신 진입에 새 결과전파 장치를 도입할 현재 이득은 작다. listener 오류도 저장을 취소하지 않는다. 동기화의 hasChanges notify는 commit 뒤라는 차이를 확인했다.
- DB serializer는 실패한 작업 Promise를 호출자에 전파하고 다음 실행 큐만 회복한다. transaction 내부와 외부 operation을 혼합·중첩시키는 공통 wrapper는 deadlock/원자성 의미가 달라질 수 있어 유지한다. logout의 DB reset→auth clear와 finally의 선택여행/cache 정리는 일부 실패 뒤 실제 남는 상태를 직접 드러낸다.
- 진단 함수의 catch는 관측 실패를 제품 결과와 분리하고, sanitizer는 원래 event spread 대신 허용값을 새로 구성한다. ACK 완료/legacy-held/삭제 수신을 단순 성공 한 종류로 모으지 않는다. UI primitive 두 파일은 닫기 시도와 disabled 전달을 확인했으며 다른 작업 변경이 섞인 경로이므로 이번 자동 수정 후보로 올리지 않았다.

## 범위·근거·한계

검토의 근거는 지정 review brief, development/references/review.md, 네 app/package guide, Ticket09·007-07·003-12와 지정 3개 records다. Personal의 development/code-expression/naming-and-completion/contracts-and-lifetime/shared-boundaries, Project data-lifecycle 및 app-runtime의 인증·세션·종료, writing-and-input의 제출·실패·종료를 실제 코드와 대조했다. 기록의 이전 완료 결론은 현재 품질의 증거로 쓰지 않았다.

범위 밖 추가 읽기는 query-refresh.ts 전체(새 조회 대기·catch 범위 확인), usePendingCleanups.ts(반환 숫자 사용 확인), auth.ts의 inspectLocalAccount 두 호출 위치 탐색(계정 검사 효과의 소비자 확인)이다. 이는 수정 범위 확대가 아니다.

실행 검사·native SQLite·실제 JWT·PostgreSQL 동시성·Directions/Mapbox·Sentry 수집을 새로 확인하지 않았다. 테스트를 읽고 어떤 조건을 강제하고 어떤 효과를 확인하는지 판단한 결과이며 과거 통과 수를 현재 실행 결과로 인용하지 않았다. E4-01도 실제 재실행한 결함 재현이 아니라 현재 mock과 호출 순서로 도출한 것이다. 새 제품 정책 선택이 필요한 제안은 자동 채택 대상으로 제시하지 않았다.
