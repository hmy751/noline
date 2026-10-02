# 11 — 경비 생성·수정 입력 생명주기

## 맡은 결과와 범위

경비 생성·수정 form에서 여행과 기본 통화가 도착하는 시점, 사용자의 통화 변경, 날짜와 연결 일정 선택, Drawer 재진입이 form baseline과 사용자 입력에 미치는 영향을 직접 이해할 수 있게 한다. 생성과 수정이 공유하는 입력 의미는 한 기준으로 읽히게 하고, loading·오류 표시·화면 구성처럼 필요한 차이는 남긴다.

범위는 `useCreateExpenseForm`, 생성 form과 screen, `UpdateExpenseDrawer`, 관련 schema·query consumer와 test다. [10번](10-schedule-form-lifecycle.md)의 form 생명주기 원칙을 대조할 수 있지만 서로 다른 feature의 동작을 하나의 범용 abstraction으로 합치는 것은 요구하지 않는다. 저장 요청 조립까지의 입력은 여기서, 성공 뒤 callback·화면 이동의 연결은 [13번](13-schedule-route-preparation.md)에서 확인한다.

## 실행 맥락과 접근

현재 생성 form의 기본 통화는 비동기 trip query에서 계산되지만 `useForm.defaultValues`는 최초 생성 시점에만 적용된다. 최초 조사에서는 수정 Drawer의 여러 setValue와 날짜별 일정 필터가 겹쳤다. 현재는 아래 선행 작업에서 reset 기반 입력 복원과 공통 일정 선택을 적용했고, 날짜 변경 뒤 연결을 유지하는 것이 채택된 정상 동작이다.

늦은 기본 통화와 사용자 수정 보존은 [003-06](../../../../003-bug-investigation-and-fixes/current/memory/tickets/06-form-state-and-defaults.md)이 맡는다. USD 초기값 뒤 JPY 여행 정보가 도착해도 USD가 유지되는 조건은 이미 분리 재현됐고, 사용자 선택은 늦은 기본값으로 덮지 않는 기대가 정의돼 있다. 같은 ID 재열기 전체가 결함인 것은 아니므로 실제 부모의 unmount·선택 해제까지 확인한다.

날짜가 달라졌다는 이유만으로 scheduleId가 무효가 되는 것은 아니다. 사용자는 같은 여행의 모든 날짜 일정 연결과 명시적 해제를 채택했다. 일정 삭제·권한 변경·다른 여행 ID처럼 실제 연결 무효의 조건은 [003-07](../../../../003-bug-investigation-and-fixes/current/memory/tickets/07-inactive-child-operations.md)의 저장 경계와 별도로 대조한다.

## 완료 조건과 확인 방법

- trip data가 즉시 또는 늦게 도착하는 경우, 사용자가 통화를 바꾼 뒤 query가 갱신되는 경우, 같은/다른 expense 재열기, 취소·재열기를 비교한다.
- 날짜 변경 전후의 일정 목록과 `scheduleId`가 항상 설명 가능한 상태이며, 무효 연결의 처리 기준이 schema와 submit 결과에 반영된다.
- 초기 baseline 적용, 외부 데이터 갱신, 사용자 수정 보존과 submit 조립 책임이 한 흐름에서 읽히고 생성·수정의 실제 공통점과 차이가 드러난다.
- 관련 hook/component Jest, 정적 검사와 client typecheck를 실행한다. query mock 결과를 실제 화면·네트워크 검증으로 확대하지 않는다.

## 현재 상태와 실제 결과

Ticket 06에서 날짜 계약 `4646752`와 경비 초안·일정 연결 `a8e60a7`을 선행 적용했다. 생성·수정의 단일 초안, 모든 날짜 일정 후보·해제, 네트워크 제한 중 기존 입력/연결 설명 보존, submit 오류와 명시적 재시도를 공유 책임으로 정리했다. 수정 폼의 날짜는 실제 변경 때만 전송하며 성공 후 baseline을 갱신한다. [세션 기록](../../../records/2026-10-02-03-expense-time-decisions-and-verification.md)에 사용자 선택과 client 523개 검사·제한적 실앱 검증을 보존했다.

늦게 도착한 여행 기본 통화와 사용자가 수정한 통화의 관계는 이번에 고치지 않았다. 같은/다른 expense 재열기·취소·외부 데이터 갱신 전체 조합, 실제 무효 연결·서버 ownership은 남는다. 날짜 차이를 연결 오류로 되돌리거나 이 선행 조각을 Ticket 전체 수락으로 해석하지 않는다.
