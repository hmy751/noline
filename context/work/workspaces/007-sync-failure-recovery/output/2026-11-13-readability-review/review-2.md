# 관점 2 — 전체 흐름을 먼저 읽고 상세로 내려갈 수 있는가

검토 대상은 manifest의 현재 workingtree 128파일 전체(생산75, 검사/설정51, 인접 UI2)다. 생산 파일은 전체 함수·타입·실제 호출을, 검사/설정은 전체 본문과 보존 시나리오를 읽었다. 출력이 잘린 검사는 해당 구간을 다시 읽었다. 마지막 SHA256 대조에서 128개 모두 시작 manifest와 같았다. 제품·검사·정본·Git은 수정하지 않았고 검사 실행이나 native 동작 검증은 하지 않았다. 파일별 읽기·판정은 coverage-2.json에 있다.

기준은 Personal code-expression의 '맡긴 동작의 흐름을 먼저 읽고 필요한 helper의 상세로 내려갈 수 있게 배치', development/shared-boundaries의 새 연결 비용 비교, review.md의 독립 대안 판단이다. Ticket09·007-07·003-12와 세 참고 기록을 현재 코드/검사와 대조했다. 과거 구조 개선을 재현할 의무로 받지 않았다. 발견 수를 채우려고 추출하거나 public/private 고정 배치를 적용하지 않았다.

이번 관점에서 우선 검토할 실제 이득은 활성화의 입수 transaction, 확정 삭제의 관련 요청 정리, 구버전 보류의 수신/ACK라는 큰 처리 구간을 조율 본문에서 식별하게 하는 것이다. 아래는 모든 발견이며 개수 제한으로 걸러낸 목록이 아니다. '중간'은 읽기·수정 부담의 상대 크기이고 동작 결함/긴급도 판정이 아니다. 낮은 이득 후보는 취향만의 지적과 구별하되 Main이 현행을 선택할 수 있다.

## F2-01 · 중간 · 활성화의 입수 transaction이 바깥 실행 순서를 가린다

- 위치: apps/client/src/entities/trip/data/useActivateTrip.ts:66 (입수 transaction), :159 (transaction 뒤 결과 판정), :166 (백그라운드 지도), :175 (mutation 후처리).
- 관찰: hook의 mutationFn 안에 withTripOperation callback, 그 안에 약90행의 withTransaction callback이 있어 '이미 활성화면 경로 재요청 / 서버 입수 / 기기 활성화 확정 / 백그라운드 준비'를 읽으려면 메타데이터 쓰기 세부 전체를 통과해야 한다. 특히 삭제된 여행의 null 반환과 transaction 밖 throw가 떨어져 있어 의도적으로 수신한 삭제를 commit하는 경계를 재구성하게 된다.
- 대안: 같은 파일 아래에 `storeActivatedTrip` 또는 `applyActivationResponse` 하나를 두고 현재 withTransaction 전체와 null 반환을 그 안에 둔다. 바깥은 parse한 응답을 넘겨 결과 확인→백그라운드 준비를 연속해서 보여준다. 입수 함수 내부는 현재 실제 순서를 그대로 유지하고 여러 table별 함수를 만들지 않는다.
- 보존: withTripOperation은 HTTP 전부터 점유한다. 요청 시 계정/세션 snapshot, 응답 전체 parse와 대상 여행 존재 검사, transaction 안 재검사→여행 reconcile→현재 여행 삭제 확인→시간대/만료→기존 활성 해제→새 준비 ID→일정→경비→마지막 세션 검사 순서. 삭제 수신 후 null은 commit한 뒤 바깥에서 실패로 알린다. 지도/경로는 transaction 밖·비대기이며 실패를 기록한다. alreadyActivated 분기와 onSuccess의 조회 갱신 범위도 유지한다.
- 이득/비용: 조율을 읽을 때 긴 DB 쓰기 상세를 건너뛰고 실제 후속 작업을 바로 찾는다. 비용은 같은 파일의 함수 1개와 activateTripResponse에서 추론한 입력 타입, tripId/요청 계정/세션 등 약4개 입력이다. 이 값들을 거대한 'context'로 감싸거나 새 service 파일을 만들면 이득이 줄어든다.
- 확인할 검사: response-freshness의 늦은 활성화·수신 중 세션 교체·원본 unavailable, temporal-local-contracts의 전체 parse 실패 rollback, save-submission의 활성화 대기 중 저장 표식/순서. 관련 검사의 반환 기대를 바꾸지 않는다.

## F2-02 · 중간 · 확정 삭제의 화면 반영과 관련 입력 정리가 한 긴 본문에 이어진다

- 위치: apps/client/src/shared/services/sync/confirmed-deletion.ts:50, :107(큐 조회), :109(큐별 판정), :187(보류 정리).
- 관찰: 전체 진입 함수가 소유/여행 확인→삭제 증거 저장→자식 숨김·연결 해제→90행가량의 큐 discard 판정→보류 정리까지 맡는다. 소비자인 reconcile·engine·direct-deletion에서 내려왔을 때 '삭제 반영을 어떤 순서로 끝내는가'를 알기 위해 개별 payload 호환 세부까지 읽어야 한다. 기존 isValidDiscardedMutation 추출은 저장 가능성 상세를 잘 분리했지만 상위 큐 정리 구간 자체는 아직 구별되지 않는다.
- 대안: 같은 파일에서 큐 조회와 반복문 전체만 `discardTasksForConfirmedDeletionInTransaction`으로 내린다. 상단의 원본 검증·targets 구성·실제 행 변경과 하단 hold 정리는 우선 그대로 둬도 된다. helper는 삭제 scope(대상 표/여행/targets/계정)와 task context(completed/confirmed ID)를 명시적으로 받는다. 보존 판정을 바꾸거나 일반적인 cleanup framework를 만들지 않는다.
- 보존: 원본 모순은 false 반환이며 그 전에 삭제 증거를 쓰지 않는다. completedTaskId는 skip, confirmedTaskId의 410은 해당 입력의 서버 검증만 대신한다. 개별 CREATE 보호, 원본 귀속 우선, payload 귀속 모순, legacy DELETE, storage-input 조건, 손상/격리 입력 보존과 실제 FIFO에 남는 원문을 그대로 둔다. 새 transaction을 중첩하지 않는다. holds 알림·ACK 생성은 기존 clearLegacyHoldInTransaction 호출을 유지한다.
- 이득/비용: 주 업무 본문에서 '삭제를 적용한 뒤 정리 가능한 입력만 종결한다'를 한 호출로 읽는다. helper는 약6개 문맥값을 필요로 하므로 F2-01보다 전달 비용이 크다. 두 개의 좁은 객체 타입 정도는 받아들일 수 있지만 광범위한 실행 상태 타입을 새로 만들면 현행 유지가 낫다. task별 DB 조회를 순수 predicate로 가장해 감추는 안은 배제한다.
- 검사 대응: deletion-storage-validation의 손상 혼합 입력/NaN의 개별410/CREATE ID 모순/다른 여행 DELETE, reconciliation의 개별 CREATE tombstone/ACK 1회/다른 여행 후속 전송, response-freshness의 삭제 증거/연결 부활 방지.

## F2-03 · 중간 · 구버전 보류 동기화는 수신 반영과 확인 전송을 조율하는 줄기가 보이지 않는다

- 위치: apps/client/src/shared/services/sync/legacy-holds.ts:180~307. 수신 transaction :221, 변경 알림 :264, ACK 조회 :267, ACK 전송 반복 :275.
- 관찰: 서버 목록 HTTP·소유 검증·중복 통합·삭제된 remote hold 반영·화면 알림·확인 DELETE HTTP·ACK 저장이 하나의 128행 함수에 들어 있다. pullChanges는 이 전체를 계정 전체의 선행 동작으로 맡긴다. 독자가 '받기/기기에 반영/남은 확인 보내기'를 알려면 두 종류의 네트워크 구간을 발견해 순서를 다시 조립해야 한다.
- 대안: 같은 파일 아래의 `applyRemoteLegacyHoldsInTransaction(userId, remoteHolds, knownIdsBeforeFetch)`와 `sendPendingLegacyHoldAcks(userId, onStage)` 두 업무 helper를 비교할 수 있다. 조율에는 최초 local ID snapshot→서버 GET/parse/귀속 검증→transaction 반영→변경시 notify→남은 ACK 전송이 남는다. 가장 작은 채택은 마지막 ACK 조회~반복만 추출하는 것이다.
- 보존: knownIdsBeforeFetch는 HTTP 전에 캡처한다. HTTP 도중 새 hold를 빈 옛 목록으로 지우지 않는다. ACK tombstone으로 늦은409/재수신 부활 방지, 같은 원문 로컬 중복만 제거, duplicate 삭제만 있어도 notify, current만 바뀐 upsert도 알림, local-only hold 보호. GET 또는 DELETE 404/405는 지원 없음으로 정상 반환하고 원문/미확인 ACK를 남긴다. onStage는 요청 전/후에만 기존 순서로 호출하고 실제 ACK 상태 확정도 HTTP 밖이다.
- 이득/비용: 전체 동기화 함수에서 두 업무의 순서와 실패 범위를 읽고 해당 helper만 내려가 수정한다. 입력은 3개/2개로 좁다. `hasChanges`는 helper 반환 boolean으로 돌릴 수 있어 공유 가변상태를 새로 만들 필요 없다. 원문 schema·ACK shape를 새 DTO로 복제하지 않는다.
- 검사 대응: reconciliation의 목록 요청 중 확인/새 입력 보존, 원문 중복·삭제시 알림·구서버 미지원·늦은409·ACK실패, logout-sync/local-account의 미확인 ACK 보존.

## F2-04 · 중간~낮음 · 거절 응답 분류 안에 409와 410 종결 상세가 모두 들어 있다

- 위치: apps/client/src/shared/services/sync/engine.ts:404~517. 호출은 pushChanges:155 한 곳.
- 관찰: 공통 envelope/target 검사 뒤 409의 보류 저장+해당 큐 ACK+현재값 reconcile, 410의 가벼운 guard+strict parse+소유 증거 조회+삭제 종결이 연속된다. 두 흐름 중 하나를 읽거나 고칠 때 다른 흐름의 상세까지 지나야 끝의 null 의미를 파악한다. 이 함수가 push 본문 밖에 있는 현재 분리는 유효하다.
- 대안: 상위 `resolveRejectedMutation`에는 '확인할 수 없는 응답이면 null /409 보류 처리 /410 삭제 처리' 분류를 남기고 동일 파일의 두 좁은 helper로 분기 본문을 내린다. 공통 검사도 각 helper로 퍼뜨리는 안은 피한다. strict parse 전후의 증거 타입이 너무 많이 생긴다면 삭제 분기 하나만 추출하는 선택이 낫다.
- 보존: stage==='sending'에서만 호출, resolver가 던지면 local-after-response 진단+FAILED 기록, false/null이면 원래 server-rejected 진단 경로. Date.parse guard로 불완전 증거를 null로 돌리는 경우와 인식한 형식의 strict parse 실패를 던지는 경우를 합치지 않는다. hold provenance 검사, 409 transaction 안 저장→해당 요청 제거→reconcile, 410 소유 증거와 종결 뒤 task 잔존 검사도 그대로 둔다.
- 이득/비용: 분류 책임을 짧게 먼저 읽고 특정 응답의 종결 상세로 바로 이동한다. task/table/body/data 등의 3~4입력과 결과 union 연결이 늘어난다. 실제 호출자가 하나라 새 파일/공개 export/공통 HTTP 에러 framework의 이득은 없다. 현재 명시적인 두 if도 충분히 읽힌다고 판단하면 낮은 우선도로 미채택 가능하다.
- 검사 대응: reconciliation의 불완전 deletedAt/tripId마다 다른 diagnostic stage, 보류 저장+FAILED 이중 실패의 진단1회, FIFO 후속 작업, blocked-diagnostics·retry의 실패단계.

## F2-05 · 낮음 · 서버 mutation의 진입 동작보다 상세 helper들이 먼저 나온다

- 위치: apps/server/src/services/entity-mutations.ts:29~181, 첫 createSchedule 진입 :183, updateSchedule :271, updateExpense :357.
- 관찰: route가 호출하는 create/update/delete의 순서를 읽기 전에 응답 생성·DB 저장가능성·부모 잠금·일정 연결·값 비교·mergeEdit 전체를 먼저 지나간다. route 호출부는 이미 request parse→service→response 검증으로 명확해서 이 파일로 내려오면 실제 서비스 흐름부터 읽는 편이 연결된다.
- 대안: 내용·함수 개수는 그대로 두고 create/update/delete 진입 함수 묶음을 앞에, 그 아래 mergeEdit와 private helper를 배치하는 안이다. mergeEdit는 현재 export를 유지한다. import/type/상수는 앞에 두어도 된다.
- 보존/비용: 모든 외부 호출은 모듈 초기화 뒤 route callback이나 test 실행에서 발생하고 mergeEdit의 production 호출은 두 update뿐임을 검색했다. const 초기화와 순환 참조를 최종 수정 때 재확인한다. 인자·타입·호출 연결은 늘지 않는다. 함수들을 알고 찾아가는 독자에게는 이득이 작아 선택 후보다. 잠금 순서/첫 귀속 조회와 잠금 뒤 재조회/validation-before-delete 판정은 옮기거나 합치지 않는다.

## F2-06 · 낮음 · 지도 컴포넌트 앞의 95행 스타일 상세가 첫 읽기를 막는다

- 위치: apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx:20(StyleSheet)~115, component :122.
- 대안: StyleSheet 선언만 component 아래로 옮긴다. 좌표/경로 조회→현재 geometry 계산→선택 카메라→empty→지도/경로/profile/요약 흐름을 import 뒤에서 바로 읽게 한다.
- 보존/비용: 스타일 값·객체 식별성·component/hooks·좌표 matcher는 그대로다. StyleSheet.create는 모듈 평가 때 같은 횟수로 실행되며 render 시 초기화되지 않게 한다. 새 함수/props/type는 0개다. 큰 책임 재분리보다 이 한 이동의 비용이 작다. 지도 renderer/진단 등 다른 작업으로 넓히지 않는다.

## F2-07 · 낮음 · 일정 화면의 날짜 구성 흐름을 삭제 handler가 중간에서 끊는다

- 위치: apps/client/src/screens/ScheduleScreen.tsx:105~110(dateRange), :112~183(menu/edit/delete handler), :185~253(날짜별 일정과 지도선택).
- 관찰/대안: 같은 화면 view data인 여행 날짜범위와 schedulesByDate/선택 보정이 70행의 이벤트 처리로 떨어져 있다. 날짜별 목록과 지도선택 파생값/보정 구간을 dateRange 바로 아래에 두고 handler들은 그 뒤 return 직전에 모으면 '조회→화면값 구성→사용자 이벤트→표시'를 한 번에 따라간다. 새 hook/helper를 추출하지 않는다.
- 보존/비용: hook 호출 순서를 바꾸지 않고, render 중 선택 보정의 조건과 setMapSelection 시점도 유지한다. handler 선언만 이동하는 안이 가장 작다. 파생값 타입/객체 구조, 정책 계산이 선택 기록의 tripId를 쓰는 계약, 삭제 confirmation callback은 그대로다. 코드·인자 총량 증가는 없다. 사용자가 기존 함수 위치에 익숙하면 이득이 작아 낮은 우선도다.

## F2-08 · 낮음 · 일부 검사 파일은 공통 정리·초기화가 사례 사이에 있어 숨은 조건을 역탐색한다

- 위치: apps/client/tests/features/edit/offline-values.test.tsx:237(afterEach가 앞3검사 뒤), apps/client/tests/screens/schedule-recovery.test.tsx:332(beforeEach가 앞2검사 뒤), apps/client/tests/screens/auth-policy.test.tsx:208(afterEach가 앞 여러검사 뒤).
- 대안: 기존 beforeEach/afterEach를 mock·fixture 선언 뒤, 첫 검사 앞의 한 구간으로 모은다. 함수/내용/실행 순서는 추가하지 않는다. 대형 mock factory를 범용화하거나 사용자 이벤트를 새 helper로 감추지 않는다.
- 보존/비용: Jest hook은 현재도 같은 describe/root 범위 전체에 적용되므로 그 범위는 유지한다. 선언 이동으로 import/mock hoisting 대상이 바뀌지 않게 한다. 타이머·network cleanup·client 취소 순서를 변경하지 않는다. 기존 첫 검사도 뒤쪽 beforeEach의 session/query 설정을 받는다는 사실을 독자가 앞에서 알게 되는 이득이 있다. 실행 의미가 같은지 관련 검사 재실행으로 확인할 수 있다.

## F2-09 · 낮음 · 큰 검사 파일의 업무별 탐색 구획은 본문을 감추지 않고 추가할 수 있다

- 위치: apps/client/tests/shared/services/sync/reconciliation.test.ts:132~1056, apps/client/tests/features/edit/offline-values.test.tsx:156~915, apps/client/tests/screens/read-query-consumers.test.tsx:292~512. (schedule-recovery는 F2-08 먼저 적용을 비교.)
- 관찰: 개별 test 이름과 단계는 구체적이지만, 서버 원본/ACK·삭제 귀속·보류 목록/ACK·진단 같은 서로 다른 흐름이 한 root에 길게 이어진다. offline-values도 offline 입력·정상제출·편집 회차/늦은응답·picker라는 관심사가 길게 섞인다. 원하는 업무 구간을 찾을 때 모든 test 제목을 다시 훑게 된다.
- 대안: 기존 사례들을 의미 있는 describe 구획으로 묶되 전체 fixture·mock을 중복하는 파일 분리는 하지 않는다. reconciliation이라면 '수신 표시와 완료 요청', '삭제 증거와 귀속', '구버전 보류 수신·확인' 정도의 현재 실제 경계가 출발점이다. 테스트 재배치는 fixture 의존이 없는지 먼저 확인하며, 이득이 작은 파일까지 일괄 적용하지 않는다.
- 보존/비용: 현재 root beforeEach/afterEach 적용을 그대로 유지한다. 개별 사건 주입·요청·assert는 안에 남긴다. 테스트 이름 전체가 바뀌어 name filter 사용처가 있으면 조정 비용이 생긴다. describe만 늘리고 관련 사례를 못 모으면 장식에 불과하므로 미채택한다. 외부 선언인 REMOTE_HOLD 등은 실제 사용 구획 가까이에 둘 수 있지만 제네릭 시나리오 실행기로 감추지 않는다.

## 유지가 적절한 주요 구조와 검토한 대안

- reconcile.ts: 상단 조율 6단계는 prepare/accept/persist/local decide/apply/ACK를 같은 본문에서 읽게 한다. state 전달과 union은 각 단계의 정상 보존/삭제/쓰기 차이를 실제로 나타낸다. 전 함수에 별도 파일을 만들거나 반환 union을 다시 줄이면 오히려 흐름/추적이 나빠진다. exported transaction wrapper가 파일 마지막에 있어도 한 줄 위임이고 핵심 진입은 상단에 있어 이동 실익은 작다.
- engine pushChanges: catch를 helper로 모두 추출하면 mutable stage와 hasServerChanges/hasReportedBlock 전달이 늘고 finally refresh와 오류 우선순위를 재조립하게 된다. 현재 중첩은 실제 보류 종결 실패·원요청 실패·부분성공 갱신 경계를 표현하므로 유지한다. F2-04는 이 전체 loop의 추출 제안이 아니다.
- engine pullChanges: session/preparation snapshot의 수명, 응답 전체 검증, transaction 안 적용 가능 scope, cursor 동시 확정을 한 본문에 이어 읽는 이득이 크다. applyPullBatch로 추출하면 requestedPreparations/세션 guard/active read/응답/cursor 등 인자와 closure 경계가 늘어난다. 현재 약120행은 필요 단계가 연속해 보여 유지가 적절하다.
- route-downloader/route-plan: 이미 공개 다운로드 조율→refreshRoutes→readCurrentSegments/pruneCache로 내려간다. transaction→네트워크→transaction과 current Local 재판정이 현재 순서에서 보인다. 네트워크 요청을 transaction helper 안으로 넣거나 profile마다 범용 작업 단위를 추가할 이유가 없다. 숫자 좌표 정규화·같은 구간 비교·최신 route 선택은 실제 공용 소비자가 있어 유지한다.
- Local datasource: 행 수정→반환 행 확인→queue 기록→앱 반환 변환을 같은 transaction callback에서 보인다. 변환을 밖으로 빼서 콜백을 짧게 하면 실패 rollback 계약을 잃는다. CREATE payload 구성과 저장 표현도 raw 전송과 SQLite 표현의 서로 다른 책임이므로 전체 공통 serializer 추출을 권하지 않는다.
- repository/API/data: 각 층은 기능 조건/저장소 실행/전송 검증/Query 후처리를 맡는다. update remote callback의 try/catch는 직접실패 보존과 같은 위치에서 읽힌다. 이를 한 줄로 줄이는 wrapper·모든 CRUD 통합 generic builder는 탐색 비용이 더 크다.
- 편집 폼: 상단 조건부 keyed form은 편집 수명을 드러내며 handleValidSubmit/handleSave/handleClose와 JSX 연결이 있다. alert/picker/controller JSX가 길다는 이유로 전부 field 컴포넌트로 쪼개면 control/value/onChange/error/visible/state 전달이 늘어난다. 현재 주요 제출 흐름은 JSX 이전에 모여 있어 유지한다. isMounted/RHF Promise 경계와 성공 후 닫기는 보존한다.
- server pull: snapshot SQL/XID 안전범위/세 table 조회가 같은 transaction callback에 붙어 있어 같은 snapshot을 확인하기 쉽다. 작은 XID 수식 helper만 분리하면 upper/since/cycle 의미를 넘나들어야 하므로 이번 관점에서는 유지한다.
- server mutation: F2-05는 배치만의 제안이다. parent lock와 row 재조회, schedule relation, mergeEdit, 저장을 generic EntityMutation 하나로 합치면 entity별 변환·serializer와 잠금 타입 연결이 더 복잡해진다. 현재 Schedule/Expense 두 명시 함수는 유지한다.
- DB/schema/migration/package export: 선언은 table/계약별로 읽히며 필수 초기화/마이그레이션 순서도 보인다. SQL을 테이블마다 새 함수로 만들면 내용을 확인할 때 호출을 순회해야 하므로 유지한다. storage-input의 숫자 검사는 복잡하지만 선형 계산과 제한 guard가 구체적이며 새 parser 계층은 불필요하다.
- 검사: deferred gate의 시작→기기/세션 변경→응답 해제→assert를 test 안에 남겨야 동시 실행 보장을 읽을 수 있다. 이를 공통 'runRace'로 추출하는 안은 배제한다. 서버 mock의 select 결과 순서는 원 query와 직접 대조할 필요가 있어 generic fixture 자동화로 감추지 않는다. 인접 Drawer/Pressable은 현재 소비 계약을 읽었으며 이 작업의 별도 자동 수정 대상으로 제안하지 않는다.

## 범위·한계

범위 밖은 실제 호출 확인을 위한 rg 검색만 수행했다(활성화 hook의 HomeScreen 소비, mutation/삭제/보류/경로 함수 참조). 범위 밖 파일의 전체 본문·전체 저장소를 읽었다고 주장하지 않는다. 함수 이동의 const 초기화/호출 시점은 현재 source 참조에 근거한 검토이며 실제 수정 후 타입·관련 회귀의 실행이 필요하다. 기능 정책을 바꿔야 하는 개선안이나 새 제품 결함을 본 보고에서 제시하지 않는다. 각 finding의 선택·조합·실제 수정은 Main 책임이다.
