# reconcile의 책임 분리와 구체적인 보존 동작

[2단계 첫 검토](2026-11-12-13-stage-two-reconciliation-review.md) 뒤 사용자는 reconcile이 전체 충돌 정책에서 맡는 역할과 pull과의 관계를 다시 물었다. 이어 코드가 방대하다며 기능과 지켜야 할 동작을 유지하면서 간결하고 이해하기 쉽게 만들 방법을 요청했다. 첫 검토에서 핵심 동작을 유지한 결론을 코드 구조까지 영구히 유지할 이유로 삼지 않고, 책임과 실패 효과를 다시 비교했다.

## 사용자가 남겨 달라고 한 피드백 관점

Main의 “간결화하면서 반드시 유지할 동작도 구체적으로 잡아야 합니다.”라는 문장에 사용자는 다음과 같이 응답했다.

> 이거 좋은 포인트같아 반드시 유지할 동작은 구체적으로 잡으면서 간결화와 뭐 이런저런것들을... 고려해야하는거 이건 당장은 아니지만 일단 기록해놔줘 나중에 루프 피드백이나 피드백 할때 기억하게

이번에 보존할 관점은 **구체적인 상황과 결과로 유지할 동작을 먼저 잡고, 그 보장을 유지하면서 간결성·이해와 수정의 부담 등을 함께 판단한다**는 것이다. “동작 유지”라는 포괄적인 말이나 줄 수 감소만으로 개선을 설명하지 않는다는 맥락이다. 사용자는 이 관점을 나중의 루프·피드백에서 회수하도록 기록해 달라고 했다. 지금 스킬·Personal의 지속 기준으로 승격하거나 009의 개선 작업을 실행하라는 지시는 아니다. 이후 피드백에서는 이번 변경이 실제로 읽기·수정 부담을 줄였는지와 보존 사례가 검증에 연결됐는지 함께 돌아볼 수 있다.

사용자는 이어 “그래 그럼 니 말대로 수정해서 다시 보여줘봐”라고 요청했다. 따라서 아래 세 가지 구조 개선은 제안에 머무르지 않고 이번 007 Ticket 09의 2단계 후속 수정으로 진행한다.

## 개선안과 선택 이유

| 개선 | 줄이려는 부담과 유지할 경계 |
| --- | --- |
| 확정 삭제 처리 분리 | `applyConfirmedDeletionInTransaction`과 `isValidDiscardedMutation`를 `confirmed-deletion.ts`로 옮긴다. 일반 수신 외에 직접 삭제·수정 실패 처리에서도 독립 소비하는 책임이다. 삭제된 서버 본문 저장 뒤 정리하는 순서와 삭제 가능한 입력의 조건은 유지한다. |
| pending 표시 계산 분리 | 같은 reconcile 파일의 `projectPendingChanges`가 FIFO 원시 입력을 겹쳐 표시 행을 만들거나 `keep-local`을 반환하도록 한다. DB 조회·ACK는 맡기지 않는다. 해석 불가 입력이 예외나 단순 task 건너뛰기가 아니라 기존 표시를 유지하는 정상 경로임을 드러낸다. |
| 서버 확인본 저장 위치 정리 | 수락 여부는 reconcile이 판단하고 key 구성·upsert는 기존 `server-state.ts`의 저장 책임으로 모은다. 표시값 계산 이전에 원본을 저장하는 순서는 유지한다. |

완료 요청 제거는 `finally`로 옮기지 않고 현재 조건과 위치를 유지하며 이름으로 대상을 드러낸다. 광범위한 helper 분할·상태 머신·범용 규칙 엔진을 추가해 줄 수를 숨기는 방향은 선택하지 않았다. 구현에서는 `sync-tables.ts`에 table map과 type guard만 두었다. `PENDING_STATES`는 표시 투영과 삭제 정리의 각 정책 옆에 한 줄씩 유지해 같은 문자열을 쓴다는 이유만으로 두 정책을 결합하지 않았다.

Main은 Drizzle [insert/upsert](https://orm.drizzle.team/docs/insert)와 SQLite [transaction](https://www.sqlite.org/lang_transaction.html) 공식 문서를 다시 확인했다. 행 삽입·충돌 갱신은 기존 ORM 기능을 활용하고, 판본 선택·미완료 입력 보호는 제품 책임으로 유지한다. helper마다 트랜잭션을 새로 열지 않고 기존 실행 경계 안에서 조합한다. 설치본과 비동기 callback에 관한 선행 대조는 13번 기록에 남아 있다.

## 수정 전 구체화한 보존 사례

| 조건 | 유지할 결과 |
| --- | --- |
| A 전송 뒤 B가 Local에 저장되고 A 응답이 도착 | 서버 확인본은 A 응답으로 갱신하되 Local에는 B를 반영하고 완료된 A 요청만 제거한다. |
| 수락한 판본보다 오래된 응답 도착 | Local의 낙관적 version이 아닌 수락한 서버 판본을 비교하고 최신 서버 확인본을 기준으로 처리한다. |
| 남은 요청 JSON을 해석할 수 없거나 UPDATE에 투영할 내용이 없음 | 해당 원시 입력과 기존 Local 표시를 보존한다. 이미 수락한 서버 원본 저장과 이번 완료 요청의 제거는 유지한다. |
| 소유권 모순이나 DB 저장 실패 | 예외를 전달하고 해당 트랜잭션의 DB 변경을 취소한다. 정상 `keep-local` 반환과 구별한다. |
| 서버 삭제 확정 | 기존 자식·연결·큐·보류 입력의 정리 조건을 유지한다. 정상 ACK가 한 요청을 지우는 것과 구별한다. |

raw queue를 request schema로 다시 정규화하거나 입력을 폐기하지 않는다. 기존 object 판정을 일괄 강화하거나 CREATE를 JSON 해석 이전에 생략하는 것도 현행 표시 보존 효과를 바꿀 수 있다. 순수 계산 분리에서 이런 조건을 함께 보존한다. 트랜잭션 주장은 DB 변경 범위이며 편집 시계 관찰 등 외부 부수 효과까지 SQL rollback된다는 뜻은 아니다.

## 실제 수정과 확인

Main이 제품·검사 **11파일**을 수정했고, 이번 2단계 후속 구조 개선의 구현·자기 확인·별도 검증을 완료로 판정했다. 전체 작업부에는 기존 변경이 많으므로 이번 delta는 `/tmp/noline-reconcile-refinement-before` 원본, `/tmp/noline-refinement-files.txt` 목록과 `/tmp/noline-refinement.patch`로 구별한다. 제품 커밋·push·배포는 하지 않았다.

- [reconcile](../../../../../apps/client/src/shared/services/sync/reconcile.ts): 수신 조율과 같은 파일 안의 순수 `projectPendingChanges`를 구별했다. `write`/`keep-local` 반환으로 정상 보존 경로를 드러내며 완료 처리 이름은 `acknowledgeCompletedTask`다. 파일은 447→255행, 수신 본체는 186→138행이 됐다. 이동·추출의 결과이며 전체 정책 코드가 그만큼 사라졌다는 뜻은 아니다.
- [confirmed-deletion](../../../../../apps/client/src/shared/services/sync/confirmed-deletion.ts): 삭제 종결과 입력 정리 판정을 옮겼다. 독립 검증자는 이전 snapshot과 비교해 삭제 본문이 타입명 변경 외에는 같음을 확인했다. engine·직접 삭제·직접 수정 실패·trip-local과 관련 검사 import를 새 책임으로 연결했다.
- [server-state](../../../../../apps/client/src/shared/services/sync/server-state.ts): `rememberServerRecordInTransaction`에 원본 upsert를 모았다. 수신에서 확인한 userId를 명시적으로 전달하며 판본 수락 판단과 호출 시점은 reconcile에 유지했다.
- [sync-tables](../../../../../apps/client/src/shared/services/sync/sync-tables.ts): 위 두 정책이 사용할 테이블 연결과 판별만 둔다. 새 트랜잭션·정책 실행 계층은 만들지 않았다.

[reconciliation 검사](../../../../../apps/client/tests/shared/services/sync/reconciliation.test.ts)에 보존 동작을 확인하는 여섯 사례를 추가했다. 손상 UPDATE/PENDING·손상 CREATE/FAILED·빈 UPDATE/IN_PROGRESS의 세 사례는 **Local과 미완료 입력 보존, 서버 원본과 완료 요청 처리 확정**을 함께 확인한다. `server_records` INSERT·`expenses` INSERT·`sync_queue` DELETE 실패 주입 세 사례는 **서버 원본·Local·큐의 전후 snapshot 일치**를 확인한다. 이번 추출 함수만 모방하는 검사 대신 실제 수신 진입에서 상태 간 관계를 검증했다.

Main 자기검사는 reconciliation·response-freshness·deletion-storage-validation·transaction-serialization·temporal-local-contracts·retry·blocked-diagnostics·query-refresh **8묶음 158/158 통과**다(`/tmp/noline-refinement-tests.log`). 앞선 wrapper 정리의 121개·독립 7개와 합산하지 않는다. 변경 lint는 **오류 0·기존 경고 4**이며, trip-local의 이름 shadow 1개와 response-freshness의 async assertion 경고 3개다(`/tmp/noline-refinement-lint.log`). 기존 경고임은 Main이 수정 전 원본 lint와 대조했다. 타입 검사는 **기존 오류 7개**이고 `/tmp/noline-refinement-types-before.log`와 `-after.log`가 완전히 같다. harness는 **기존 링크 누락 64개**로 `/tmp/noline-refinement-harness.log`가 이전 stage2 로그와 같다. 타입·harness 전체 통과로 보고하지 않는다.

별도 검증자 `/root/verify_reconcile_refinement`는 이전 snapshot·실제 소비자·검사의 기대값 적절성을 대조하고 다음 **독립 3개를 직접 실행해 통과**했다(`/tmp/noline-independent-refinement-probe.ts`, `/tmp/noline-independent-refinement-probe.log`). 158개를 검증자가 다시 실행한 결과로 취급하지 않는다.

1. `FAILED`·`IN_PROGRESS`·`PENDING`을 ID 정렬과 다른 삽입 순서로 처리하고 `QUARANTINED`는 제외했다. 빈 제목과 `030.00` 원시 표시값, 큐 원문 보존을 확인했다.
2. 최신 서버 본문이 없는 상태에서 오래된 응답을 받으면 필요한 오류가 발생하고 서버 원본·Local·큐가 보존됐다.
3. 손상 입력의 `keep-local`은 정상 commit되지만, 같은 경로에서 ACK가 실패하면 서버 원본·Local·큐가 모두 rollback됐다.

검증자는 삭제 본문·projection 조건 순서와 서버 원본 upsert 시점도 직접 대조했다. 임시 repository probe는 실행 뒤 제거하고 위 `/tmp`에 근거를 남겼다. Node 메모리 SQLite·Drizzle을 사용했으며 Expo adapter·HTTP·편집 시계 등의 대체가 있다. **native·실제 HTTP·UI 렌더링·앱 종료/재시작은 이번에 확인하지 않았다.**

결과 설명은 Main의 사용자 전달로 이어간다. 3단계는 아직 착수하지 않았으며 전체 Ticket 09·Work·009 개선 완료나 사용자 수락을 뜻하지 않는다. 나중의 루프·피드백은 앞의 사용자 원문과 이번 실제 분리·검증 결과를 함께 근거로 사용할 수 있다.

## 입력 범위

기록 담당은 상속된 Main 대화의 사용자 질문과 직전 개선안 답변, 위 최신 기록·수정 요청을 직접 읽었다. 별도 rollout의 전체 대화 원문을 복원한 결과는 아니다. 13번 기록·Ticket 09·현재 상태, 이번 코드·diff와 158개/독립 3개 결과 로그를 대조했다. 타입 전후와 harness 이전/현재 로그의 동일함도 직접 확인했다. 구현·제품 검사 실행과 별도 검증은 기록 담당의 수행이 아니다. 이번 기록은 과거 기록을 덮지 않고 후속 선택과 향후 피드백 후보를 보존한다.
