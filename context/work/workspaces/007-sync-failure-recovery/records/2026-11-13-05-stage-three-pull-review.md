# 3단계 조회 범위·사본 수명 검토와 checkpoint 진입 정리

사용자가 “그래 그럼 그 기준 적용해서 3단계 진행하자”라고 요청해 [Ticket 09](../current/memory/tickets/09-staged-code-review-and-refinement.md)의 3단계를 진행했다. Main은 핵심 선택의 검토와 한정 정리·자기 확인·**최신 결과의 독립 검증을 완료**로 판정했다. 코드와 선택 이유의 사용자 설명은 이번 최종 응답으로 이어진다. 4단계와 전체 Ticket 완료, 커밋·배포로 확대하지 않는다.

## 기존 워크플로에 더해 적용한 판단

사용자는 2단계를 시작할 때 정한 1단계 판단은 그대로 두고, 2단계 진행 중 새로 생긴 기록을 다시 판단하라고 요청했다. Main이 기존 기준을 재검토하거나 3단계 검사 계획으로만 답하자 적용 범위를 바로잡았다. 이 선택을 가르는 원문은 다음과 같다.

> 아니 2단계 진행할때 결정한 1단계 판단들은 일단 두고 2단계 진행하면서 새로 생긴 기록 잇잖아? 그걸 판단해보라고 다시

> 마무리 피드백은 됐고 어쨋든 그정도 반영해서 하자 그럼 어떻게 할건지 다시 설명해봐

> 제대로 읽어봐 1단계 에서 판단을 워크플로에 적용햇엇짢아? 기록 다시 봐봐

[1단계 실행 합의](2026-11-12-12-workflow-application-agreement.md)는 유지한다. 요구·Project·공식 문서·설치본·실제 소비자·기존 유틸·Personal을 같은 선택에 연결하고, 첫 구현 품질·독립 검토·Main의 채택 책임·요구 기반 검증·설명 뒤 영향 추적을 계속 적용한다. 여기에 아래 2단계 판단을 **기존 역할과 판단 시점**에 더했다. 별도 상설 담당·고정 체크리스트·스킬·Personal·Project 규칙 변경은 아니다.

| 판단 시점 | 이번에 더해 적용한 내용 |
| --- | --- |
| Main의 범위 설정·배정 | 구체적 상황과 보존할 결과를 요구에서 잡는다. 현재 코드의 모든 분기를 보존 요구로 취하지 않고 필요한 호출자는 함께 본다. |
| 구현의 첫 선택 | 처리의 필요성과 현재 표현의 적절성을 별도로 판단한다. 본문에서 판단·저장 효과의 경계를 읽을 수 있는지, 분리가 탐색 부담을 옮기기만 하는지, 같은 모양의 처리가 실제 같은 책임인지 본다. |
| 독립 검토와 Main의 채택 | 구현자의 선택을 별도로 비교한다. 동작 필요성으로 구조까지 정당화하지 않으며, Main이 근거·효과·비용을 대조해 채택한다. |
| 요구 충족 검증 | 구체적인 보존 사례를 실제 사용 경로·실패 조건에 연결한다. 현재 분기나 새 helper를 그대로 재현한 검사를 구조 유지의 근거로 삼지 않는다. |
| 설명·정정 | 사건이 처리를 시작하는 조건, 반영 권한과 변경 범위를 실제 코드와 연결한다. 바뀐 전제는 영향받는 코드·타입·검사·설명으로 추적한다. 고정 설명 순서를 새로 정하지 않는다. |

사용자가 제외한 마무리 피드백은 이번 추가 적용 범위에서 뺐다. 앞선 [2단계 판단 기록](2026-11-13-04-stage-two-judgment-and-handoff.md)의 모든 해석을 승인한 것으로 소급하지 않는다.

## 보존할 결과와 유지한 선택

| 실제 상황 | 필요한 결과와 유지한 선택 |
| --- | --- |
| pull snapshot 전에 또는 도중에 열린 쓰기가 뒤늦게 commit | 다음 조회가 아직 끝나지 않은 쓰기의 ID 하한부터 겹치게 한다. 오래된 updatedAt을 가진 생성·수정·삭제도 놓치지 않는다. |
| 기다리는 동안 같은 여행을 비활성화·정리하거나 다시 활성화 | 요청 당시와 현재 준비 ID가 같은 자식 본문만 반영한다. 같은 여행 ID·같은 시각만으로 새 사본과 옛 사본을 같다고 보지 않는다. |
| 같은 계정이 재인증되거나 세션이 바뀜 | 사용자 ID와 별도로 세션을 확인한다. 활성화의 반환 직전 검사도 transaction 안에 유지해 변경을 함께 되돌린다. |
| 옛 응답에 자기 여행 메타데이터나 확정 삭제가 포함 | 살아 있는 자식 본문과 달리 처리한다. 전체 응답 폐기로 삭제 증거를 잃거나 전체 반영으로 정리한 사본이 되살아나지 않게 한다. |
| 데이터 적용 또는 checkpoint 쓰기 실패 | 본문·수락 서버 판본·cursor·수신 시각을 같은 SQLite transaction에서 되돌린다. |
| 여행 삭제 반영이 활성 상태를 제거 | checkpoint 직전 준비 상태를 다시 읽는다. 응답 반영 전 확인과 다른 시점의 보장이므로 중복으로 제거하지 않는다. |

Main과 독립 개선 검토자는 snapshot/XID 방식, 준비 ID, metadata·삭제와 자식 본문 구분, 같은 transaction의 checkpoint를 유지하는 것이 적절하다고 판단했다. `pullChanges`를 단계별 helper로 전면 분해하는 안은 세션 guard·준비 Map·현재 조회·checkpoint 조건을 넘기는 추가 계약과 탐색 비용에 비해 이득이 분명하지 않아 채택하지 않았다. 서버 특수 SQL도 경계·fallback·조회가 가까이 있어 선택 이유를 따라갈 수 있는 현행을 유지했다.

기술 근거는 PostgreSQL 14의 [snapshot 함수](https://www.postgresql.org/docs/14/functions-info.html#FUNCTIONS-PG-SNAPSHOT), [행 xmin과 32비트 ID](https://www.postgresql.org/docs/14/ddl-system-columns.html), [Repeatable Read](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-REPEATABLE-READ), [Drizzle transaction 설정](https://orm.drizzle.team/docs/transactions)이다. Main은 서버 설치 Drizzle 0.29.5·postgres 3.4.7과 client Drizzle 0.30.10·expo-sqlite 14.0.6을 대조했다. 서버 adapter는 callback 전 transaction 설정을 적용한다. client Expo adapter는 비동기 callback을 기다리지 않고 commit하므로 기존 DB 실행기가 async 완료를 기다리는 경계도 유지했다. 공식 근거는 새 보호를 덧붙이는 명분이 아니라 현재 보장의 담당과 조건을 판단하는 입력으로 사용했다.

## 실제 정리와 범위

시작 HEAD는 **9f3e87f2**이며 이 세션에서 2단계 완료 기록 7개를 커밋한 결과다. 마지막 제품 분리 커밋은 **44d2a5ef**다. 이번 변경은 기존 미커밋 전체가 아닌 다음 **제품 2파일·검사 3파일**의 추가 정리다. 시작 사본은 `/tmp/noline-stage3-current-before`, delta는 `/tmp/noline-stage3-refinement.patch`에 있다.

- [storage.ts](../../../../../apps/client/src/shared/services/sync/storage.ts): production에서 쓰지 않는 `getLastSyncedAt`·`setLastSyncedAt`·`clearLastSyncedAt`, fixture만 쓰던 `setPullCheckpoint` wrapper를 제거했다. 공개 진입을 cursor 조회와 기존 transaction 안 checkpoint 저장으로 좁혔다. 마지막 수신 시각의 실제 저장은 유지한다. cursor 형식은 공유 `syncPullQuerySchema`의 필드 검증을 재사용해 중복 정규식을 없앴다.
- [engine.ts](../../../../../apps/client/src/shared/services/sync/engine.ts): Trip 행이 아닌 준비 식별자 목록을 `activePreparations`·`readActivePreparations`로 표현하고 요청·검증·반영 구간의 개행을 정리했다. 이미 optional인 cursor의 불필요한 `?? undefined`를 제거했다. 수신 정책·처리 순서는 바꾸지 않았다.
- [response-freshness](../../../../../apps/client/tests/shared/services/sync/response-freshness.test.ts) fixture는 자기 transaction에서 실제 checkpoint 진입을 호출한다. [auth-result](../../../../../apps/client/tests/shared/services/sync/auth-result.test.ts)의 제거된 함수 mock도 정리했다.
- [PostgreSQL cursor 검사](../../../../../apps/server/tests/integration/pull-cursor.test.ts)는 쓰기 ID를 조회 전·도중에 받은 두 조건과 오래된 변경 시각을 검증하도록 보완했다. 기존 서버 구현과 활성화 hook은 수정하지 않았다.

공개 진입을 줄인 것은 숨겨진 실행 결함을 발견했다는 뜻이 아니다. 본문과 checkpoint를 함께 확정한다는 현재 계약보다 넓게 남아 있던 사용법을 정리해 다음 변경에서 알아야 할 책임을 줄인 것이다.

## 확인 결과와 남은 범위

Main 자기 확인은 관련 client **4묶음 92/92**, 서버 응답 계약 **2파일 24/24**, 실제 PostgreSQL **2/2** 통과다. 변경 client lint는 오류 0·기존 async assertion 경고 3이며 formatter 4파일은 통과했다. client 타입은 수정 전후 로그가 같은 기존 오류 7개이고 서버 타입 검사는 통과했다. 시작판 client 2묶음 81개와 최신 92개를 합산하지 않는다. 서버 응답 검사의 첫 실행은 local listen 권한 오류였고, 권한을 갖춘 재실행에서 통과했으며 제품 실패로 분류하지 않는다.

독립 검증자는 요구·현재 코드·기존 assertion과 Main 로그를 대조하고, 별도 client **19/19**와 실제 PostgreSQL **1/1**을 실행해 통과했다. 충족 근거가 충분하고 미충족 계약을 발견하지 않았다고 반환했다.

- cursor의 계정 격리·활성 여행 집합의 순서/중복 정규화·범위 변경, 손상 JSON·잘못된 cursor·cursor 없는 이전 응답에서 전체 조회로 돌아가는 조건을 확인했다. `lastSyncedAt`를 새 앱의 조회 대체 기준으로 보내지 않는 것도 확인했다.
- pull 반영 도중 계정 또는 같은 계정의 세션이 바뀌면 본문·수락 서버 원본·checkpoint가 함께 rollback되는 별도 조건을 실행했다.
- 실제 PostgreSQL에서는 소유 여행 metadata, 요청한 활성 여행 자식, tombstone, 자식 범위 없는 조회, 이전 앱의 timestamp 요청, 미래·0 cursor와 잘못된 cursor의 응답을 확인했다.
- Main의 지연 수신·정리·재활성화·삭제·checkpoint 실패 검사와 PostgreSQL의 열린 쓰기 두 조건은 실제 코드와 assertion을 대조해 재사용했다. 독립 검사 수를 같은 회귀의 재실행 수와 섞지 않는다.

Main 근거는 `/tmp/noline-stage3-after-tests.log`, `/tmp/noline-stage3-server-contracts.log`, `/tmp/noline-stage3-pg-tests.log`, `/tmp/noline-stage3-lint.log`, `/tmp/noline-stage3-types-before.log`·`-after.log`, `/tmp/noline-stage3-server-types.log`다. 독립 원본은 `/tmp/noline-stage3-independent-client-probe.test.ts`·`-pg-probe.test.ts`와 `/tmp/noline-stage3-independent-client.log`·`-pg.log`다. 기록 담당자는 검사 요약과 핵심 assertion, 실제 변경·사용자 원문을 직접 대조했으며 제품 검사를 재실행하지 않았다. 첫 독립 probe에서 기대 오류 하위형을 잘못 정한 부분은 실제 요구의 오류 메시지·상태 보존 기준으로 바로잡았으며 제품 회귀로 기록하지 않는다.

client 검사는 Node SQLite·대체된 외부 경계이고 서버 검사는 분리된 PostgreSQL 14 DB를 사용했다. native Expo·UI·실제 client↔server HTTP 연결·앱 종료/재시작·운영 서버·배포는 이번에 확인하지 않았다. 실제 XID wrap/freeze의 장기 실행도 재현하지 않았으며, 변경하지 않은 알고리즘의 공식 모델 대조와 현재 실행 근거의 범위를 구별한다. 선행 native 결과를 이번 판본의 재실행으로 확대하지 않는다.

Main은 독립 검증 뒤 이번 단계의 한정 검토·정리·검증 완료를 판정했다. 임시 테스트 DB·container·network는 제거했고 기존 개발 DB는 건드리지 않았다. 시작 시 보존한 88개 기존 변경·미추적 파일 중 이번 소유 파일 4개 외 내용은 같으며, 원래 clean이던 auth-result가 다섯 번째 변경이다. 이번 제품 변경은 미커밋이다. 3단계 결과 설명 뒤 다음은 **4단계 전송·서버 판정**이며 아직 착수하지 않았다. 사용자 수락·전체 Ticket 완료·커밋·push·배포를 선언하지 않는다.

## 입력과 기록 범위

기록 담당자는 상속된 현재 대화에서 현황 파악 요청, 2단계 기록 커밋, 2단계 새 판단 재검토와 범위 정정, 워크플로 적용 설명·승인, 3단계 착수 이후 최초 기록 호출까지를 읽고, 뒤이어 Main이 전달한 최종 검증·정리 결과와 그 원본 로그를 추가 대조했다. Main의 로컬 rollout 경로·식별자는 확인되지 않아 지어내지 않는다. 대화에 포함된 개선 검토 반환과 실제 검사 로그를 직접 읽었으며, 과거 1단계 대화 전체를 새로 복원하거나 2단계 해석의 효과를 일반적으로 입증한 것으로 기록하지 않는다.
