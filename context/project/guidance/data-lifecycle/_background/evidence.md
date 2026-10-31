# 데이터 보존 선택의 근거와 현재 관찰

[본문](../INDEX.md)과 [형성 맥락](context.md)의 근거다. 2026-10-31 저장소 HEAD `725e6d5`의 원자료·코드를 대조했다. 아래 식별자는 판본을 찾는 조사 정보이며 옛 제품 문서를 일반 읽기로 연결하는 경로가 아니다. 과거 결정의 완료 표시는 현재 제품 검증으로 승격하지 않는다.

## 정리를 늦추는 선택

2025-11-20 `deactivation-sync-queue-safety` 결정은 우선순위를 다음과 같이 적었다.

> 데이터 안전성
> 사용자 경험 - 즉시 비활성화 (대기 없음)
> 저장 공간 효율 - 7일 후 자동 회수

당시 비교는 즉시 hard delete의 손실 위험, soft delete만 유지하는 저장 부담, 동기화 대기의 오프라인 무한 대기를 이유로 단계별 정리를 선택했다. 현재에도 유지하는 뜻은 비활성화·전송·사본 삭제를 분리하고 변경을 보존한다는 것이다. ‘7일 후 자동 회수’와 ‘sync 완료 보장’은 현재 실행 계기·queue 상태 보호가 입증한 범위보다 강해 그대로 옮기지 않았다. 원래 변경 식별자는 `f0b5039`다.

## 후속 보완과 남은 차이

002의 Local transaction·sync·미전송 정리 작업은 원자성, 재시도·결과, 계정 종료·vacuum을 구분했다. 16의 현재 결과에는 다음 두 사실이 나란히 남아 있다.

> 오래된 삭제 row도 sync_queue가 참조하면 vacuum에서 보존한다.

> 여행별 미전송 조회와 deactivation·cleanup은 아직 PENDING 중심이다.

이번 대조에서도 [queue](../../../../../apps/client/src/shared/services/sync/queue.ts)는 PENDING·payload.tripId로 여행을 찾고, [cleanup](../../../../../apps/client/src/shared/services/sync/cleanup-job.ts)의 vacuum은 상태와 무관한 원본 참조를 보호한다. 003의 재활성화·Local write 조사에 기록된 위험은 [활성화](../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)의 conflict update와 cleanup의 활성 재검사 부재에서도 남아 있다. 과거 재현과 현재 소스 대조를 합쳐 이번에 실제 손실을 새로 재현했다고 주장하지 않는다.

002의 sync 결과 설명 중 ‘활성 여행이 없어 pull이 생략되는 경우에도 completed를 반환하지 않는다’는 문장은 현재 코드에 일반화할 수 없다. 실제 [인증 결과 검사](../../../../../apps/client/tests/shared/services/sync/auth-result.test.ts)는 **인증 오류로 push가 중단된 경우**를 확인한다. [lifecycle](../../../../../apps/client/src/shared/services/sync/lifecycle.ts)은 정상 반환한 sync를 completed로 처리하므로 본문은 pull checkpoint와 실행 성공 시각을 구별한다. 과거 Work 원문은 그대로 보존한다.

## 확인 범위

Local mutation과 queue의 같은 transaction, FIFO 앞부분 선택·재시도 한도, 인증 중단, 전체 pull schema 검사와 순차 upsert, 조회 뒤 serverTime 생성은 각 실제 코드에서 대조했다. 실제 SQLite 검사와 mock HTTP·cleanup 검사는 해당 경계의 보존·제어 흐름 근거다. 기기 저장 내구성, 프로세스 강제 종료 복구, 서버 동시 쓰기 중 cursor 무누락이나 모든 여행 정리의 안전은 이 대조로 확인되지 않는다.

문서 재구성은 기존 보존 약속을 지우거나 새 충돌 정책을 선택하는 작업이 아니다. 현재 지원과 차이는 본문에서 사용 조건 가까이 설명하고, 실제 개선은 그 계약과 사용 경로에 대한 별도 구현·검증을 요구한다.
