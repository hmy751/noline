# 11 — 경비 생성·수정 입력 생명주기

## 맡은 결과와 범위

경비 생성·수정 form에서 여행과 기본 통화가 도착하는 시점, 사용자의 통화 변경, 날짜와 연결 일정 선택, Drawer 재진입이 form baseline과 사용자 입력에 미치는 영향을 직접 이해할 수 있게 한다. 생성과 수정이 공유하는 입력 의미는 한 기준으로 읽히게 하고, loading·오류 표시·화면 구성처럼 필요한 차이는 남긴다.

범위는 `useCreateExpenseForm`, 생성 form과 screen, `UpdateExpenseDrawer`, 관련 schema·query consumer와 test다. [10번](10-schedule-form-lifecycle.md)의 form 생명주기 원칙을 대조할 수 있지만 서로 다른 feature의 동작을 하나의 범용 abstraction으로 합치는 것은 요구하지 않는다. 저장 요청 조립까지의 입력은 여기서, 성공 뒤 callback·화면 이동의 연결은 [13번](13-schedule-route-preparation.md)에서 확인한다.

## 실행 맥락과 접근

현재 생성 form의 기본 통화는 비동기 trip query에서 계산되지만 `useForm.defaultValues`는 최초 생성 시점에만 적용된다. 수정 Drawer도 ID 기준 effect의 여러 `setValue`로 값을 복원한다. 생성과 수정에는 선택 날짜의 일정 필터·표시가 반복되며, 날짜 변경 뒤 기존 `scheduleId`가 새 목록에 없어도 남을 수 있다.

늦은 기본 통화와 사용자 수정 보존은 [003-06](../../../../003-bug-investigation-and-fixes/current/memory/tickets/06-form-state-and-defaults.md)이 맡는다. USD 초기값 뒤 JPY 여행 정보가 도착해도 USD가 유지되는 조건은 이미 분리 재현됐고, 사용자 선택은 늦은 기본값으로 덮지 않는 기대가 정의돼 있다. 같은 ID 재열기 전체가 결함인 것은 아니므로 실제 부모의 unmount·선택 해제까지 확인한다.

날짜 변경 뒤 무효해진 `scheduleId` 처리의 구체 UX는 아직 열려 있다. 연결 변경·해제의 저장 계약을 맡는 [003-07](../../../../003-bug-investigation-and-fixes/current/memory/tickets/07-inactive-child-operations.md)과 대조하고 Main이 입력 측 담당·기대를 확정한다. 구조 정리는 독립 착수할 수 있지만 기대값이 정해지지 않은 시나리오를 관성적으로 보존하거나 기본값으로 숨긴 채 완료하지 않는다.

## 완료 조건과 확인 방법

- trip data가 즉시 또는 늦게 도착하는 경우, 사용자가 통화를 바꾼 뒤 query가 갱신되는 경우, 같은/다른 expense 재열기, 취소·재열기를 비교한다.
- 날짜 변경 전후의 일정 목록과 `scheduleId`가 항상 설명 가능한 상태이며, 무효 연결의 처리 기준이 schema와 submit 결과에 반영된다.
- 초기 baseline 적용, 외부 데이터 갱신, 사용자 수정 보존과 submit 조립 책임이 한 흐름에서 읽히고 생성·수정의 실제 공통점과 차이가 드러난다.
- 관련 hook/component Jest, 정적 검사와 client typecheck를 실행한다. query mock 결과를 실제 화면·네트워크 검증으로 확대하지 않는다.

## 현재 상태와 실제 결과

기존 08을 11로 옮겼으며 제품 코드·test는 변경하지 않았다. 늦은 통화는 003-06의 재현·담당 결과를 사용하고, 무효 연결 일정의 입력 UX는 Main의 조율이 남아 있다. 구현·검증·사용자 수락은 없다.
