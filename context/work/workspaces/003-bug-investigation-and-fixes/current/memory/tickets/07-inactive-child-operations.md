# 07. 비활성 여행의 일정·경비 작업

## 맡은 결과와 범위

활성화하지 않은 여행에서도 온라인으로 일정·경비를 생성한 뒤 수정·삭제·상세 조회하고 일정별 경비를 읽을 수 있게 한다. 서버에 존재하는 항목이 로컬에 없다는 이유만으로 요청을 막지 않는다.

화면이 가진 tripId·scheduleId에서 hook·Repository·API까지 이어지는 계약, 일정과 경비의 연결 변경·해제·삭제를 포함한다. 비활성 여행의 오프라인 편집은 추가하지 않는다.

## 실행 맥락과 접근

[첫 사용](../../../records/2026-09-13-01-first-use-scenario-investigation.md)과 [추가 조사](../../../records/2026-09-13-02-major-feature-category-investigation.md)에서 생성 후 수정, 삭제, 일정별 경비 조회가 local row 부재로 remote 호출 전에 실패했다. 활성 여행의 정상 CRUD와 온라인/오프라인 routing 대조군은 보존한다.

[일정 Repository](../../../../../../../apps/client/src/entities/schedule/repository/schedule-repository.ts), [경비 Repository](../../../../../../../apps/client/src/entities/expense/repository/expense-repository.ts), [일정 상세](../../../../../../../apps/client/src/screens/ScheduleDetailScreen.tsx)가 시작점이다. 서버에 이미 존재하는 부모 fixture로 독립 착수할 수 있다. 막 생성한 부모의 전송 시점은 03, 서버 소유권·응답은 13, 조회 실패의 공통 표시 패턴은 01과 연결한다.

공통 기준은 [기대 동작](../spec/02-behavior-and-cases.md)과 [품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 완료 조건과 확인 방법

- local cache가 완전히 없는 비활성 여행에서 일정·경비 생성→수정→상세/목록 재조회→삭제가 실제 격리 API를 통해 동작한다.
- 일정 상세에서 연결된 경비와 통화별 합계를 읽고 연결 변경·해제·일정 삭제 뒤 관계가 기존 계약대로 남는다. 계약이 불명확하면 먼저 명시하고 임의 cascade 삭제를 도입하지 않는다.
- 활성 여행은 계속 local/queue로, 비활성 온라인은 remote로 처리되며 비활성 오프라인은 기존 정책 안내를 제공한다.
- 잘못된 tripId·다른 여행 scheduleId를 넘겨도 다른 데이터에 접근하거나 수정하지 않는다. 13의 서버 거절 계약과 client 호출을 대조한다.
- 실패를 빈 경비 목록으로 숨기지 않는다. 해당 화면의 실제 오류 소비까지 확인하되 공통 오류 표시와 재시도 방식은 01에서 제공한 계약을 사용한다.

## 현재 상태와 실제 결과

구성됨, 실행 전. 위 확인 계획을 수행하거나 제품 코드를 수정한 상태가 아니다. 기존 조사 근거는 위에 연결했으며, 실행할 때 현재 코드·환경과 수정 전 조건을 다시 대조한다.
