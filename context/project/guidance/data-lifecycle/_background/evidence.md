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

2026-10-31 판본의 [queue](../../../../../apps/client/src/shared/services/sync/queue.ts)는 PENDING·payload.tripId로 여행을 찾고, [cleanup](../../../../../apps/client/src/shared/services/sync/cleanup-job.ts)의 vacuum은 상태와 무관한 원본 참조를 보호한다. 003의 재활성화·Local write 조사에 기록된 위험은 [활성화](../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)의 conflict update와 cleanup의 활성 재검사 부재로 당시에도 남아 있었다.

이후 007에서 미전송 세 상태와 보류 입력을 여행별 정리에 반영했다. 보류 해제는 다음 정리를 허용한다. 해제한 채 두면 예약을 실행할 수 있고, 그 전에 다시 활성화하면 사용자가 보관하기로 한 새 사본을 보호해야 한다. 빌드 16에는 003-04의 옛 예약 취소·삭제 직전 재확인과 003-05의 같은 도시 지도 보유자 확인이 각각 반영됐다. 후자는 A의 사본이 실제로 정리돼도 B가 보유한 지도를 남기는 범위다. [007의 사본 보호 근거](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-14-04-trip-list-and-cleanup-isolated-commits.md) · [003의 두 수정과 확인 범위](../../../../work/workspaces/003-bug-investigation-and-fixes/records/2026-11-14-01-reactivation-and-shared-city-map-fixes.md)

002의 sync 결과 설명 중 ‘활성 여행이 없어 pull이 생략되는 경우에도 completed를 반환하지 않는다’는 문장은 현재 코드에 일반화할 수 없다. 실제 [인증 결과 검사](../../../../../apps/client/tests/shared/services/sync/auth-result.test.ts)는 **인증 오류로 push가 중단된 경우**를 확인한다. [lifecycle](../../../../../apps/client/src/shared/services/sync/lifecycle.ts)은 정상 반환한 sync를 completed로 처리하므로 본문은 pull checkpoint와 실행 성공 시각을 구별한다. 과거 Work 원문은 그대로 보존한다.

## 2026-10-31 판본의 확인 범위

Local mutation과 queue의 같은 transaction, FIFO 앞부분 선택·재시도 한도, 인증 중단, 전체 pull schema 검사와 순차 upsert, 조회 뒤 serverTime 생성은 각 실제 코드에서 대조했다. 실제 SQLite 검사와 mock HTTP·cleanup 검사는 해당 경계의 보존·제어 흐름 근거다. 기기 저장 내구성, 프로세스 강제 종료 복구, 서버 동시 쓰기 중 cursor 무누락이나 모든 여행 정리의 안전은 이 대조로 확인되지 않는다.

## 재시도 한도 제거와 중단 전송 회복의 근거

Workspace 007에서 재시도 한도를 바꾼 근거는 다음과 같다.

- **사고 관찰:** 시뮬레이터 개발 앱의 queue 맨 앞에 FAILED·retryCount 3인 경비 CREATE가 있었고 서버 DB에는 같은 ID의 행이 1초 뒤 생성돼 있었다. 실패 3번은 큐 등록 뒤 약 57초 안에 쌓였다. 시각별 사실과 원인의 확인 범위는 [관찰 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-02-01-simulator-sync-block-observation.md)에 있다.
- **대안 비교:** 재시도·IN_PROGRESS 되돌림·폐기·큐 구조의 전체 비교표와 기각 이유는 [설계 판단 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-03-01-sync-failure-design-decisions.md#주제별-선택지-비교)에 있다.
- **구현과 검사 (2026-11-03):** 앱 변경은 커밋 `437cc5c7`, 서버 응답은 `ba91d1a3`이다. [queue 재시도 검사](../../../../../apps/client/tests/shared/services/sync/retry.test.ts)가 "FAILED는 횟수와 관계없이 선택, IN_PROGRESS는 되돌리기 전까지 막음"을 고정한다. 구현에 참여하지 않은 검증자가 완료 조건을 확인했다([구현 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-03-03-stage-one-implementation.md)).
- **실제 앱 확인 (2026-11-03):** 위 막힌 DB에 IN_PROGRESS 일정 하나를 더해 시뮬레이터에서 실행했다. 첫 sync에서 세 작업이 200으로 끝나고 pull이 돌았으며 서버 행은 중복되지 않았다. 약 4분 동안 sync 시작은 1번이었고 홈으로 보냈다 돌아와도 늘지 않았다. 이 관찰은 연결이 안정적인 환경에서 숨은 반복 실행이 없다는 것만 보여 준다. 실제 사용의 시작 횟수와 10-31의 "1분 안에 3번"의 원인은 확인하지 못했다([실제 앱 확인 기록](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-03-05-stage-one-real-app-verification.md)).

간격 재시도를 처음에는 "두지 않음"으로 결론 냈다가, 빈도를 아직 모른다는 사용자 지적으로 같은 날 "보류"로 정정했다. 사용자의 질문은 다음과 같았다.

> "근데 빈도는 여전히 염두해두어야 하는거 아닌가? 지금은 괜찮았다 할지라도 아직 정확히 모르잖아"

## 개발 앱에서 확인한 재전송과 보류 복구

2026-11-14 iOS 시뮬레이터의 개발 앱을 실제 SQLite·로컬 API·전용 PostgreSQL에 연결했다. 서버가 경비 수정을 처리한 뒤 응답만 유실시키자 실패한 요청이 기기에 남았고 재전송 뒤 큐가 비었다. 기기의 미전송 금액과 다른 요청에서 바꾼 분류가 함께 남았으며, 응답 처리 중 새로 저장한 금액도 보존됐다. 구버전 요청을 보류한 뒤 화면에서 분류만 골라 복구했고, 앱을 다시 열어도 선택한 분류와 기존 금액이 유지됐다. 서버에서 삭제한 경비의 수정은 종결됐고 바로 뒤 경비는 정상 생성됐다.

다른 기기의 편집은 API 요청으로, 오프라인은 감지 상태 주입 또는 로컬 API 중단으로 재현했다. 개발 앱에 구버전 요청 형식을 넣어 확인한 범위이며 실제 설치본 교체, 물리 기기의 망 단절, 출시 빌드 실행은 각각 별도 확인이 필요하다. [실행 조건과 관찰값](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-14-07-simulator-sync-recovery-validation.md)

별도의 빌드 15 실기기 영상에서는 새 앱을 처음 오프라인으로 열었을 때 수정된 일정과 경비가 보였다. 온라인 복귀 뒤 같은 값이 운영 DB에도 있었다. 영상에 구버전에서 수정하거나 앱을 업데이트하는 과정은 없었고, 기기 큐의 소진과 충돌한 원문의 선택 복구도 관찰되지 않았다. 이 결과는 충돌 없이 반영되는 설치 경로의 일부를 뒷받침한다. [실기기 영상과 운영 조회 대조](../../../../work/workspaces/007-sync-failure-recovery/records/2026-11-14-06-production-release-in-progress.md)
