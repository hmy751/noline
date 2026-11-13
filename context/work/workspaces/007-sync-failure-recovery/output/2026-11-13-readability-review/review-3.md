# 관점 3 — 이름·타입·반환과 실제 의미

검토 범위는 manifest의 **128/128파일 전부**다. 생산75·검사/설정51·인접 UI2의 현재 본문 전체를 읽었고, 잘린 도구 출력은 해당 구간을 다시 읽었다. 표본 선정이나 발견 개수 도달로 종료하지 않았다. 최종 SHA256 대조에서 128파일 모두 시작 manifest와 같았다. 제품·검사·문서·git은 수정하지 않았다. 테스트 실행·앱 실행·DB 작업·외부 통신도 하지 않았다. 아래는 코드와 검사 내용을 대조한 읽기·수정 부담 판단이며 기능 검증 완료 선언이 아니다.

동작을 새로 고르는 의견은 없다. wire 필드·HTTP status·DB column·제품 상태 이름은 임의로 바꾸지 않는다. 아래 우선도는 보안 결함 등급이 아니라 이해·수정 부담이다. `유력`은 Main이 실제 이득을 확인해 채택할 수 있다는 뜻이며 필수 변경 개수는 없다. 각 파일의 판단은 coverage-3.json에 별도로 남겼다.

## M3-01 — 준비를 진행 중인 Promise를 준비 완료 요청처럼 부른다 (유력, 작음)

- 위치: `apps/client/src/entities/expense/repository/expense-repository.ts:66`, `apps/client/src/entities/schedule/repository/schedule-repository.ts:67`; 소비자 `shared/services/offline-prep/router.ts:88`.
- 관찰: `prepareEdit`는 `Promise<PreparedEdit<T>>`인데 변수는 `preparedRequest`다. 그 값을 await하지 않고 Router의 `preparation` 인자로 넘기는 것이 의도다. 현재 이름만 읽으면 이미 검증·표식 영속화가 끝난 값으로 예상하게 되고, Router가 준비 실패를 먼저 받아 두는 이유를 다시 조사해야 한다.
- 대안: 두 변수만 `requestPreparation` 또는 `preparedRequestPromise`로 바꾼다. Router callback의 `request`/`input`은 실제 준비 완료값이므로 현재 이름을 유지한다.
- 보존: prepareEdit 호출 시 제출 시각·발급 순서를 접수하고, 같은 여행 작업 순서도 즉시 접수한다. **Repository에 await를 추가하지 않는다.** 앞 작업 대기 중 준비 실패를 rejection 처리하는 Router 경로·세션 재검사·표식 재사용을 그대로 둔다.
- 이득/비용: 타입 선언으로 이동하지 않아도 진행 중 입력 준비와 준비 완료 요청이 구별된다. 생산2파일의 지역 개명뿐이며 타입·인자·wire 비용은 없다. 관련 save-submission과 trip-operation 검사를 기대값 변경 없이 재사용할 수 있다.

## M3-02 — `changedFields`가 돌려주는 것은 변경된 필드만의 집합이 아니다 (유력, 중간)

- 위치: `apps/client/src/shared/lib/edit-fields.ts:38`; 소비자 UpdateExpenseDrawer:93, UpdateScheduleDrawer:133, tests/shared/lib/edit-fields.*.
- 관찰: 금액만 달라져도 unchanged currency를 넣고 장소 하나가 달라져도 location/address/latitude/longitude 전체를 반환한다. 함수명은 개별 필드 diff처럼 읽히지만 실제 결과는 원자적 편집 그룹을 완성한 요청 patch다. 테스트도 이를 `changed atomic groups`라고 따로 설명한다.
- 대안: `buildChangedGroupPatch` 또는 `changedGroupFields`로 개명하고 overload/반환 타입은 그대로 둔다. 호출부 결과 이름 `patch`는 적절하다. 그룹 완성 책임을 폼으로 옮기지 않는다.
- 보존: 숫자 표기 동등성, null/undefined 비교, 명시적 null 삭제, 입력에 하나라도 있는 변경 그룹의 전 필드 포함, 순수 계산·SecureStore 미의존을 유지한다. 공통 schema의 `expenseEditGroups`/`scheduleEditGroups`나 wire 이름은 바꾸지 않는다.
- 이득/비용: 금액·장소의 동반 필드가 왜 전송되는지 helper 내부까지 읽지 않아도 알 수 있다. 소비자는 생산2·검사/타입2로 좁다. 긴 이름으로 인한 행 증가 외 새 타입·층·인자 비용은 없다. `changedFields`가 익숙한 일반명이라는 유지 이득보다 이 기능의 grouped patch 의미가 더 구체적이다.

## M3-03 — `mergeEdit.changed`는 값 변화가 아니라 DB 쓰기 필요 여부다 (유력, 중간)

- 위치: `apps/server/src/services/entity-mutations.ts:138,154,176,334,430`.
- 관찰: 같은 값이어도 더 늦은 edit 표식을 받아야 하면 `hasChanges=true`를 돌려준다. 호출자는 이를 보고 fieldEdits·updatedAt·version을 쓴다. `changed`를 값 diff라고 해석하면 향후 같은 값 비교 최적화 때 중요한 표식 쓰기를 지우기 쉽다. 이 동작은 field-edits-and-deletion의 같은 값 새 표식·재전송 검사와 일치한다.
- 대안: 내부 `hasChanges`와 반환 `changed`를 `requiresWrite` 또는 `hasAcceptedEdit`로 정리한다. 실제 값이 같아도 쓰는 의미까지 포함하는 `requiresWrite` 쪽을 권한다. mergeEdit 이름·입력은 유지해도 된다.
- 보존: 표식 없는 충돌은 요청 전체 보류, 오래된/동일 표식은 쓰기 생략, 같은 값의 새 표식은 반드시 저장, 독립 그룹 결합·수용 전 storage 검증·부모부터 잠금 순서를 유지한다.
- 이득/비용: 호출자의 `if (!merged.requiresWrite)`가 실제 조치와 직접 연결된다. 한 생산파일의 반환 property와 두 소비 분기만 바뀐다. mergeEdit를 직접 쓰는 서버 검사도 property를 참조하면 함께 개명하되 기대 동작은 유지한다. union/state-machine 추가는 이 개선에 필요 없다.

## M3-04 — 정리 보호용 hold를 실제 큐 행 타입으로 위장한다 (유력, 중간)

- 위치: `apps/client/src/shared/services/sync/queue.ts:237,242,264`; 소비자 useDeactivateTrip:42, cleanup-job:123,128.
- 관찰: `getPendingTasksForTrip*(): Promise<SyncQueueItem[]>`가 실제 큐 행 외에 legacySyncHolds를 가공한 가짜 UPDATE/HELD 행도 돌려준다. HELD는 DB sync_queue 상태도 아니며 이 hold는 전송할 수 없다. 현재 소비자는 전부 길이가 0보다 큰지만 본다. 독자가 이 반환을 전송/상태 변경에도 쓸 수 있는 task 배열로 이해할 비용이 있다.
- 대안: 실제 쓰임에 맞춰 `hasUnresolvedTripChangesInTransaction(tripId): Promise<boolean>`와 외부 실행 경계 wrapper를 두고, 같은 조회·귀속 조건에서 hold 존재나 queue 존재를 boolean으로 반환한다. 기존 함수명을 유지해야 하면 적어도 반환을 `UnresolvedTripWork`의 queue/legacy-hold 구분 union으로 표현하되, 지금은 모든 소비자가 존재 여부만 원하므로 union 추가 이득이 적다.
- 보존: PENDING/FAILED/IN_PROGRESS와 보류 입력 모두 정리 방지, 부분 UPDATE의 원본 자식 귀속 확인·payload tripId fallback, 손상 payload 처리와 소유 필터의 현재 동작을 그대로 둔다. 보류를 sync FIFO에 합치거나 HELD를 실제 DB 상태로 추가하지 않는다. transaction 안 재검사도 유지한다.
- 이득/비용: 전송 가능한 요청과 사용자 복구 입력을 독자가 다시 구별할 필요가 없고 가짜 payload/status 생성도 사라진다. 생산 queue·cleanup·deactivate 및 cleanup-lifecycle mock의 연결 변경이 필요하다. boolean helper를 두 경계로 나누는 비용은 기존 wrapper 구조와 같다. 조회 최적화·쿼리 조건 변경까지 묶지 않는 것이 좋다.

## M3-05 — `processedCount`는 실제 정리 완료 수를 약속하지 않는다 (조정 적용 권고, 중간)

- 위치: `apps/client/src/shared/services/sync/cleanup-job.ts:69,81,84,88,100`.
- 관찰: processCleanupForTrip은 pending 때문에 아무 정리도 하지 않은 정상 반환을 할 수 있는데 호출자는 무조건 count를 늘린다. 지도·vacuum 실패도 무시된다. Project에도 이 제한이 명시돼 있으므로 새 버그를 발견했다는 뜻이 아니다. 다만 코드 안 이름은 여전히 실제 처리 완료 수처럼 읽혀 문서를 찾아야 의미를 알 수 있다.
- 이번 동작 보존 대안: count 이름을 `nonFailedAttemptCount`/`attemptedTripCount`로 바꾸고 `runPendingCleanups`와 public 숫자 반환의 가까운 계약에 pending으로 건너뛴 정상 반환도 포함함을 적는다. `processedCount > 0`의 기존 cache refresh 조건은 그대로 둔다.
- 보존: pause·동시 호출 공유·여행별 실패 뒤 계속·pending 두 번 확인·지도와 vacuum best-effort·현재 반환 수·cache refresh 시점은 그대로다.
- 비용과 다른 선택: 숫자를 실제 cleaned 수로 바꾸려면 processCleanupForTrip의 boolean/result를 전달하고 cache refresh 조건까지 달라지므로 **이번 단순 개명에 섞지 않는다.** 현재 생산 caller는 숫자를 사용하지 않고 startup과 engine 모두 완료만 기다린다. 이런 조건에서는 public 반환 자체를 void로 줄일 수도 있지만 cleanup-lifecycle 숫자 기대와 공유 Promise 타입까지 바뀌므로 Main이 별도로 선택한다. 안전한 작은 안은 현재 숫자 뜻을 정확히 표현하는 것이다.

## M3-06 — 경로 반환 `downloaded`는 다운로드 성공 수가 아니라 최종 삽입 수다 (유력, 작음)

- 위치: `apps/client/src/shared/services/directions/route-downloader.ts:33,66,128,147,154`.
- 관찰: 네트워크에서 받은 후보도 현재 세션·Local 인접 관계에 안 맞으면 저장하지 않는다. 실제 반환은 `inserted`를 합친 수다. route-cache의 deactivation-during-request 검사는 Directions를 1회 실행하고도 `{downloaded:0}`을 반환한다. 같은 숫자를 원격 성공 지표나 이미 준비된 전체 수로 오해하기 쉽다.
- 대안: 지역 변수와 결과 필드를 `savedCount` 또는 `newlyCachedCount`로 바꾼다. API/DB wire가 아니라 client 내부 서비스 결과다. 모든 production caller는 결과 필드를 소비하지 않으므로 실제 결과 이용자는 route-cache 검사다. 외부 호환 요구가 있다면 property는 유지하고 반환 주석만 정확히 제한하는 절충도 가능하다.
- 보존: 네트워크는 DB transaction 밖, profile별 실패 허용, 기존 캐시 재사용, 현재 Local 재대조·세션 검사·첫/마지막 prune·Query 무효화 순서와 await 범위는 유지한다. 실제 inserted 계산을 network 성공 수로 바꾸지 않는다.
- 이득/비용: 결과가 어떤 완료 범위인지 바로 알 수 있다. 생산1과 검사1의 좁은 개명이나 반환 주석 비용이며 새 계층·타입은 없다. downloadRoutesForSchedules 전체 함수명까지 함께 바꾸는 것은 이득에 비해 참조 수가 늘어 별도 필요가 적다.

## M3-07 — `hasLocalTrips`는 Local 행 존재가 아니라 보호할 Local 여행 존재다 (유력, 작음)

- 위치: `apps/client/src/entities/trip/lib/trip-local.ts:169`; trip-repository:31, application/trip-list-refresh 및 useGetTrips 검사 mock.
- 관찰: 반환 trips는 전부 SQLite에서 다시 읽는데 flag는 `protectedTrips.length>0`다. 즉 서버 목록을 방금 저장해 Local 행이 있어도 false가 된다. flag의 실제 목적은 결과 source를 mixed/remote로 분류할 보호 책임의 존재다.
- 대안: `hasProtectedLocalTrips`로 개명한다. 반환에 ID 집합 등을 추가하거나 mixed 분류 기준을 바꾸지 않는다.
- 보존: active/pending 부모 보호, 서버 목록 수신·누락 숨김·시작 snapshot 대조·query abort/세션·기존 source 값은 같다.
- 이득/비용: bool의 판단 근거를 helper 안에서 다시 찾는 일을 없앤다. 생산2와 flag를 직접 mock하는 검사2의 property 개명뿐이다. `source` wire/화면 표현은 그대로다.

## M3-08 — 보류 보존 함수의 반환 row가 실제 저장 row라는 보장이 없다 (유력, 중간)

- 위치: `apps/client/src/shared/services/sync/legacy-holds.ts:66,110,114,122,125`.
- 관찰: 이미 ACK한 서버 hold는 저장하지 않고도 새로 만든 `hold`를 반환한다. ID 충돌로 onConflictDoNothing한 경우에도 existing을 읽지 않고 요청으로 만든 값을 반환한다. `Promise<LegacySyncHold>`는 호출자가 실제 저장본을 받은 것으로 믿기 쉬운 결과다. 현재 생산 direct-update-failure·engine과 관련 검사 모두 반환 row를 쓰지 않는다.
- 대안: 두 preserve 함수의 반환형을 `Promise<void>`로 줄이고 dismissal의 `return hold`를 bare return으로, 마지막 `return hold`도 제거한다. 보관된 row가 필요한 새 소비자가 생기면 그때 실제 조회 결과나 `{kind:'already-dismissed'|'preserved'}` 계약을 추가한다.
- 보존: dismissal일 때 재삽입 금지, conflict do-nothing, payload 원문, 계정 확인, notifyLegacyHolds의 현재 호출 횟수·순서·transaction 안 위치는 바꾸지 않는다.
- 이득/비용: 사용되지 않는 허위 완료 증거를 없앤다. 생산1파일의 타입/return만 변경하고 현재 caller는 수정할 필요가 없다. 반환을 실제 row로 맞추는 추가 SELECT/union보다 비용이 적다. 사용자 복구·FIFO 계약에는 변화가 없다.

## M3-09 — `listLegacyUpdates`는 순수 목록 읽기가 아니라 삭제 정리도 한다 (유력, 작음)

- 위치: `apps/server/src/services/legacy-update-holds.ts:86,133,140`; routes/legacy-holds:14.
- 관찰: 최신 current를 조회하다 자기 여행/Entity의 삭제 증거를 찾으면 DB의 legacyUpdateHolds도 삭제한다. 이름과 가까운 주석은 현재 값 조회만 말한다. 이 함수를 read-only 처럼 옮기거나 transaction을 생략할 때 효과를 놓칠 수 있다.
- 대안: `refreshAndListLegacyUpdates` 또는 `refreshVisibleLegacyHolds`로 바꾸고 가까운 설명에 확정 삭제에 속한 hold 정리를 포함한다. endpoint GET/response·보류 확인 API 이름은 바꾸지 않는다.
- 보존: 부모 여행부터 잠금, ACK 뒤 hold 재확인, 단순 행 부재는 삭제 증거로 안 씀, current fallback, 삭제 범위와 transaction 순서는 그대로다.
- 이득/비용: 호출부에서 쓰기를 포함한 refresh임이 드러난다. service export·route import/call의 2생산파일 개명이며 HTTP 호환비용은 없다. 삭제 정리를 별도 서비스로 분리하면 두 호출/transaction 책임이 늘므로 그 분리는 권하지 않는다.

## M3-10 — SyncIncompleteError.failedCount에는 FAILED 이외 차단 상태도 포함된다 (유력, 작음)

- 위치: `apps/client/src/shared/services/sync/engine.ts:62,187,190`.
- 관찰: 생성자 값은 `stats.total - stats.quarantined - stats.pending`여서 IN_PROGRESS·알 수 없는 상태도 포함한다. 이는 의도된 blockedCount다. error property만 failedCount라서 UI/진단에서 FAILED 행 수처럼 쓰려면 다시 확인해야 한다.
- 대안: 생성자 property/매개변수를 `blockedCount`로 바꾼다. 오류 클래스명·사용자 메시지·name은 유지한다. 현재 전체 source/test 검색에서 `.failedCount`를 읽는 소비자는 없었다. logout의 failedCount는 진짜 stats.failed이므로 바꾸지 않는다.
- 보존: 정상 후속 PENDING은 다음 실행으로 남기고 unknown/IN_PROGRESS는 중단, 메시지 숫자와 예외 발생 시점·진단 분류는 그대로다.
- 이득/비용: 차단 수와 상태 FAILED 통계가 구별된다. 생산1의 국소 내부 타입 변경이며 공개 HTTP 계약 변화는 없다.

## M3-11 — 활성화 테스트 helper가 이미 제거된 목록 반환을 선언한다 (유력, 작음)

- 위치: `apps/client/tests/shared/services/sync/save-submission.test.ts:123,126`.
- 관찰: `activateTripForTest`의 강제 타입은 `Promise<{schedules:unknown[];expenses:unknown[]}>`지만 실제 useActivateTrip은 `{tripId,alreadyActivated}`를 돌려준다. 테스트는 이 결과 배열을 쓰지 않으므로 통과 여부로 계약 불일치를 알 수 없다. response-freshness의 helper는 실제 결과 모양을 정확히 선언한다.
- 대안: 테스트 helper 선언을 `Promise<{tripId:string;alreadyActivated:boolean}>`로 맞추거나 실제 hook mutateAsync 반환 타입을 추론해 사용한다. 호출부에서 사용하지 않는다고 과거 결과 계약을 계속 선언할 이유가 없다.
- 보존: fixture HTTP data 배열·SQLite 확인·activation 대기 순서와 모든 assertion은 그대로다. runtime hook을 시험 대역으로 바꾼 구조도 그대로 둔다.
- 이득/비용: 다음 읽는 사람이 활성화 완료 반환에 목록이 있다고 추론하는 일을 막는다. 검사1의 타입 변경뿐이다. 공통 타입 export 추가는 이 1곳 때문에 필요하지 않다.

## M3-12 — 두 offline 테스트 제목이 실제 검사보다 큰 저장 결과를 말한다 (유력, 작음)

- 위치: `apps/client/tests/features/edit/offline-values.test.tsx:156,181`.
- 관찰: 첫 테스트는 장소·좌표를 payload에서 덮지 않는다고 이름 붙였지만 무변경 제출 후 saveSchedule 미호출만 검사한다. 둘째는 같은 일정 연결을 저장한다고 이름 붙였지만 마찬가지로 saveExpense 미호출을 검사한다. 무변경이면 저장을 생략하는 현재 합의와 동작은 맞다. 제목만 저장 실행을 검증한 것처럼 읽힌다.
- 대안: 각각 `오프라인 일정 수정은 장소 검색을 숨기고 변경이 없으면 저장 요청을 생략한다`, `오프라인 경비 수정은 기존 값과 연결을 표시하고 변경이 없으면 저장 요청을 생략한다`로 한정한다.
- 보존: assertion·fixture·사용자 입력 시퀀스는 변경하지 않는다. payload 보존을 증명하려고 불필요한 저장을 추가하지 않는다.
- 이득/비용: 테스트 목록만 읽어 검증 범위를 파악할 때의 과장을 없앤다. 한 검사파일의 문자열2개 변경이며 제품·타입 비용은 없다.

## M3-13 — `isServerBacked` boolean 하나가 원문 소유권 검사 완화의 근거까지 맡는다 (선택 후보, 중간)

- 위치: `apps/client/src/shared/services/sync/legacy-holds.ts:73,82,132`; 호출 engine:445, direct-update-failure:39.
- 관찰: 맨 뒤 true/false가 단순 저장 출처 표시뿐 아니라 payload에 섞인 userId/tripId/id를 소유권 주장으로 해석할지까지 결정한다. 현재 검증된 서버 hold의 원문은 incidental 식별자가 있어도 보존하는 합의와 일치한다. 문제는 긴 인자열의 `!!serverHold`/`true`만으로는 그 전제를 보려면 피호출자 검사를 추적해야 한다는 것이다.
- 대안: 마지막 인자만 `{source:'server'|'local'}` 또는 `{serverBacked:boolean}` options로 바꿔 호출부에 의미를 적는다. 새 구분값은 앱 내부 입력에만 쓰며 DB의 serverBacked column과 shared schema는 그대로 유지한다. `source` union은 실수로 전달한 unrelated bool을 막는 추가 이득이 있으나, 단순 object의 비용도 비교한다.
- 보존: table/current의 owner·id·trip 확인은 양쪽 모두 유지하고, 서버가 검증해 보관한 raw payload만 부수 식별자 검사를 우회한다. 신규 세션 규칙·추가 검증·원문 정규화는 도입하지 않는다. dismissal·ACK·notify 순서도 같다.
- 이득/비용: 신뢰 근거를 호출부에서 읽을 수 있다. 생산3과 여러 fixture 호출의 기계적인 인자 변경 비용이 든다. M3-08보다 실익이 작고 참조비용이 커 선택 후보로 둔다. 긴 인자 전체를 한 options로 합치는 추가 구조 변경까지 필요하지 않다.

## M3-14 — entity 설명의 `DB와 1:1`이 실제 표현 경계와 다르다 (유력, 작음)

- 위치: `packages/schema/src/entities/expense.ts:10,16`, `packages/schema/src/entities/schedule.ts:7,13`, `packages/schema/src/index.ts:8`.
- 관찰: 공유 entity는 API/application 표현이다. 서버 DB의 Date·integer hasReceipt·datetime expense date는 serializer에서 ISO/boolean/date-only로 바뀌고 Local은 기존 datetime을 읽을 때 날짜를 정리한다. `DB와 1:1 매핑`은 필드 의미 연결과 값 표현 동일함을 혼동시킨다. server/client schema·직렬화 검사와 package CLAUDE는 실제로 이 경계를 구별한다.
- 대안: 주석을 `공유 도메인/API 표현 — DB 저장 표현은 serializer/Local 경계에서 변환`으로 정확히 한정한다. schema 객체·field명·타입·validation은 전혀 바꾸지 않는다.
- 보존: optional version/fieldEdits·nullable userId·날짜 호환 및 server storage 계약 전부 같다.
- 이득/비용: 타입 이름을 DB row로 재사용하기 전에 변환 경계를 찾게 한다. schema3파일의 설명만 수정하며 build/wire 영향은 없다. field별 장황한 설명 추가는 불필요하다.

## 유지가 더 적절한 선택과 비용 큰 대안

- `PreparedEdit<T>`의 필수 edit, allocateEdit/observeFieldEdits의 역할 구별과 isLaterClock의 time/sequence 비교는 유지한다. compareEdits는 wire 편집 승패의 고정 ID까지 보지만 시계 발급은 관측 시각/순번보다 뒤를 만들면 되므로 두 비교의 차이는 이름 문제가 아니다.
- `ConfirmedUpdateError`와 `ConfirmedDeletionError`는 유지한다. 전자는 확인된 서버 처리 뒤 기기 후속 준비 실패, 후자는 삭제 귀속·Local 반영 완료라는 다른 완료 범위다. 단순 SaveError/ConflictError로 통일하면 UI·복구 보존 의미가 사라진다. handleDirectUpdateFailure는 항상 throw하지만 `Promise<never>`와 catch 호출이 이를 이미 드러내므로, 길고 부작용을 전부 열거한 이름으로 바꾸는 실익은 작다.
- reconcile의 ServerAcceptance/LocalDecision/ProjectionResult는 preserve·write·confirm-deletion·keep-local을 분리하고 정상 보존도 ACK까지 진행한다. 이를 boolean 성공/실패로 줄이면 보존과 rollback의 차이가 사라진다.
- reconcile.ts:45의 `LocalRecord = ServerRow & {userId:string}`는 raw pending overlay 이후에도 공유 응답 타입인 것처럼 보이는 부담이 있다. 실제 overlay는 Record<string,unknown>으로 검증하지 않은 값을 겹친다. 다만 raw 값을 버리지 않고 driver로 보내는 현재 경계 때문에 단순 타입 개명만으로 정직한 정적 보장을 만들 수 없다. `OwnedServerRecord`와 `ProjectedLocalValues`를 분리하고 writeLocalRecord 한곳에서 Drizzle 입력 bridge를 명시하는 대안은 가능하지만 union/식별자/SQL값 타입과 cast가 늘어난다. 이번에는 이름만 바꾸어 타입 문제가 해결됐다고 주장하거나 schema.parse를 넣지 말고 **현행 유지+명시된 raw overlay 주석을 유지**하는 편을 권한다. 새 raw consumer·실제 타입 오류가 생기면 다시 판단한다.
- server MutationResult의 넓은 status/body를 entity별 discriminated response union으로 만드는 대안도 검토했으나, 현재 route가 성공 body를 schema로 검증하고 실패 body는 여러 모양이며 helper를 공유한다. 이름 개선만을 위해 response 종류별 generic을 새로 늘릴 이득이 작아 유지한다. status나 error code의 wire 개명은 제안하지 않는다.
- useActivateTrip의 data 입수 완료와 지도/경로 백그라운드 준비, useDeactivateTrip의 cleanupExecuted/cleanupPending은 현재 이름·가까운 계약으로 범위가 드러난다. 활성화 성공을 지도까지 완료한 것으로 넓히지 않는다. useSubmitSchedule의 submit은 요청 접수이며 Promise 완료를 반환한다고 가정하지 않는다.
- 날짜/좌표 경계의 toExpense/toSchedule/readTripTimeZone, RouteSegment/coordinatesKey, request/schema의 edit/fieldEdits, API 반환 entity·삭제 proof, 진단의 RequestStage/SyncFailure와 whitelist는 실제 표현을 충분히 구별한다. 모든 data/input/request·fetch 이름을 일괄 통일하는 것은 현재 이득보다 참조비용이 크다.
- Drawer/Pressable의 props·행동 연결은 읽었으나 인접 변경이다. onClose는 부모에 닫기 요청을 전달하는 표준 callback이며 isOpen이 실제 표시를 결정한다. 별도 onRequestClose 개명은 shared UI 소비자 전체 호환비용이 있어 이번 자동 수정 후보로 넣지 않는다.

## 범위와 근거의 한계

필수 review reference, app/package 가이드, Personal naming-and-completion 및 contracts/lifetime·expression·shared-boundaries, Project data lifecycle, Ticket09/07·003-12와 지정된 세 기록을 읽고 실제 코드/검사와 대조했다. 기록의 선행 판단을 정답으로 채택하지 않았다. 범위 밖 추가 읽기는 `apps/client/src/shared/services/sync/usePendingCleanups.ts`(cleanup 숫자 사용 여부)이며 전체 source/test 참조 검색은 후보의 호출자·호환 범위를 확인하기 위한 것이다.

검사 전수 읽기는 기존 assertion이 현재 이름·완료 계약을 실제로 뒷받침하는지 판단하는 근거다. 검사를 새로 실행하거나 native·실HTTP·Sentry 수집·PostgreSQL 안전성을 다시 입증한 것은 아니다. 제품 동작을 바꿔야 하는 의심은 이번 자동 채택 후보로 올리지 않았다. Main은 각 관찰과 구체 대안의 채택을 별도로 결정할 수 있다.
