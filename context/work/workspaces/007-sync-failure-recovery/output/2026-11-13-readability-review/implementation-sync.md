# sync·정리·계정 표현 구현 결과

배정 범위의 채택을 모두 반영했다. 비교 기준은 Main의 `visual-stage/`이며 기존 작업과 병행 담당 파일을 되돌리지 않았다. 제품·검사 수정은 아래 14파일이고 새 파일·공개 DTO·정책 프레임워크는 만들지 않았다. commit/stage/install/network/app 실행은 하지 않았다.

## 실제 채택

| Finding | 반영 |
| --- | --- |
| F2-02 | confirmed-deletion의 queue 조회~판정~삭제만 private `clearRelatedQueueTasksInTransaction`으로 이동. 삭제 scope와 기존 task context 두 입력이며 holds 정리는 상위에 유지. |
| F2-03 | `applyRemoteLegacyHoldsInTransaction`과 `acknowledgeLegacyHolds`로 수신 transaction/ACK 분리. 수신 schema에서 `z.infer`한 data를 받으며 변경 boolean만 반환. |
| F2-04 | 409는 옵션 이름 외 기존 본문 유지. 410의 최소 guard와 strict parse는 분류 함수에 두고, strict parse 후 귀속 조회~삭제 반영~task 잔존 확인만 private helper로 이동. |
| M3-04 | `hasUnresolvedTripChanges`/`hasUnresolvedTripChangesInTransaction` boolean 계약으로 변경. 합성 HELD 행 제거. cleanup과 비활성화 및 mock을 끝까지 연결. |
| M3-05·E4-03 | `handledTripCount`, 공개 반환 계약에 예외 없이 검사를 마친 수이며 미전송 보호로 유예한 여행도 포함함을 명시. 수와 후처리 조건 동일. |
| M3-08·R5-03 | preserve 두 진입의 반환은 `Promise<void>`. dismissal은 빈 return, 삽입 뒤 notify 후 종료. |
| M3-10 | `SyncIncompleteError.blockedCount`. 계산·문구·throw 위치 동일. 저장소 실제 소비 검색에서 옛 property 소비 없음 확인. |
| M3-11·R5-11·R6-05 | save-submission의 activate fixture만 `Promise<unknown>`. response-freshness의 실제 결과 검사 타입은 유지. |
| M3-13 | preserve의 마지막 boolean만 `{ serverBacked }` 옵션으로 변경. optional id 위치와 내부 `id = generateId()` 평가 시점 유지. engine/direct-update-failure와 reconciliation 호출을 연결. |
| E4-01 | queue-ownership mock에 정상 완료 recoverInterruptedTasks 추가, AuthRequiredError 거절과 getQueueOwner의 task 도달 확인. HTTP/상태쓰기0 유지. |
| E4-04 | `shouldRefreshQueries`로 개명. 대입/실패/finally 순서 동일. |
| E4-05 | `retainAndReadObservedClock`로 개명. 메모리 보존/읽기/직렬화/실패 잔류 순서 동일. |
| E4-06 | 계정 검사 입구에 원문 그대로 영속 격리·후속 판단 실패가 앞선 격리를 rollback하지 않음을 명시. |
| R5-04 | addToSyncQueue는 `Promise<void>`, 미사용 id 반환만 제거. ID 발급/insert 유지. |
| R5-05 | 미사용 단건 hasPendingTask와 설명 제거. |
| R5-06 | 비활성화 transaction은 지도 정리 실행 boolean만 반환. 외부 결과는 tripId/alreadyDeactivated. DB cleanupPending·지도·서버 후처리 순서 유지. |
| R5-07 | checkPendingSync 결과의 failedCount만 제거. stats와 총 보호 수 계산은 유지. |

## 자기 확인

- `visual-stage/`와 실제 diff를 읽어 반환·조건·조회/쓰기·await·예외·진단 순서를 대조했다. queue는 같은 task→schedule→expense→hold 조회 뒤 같은 귀속 조건으로 존재 여부를 판정한다. filter가 some으로 바뀌어 뒤의 순수 payload 판정은 일찍 끝날 수 있지만 조회와 보호 결과는 동일하다. holds가 있어도 기존 조회는 모두 실행한다.
- 문자열의 공백을 제외해 추출 전후 본문이 동일함을 직접 assert했다: confirmed-deletion queue 본문, 410 post-parse 효과 본문, legacy 수신 transaction 본문, legacy ACK 본문 네 곳 모두 일치. 이는 새 helper 조율 자체의 완전 증명과 구별하며 호출/transaction/notify 위치도 별도로 대조했다.
- completedTaskId skip→상태/table→JSON parse→대상/DELETE 근거→개별 CREATE 보호→원본 귀속→payload 귀속→DELETE/저장 가능성→delete 순서 유지.
- legacy 최초 ID snapshot은 HTTP 전, GET/DELETE 404·405 반환은 기존 위치, transaction 후 notify 뒤 ACK, ACK tombstone에 따른 재등장 방지 유지.
- 410 최소 guard의 null과 strict parse 예외가 기존 서로 다른 진단으로 이어지는 경계를 유지. 일반 catch·진단·FAILED 기록/finally는 추출하지 않았다.
- 앱·검사·저장소 실제 참조를 검색해 옛 pending/failedCount/clock/refresh 심벌의 현재 소비 누락이 없음 확인. 과거 보존 자료의 old 이름은 수정하지 않았다.

## 실행 확인

- `node node_modules/jest/bin/jest.js --config apps/client/jest.config.cjs --runInBand apps/client/tests/shared/services/sync apps/client/tests/shared/services/auth apps/client/tests/shared/services/edit-stamp.test.ts`: **23 suite·279 tests 통과**. 원본 `sync-jest.log`.
- 비활성화 인접 `activation-query-refresh.test.ts`: **1 suite·9 tests 통과**. 원본 `sync-activation-jest.log`. 합계 **24 suite·288 tests 통과**.
- client tsc 실행: 담당 파일 오류0. 기존 baseline7오류 외 당시 병행변경 read-query-consumers.test.tsx:520의 undefined→never 오류1을 Main에게 전달. 원본 `sync-typecheck.log`. Main 통합 재확인 대상이다.
- 기존 ESLint 실행은 `prettier.resolveConfig.sync is not a function` 도구 호환 오류로 중단(`sync-lint.log`). Prettier rule만 끈 동일 대상 lint는 오류0, 기존 cleanup `no-void` 경고1(`sync-lint-without-prettier.log`). 도구 설치/설정 변경은 하지 않았다.
- 검사 뒤 변경은 helper 인자/빈 줄과 테스트 호출의 국소 개행, 반환 주석 표현뿐이다. 실행문 변경은 없다.

## 변경 파일

생산:
- apps/client/src/shared/services/sync/engine.ts
- apps/client/src/shared/services/sync/queue.ts
- apps/client/src/shared/services/sync/legacy-holds.ts
- apps/client/src/shared/services/sync/confirmed-deletion.ts
- apps/client/src/shared/services/sync/direct-update-failure.ts
- apps/client/src/shared/services/sync/cleanup-job.ts
- apps/client/src/shared/services/edit-stamp/index.ts
- apps/client/src/shared/services/auth/local-account.ts
- apps/client/src/shared/services/auth/logout-service.ts
- apps/client/src/entities/trip/data/useDeactivateTrip.ts

검사:
- apps/client/tests/shared/services/sync/reconciliation.test.ts
- apps/client/tests/shared/services/sync/cleanup-lifecycle.test.ts
- apps/client/tests/shared/services/sync/save-submission.test.ts
- apps/client/tests/shared/services/sync/queue-ownership.test.ts

## 남은 영향

담당 구현 미완성은 없다. client 타입의 병행 담당 검사 오류 처리와 전 범위 통합 검증·독립 검토는 Main으로 연결한다. 실제 기기 SQLite/서버/Mapbox/Sentry는 새 실행하지 않았으며 기존 회귀의 mock·Node SQLite 증거 범위다. Project/Work 본문은 배정대로 수정하지 않았다. Project data-lifecycle의 현재 사실 표에 `processedCount` 코드명 표기가 남아 현명칭과 다르지만, 표가 설명하는 숫자의 뜻은 동일하다. 문서 수정은 이번 담당 범위 밖으로 남긴다.
