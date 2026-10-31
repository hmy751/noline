# Ticket 03 — 저장·동기화·정리 재구성 결과

2026-10-31, 기준 HEAD `725e6d5` 이후 문서 작업이다. [Project 데이터 수명 본문](../../../../project/guidance/data-lifecycle/INDEX.md)은 Local 저장·queue·push/pull·활성화·비활성화·vacuum·계정 종료를 연결한다. 문서 이관과 제품 안전성 개선을 구별하며 제품 코드는 바꾸지 않았다. 최종 독립 검증 결과는 아래 확인 절에서 관리한다.

## 무엇을 바꾸었는가

이전에는 짧은 활성화 가이드 두 개, 오래된 정리 결정과 앱 실행 본문을 조립해야 했다. 특히 pending이 없는 상태를 미전송 변경 없음으로 읽기 쉬웠고, soft delete와 7일 유예가 동기화 안전을 보장한다는 과거 표현이 남아 있었다.

새 본문은 각 작업에서 먼저 판단할 조건을 제시하고, 저장 → 전송 → 정리의 관계 안에 현재 구현과 공백을 함께 설명한다. Entity 배치·Router 경계·활성화 순서의 유효한 뜻은 유지했다. 표는 상태와 경로 비교에 쓰고, 일반 체크리스트는 해당 작업 조건 가까이 통합했다. 긴 과거 코드·통계·완료 선언은 옮기지 않았다. 인증 상태·종료 실패별 상세는 기존 app-runtime Owner에 유지해 중복을 줄였다. 세 층에 같은 내용을 나누는 구성은 추가 이해 이득이 없어 선택하지 않았다.

[형성 맥락](../../../../project/guidance/data-lifecycle/_background/context.md)과 [근거](../../../../project/guidance/data-lifecycle/_background/evidence.md)에 즉시 해제·원본 보존·공간 회수의 절충과 후속 보완을 담았다. 원자료의 당시 판단과 현재 코드 관찰을 구별한다.

## 현재 사실로 확인한 중요한 차이

| 질문 | 대조 결과와 남은 판단 |
| --- | --- |
| FAILED나 IN_PROGRESS가 있으면 여행 정리가 막히나 | 여행별 조회는 PENDING만 본다. child 부분 UPDATE에는 payload.tripId가 없을 수도 있어 해당 작업을 누락한다. 일반 로그아웃은 세 상태 모두 보류한다. |
| 다시 활성화한 여행은 옛 정리 예약에서 벗어나나 | 기존 activation의 conflict update는 cleanupPending을 해제하지 않고 pending cleanup은 isActivated를 다시 검사하지 않는다. 현재 소스의 위험 경로이며 이번에 실앱 손실을 새로 재현한 것은 아니다. |
| 오래된 삭제 행은 무조건 지우나 | vacuum은 상태와 무관하게 queue가 참조한 원본을 보존한다. pending cleanup 후보가 없으면 vacuum 전에 반환하므로 ‘7일 후 자동 회수’도 일반 보장이 아니다. |
| completed는 pull과 모든 정리의 완료인가 | 엔진 정상 반환을 뜻한다. 활성 여행이 없어 pull을 생략해도 성공 시각을 기록할 수 있다. DB pull checkpoint, 지도·cleanup·화면 완료와 구별해야 한다. |
| pull은 한 번에 원자적으로 반영되나 | 전체 응답 검사는 첫 쓰기 전이지만 upsert 전체는 단일 transaction이 아니다. 미전송 변경과의 충돌 처리, 조회 뒤 serverTime을 만드는 cursor의 동시성 보장은 남아 있다. |

002 Ticket 15의 ‘활성 여행이 없어 pull을 생략해도 completed를 반환하지 않는다’는 문장은 일반화하지 않았다. 실제 인증 결과 검사는 인증 오류가 난 push에 한정되어 있고, 현재 lifecycle의 정상 반환 경로는 다르다. 기존 Work 원문은 역사 자료로 유지하고 현재 Project에 정확한 범위를 반영했다.

## 원본의 의미와 읽기 경로

| 이전 원본 | 현재 의미와 역사 보존판 |
| --- | --- |
| `.claude/context/selective-activation-architecture.md` | Entity 책임·Local transaction·queue·Service 경계를 새 본문으로 통합. [이관 전 원문](../../../../../_archive/selective-activation-pre-project-2026-10-31.md) |
| `.claude/context/activation-system.md` | 활성화 입수·metadata·해제와 정리 조건을 코드에 대조해 통합. [이관 전 원문](../../../../../_archive/activation-system-pre-project-2026-10-31.md) |
| `.claude/decisions/2025-11-20-deactivation-sync-queue-safety.md` | 단계별 삭제의 이유·대안·비용을 형성 자료로 선별. 과거 안전 보장은 현재 차이와 구별. [원문 보존판](../../../../../_archive/deactivation-sync-queue-safety-pre-project-2026-10-31.md) |

세 보존판은 역사 안내만 앞에 추가하고 본문을 유지했다. 옛 위치에는 연결 파일을 남기지 않았다. Project 진입·guidance·제품·구조·app-runtime, client guide, context 색인, transaction rule·guard·sync runbook, command reference와 지도·경로 가이드의 현재 링크를 전환했다. command 예시의 중복 경로와 낡은 줄 번호도 함께 정리했다.

첫 자료 지도는 조사 snapshot의 내용을 유지하고 삭제된 원문 링크만 보존판으로 맞췄다. 이 output의 archive 링크는 조사 재접근 경로이며 현재 제품 설명의 일부가 아니다. 미이관 지도 결정·Data/Service 결정과 종료된 005 등 역사 Work의 원문 링크는 덮어쓰지 않았다. 지도·구조 등 남은 주제의 결정과 전체 읽기 분리는 04–08 범위에 이어진다. `.claude` 전체 제거 또는 006 전체 이관 완료를 뜻하지 않는다.

## 내용 검토와 확인

별도 조사자는 cleanup·계정 종료 코드와 002/003 근거를 대조했다. 개선 검토자는 기존 source·결정·현재 본문·실제 코드와 주변 소비자까지 읽고 현재 구성을 유지하는 편이 적합하다고 판단했다. 검토에서 Soft Delete guard가 sync 조회에도 삭제 행 필터를 일괄 적용하게 읽히는 문제를 찾아 일반 화면 조회와 sync의 삭제 사실 전달을 구별하도록 수정했다. metadata 배지 구현 링크도 추가했다.

직접 실행한 기존 검사:

- Main: sync retry, auth-result, HTTP retry, query-refresh, lifecycle, DB transaction-serialization — 6 suites·27 tests 통과.
- 별도 조사자: Local preservation, cleanup lifecycle, logout-sync, local-access — 4 suites·34 tests 통과.
- Main: temporal-local-contracts — 1 suite·36 tests 통과. Local 반환 검증 실패 rollback, pull·activation schema 검사와 입수·checkpoint의 범위를 포함한다.

합계 11 suites·97 tests이며 서로 다른 대상이다. Main 원본 로그는 `/tmp/noline-006-ticket03-sync-tests.log`, `/tmp/noline-006-ticket03-local-pull-tests.log`에 있다. 임시 로그의 지속 보존을 전제하지 않으며 위 명령 대상은 `apps/client`에서 `node ../../node_modules/jest/bin/jest.js --config jest.config.cjs --runInBand <대상 test 파일>`로 재실행할 수 있다. 조사자의 pnpm 경로는 host 의존성 검사에서 실패했으나 로컬 Jest 직접 실행으로 확인했다. 설치를 추가 수행하지 않았다.

Node 메모리 SQLite·Drizzle SQL, mock HTTP·native 경계의 검사다. 여행별 세 상태 정리 안전, 재활성화 실앱 손실, 실제 PostgreSQL 동시 cursor, 기기 저장 내구성·강제 종료 복구를 입증하지 않는다. 테스트 통과를 확인한 공백의 해소로 쓰지 않는다.

`git diff --check`와 변경 문서의 코드 예시 밖 파일·앵커 링크를 확인했다. default 001, session-bound 002와 명시적 006의 Recover가 성공했다. 이 live consumer들의 선택 문서 경로는 유지됐고 수정된 Project 진입·제품·구조를 통해 새 Owner를 찾는다. Recover는 제품 검증이 아니다.

전체 `node scripts/check-harness.mjs`는 24건의 역사 링크 오류로 실패했다. 직전 알려진 16건에 옛 활성화 문서를 참조하는 결정 3건·종료된 005의 5건이 더해졌다. 현재 변경 본문의 링크 검사와 구별하며, 통과시키기 위해 옛 정본·호환 파일을 되살리거나 원문 기록을 최신화하지 않았다.

최종 독립 검증자는 구현·개선 검토와 다른 새 세션에서 Spec·Ticket·원자료·현재 본문·코드를 대조했다. 저장부터 종료까지의 설명, 미전송 보호 차이, 유효한 이유·비용 보존, 대표 질문의 답과 진입, 옛 정본 제거에 충족 근거가 있다고 반환했다. archive 세 본문이 안내문을 제외하면 HEAD 원문과 동일함도 확인했다. Main의 7 suites·63 tests 로그와 주요 검사 본문은 직접 확인했으며, 별도 조사자의 34 tests는 원본을 직접 확인하지 않아 그 검증자의 독립 확인 수치에는 합산하지 않았다. 제품 공백은 그대로 남고 이번 문서 범위의 이관·검토·확인을 완료한 것으로 판단한다.

## 권장 후속 작업

문서 이관의 다음 주제는 예정 04의 오프라인 지도·경로다. 여기서 데이터 활성화 완료, 지도 pack과 경로 준비·만료·재시도의 차이를 이어 확인한다.

제품 개선은 별도 범위로 두되 우선순위는 **여행별 미전송 판정과 재활성화 정리 보호**를 먼저 권한다. 실패·진행 중·귀속 불명 작업 보존, 검사와 쓰기 사이의 경합, 재활성화 예약 취소를 함께 다루어야 한다. 이어 cleanup 실제 결과·지도 부분 실패와 처리 수, IN_PROGRESS 재개, pull 충돌·cursor 정책을 분리해 검증한다. 이 권고를 이번 문서 작업에서 코드로 구현하거나 새 제품 정책으로 확정하지 않았다.
