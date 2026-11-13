# 관점 5 — 역할 없는 표현이 불필요한 해석을 요구하는가

128파일 전체(생산75·검사/설정51·인접공유UI2), manifest 기준 24,287행을 읽었다. 생산 코드는 현재 파일의 함수·타입·렌더·호출 연결 전체를, 검사/설정도 전부 읽었다. diff 표본이나 발견 개수로 종료하지 않았다. 완료 시 SHA256을 manifest와 대조해 128파일 모두 같은 판본임을 확인했다. 파일별 실제 읽은 범위·함수·판단·finding 연결은 `coverage-5.json`에 있다. 제품·검사·정본 문서·git을 변경하지 않았으며 검사·설치·앱·DB·네트워크 작업을 실행하지 않았다.

추천은 아래 12개다. 모두 기능 추가나 정책 변경 없이 가능한 후보이며, 심각도는 이해·수정 부담 기준이다. `중간`은 먼저 판단할 만한 후보, `작음`은 한정 정리, `선택`은 이득이 작아 함께 만질 때만 고려할 후보다. 보안/기능 결함의 등급으로 읽지 않는다. 무역할처럼 보였으나 실제 보존 역할이 있는 장치는 뒤에서 따로 밝혔다.

## R5-01 · 중간 — submit callback의 수명 검사를 실제 처리 함수 첫머리로 모을 수 있다

위치: `apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx:91`, `:118`, `:124`; `apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx:113`, `:164`, `:170`.

현재 `handleSave`는 RHF `handleSubmit`에 두 익명 콜백을 주고, 각 콜백은 mounted 검사 뒤 `handleValidSubmit` 또는 `handleInvalidSubmit`을 다시 호출한다. 유효/무효 처리 함수와 그 둘의 입구 사이를 오가며 실제 진입 조건을 조립해야 한다. mounted 검사는 필요하지만 별도의 중계 콜백 층까지 필요한 것은 아니다.

대안: `handleValidSubmit`와 `handleInvalidSubmit`의 첫머리에 각각 `if (!isMounted.current) { return; }`를 두고 `await handleSubmit(handleValidSubmit, handleInvalidSubmit)()`로 연결한다. 공유 guard wrapper나 새 Hook은 만들지 않는다. 오류 catch와 저장 뒤 mounted 재검사는 그대로 둔다.

보존: 비동기 resolver가 끝나기 전에 이전 폼이 해제되면 유효·무효 어느 쪽도 저장/안내하지 않는다. 저장 시작 뒤 해제된 폼은 완료될 수 있으나 post-await 성공 안내/닫기는 실행하지 않는다. RHF Promise 수명과 `isSubmitting`, 저장 성공 후 닫기, 새 폼에 앞 폼 잠금이 이어지지 않는 계약도 유지한다. 일정 저장 뒤 경로 준비는 현재처럼 mounted 재검사 앞에서 실행한다.

이득/비용: submit 연결을 읽을 때 익명 중계 두 개를 풀어볼 필요가 사라지고 함수 자체에 진입 조건이 붙는다. 함수 수·인자·파일 이동은 늘지 않는다. 기존 offline-values의 지연 resolver·이전 폼 완료 사례와 update-save-lifetime을 보존 검사로 사용하면 된다. snapshot state와 mounted ref 제거 제안이 아니다.

## R5-02 · 작음 — 지도 요약의 hasAllRoutes는 계산도 반환도 소비되지 않는다

위치: `apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx:155`, `:157`.

`routeSummary.hasAllRoutes`는 전체 경로가 준비됐는지를 계산해 반환하지만 컴포넌트의 JSX/효과/호출부 어디에서도 읽지 않는다. 현재 표시는 `savedCount > 0`와 거리·시간만 사용한다. 독자는 전체 준비 여부가 어떤 표시나 제한을 결정하는지 찾아야 하지만 연결은 없다.

대안: `hasAllRoutes` 선언과 반환 속성만 제거한다. `savedSegments`, 합계, `savedCount`와 route 조회/segment matcher는 유지한다.

보존: 부분 경로에서도 저장된 경로의 거리·시간을 표시하는 현재 결과, 선택 profile과 현재 좌표가 일치할 때만 저장 경로를 쓰는 조건, 지도 카메라 동작을 바꾸지 않는다. `s.distance && s.duration`의 0 처리 등 다른 조건은 이 후보에 섞지 않는다.

이득/비용: 현재 존재하지 않는 전체 준비 판단을 추적할 필요가 없어지며 새 탐색·타입·인자 비용이 없다. 지도 freshness 검사는 그대로 적용 가능하다.

## R5-03 · 중간 — 보류 보존 함수가 쓰지 않은 합성 hold까지 반환할 필요가 없다

위치: `apps/client/src/shared/services/sync/legacy-holds.ts:66`, `:112`, `:122`, `:125`.

`preserveLegacyHoldInTransaction`과 외부 transaction 진입 `preserveLegacyHold`는 `Promise<LegacySyncHold>`를 공개한다. 그러나 앱·검사 전체 호출 검색에서 반환 행을 읽는 소비자는 없고 모두 완료만 기다린다. 특히 이미 확인된 서버 보류를 다시 받는 `dismissal` 경로는 DB에 삽입하지 않고 방금 조립한 `hold`를 반환한다. 같은 ID가 이미 있으면 `onConflictDoNothing` 뒤의 반환도 DB에서 읽은 행이 아니다. 현재 반환값은 필요 없는 조회 결과/저장 결과 해석을 호출자에게 제시한다.

대안: 둘 다 `Promise<void>`로 좁힌다. dismissal은 빈 return, 정상 삽입 뒤에는 notify 후 종료한다. 실제 DB 저장할 `hold` 객체는 유지한다. 외부 진입의 transaction callback은 그대로 둔다.

보존: 원문/현재값·소유권 검사, serverBacked에 따른 payload 해석 차이, ACK가 있는 보류의 재등장 방지, 기존 보류의 덮어쓰기 방지, 계정 재검사, notification 시점과 예외 전파를 유지한다. 반환 행을 얻으려는 새 DB 조회는 추가하지 않는다.

이득/비용: 호출 계약이 실제 사용하는 '보존 처리를 끝냄'만 남고, 반환 행이 이번에 실제 삽입됐는지 해석할 필요가 사라진다. 다른 인자는 그대로며 호출부 수정도 거의 없다. reconciliation/save-submission의 원문·ACK 보존 검사를 그대로 사용한다.

## R5-04 · 작음 — queue 추가의 반환 ID는 모든 소비자가 버린다

위치: `apps/client/src/shared/services/sync/queue.ts:23`, `:29`, `:43`.

`addToSyncQueue`는 `Promise<string>`으로 queue ID를 반환한다. 전체 사용처는 Trip·Schedule·Expense Local CRUD의 `await addToSyncQueue(...)`와 transaction 실패 검사 한 곳이며, 반환을 대입하거나 전달하는 곳이 없다. 독자는 Local entity ID와 별도로 받은 queue ID로 후속 처리가 이어질 가능성을 고려해야 한다.

대안: 반환을 `Promise<void>`로 좁히고 마지막 `return queueItem.id`만 없앤다. queueItem 자체의 ID 발급/insert는 유지한다.

보존: 같은 transaction 안에서 원본 변경과 queue insert가 함께 확정/실패한다. 생성 ID·raw payload·FIFO 삽입 순서·표식 값은 전혀 바꾸지 않는다.

이득/비용: 소비하지 않는 두 번째 식별자 반환 계약을 제거한다. 절감은 작지만 새 helper·인자·타입은 없다. 소비자들이 완료만 기다린다는 확인을 바탕으로 한 후보이며 queue ID 생성 자체를 없애는 뜻이 아니다.

## R5-05 · 작음 — 사용되지 않는 단건 hasPendingTask API를 남길 이유가 없다

위치: `apps/client/src/shared/services/sync/queue.ts:152`.

`hasPendingTask(tableName, recordId)`는 자체 정의 외 앱·검사·스크립트 소비자가 없다. 한 행을 조회해 PENDING 존재를 판단하는 전체 API를 독자가 이해해야 하지만 실제 흐름에는 연결되지 않는다. 이름이 비슷한 `hasPendingTasksForTrip`는 cleanup에서 실제 사용하며 FAILED·IN_PROGRESS·보류 입력까지 보호한다. 둘을 같이 남기면 단건 helper가 실제 업무 경로에서도 필요한지 추적해야 한다.

대안: 사용되지 않는 `hasPendingTask`와 그 JSDoc만 제거한다. 실제 cleanup의 `hasPendingTasksForTrip`/transaction 진입은 유지한다.

보존: queue 전송·재시도·정리 조건은 바뀌지 않는다. 이 제거를 다른 실제 pending 검사 축소로 확대하지 않는다.

이득/비용: 호출 없는 API 한 개의 의미와 제한을 읽을 필요가 사라진다. 새 코드/타입/호환 adapter 없이 제거 가능하다. 저장소 외부에 이 앱 내부 모듈을 직접 가져가는 소비자는 이번 검색으로 확인할 수 없으나 패키지 공개 API는 아니다.

## R5-06 · 작음 — 비활성화 결과에 사용하지 않는 정리 상세값을 옮겨 담는다

위치: `apps/client/src/entities/trip/data/useDeactivateTrip.ts:41`, `:60`, `:77`.

`cleanupPending`은 DB에 기록할 실제 상태다. 그러나 transaction에서 `{ cleanupExecuted, cleanupPending }`를 반환하고, mutation 결과에 다시 `cleanupData`, `cleanupExecuted`, `cleanupPending`을 싣는 부분은 현재 소비가 없다. hook의 onSuccess는 `alreadyDeactivated`만 분기하고 MainTripSection·TripsSection의 성공 콜백은 결과 인자를 받지 않는다. 반환용으로만 보류 상태를 transaction 밖에 끌어낸다.

대안: transaction은 지도 정리가 필요한지의 boolean `cleanupExecuted`만 반환한다. `shouldDeferCleanup`는 DB update에서 그대로 사용한다. 최종 mutation 결과는 현재 사용되는 `{ tripId, alreadyDeactivated: false }`로 좁힌다.

보존: pending 재검사, soft-delete/준비 ID 갱신, cleanupPending 영속 기록, 실제 정리된 경우의 지도 정리, 지도 실패/서버 비활성화 알림 실패의 무시, onSuccess의 Query 갱신 조건과 완료 시점을 유지한다.

이득/비용: 실제 저장 상태와 외부 완료 결과를 다시 읽으며 같은 이름을 추적할 비용이 줄어든다. 새 상태·옵션은 없다. 결과 객체 shape 축소이므로 activation-query-refresh 같은 범위 밖 hook 소비자 검사도 함께 확인할 필요가 있다.

## R5-07 · 선택 — checkPendingSync의 failedCount 반환은 현재 쓰이지 않는다

위치: `apps/client/src/shared/services/auth/logout-service.ts:35`, `:55`.

일반·강제 로그아웃/탈퇴와 유일한 직접 검사 소비자는 `hasPending`과 `pendingCount`만 읽는다. `failedCount`는 결과 타입과 값에만 존재한다. FAILED가 별도 UI 분기를 만드는 것처럼 보일 수 있지만 실제 종료 판단은 `stats.total + recoveryCount`다.

대안: checkPendingSync 반환에서 failedCount만 제거한다. `getSyncQueueStats` 자체의 failed 필드나 SyncIncompleteError의 실패 정보는 이 후보에 포함하지 않는다.

보존: FAILED·IN_PROGRESS·QUARANTINED·hold·미확인 ACK가 총 손실 가능 입력으로 계산되는 조건, force의 건너뛰는 범위, 세션 종료 순서 그대로다.

이득/비용: 작은 반환 계약 정리다. 동작 이득은 없고 주변에서 이 파일을 고칠 때 함께 반영할 정도다. 별도 공통 pending 모델 도입은 필요 없다.

## R5-08 · 선택 — 부모 잠금 helper의 성공 trip은 어느 호출자도 읽지 않는다

위치: `apps/server/src/services/entity-mutations.ts:81`, `:99`; 호출 `:190`, `:231`, `:289`, `:375`, `:465`.

`lockOwnedTrip`은 실패 때 `{ error: MutationResult }`, 성공 때 `{ trip }`을 반환한다. 다섯 호출자는 모두 `parent.error`만 읽고 성공 trip은 사용하지 않는다. 이 성공 payload를 보면 이후 mutation이 그 여행 데이터를 사용해 판정하는 것처럼 보이지만 실제 책임은 소유 여행 잠금과 삭제 거절이다.

대안: 성공은 undefined, 실패는 MutationResult를 반환하는 `Promise<MutationResult | undefined>`로 좁혀 호출부를 `const parentError = await lockOwnedTrip(...); if (parentError) return parentError;`로 표현할 수 있다. helper 자체와 잠금은 유지한다.

보존: 저장 가능성 검사 뒤 부모 잠금, 부모 없음404/확정 삭제410, entityId를 넣은 proof, 부모먼저 잠금 순서와 transaction 수명을 보존한다. 성공 행 미사용을 이유로 SELECT나 `for('update')`를 제거하면 안 된다.

이득/비용: 쓰지 않는 성공 자료와 부모 결과 래퍼 해석을 줄인다. 다섯 호출부 이름이 바뀌는 비용이 있고 기존 패턴도 읽기 어렵지 않아 선택 후보다. discriminator를 더 만드는 대안은 이득이 없다.

## R5-09 · 중간 — Trip route가 공유 schema에서 거절된 null/invalid 날짜를 다시 처리한다

위치: `apps/server/src/routes/trips.ts:93`, `:108`, `:140`, `:212`, `:227`.

POST는 `legacyCreateTripRequest.safeParse` 성공 뒤 `new Date` 두 개를 만들어 NaN 검사만 하고 insert에서 같은 Date를 다시 만든다. PUT는 `updateTripRequest.safeParse` 성공 뒤에도 start/end null 분기와 Invalid Date 응답 분기를 각각 둔다. 실제 `tripEntity`의 startDate/endDate는 `isoDateTime`이고 해당 primitive는 string datetime과 유한 Date.parse를 검사한다. update는 optional만 추가하므로 null을 허용하지 않는다. reader는 schema와 route가 서로 다른 날짜 집합을 지원하는지 다시 확인해야 하지만 이 분기들은 현재 요청 경로에서 도달하지 않는다. POST에서 구조분해한 userId 역시 쓰지 않으며 실제 소유자는 req.userId다.

대안: request parse를 그대로 둔 채 도달 불가 null/NaN 분기를 제거하고, PUT는 각 값이 undefined가 아닐 때 Date 변환을 한 번만 수행한다. POST는 불필요한 검사 변수 없이 insert에서 한 번 변환하거나, 먼저 만든 start/end를 그대로 저장한다. 미사용 userId 구조분해도 제거한다.

보존: 요청 schema 거절400의 현재 응답, 날짜 범위/도시 시간대 조합 검증, 기존 행과 부분 요청의 결합, 소유권 조회·쓰기·version·직렬화와 응답 검증을 유지한다. 개별 날짜가 유효하다는 이유로 `isTripDateRangeValid`를 제거하지 않는다. latitude/longitude/cityId 저장 범위, Trip의 별도 기존 동작은 이 정리에 섞지 않는다.

이득/비용: 실제로 지원하지 않는 null 날짜와 이중 검증 실패 흐름을 읽을 필요가 없어지고 Date 변환도 중복되지 않는다. 공유 schema나 외부 wire 호환 변경은 없다. 이 부분은 새 sync 코드의 핵심이라기보다 같은 대상 파일의 기존 상세이므로 Main이 이번 정리 범위에 넣을지 별도로 고르면 된다. 범위 밖 `packages/schema/src/requests/trip.ts`와 primitives/datetime을 직접 읽어 도달 불가를 확인했다.

## R5-10 · 작음 — mutateAsync 검사에 구형 onSuccess callback adapter가 남아 있다

위치: `apps/client/tests/screens/read-query-consumers.test.tsx:499`.

'일정 제목만 저장하면…' 검사는 `mockSaveSchedule`에 `async (_input, callbacks) => callbacks?.onSuccess?.()` 구현을 설치한다. 현재 UpdateScheduleDrawer는 `mutateAsync`를 하나의 입력으로 호출하고 await 뒤 직접 안내한다. 두 번째 callbacks 인자는 실제로 오지 않으므로 이 코드는 성공 처리에 전혀 기여하지 않는다. 독자는 폼이 여전히 mutate callback 방식인지 잘못 추정할 수 있다.

대안: `mockSaveSchedule.mockResolvedValueOnce(undefined)`처럼 Promise 성공만 재현한다. 현재 이 검사에서 저장 결과는 읽지 않는다. 별도의 가짜 성공 callback을 추가하지 않는다.

보존: 실제 submit/RHF·await 완료 뒤 성공 Alert, 제목만의 patch, route 요청 부재를 그대로 검증한다. mockSaveSchedule이 생성 폼에서도 공유된다는 사실은 유지하며 해당 한 사례의 mockReturn만 바꾼다.

이득/비용: 실행되지 않는 인자와 callback 계약, 타입 cast가 없어지고 실제 저장 계약과 fixture가 일치한다. 제품 수정은 필요 없다.

## R5-11 · 작음 — 활성화 테스트의 반환형 cast가 이미 없어진 목록을 요구한다

위치: `apps/client/tests/shared/services/sync/save-submission.test.ts:123`, `:127`.

`activateTripForTest`는 mock useMutation에서 얻은 실제 옵션을 사용하면서 `mutationFn`을 `Promise<{ schedules: unknown[]; expenses: unknown[] }>`로 강제한다. 현재 activation 함수는 `{ tripId, alreadyActivated }`를 반환하고 이 파일의 소비자는 활성화 완료만 기다린다. 오래된 목록 반환형은 실제 코드에 없는 반환 계약을 독자에게 제시한다.

대안: 이 fixture에서는 `mutationFn: (id: string) => Promise<unknown>`로 좁힌다. 또는 반환을 검사해야 한다면 현행 tripId/alreadyActivated 타입으로 맞추되, 지금 소비하지 않는 상세를 추가할 이유는 없다. production Hook의 반환을 되돌리지 않는다.

보존: 활성화를 지연한 동안 제출 표식을 확보하는 순서와 그 후의 Local/queue 검사는 동일하다. response-freshness 파일은 현재 반환을 실제 검사하므로 그 fixture까지 unknown으로 일반화하지 않는다.

이득/비용: 실제로 쓰지 않는 반환 shape와 현재 구현 사이의 가짜 의존을 제거한다. 새 helper·fixture 공유는 필요 없다.

## R5-12 · 선택 — 하나의 경비 사례만 있는 it.each가 불필요한 변형 축을 만든다

위치: `apps/client/tests/screens/read-query-consumers.test.tsx:443`.

닫힌 경비 수정 폼 검사는 `it.each([{ name: '경비', ui: updateExpense }])` 하나의 행만 가진다. 실제 비교 축이 없는데 `$name`, ui callback 인자를 따라가야 한다. 일정 폼의 별도 '전체 목록을 구독하지 않음' 검사는 이미 다른 곳에 있고, 그 정책 차이를 이 표의 새 행으로 다시 합치면 안 된다.

대안: 단일 `it('닫힌 경비 수정 폼은…', async () => ...)`로 두고 updateExpense(false/true)를 직접 호출한다.

보존: 닫힌 상태의 cache invalidation→조회0회→열기→조회1회 순서와 같은 QueryClient wrapper를 유지한다.

이득/비용: 불필요한 변형 표와 간접 ui 인자가 사라진다. 단순 줄 수보다 '다른 지원 사례가 있는가'라는 추측을 없애는 작은 이득이며 별도 수행 우선순위는 낮다.

## 제거하면 안 되는 유사 표현을 확인한 결과

- 두 수정 폼의 첫 입력 `useState` snapshot은 RHF 값과 같아 보여도 배경 조회 이후 비교 기준·시간대가 바뀌지 않는 역할이다. mounted ref는 resolver 이후/저장 이후의 늦은 효과를 막는다. R5-01은 이 장치를 보존한 표현 정리다.
- routeChildMutation의 preparation 결과 포장은 이전 여행 작업을 기다리는 동안 발생한 Promise rejection을 받아두는 역할이다. 표식 준비·router·API parse·Local 변환은 같은 검증 중복이 아니다. generated edit 뒤 schema parse는 그룹 계약을 최종 확인한다.
- DB transaction과 runDatabaseOperation, preserve/reconcile의 InTransaction과 외부 wrapper는 직렬 실행·원자성·재진입 대기의 경계를 나눈다. wrapper 수가 많다는 이유로 합치거나 내부에서 실행 큐를 다시 잡게 만들지 않는다.
- reconcile의 준비/서버 수락/보존/Local 결정/반영/ACK helper와 결과 union은 정상 keep-local과 저장 실패를 분리한다. state.server와 acceptance.record는 늦은 응답 때 다를 수 있다. 서버 확인본/Local/pending raw 입력은 중복 상태가 아니다.
- `LocalRecord = ServerRow & { userId: string }`의 교차타입은 필요하다. 실제 공유 entity의 userId가 nullable이고, Local 저장은 확인한 현재 계정의 string을 요구한다.
- editedMarks의 Mark generic은 실제로 raw unknown queue 표식과 EditStamp 둘을 다룬다. findSavedRoute의 generic은 geometry/distance 등 호출자의 row 정보를 반환까지 보존한다. 단순 제네릭 제거 후보가 아니다.
- push의 stage, hasServerChanges, hasReportedBlock은 실패 위치·일부 성공 후 캐시 갱신·중복 진단 방지라는 서로 다른 사실이다. 이들을 '동기화 중' 한 상태로 합치지 않는다.
- 410 처리의 느슨한 맥락 guard와 엄격한 parse는 서로 다른 진단 단계를 만든다. reconciliation의 incomplete deletion response 사례가 server-rejected/local-after-response 차이를 직접 확인한다. safeParse 하나로 합치는 제안은 여기서 하지 않는다.
- confirmed-deletion의 원본 귀속, 저장된 DELETE 증거, 서버가 직접 검사한 confirmedTaskId, 일반 2xx completedTaskId는 서로 대체할 수 없다. 모양이 비슷한 조건이어도 삭제 권한과 정리 대상이 다르다.
- route-downloader의 네트워크 전후 Local 조회·transaction·session callback은 대기 중 바뀐 인접관계/활성/계정을 다시 확인한다. `downloaded`와 vacuum 삭제 수는 검사에서 구체 결과를 구별하므로 무소비 반환과 달리 유지했다.
- 테스트의 지연 resolver를 다시 호출하는 callback은 종종 의미 있다. update-query-refresh의 `finishNew: value => finishNew(value)`는 이후 새 요청이 시작한 뒤 채워지는 변수를 읽는다. 서버 pull-cursor의 `pull(...).then(response => response)`도 Supertest thenable을 즉시 실행시키는 역할이라 그대로 Promise 변수에 넣는 것으로 대체하면 실행 시점이 바뀐다.
- SQLite adapter의 rows→배열 변환, mockQuery thenable, QueryClient wrapper, hoisted 상태와 SDK 수신기 callback은 검사대상과 호스트 API를 연결한다. 반복이나 길이만으로 삭제하지 않았다.
- packages/schema package.json의 exports와 typesVersions는 서로 다른 resolver 경로다. schema raw payload·local numeric 보수 판정은 실제 PostgreSQL 수용과 역할이 달라 보이는 검증을 통합하지 않았다.
- 인접 Drawer·Pressable 두 파일도 전체를 읽었다. ref/animation·backdrop 배치·callback children/Text wrapper의 역할을 확인했으며 다른 작업의 UI 변경을 이번 코드 정리 자동 대상으로 제안하지 않았다.

## 추가로 확인한 범위와 한계

범위 밖에서는 unused 반환/호출을 확인하기 위해 apps·packages의 실제 심벌 사용을 검색했다. 비활성화 결과를 받는 MainTripSection/TripsSection 성공 callback을 직접 읽었고, 날짜 분기 판정을 위해 Trip request schema와 isoDateTime primitive를 읽었다. 추가 검색은 이 대안의 유효성 확인용이며 범위 밖 파일 전체 검토나 수정 권한을 뜻하지 않는다.

기준은 review.md, client/server/schema/ui 가이드, Ticket007-09·007-07·003-12, 지정 세 기록과 관련 Personal 본문·Project data-lifecycle를 직접 대조했다. 이전 Main/다른 reviewer 결론이나 main-decisions는 읽지 않았다. 실행 검증은 하지 않았으므로 위 대안은 채택·구현 완료가 아니다. 함수·필드 소비 부재는 현재 저장소의 정적 호출 확인이며 동적 외부 소비에 대한 일반 보장은 아니다.
