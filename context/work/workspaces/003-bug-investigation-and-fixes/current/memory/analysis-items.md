# 버그 확인·수정 후보 전체

원래 의심을 새 발견으로 중복 집계하지 않고, 기존 분석에서 출발했는지·추가 확인으로 근거가 강화됐는지·새 조건을 찾았는지 함께 적는다.

아래는 실행 Ticket 목록이나 모든 항목을 무조건 변경하라는 결정이 아니다. 원래 관찰·현재 근거·검증 필요 여부를 보존한 후보이며, 채택할 때 해당 원문과 현재 코드를 직접 확인한다.

## local 저장·queue 기록의 원자성

withTransaction은 async callback의 완료보다 먼저 commit하는 설치 드라이버 경로를 사용한다. 분리 실험에서 queue 기록 실패 후 본 데이터 1개가 남았고 동기 tx 대조군은 rollback했다. 실제 mutation 호출부와 중첩·오류 전파를 포함해 수정 범위를 정한다.

근거 수준과 경계: 기존 의심 항목을 추가 실험으로 강화. 분리 실험 재현, 실제 앱 전체 실패 재현은 미수행.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/verification.md), [대표 코드](../../../../../../apps/client/src/shared/db/utils.ts).

## 여행별 미전송 수정 누락·정리 조건

getPendingTasksForTrip은 PENDING만 읽고 payload.tripId로 소속을 판단한다. 부분 UPDATE에는 tripId가 없어 PENDING 수정과 FAILED 생성이 반환에서 빠지는 것을 재현했다. FAILED·IN_PROGRESS·지연 cleanup·비활성화의 보존 조건을 함께 본다.

근거 수준과 경계: 기존 상태 필터 관찰 + 부분 UPDATE 누락 추가 발견·분리 실험. 실제 데이터 손실 재현은 아님.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/shared/services/sync/queue.ts).

## 동기화 결과·재시도·중단 복구

push의 일반 실패·인증 실패 처리와 정상 반환, Provider의 마지막 완료 시각이 실제 전체 반영과 구별되지 않는다. _retry가 첫 시도 뒤 재진입을 막아 _retryCount 최대 3회와 충돌한다. FAILED 재처리·앱 중단 후 IN_PROGRESS 복구 경로의 충분성도 확인한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 실제 오류·중단·재연결 시나리오 검증 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/shared/services/sync/engine.ts).

## pull의 시간 경계·로컬 충돌

조회 뒤 만든 serverTime이 조회 중 발생한 변경을 다음 pull에서 누락시키는지 확인한다. query schema import와 직접 query 처리 차이, 내려온 row의 upsert가 아직 미전송인 local 변경과 충돌하는 조건도 확인한다.

근거 수준과 경계: 기존 시간 경계 과제 + 미전송 local upsert 조건 추가 관찰. 동시 쓰기·충돌 재현과 기대 정책 확인 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/verification.md), [대표 코드](../../../../../../apps/server/src/routes/sync.ts).

## 장소 변경 후 경로 최신성

일정 수정의 후속 계산이 이전 schedules에서 시간만 교체하고 좌표는 그대로 사용한다. 공통 다운로드는 일정 ID와 profile만으로 기존 route를 판단하므로 함수 통합만 하면 변경 좌표 재계산을 건너뛸 수 있다. 일정 순서·삭제·중복과 500ms 대기도 확인한다.

근거 수준과 경계: 기존 후속 처리·중복 관찰 + 오래된 좌표와 routeExists 조건 추가 발견. 코드 확인, 전체 경로 재현 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx).

## 좌표 0·누락·null

선택 장소·저장 요청·서버 String 변환·경로 필터의 truthy 조건이 유효한 좌표 0을 없음으로 취급한다. 지도/장소 검색 bias도 같은 조건이 있는지 범위를 확인한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 입력부터 저장·응답·경로까지 경계별 재현 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/code-style.md), [대표 코드](../../../../../../apps/client/src/entities/route/data/useAutoDownloadRoutes.ts).

## 비활성 여행의 local 선행 의존

일정·경비 수정/삭제와 일정별 경비 조회는 Router 호출 전 local에서 tripId를 구한다. local row가 없는 비활성 여행의 온라인 작업이 서버에 도달하는지 확인한다. UI가 이미 아는 tripId를 계약으로 전달할 수 있는지 검토한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 실제 화면·준비 상태를 포함한 재현 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/entities/expense/repository/expense-repository.ts).

## 서버 소유권·삭제 조건

GET /trips/:tripId/schedules는 인증 뒤 tripId만 조회하며 다른 경로의 userId·deletedAt 조건이 없다. 일정·경비 생성의 부모 tripId/scheduleId 소유권 확인도 부족한 경로가 있다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 조회 조건 결함 확인, 실제 사용자 데이터 API 호출은 미수행.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/server-contracts.md), [대표 코드](../../../../../../apps/server/src/routes/trips.ts).

## 활성화·CRUD·sync 응답 계약

경비 CRUD와 sync pull에 있는 hasReceipt 정수→boolean, date 문자열 변환 일부가 활성화 응답에 없다. validatedExpenses 이름과 실제 Zod 검증도 다르다. 데이터별 응답 경계와 client 검증을 함께 확인한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 실제 활성화 영향 재현 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/server-contracts.md), [대표 코드](../../../../../../apps/server/src/routes/expenses.ts).

## 허용된 여행 수정 필드 미반영

여행 수정 schema가 latitude·longitude·cityId를 허용하지만 PUT 처리에서 해당 필드를 꺼내거나 저장하지 않고 성공 응답한다. 누락·미전달·유효 값의 의미를 구별해 확인한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 허용 입력/처리 불일치 확인.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/server-contracts.md), [대표 코드](../../../../../../apps/server/src/routes/trips.ts).

## 초기화 실패·준비 신호·지연 cleanup

DB·인증 초기화 실패도 finally에서 isAppReady로 이어지고 cleanup 일부는 준비 신호 대신 2초 지연을 사용한다. 필수 실패와 계속 진행 가능한 실패, 실패 화면·재시도·정리 실행 조건을 확인한다.

근거 수준과 경계: 기존 분석. 실제 시작 실패 화면과 기대 정책 확인 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/app/_layout.tsx).

## 폼 재진입·비동기 초기값·오류 화면

같은 ID 재열기, 취소 후 재진입, 늦게 도착한 trip 통화, picker onClose의 값 선택, 조회/저장 실패 표시 차이가 실제 잘못된 입력·표시를 만드는지 확인한다. 정상 UX 선택인 차이는 리팩토링 대상으로 유지한다.

근거 수준과 경계: 기존 분석 + 기본 통화/동일 ID 재진입 추가 관찰. 전체를 확정 버그로 보지 않는다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/components.md), [대표 코드](../../../../../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts).

## 활성화·지도·경로 완료와 부분 실패

활성화의 데이터 반영과 백그라운드 지도·경로 준비가 다른 시점에 끝나며 ready는 지도 여부를 본다. 준비 완료 표시, 경로 다운로드 실패, 후속 작업 실패가 사용자에게 어떤 결과를 주는지 확인한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 완료 용어의 가독성 문제와 실제 기능 결함을 구별.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts).

## 오류 응답 소비와 재시도 판단

auth·CRUD helper·최종 middleware의 오류 형태가 서로 다르다. 호출자가 실제로 메시지나 오류 종류를 놓쳐 표시·재시도를 잘못하는지 확인한다. 내부 책임 정리만 필요한 차이는 리팩토링에 남긴다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 불일치 자체로 모든 경로의 기능 결함을 확정하지 않는다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/server-contracts.md), [대표 코드](../../../../../../apps/server/src/middleware/errorHandler.ts).
