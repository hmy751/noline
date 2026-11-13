# 3단계 코드와 관련 기록의 분리 커밋

2026-11-13. 사용자는 정리된 현재 코드로 3단계를 다시 설명받은 뒤, **3단계 코드와 관련 기록을 잘 구별해 먼저 커밋**하도록 요청했다. 코드는 **941e8557 — `fix(sync): 조회 누락과 이전 준비 응답의 반영을 막는다`**로 커밋했다. 시작 HEAD8ab15b33 위에서3단계 코드·검사14파일만 선별했고734줄 추가·494줄 삭제다. 이 기록과 필요한 현재 안내는 코드와 별도의 문서 커밋 대상으로 준비한다. 문서 자신의 커밋 hash는 이 기록의 선행 조건이 아니다.

## 재설명에서 커밋 요청으로 이어진 범위

전수 가독성 정리 완료 뒤 사용자가 “3단계는 커밋 했엇나?”라고 물었다. Main은 제품 코드는2단계 `44d2a5ef`까지, 이후3〜7단계의 검토·설명 기록은 `bf1e13b1`·`8ab15b33` 등에 들어갔지만3단계 제품은 아직 미커밋이라고 구별했다.

사용자는 이어 “그래 다시 3단계 코드 설명 해줘”라고 요청했다. Main은 이미 준비한 여행의 pull 한 번을 따라 현재 코드를 발췌했다. 요청 당시 여행·준비 ID와 저장 cursor를 읽는 부분, 서버의 실제 범위 조건에서 cursor를 사용하는 부분, snapshot과 nextCursor 반환, 응답 검증과 현재 준비 비교, reconcile/확정 삭제 반영, Local과 checkpoint의 같은 transaction, 화면 재조회 순으로 연결했다. 앞선 [이해 과정](2026-11-13-12-pull-boundaries-and-understanding.md)에서 빠졌던 기존 timestamp 증분 조회와 실제 변경 이유를 이번 설명에 유지했다.

특히 `requestedPreparations`를 만든 뒤 현재 준비와 비교하는 사용처, `xidRange`와 `changedSincePreviousPull`이 실제 경비 조회 조건에 들어가는 지점, 저장한 cursor를 다음 요청이 다시 읽는 연결까지 제시했다. 사용자가 새로 모든 분기 이해나 제품 전체 수락을 선언한 것은 아니다. 다음 발화는 커밋 범위에 관한 지시였다.

> 사용자: “그래 그럼 3단계 코드랑 관련 기록부터 잘 구분해서 커밋하자”
>
> Main: “동기화 엔진과 일부 검사 파일에 4~7단계 변경도 함께 들어 있어, 파일 통째로 담지 않고 3단계 부분만 골라 담겠습니다. 분리한 커밋 자체에서도 관련 검사가 성립하는지 확인하겠습니다.”

## 분리하는 책임과 보존하는 변경

이번 코드 커밋은 서버 cursor/snapshot 조회, pull의 계정·세션·준비 수명·checkpoint, 활성화와 사본 정리의 준비 ID 연결을 포함한다. 서버 cursor 계약은 optional로 두어 기존 timestamp 요청·응답 호환을 유지한다. 준비 ID는 기존 `tripActivations.id`를 사용하므로 DB migration은 필요하지 않다.

같은 engine 파일의 FIFO·push·409/410·ACK·진단과 후속 DB 매핑 정리는 포함하지 않았다. 독립 감사가 AST로 대조한 결과 `pullChanges` 외 최상위 함수·변수 선언은 HEAD와 동일하다. 선택한 pull 본문은 현재 구현에서6단계 보류 동기화 호출만 제외한 판본과 같다. 그 호출에 의존하지 않고 계정/세션·범위 검증·준비 비교·metadata/삭제와 일반 자식 반영·checkpoint 전후 재검사를 연결한다.

사본 정리는3단계에서 빼면 안 되는 의존성이었다. 명시적으로 사본을 정리해도 활성 상태가 true일 수 있어, 준비 ID가 그대로면 이전 pull 응답이 정리한 데이터를 되살릴 수 있다. `clearTripCopiesInTransaction`은 서버 본문 해제·현재 사용자의 자식 사본 정리·준비 ID 갱신을 함께 확정하며, pending cleanup·force cleanup·일반 비활성화의 즉시 정리3곳에서 기존 transaction 안에 호출한다. 기존 pending 보호, 공개 반환 속성, 지도/서버 후처리·실패 처리·vacuum은 유지했다. 큐 보호 predicate 확대와 보류·진단 후속을 끌어오지 않았다.

### 이번 판본에 함께 담은3단계 표현 선택

활성화의 긴 DB 반영은 같은 파일 `applyActivationResponse`로 분리해 입수→기기 반영→백그라운드 준비의 순서를 본문에서 읽게 했다. 새 공개 DTO나 별도 service를 만들지 않았으며 공유 schema에서 추론한 응답 타입과4개 입력을 사용한다. helper 자체가 transaction을 시작하므로 `InTransaction` 이름을 붙이지 않았다. 내부 세션 검사·여행 반영·준비 ID·자식 순서는 그대로이고, 삭제 응답의 null은 transaction을 commit한 다음 바깥에서 실패로 알린다.

실제 소비자가 읽지 않던 schedules/expenses 반환과 재조회를 제거하고, 검사는 반환 배열 대신 실제 Local 조회·DB 날짜를 확인하게 했다. 서버 조회 조건은 `changedSincePreviousPull`, 준비 조회는 `preparationId`처럼 실제 기준을 드러낸다. 이 선택의 목적은 동작·필요한 보호를 줄이는 것이 아니라 사용하지 않는 계약과 조율 본문을 읽을 때의 추적을 줄이는 것이다. 전체 가독성 기록이 미커밋이어도 이번3단계의 이유를 여기서 복원할 수 있게 남긴다.

### 확정한14파일

| 책임 | 포함 파일 |
| --- | --- |
| 활성화·사본 수명 | `apps/client/src/entities/trip/data/useActivateTrip.ts`, `apps/client/src/entities/trip/data/useDeactivateTrip.ts`, `apps/client/src/shared/services/sync/cleanup-job.ts` |
| pull 요청·반영·저장 | `apps/client/src/shared/services/sync/engine.ts`, `apps/client/src/shared/services/sync/storage.ts` |
| 서버 조회·공유 계약 | `apps/server/src/routes/sync.ts`, `packages/schema/src/sync/sync-status.ts` |
| client 수신·Local·소비 연결 검사 | `apps/client/tests/shared/services/sync/auth-result.test.ts`, `response-freshness.test.ts`, `query-refresh.test.ts`(같은 디렉터리), `apps/client/tests/entities/temporal-local-contracts.test.ts`, `apps/client/tests/screens/schedule-recovery.test.tsx` |
| 서버 검사·최소 지원 | `apps/server/tests/integration/pull-cursor.test.ts`, `apps/server/tests/support/test-app.ts` |

response-freshness에는 원래 사례와 활성화 Local 조회·준비 수명·cursor·세션을 담고, 현재 작업 트리의 직접 CRUD·목록·라우팅 보완과 보류 동기화 mock은 제외했다. temporal 검사는 활성화 후 실제 DB 날짜를 읽는 한 사례만 바꾸고 SQLite adapter 통합·일반 표현 정리는 제외했다. server test-app은 snapshot 실행에 필요한 execute/transaction만 연결하며 후속 mutation의 잠금·delete wiring은 담지 않았다.

3단계의 앞선 검토·소비자 재검토·설명 참고·reconcile/pull 이해 기록은 이미 커밋돼 있다. 이번 문서 커밋은 이 분리의 이유·범위·검증·실제 커밋 결과와 필요한 현재 진입만 담는다. 전체 가독성 검토 기록13과85파일 검토 산출물은 이번 문서 커밋에서 제외하고 작업 트리에 보존한다. 코드 전체나 기록 전체를 일괄 stage하거나 작업 트리를 되돌리는 요청이 아니다.

## 분리판 검사·독립 감사·커밋 확인

Main은 HEAD8ab15b33 전체에서 만든 후보 트리에서 `@repo` 의존성이 후보 packages를 가리키도록 연결하고 공유 schema를 별도로 build했다. 기존 전체 작업 트리505/73 결과를 분리판 검사로 대신하지 않았다.

| 확인 | 결과와 한계 |
| --- | --- |
| client 핵심 | 5묶음106개 통과 |
| client lifecycle 연결 | 앞 검사와 겹치지 않는4묶음41개 통과. 분리판 client 합계147개 |
| server | 12묶음73개 통과. 처음 listen EPERM 뒤 허용된 같은 검사로 통과 |
| 타입 | server 오류0, client는 기존7오류 |
| 한정 lint | client10파일 오류0·경고4. HEAD의 경고1에서 async assertion 경고3개 증가 |
| 범위·의존성 | 독립 감사가14파일 전체와 HEAD/현재판을 대조해 누락·타 단계 필수 수정0으로 판정 |

lint 경고를 기존과 모두 같다고 쓰지 않는다. 이번 분리판에는 async assertion 경고3개가 추가됐으며 기능 실패와 구별한다. 실제 PostgreSQL·native 기기 검사는 이번 후보판에서 새로 실행하지 않았다. 새 PG cursor 검사 파일의 포함과 그 검사의 이번 실제 실행도 구별한다.

독립 감사는 engine 비-pull 선언 동일, pull의6단계 동기화 제외, cleanup3곳 연결, 공유 schema 호환, 검사 mock·지원의 최소 의존성을 확인했다. 최종 stage14파일은 검사한 후보와 byte 단위로 같다고 Main이 확인했다. 코드 커밋 뒤 기록 담당자도 `git show --stat 941e8557`에서14파일·734추가·494삭제를 확인했다. Main의 해시 대조에서 제품 및 무관한 작업 트리 내용 변화는0이었다. stage를 위해 다른 작업을 되돌리지 않았다.

나머지4〜7단계 코드와 전체 가독성 기록13·검토 산출물은 미커밋으로 남았다. 다음 설명은 아직 미착수인4단계의 전송 순서부터 이어갈 수 있다. 이번 분리 커밋을 전체 구현 수락·원격 push·배포로 확대하지 않는다.

## 원문 접근

[Main rollout](/Users/hammyeong-yeon/.codex/sessions/2026/11/13/rollout-2026-11-13T02-05-41-01a1d0b8-e751-78a3-8a4a-7bac4bd0bb96.jsonl)의5717〜6020행을 직접 읽었다. 핵심 발화는 전수 정리 완료5846, 커밋 현황 질문5853·답5863,3단계 재설명 요청5879·설명5919, 분리 커밋 요청5926·Main 범위 설명5975행이다. 초안 입력 끝은6020이었다. 이후 Main의 최종 범위·검사·코드 커밋 전달과 `/tmp/noline-stage3-commit/paths.json`, `scope-audit.md`, `audit-scope.json`을 직접 읽고 결과를 반영했다. 감사의14파일 hash·비-pull 선언 동일·현재 pull에서6단계만 제외했다는 판정과 핵심 이유를 위 본문에 보존했다. 임시 경로는 재접근점이며 기록을 이해하는 유일한 근거로 남기지 않는다.

기록 담당자는 새 기록과 지정된 Work007 현재 안내만 수정한다. 제품·검사·과거 기록·전수 검토 산출물은 이 기록 과업으로 바꾸지 않으며 stage·commit은 Main이 수행한다.
