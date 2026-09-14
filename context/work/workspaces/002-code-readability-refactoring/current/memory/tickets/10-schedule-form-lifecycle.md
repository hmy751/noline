# 10 — 일정 생성·수정 입력 생명주기

## 맡은 결과와 범위

일정 생성과 수정에서 화면 진입, 기본값 적용, 장소 선택, picker 확인·취소, 같은 일정 재열기와 다른 일정 전환 때 어떤 값이 초기화되고 보존되는지 한 흐름으로 이해할 수 있게 한다. render 중 form mutation, effect와 `reset`·`setValue` 사이의 중복 책임, picker의 선택과 닫기 callback 혼선을 줄인다.

범위는 `CreateScheduleScreen`, `useCreateScheduleForm`, `UpdateScheduleDrawer`, 일정 form, `DatePicker`, `TimePicker`, 장소 선택 modal과 관련 test다. 저장 성공 뒤 경로 준비는 [13번](13-schedule-route-preparation.md)이 맡으므로 이 Ticket은 submit 직전까지의 입력 의미와 저장 요청 조립만 다룬다.

## 실행 맥락과 접근

현재 생성 화면은 render 중 watched date를 `setValue`하고, form hook은 선택 장소를 effect에서 여러 필드로 복사한다. 장소 제거의 `reset`과 화면의 날짜 재주입도 함께 추적해야 한다. 생성 화면은 picker의 `onClose`를 선택 handler에 연결하고 picker 내부도 선택 뒤 `onClose`를 호출해 확인·취소·닫기 의미가 겹친다. 수정 Drawer는 최초 `defaultValues`와 일정 ID만 보는 effect를 함께 사용하므로 같은 ID의 새 데이터, 닫았다 재열기, 다른 일정 전환의 기준이 분명하지 않다.

기본값·picker·재진입의 동작 판단은 [003-06](../../../../003-bug-investigation-and-fixes/current/memory/tickets/06-form-state-and-defaults.md), 좌표 `0`과 누락의 구분은 [003-09](../../../../003-bug-investigation-and-fixes/current/memory/tickets/09-map-search-route-behavior.md)이 맡는다. 003 조사에는 Drawer 부모가 닫을 때 선택값을 null로 만드는 정상 근거가 있으므로 같은 ID 재열기를 일괄 결함으로 전제하지 않는다. 실제 부모·picker까지 연결해 확인한다.

form 생명주기의 구조 정리는 독립 착수할 수 있지만, 값 결과를 바꿔야 하는 조건은 해당 003 결과나 명시적 추가 권한을 사용한다. 기대 UX가 미정인 취소·재진입 조건을 임의의 reset 규칙으로 숨겨 완료하지 않는다. 저장 오류의 표시·복구는 003-01, 저장된 결과의 경로 준비는 13과 연결하며 이 Ticket이 함께 완료했다고 하지 않는다.

## 완료 조건과 확인 방법

- prefilled date 유무, 장소 선택·제거·재선택, picker 확인·취소, 동일 ID 재열기, 다른 ID 전환, 늦게 도착한 schedule data를 변경 전후 비교한다.
- render 단계에서 form 값을 바꾸지 않고, 초기화·사용자 수정·외부 선택 반영의 Owner가 겹치지 않는다.
- picker 확인은 값을 한 번 반영하고, 단순 닫기·취소는 채택된 UX 계약에 따라 값 변경과 구별된다.
- 저장 요청의 title·location·address·date/time·좌표 조립이 `@repo/schema`와 기존 공개 동작을 유지한다. 좌표나 취소의 결함 판단이 미정이면 그 관련 완료를 열어 둔다.
- hook/component Jest와 관련 정적 검사를 실행하고 mock 기반 결과와 실제 React Native modal 동작의 미확인을 구별한다.

## 현재 상태와 실제 결과

기존 07을 10으로 옮겼으며 제품 구현·검증·수락은 없다. 003-06·09의 담당 관계와 정상 재열기 근거를 반영했다. picker 취소 등 미확정 UX는 실행 전에 확인한다.
