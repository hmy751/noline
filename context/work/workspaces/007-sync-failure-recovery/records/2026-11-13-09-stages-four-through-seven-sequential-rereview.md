# 4〜7단계 보완 재검토 — 진행 범위 정정과 순차 실행

**3〜7단계를 각각 보완 검토·수정·독립 검증·설명하고 마지막 연결 회귀까지 마쳤다.** 한 단계의 검토·필요 수정·독립 검증·기록·설명을 마친 뒤 다음 단계를 시작해 7단계까지 이어가는 요청이다. 단계마다 사용자에게 다시 승인을 받거나 턴을 끝내라는 뜻은 아니다.

## 단계별 진행을 중단 요구로 잘못 읽었다

사용자가 “3\~7 단계들 다시 진행 해봐 단계별로 순차적으로 한번에 하지말고”라고 했을 때 Main은 3단계만 마치고 결과 설명 뒤 멈추겠다고 답했다. [3단계 후속 기록](2026-11-13-08-stage-three-consumer-and-expression-rereview.md)은 그 당시의 해석과 실제 수행을 남긴다. 이어 사용자가 정정했다.

> 4\~7 단계도 하라니까 단지 한번에 처리하지말고 단계별로 잘 진행하라고

Main은 “단계별로”를 단계마다 멈추라는 뜻으로 잘못 이해했다고 인정하고 4〜7단계를 계속 진행하겠다고 답했다. 원래 요청의 전체 범위는 3〜7단계였으며, 이번 정정은 새 범위를 추가한 승인이 아니라 전체 범위와 진행 방식의 오독을 바로잡은 것이다. current·Ticket·재개·산출물 안내에서 “3단계 설명 뒤 멈춤”을 제거하고 **단계별로 결과를 닫으며 7단계까지 지속**하도록 맞췄다. 과거 기록은 덮어쓰지 않는다.

[검토 깊이·완료 판단 정정](2026-11-13-07-review-depth-and-completion-correction.md)도 유지한다. 각 단계의 실제 요구·소비자·현재안과 대안의 비용을 비교하고, 동작 검증 통과를 전반적인 표현 품질의 충분성으로 확대하지 않는다. 완료 결과가 확인되기 전에 다음 단계의 유지·완료 판단을 미리 기록하지 않는다.

## 4단계 — 첫 조회의 역할과 큐 입력의 계약

Main과 독립 reviewer가 실제 소비를 각각 확인한 결과, 서버 일정 수정·경비 수정·자식 삭제의 첫 `ownedRecord` 조회는 부모 여행 ID만 사용했다. 세 곳을 `select({ tripId })`로 좁혔다. 첫 조회는 잠글 부모를 찾고, 이후 부모 잠금과 자식 전체 행의 `for update` 조회는 잠금 대기 뒤 실제 판정할 값을 얻으므로 둘 다 유지한다. 중복 조회를 없앤 변경이 아니라 각 조회의 역할을 선택하는 데이터로 드러낸 변경이다.

클라이언트 `addToSyncQueue`는 입력을 해석하지 않고 직렬화해 보관하므로 `payload: any`를 `unknown`으로 바꾸고 lint 예외를 제거했다. 서버 입력을 파싱한 값과 보류에 남길 `originalPayload`의 원문 책임도 구별해 유지한다. 큐의 raw payload·FIFO, 이전보다 새 표식의 채택과 같은 값에도 새 표식을 저장하는 규칙은 그대로다.

`lockOwnedTrip`의 성공 반환을 쓰지 않는다는 이유로 nullable 오류 응답만 반환하도록 바꾸는 안은 채택하지 않았다. 잠금 함수의 이름과 반환 의미가 멀어지는 비용이 있었기 때문이다. `mergeEdit`의 두 순회도 구버전 요청 전체의 충돌 선판정과 수락한 그룹의 적용이라는 서로 다른 책임이다. 전면 helper 분해나 세 갈래 union은 두 소비자의 간단한 guard보다 추론 부담을 충분히 줄이지 못해 유지했다. Main은 PostgreSQL 14 명시적 잠금·SQLite AUTOINCREMENT 공식 동작도 실제 사용과 대조했다.

이번 추가 변경은 서버 `entity-mutations.ts`와 클라이언트 `queue.ts`의 2파일이다. patch는 `/tmp/noline-stage4-rereview.patch`, 후속 시작 사본은 `/tmp/noline-stages4-7-rereview-before`다. Main의 변경 전후 client 3묶음 61개가 각각 통과했고(`/tmp/noline-stage4-rereview-before-client.log`, `-after-client.log`), 수정 후 서버 3파일 39개도 통과했다(`-after-server.log`). 최초 서버 실행의 listen EPERM은 환경 권한 문제이며 허용된 재실행이 통과했으므로 제품 실패로 세지 않는다. 서버 타입 통과·client 타입 기존 7개 동일·2파일 포맷 통과는 Main 보고다. 축약 로그는 모두 `/tmp/noline-stage4-rereview` 접두사를 쓴다. 독립 verifier는 실제 PostgreSQL의 `field-edits-and-deletion.test.ts` 1파일 22개를 직접 실행해 통과했다(`/tmp/noline-stage4-independent-pg.log`). 별도 schema 적용은 `/tmp/noline-stage4-independent-schema.log`에 있다. client61·서버39는 실제 delta·assertion과 대조해 근거로 재사용했으며 반복 실행하거나 별도 검사 수로 더하지 않았다. 요구 충족 근거가 충분하고 필수 수정이 없다는 반환을 Main이 채택해 4단계 보완 완료를 판정했다. queue lint는 오류·경고 0이다(`/tmp/noline-stage4-rereview-lint.log`). 검증용 `noline-stage4-rereview`의 55432 자원은 정리했고 개발 DB5432는 보존했다. 인증 대역 REST·PostgreSQL과 Node SQLite의 확인이며 native·실제 JWT·Cloud 검증으로 확대하지 않는다. 단계별 검사와 앞선 기록의 수치는 합산하지 않는다.

## 5단계 — 응답 완료의 경계와 같은 DB 매핑 재사용

서버에 보낸 30의 응답을 기다리는 동안 기기에 새로 저장한 35는 남아야 한다는 결과를 기준으로 다시 대조했다. ACK를 engine으로 옮겨도 `completedTaskId`는 후속 pending을 계산하는 데 필요하므로 정보 전달이 줄지 않고 같은 transaction의 조율만 늘어난다. reconcile의 preserve는 서버 확인본 수락과 Local 표시 보존을 구별하므로 단순한 조기 return으로 합치지 않는다. 삭제 executor의 관련 입력 정리와 성공한 현재 task의 ACK도 근거가 달라 구별하며 현재 요청은 한 번만 ACK한다. 완료 ID의 별도 조회는 다른 record에 속한 잘못된 ID를 거절하기 위해 유지한다.

실제 중복은 engine의 `LOCAL_TABLES`였다. 기존 `sync-tables.ts`의 `SYNC_TABLES`와 같은 DB 테이블 책임·값이므로 기존 매핑을 재사용하고 중복 선언·import를 없앴다. 성공 DELETE와 거절 응답의 source 조회 두 곳을 바꾼 engine 한 파일의 변경이며 `/tmp/noline-stage5-rereview.patch`에 있다. 반면 HTTP endpoint 매핑과 `isSyncTable`은 전송 지원 범위를 검증하는 책임이므로 DB 목록과 합치지 않았다.

DELETE 본문을 helper로 추출하는 안은 다섯 인자를 새로 연결해야 하는 비용이 컸고, task와 검증된 tableName을 새 객체로 묶는 안도 이득이 작았다. 작은 조회 projection·공개 response alias의 import 경로 변경도 이 범위에서 개선 이득이 작아 채택하지 않았다. query refresh는 읽기 책임이며 새 GET 완료까지 동기화의 성공 조건으로 넓히지 않는다. Main이 독립 reviewer의 의견과 실제 소비를 대조해 한정 변경과 유지안을 선택했다.

Main의 client 3묶음 91개가 통과했다(`/tmp/noline-stage5-rereview-client.log`). 독립 verifier는 같은 DB 객체 매핑이 보존됐는지, 91개 실행 로그와 핵심 assertion, 앞선 실제 HTTP probe 원본의 적용 범위를 대조해 요구 충족 근거가 충분하고 필수 수정이 없다고 반환했다. Main이 이를 채택해 5단계 보완 완료를 판정했다. 독립 재실행·새 probe는 없으며 과거 HTTP 검사를 이번 실행으로 기록하지 않는다. client 타입은 기존 7개와 파일 diff가 없고(`/tmp/noline-stage5-rereview-types.log`), lint 출력은 비어 있으며(`-lint.log`) 포맷 검사는 통과했다. 6단계와 공유하는 매핑의 같은 객체 참조를 확인한 것은 이번 변경 영향 확인이지 6단계 전체 보완 완료가 아니다.

## 6단계 — 중복 보류 정리 알림과 삭제 응답의 판단 순서

이미 받은 서버 보류 내용이 같아도 같은 입력의 Local 중복 행을 지웠다면 복구 목록에 변경을 알려야 한다. 독립 reviewer가 이 알림 누락을 제기했고 Main은 회귀를 먼저 추가해 DB에는 서버 보류 하나만 남지만 구독 알림은 0회인 실패를 확인했다. `legacy-holds.ts`의 중복 삭제 분기에 `hasChanges = true`를 추가해 transaction 완료 뒤 알리도록 고쳤다. UI 소비자는 실제 구독 알림을 받아 조회를 무효화한다.

engine의 410 처리는 최소 삭제 맥락 인식 → 엄격한 schema 검증 → 귀속 확인 → 반영 순서가 보이도록 정리했다. `isTripDeletion`과 `canConfirmTripDeletion`으로 판단을 이름 붙이고 반영할 수 없는 경우를 먼저 반환한다. 기존 Date guard를 없애거나 전체를 같은 `safeParse` 실패로 처리하면 기존의 `server-rejected`와 `local-after-response` 분류가 바뀌므로 채택하지 않았다. 그러나 그 이유로 기존 긴 조건 표현을 고정하지 않고, 같은 판정을 더 읽기 쉽게 배치했다. [Date.parse 공식 설명](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)의 날짜 해석과 저장소의 timezone 포함 ISO schema가 맡는 엄격한 검증을 Main이 대조했다.

직접 수정과 sync 실패 처리를 합치는 안은 오류 형태·원문 및 부모 정보 확보·throw와 다음 요청 진행의 책임이 다르므로 유지했다. 위치 인자를 객체로 묶는 개편도 이 범위에서 이득보다 전달 비용이 커 채택하지 않았다. 이전 정정에서 요구한 것은 guard 제거라는 정답이 아니라 동작 보존과 표현 적합성을 별도로 판단하는 일이었으며, 이번 변경은 그 구별을 실제 코드에 적용했다.

추가 delta는 engine·legacy-holds 제품 2파일과 reconciliation 검사 1파일이다(`/tmp/noline-stage6-rereview.patch`, 시작 사본 `/tmp/noline-stage6-before`). 수정 전 회귀는 알림 누락 1개 실패·기존 삭제 실패 분류 4개 통과였다(`/tmp/noline-stage6-regression-before.log`). 처음 검사에서는 `expect.anything()`이 undefined 인자를 허용하지 않아 별도 실패가 있었으나 matcher를 고친 뒤 제품 수정 전 baseline을 다시 실행했다. 이 검사 준비 실패를 제품 결함으로 세지 않는다.

수정 뒤 Main의 client 4묶음 91개가 통과했다(`/tmp/noline-stage6-rereview-client.log`). 독립 verifier는 실제 patch·수정 전 회귀·최신 91개 로그·핵심 assertion과 transaction 완료 뒤 알림, 실제 UI의 구독·무효화 연결을 대조해 충분하고 필수 수정이 없다고 반환했다. 추가 실행·새 probe는 없으며 Main이 채택해 6단계 보완 완료를 판정했다. client 타입은 5단계와 파일 diff 없이 기존 7개가 같고(`-types.log`), lint 오류·경고는 0이다(`-lint.log`). 축약 로그는 `/tmp/noline-stage6-rereview` 접두사를 사용한다.

새 알림부터 실제 화면 렌더까지 통합 실행한 것은 아니다. 기존 복구 UI 검사는 구독 대역을 사용하며, 이번 새 알림과 실제 UI 연결은 각각의 실행·정적 대조 근거다. native·운영 HTTP·배포를 확인하지 않았고 5단계의 91개와 이번 91개는 서로 다른 검사 묶음이므로 혼동하거나 합산하지 않는다.

## 7단계 — 최종 전송 필터가 진단 그룹 키를 만든다

사건 생성과 최종 전송 필터 양쪽에서 같은 fingerprint를 계산하던 중복을 없앴다. 최종 허용값을 결정한 필터가 그 값으로 그룹 키를 만들도록 생산자의 계산·import를 제거하고 필터 helper를 비공개로 바꿨다. resolved 검사는 실제 등록된 `beforeSend`를 호출해 출력 그룹 키를 확인하도록 바꿨다. blocked 검사는 기존 sanitizer 직접 호출의 오염된 scope 검사에 그룹 키 assertion을 더했다. 두 사건을 모두 실제 beforeSend로 실행한 것은 아니다.

반면 생산자가 raw task에서 허용된 필드만 꺼내는 것과 SDK의 최종 scope를 정제하는 것은 서로 다른 경계라 유지했다. Signal의 사건별 union은 각 사건의 필수 정보를 표현하므로 넓은 optional 객체로 바꾸지 않았다. `SyncRun`을 명시적으로 전달하는 대신 전역으로 두면 실행 밖 로그인 격리 신호가 다른 실행에 연결될 수 있다. started·finished 두 신호는 시작만 온 실행과 실제 종료를 구별하므로 종료 하나로 줄이지 않았다. 일반 예외와 sync 진단을 별도 파일로 쪼개면 공통 전송 제약이 중복되며, 기본 integration을 모두 없애면 일반 JS 예외 수집까지 잃으므로 둘 다 채택하지 않았다.

Main과 reviewer는 [Sentry React Native filtering](https://docs.sentry.io/platforms/react-native/configuration/filtering/) 및 [options 문서](https://docs.sentry.io/platforms/react-native/configuration/options/)와 설치 RN 6.22.0·core 8.55.0을 대조했다. 기본 integration과 `_prepareEvent` 이후 `beforeSend`·send 순서, Dedupe 제외, Replay 옵션 부재를 확인해 최종 필터에서 그룹 키를 확정하는 판단에 연결했다. 단순히 중복 코드를 찾은 사실로 서로 다른 보호 책임까지 합치지 않았다.

추가 delta는 제품 `sentry.ts`·`sanitize-sentry-event.ts`와 `sentry.test.ts`의 3파일이다(`/tmp/noline-stage7-rereview.patch`, 시작 사본 `/tmp/noline-stage7-before`). Main의 전후 client 5묶음 57개가 통과했다(`/tmp/noline-stage7-rereview-before-client.log`, `-client.log`). 초기 검사 수정에 Event를 ErrorEvent 자리로 넘기는 새 타입 오류 1개가 있었고 Main·독립 verifier가 각각 확인했다. 실제 event의 type을 검사해 일반 이벤트임을 좁힌 뒤 그 값을 전달하도록 고쳤으며 캐스트나 transaction을 일반 이벤트로 바꾸는 우회는 하지 않았다. 수정 후 최신 57개를 다시 실행했다.

독립 verifier는 최신 검사·patch·타입 로그를 직접 대조해 충분하고 필수 수정이 없다고 반환했다. 제품 2파일은 추가 변경이 없어 이미 확인한 SDK·민감값·진단 계약 근거를 재사용했고 별도 재실행·새 probe는 없다. Main이 채택해 7단계 보완 완료를 판정하고 설명했다. client 타입 결과는 기존 7개와 byte 단위로 같고(`/tmp/noline-stage7-rereview-types.log`), lint 출력은 비어 있으며(`-lint.log`) 포맷도 통과했다. 실제 SDK 송신·운영 Sentry·native 확인은 이번에 하지 않았다.

## 마지막 연결 확인과 완료 범위

Main이 최신 client의 활성화 → 큐 → 응답 반영 → 보류·삭제 → 진단 연결을 확인했다. sync 14묶음과 diagnostics·orphaned queue·trip lifecycle·활성화 조회 갱신·날짜 저장·복구 UI를 포함한 20묶음 309개가 통과했다(`/tmp/noline-stages4-7-final-client.log`, 목록 `/tmp/noline-stages4-7-final-test-paths.txt`). 독립 verifier도 선택한 20묶음·309개 로그와 최종 변경 범위를 직접 대조해 충분하며 추가 실행이 불필요하다고 반환했고 Main이 채택했다. client 전체 검사라고 부르지 않으며 단계별 61·91·57 등과 합산하지 않는다. 서버는 4단계 이후 바뀌지 않아 당시 39개와 독립 실제 PostgreSQL 22개의 근거를 재사용한다.

이번 4〜7단계 추가 변경은 제품 6파일(engine·queue·legacy-holds·sentry·sanitize-sentry-event·서버 entity-mutations)과 검사 2파일(reconciliation·sentry)이다. 3단계 당시 추가 6파일과 중첩 경로가 있으므로 단순 합계로 누적 파일 수를 만들지 않는다. Main이 시작 baseline97개와 hash를 대조한 `/tmp/noline-stages4-7-final-changed-baseline.txt`에는 이번 제품·검사 8파일과 담당 Work007 변경만 있으며 무관한 기존 내용은 보존됐다. 새 누적 기록은 별도다.

Main은 요청된 **3〜7단계 순차 보완 재검토 수행을 완료**로 판정했다. 단계마다 선택·비용·필요 수정·독립 근거를 확인하고 결과를 설명한 뒤 다음으로 진행했으며, 마지막 연결 검사도 확인했다. [07 정정](2026-11-13-07-review-depth-and-completion-correction.md)을 취소하거나 앞선 검토가 처음부터 충분했다고 소급하지 않는다. 이번에 확인한 선택·실행 범위의 완료이지 이후 개선 여지가 없다는 보장은 아니다.

최신 client 타입은 기존 오류 7개와 같고 변경 lint·포맷 검사는 통과했다. native·실제 SDK 송신·운영 Sentry/Cloud·실제 JWT·배포는 이번에 확인하지 않았다. 사용자 최종 수락·선별 커밋·배포는 별도이며 전체 Work007 또는 009 완료를 선언하지 않는다. 최신 기록 커밋945922fe·제품44d2a5ef 이후의 코드·기록은 미커밋이다.

## 원문과 기록 확인

3단계의 추가 6파일과 115개 보존 검사·독립 근거 대조는 앞선 기록의 결과로 유지한다. 기록 담당자는 제품·검사를 수정하거나 재실행하지 않았으며 단계별 완료 판단은 Main의 채택과 반환된 근거를 연결했다.

기록 담당자는 Main rollout `/Users/hammyeong-yeon/.codex/sessions/2026/11/13/rollout-2026-11-13T02-05-41-01a1d0b8-e751-78a3-8a4a-7bac4bd0bb96.jsonl`의 3단계 최종 답변 2279행, 사용자 정정 2286행, Main의 해석 정정·계속 진행 답변 2291행을 직접 읽었다. 이어 2343·2423행의 4단계 판단·진행과 2489행 완료 설명, 2555행의 5단계 판단과 2600행의 완료 설명, 2678·2774행의 6단계 수정 판단·완료 설명, 2836·2906행의 7단계 진입·판단 원문, 실제 patch와 자기검사 로그를 대조했다. 독립 검토자의 판단·설치 근거는 Main 전달과 연결하며 기록 담당자가 제품 검사를 재실행하지 않았다. 7단계 최종 반환·마지막 연결 검사·변경 범위 보존은 Main 전달과 실제 patch·로그·hash 비교 목록을 대조했다. 최신 기록 커밋945922fe·제품44d2a5ef이고 이번 후속은 미커밋이다.
