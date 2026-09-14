# 10. 로컬 저장과 미전송 작업 보존

## 맡은 결과와 범위

여행·일정·경비의 로컬 변경과 전송 queue 기록이 함께 성공하거나 함께 취소되게 한다. 아직 전송하지 않은 변경을 여행별로 빠짐없이 식별하여 비활성화·로그아웃 등의 정리 판단에 넘긴다.

범위는 withTransaction과 실제 mutation 호출부, CREATE·부분 UPDATE·DELETE의 여행 귀속, PENDING·FAILED·IN_PROGRESS 조회다. 실제 정리 시점은 04, 로그아웃은 02, 재시도 실행은 11가 맡는다. 이 티켓의 결과는 저장·조회 기반이며 모든 데이터 손실 경로의 해결을 뜻하지 않는다.

## 실행 맥락과 접근

[기존 드라이버·queue 실험](../../../records/2026-09-10-02-additional-findings.md)에서 설치 Drizzle의 async callback 완료 전 commit과 queue 실패 후 본 row 잔존, 부분 UPDATE와 FAILED의 조회 누락을 확인했다. [후속 조사](../../../records/2026-09-13-02-major-feature-category-investigation.md)의 정상 메모리 DB 대조군은 이 원자성 결함을 반박하지 않는다.

시작점은 [DB helper](../../../../../../../apps/client/src/shared/db/utils.ts), [queue](../../../../../../../apps/client/src/shared/services/sync/queue.ts)와 이를 호출하는 local mutation이다. 선행 수정 없이 시작할 수 있다. payload에 tripId를 무조건 추가하는 식으로 해법을 고정하지 않고, 삭제 뒤에도 귀속을 잃지 않는 최소 계약을 정한다.

공통 기준은 [기대 동작](../spec/02-behavior-and-cases.md)과 [품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 완료 조건과 확인 방법

- 실제 설치 드라이버 계약을 유지한 시험에서 본 데이터 실패·queue 실패·callback 예외가 모두 rollback되고 성공 시 두 결과가 함께 남는다. tx 밖 쓰기·중첩 호출·동시 저장의 영향도 검사한다.
- tripId 없는 부분 수정, FAILED 생성, IN_PROGRESS, soft delete 후 항목을 올바른 여행의 미전송 작업으로 찾고 다른 여행 작업과 섞지 않는다.
- 원자성을 바꿔 주는 mock만으로 완료하지 않는다. 격리 SQLite와 대표 실제 호출부의 회귀 검증을 남기고 native 저장 경계 확인이 없으면 그 보장 범위를 제한한다.
- 02·04에 넘길 미전송 판정과 실패 전파 계약을 명시한다. 기존 조사 원문은 유지하고 올바른 동작을 검증하는 제품 회귀 테스트를 별도로 만든다.

## 현재 상태와 실제 결과

구성됨, 실행 전. 위 확인 계획을 수행하거나 제품 코드를 수정한 상태가 아니다. 기존 조사 근거는 위에 연결했으며, 실행할 때 현재 코드·환경과 수정 전 조건을 다시 대조한다.
