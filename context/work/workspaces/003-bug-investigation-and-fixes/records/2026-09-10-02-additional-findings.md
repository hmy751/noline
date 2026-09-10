# 추가 조사에서 확인한 내용과 증명 범위

2026-09-10 같은 session에서 제품을 변경하지 않고 수행한 코드 조사·분리 실험을 이어받았다. 기존 분석이 이미 제시한 의심과 이번에 추가 확인한 조건을 구별한다. 원자료는 [실험 스크립트](../source/2026-09-10-isolation-probes.cjs.txt), [출력](../source/2026-09-10-isolation-probes-output.txt), [출처·해시](../source/provenance.json)다. 이번 Workspace 생성 중 실험을 다시 실행한 것은 아니다.

## Transaction

설치된 drizzle-orm 0.30.10의 Expo SQLite transaction은 callback을 호출한 반환값을 기다리지 않고 commit한다. 현재 withTransaction은 async callback을 넘기며 여러 local 저장 함수는 전역 db를 사용한다. 분리 실험의 SQL 순서는 begin → commit → 본 데이터 insert → 실패하는 queue insert였다. queue 오류 뒤 본 데이터 1개가 남았다. 같은 메모리 연결에서 동기 tx.run 대조군은 begin → insert → 실패 → rollback 순서였고 본 데이터는 0개였다.

이는 현재 helper와 설치 드라이버 조합의 원자성 결함을 뒷받침한다. 실제 Expo 기기·앱 mutation 전체·중첩 트랜잭션·사용자 데이터 손실 사고를 재현한 것은 아니다. 수정 시에는 실제 호출부와 실패 조건에 맞는 회귀 확인이 필요하다.

## 여행별 미전송 작업

실제 getPendingTasksForTrip 함수를 추출해 메모리 sync_queue에서 실행했다. PENDING UPDATE `{title: 'Edited'}`와 FAILED CREATE `{tripId: 'trip-1'}`가 있는 상태에서 반환은 빈 배열이었다. PENDING CREATE에 tripId가 있는 대조군은 1개가 반환됐다. 일정·경비 local update는 변경 필드만 enqueue하고 큐 함수가 tripId를 보충하지 않는 코드를 확인했다.

PENDING 상태만 조회하는 기존 문제뿐 아니라 부분 UPDATE의 여행 식별 누락이 추가 확인됐다. 실제 비활성화·지연 cleanup이 이 helper 결과에 의존하지만, 이 실험은 해당 전체 동작이나 실제 데이터 손실을 실행하지 않았다. IN_PROGRESS 제외는 소스 조건으로 확인한 것이며 위 실험의 직접 입력은 아니었다.

## 경로 계산과 다른 추가 조건

일정 수정의 onSuccess는 이전 schedules 목록에서 변경한 일정의 scheduledAt만 교체하며 latitude/longitude는 기존 값을 사용한다. 별도 공통 다운로드 함수는 from/to 일정 ID와 profile로 기존 route를 판단해 같은 ID의 장소 변경을 충분히 구별하지 못할 수 있다. 함수만 합치는 리팩토링은 재계산을 더 건너뛸 수 있어 좌표·순서·삭제·최신성의 기대 동작을 먼저 정해야 한다. 전체 지도 경로 UI는 실행하지 않았다.

비활성 여행의 local 선행 조회, server ownership·응답 변환·허용 수정 필드, 동기화 결과와 재시도 충돌은 기존 관찰을 코드에서 재확인했다. 늦게 도착하는 trip 기본 통화, 같은 ID Drawer 재열기, FAILED/IN_PROGRESS 중단 복구, pull과 local 미전송 변경의 충돌은 추가 확인 후보로 남겼다. 실제 UX나 데이터 영향이 아직 확인되지 않은 내용을 확정 장애로 서술하지 않는다.
