# 07 — 일정 생성·수정 입력 생명주기

## 맡은 결과와 범위

일정 생성과 수정에서 화면 진입, 기본값 적용, 장소 선택, picker 확인·취소, 같은 일정 재열기와 다른 일정 전환 때 어떤 값이 초기화되고 보존되는지 한 흐름으로 이해할 수 있게 한다. render 중 form mutation, effect와 `reset`·`setValue` 사이의 중복 책임, picker의 선택과 닫기 callback 혼선을 줄인다.

범위는 `CreateScheduleScreen`, `useCreateScheduleForm`, `UpdateScheduleDrawer`, 일정 form, `DatePicker`, `TimePicker`, 장소 선택 modal과 관련 test다. 저장 성공 뒤 경로 준비는 [09번](09-schedule-route-preparation.md)이 맡으므로 이 Ticket은 submit 직전까지의 입력 의미와 저장 요청 조립만 다룬다.

## 실행 맥락과 접근

현재 생성 화면은 render 중 watched date를 `setValue`하고, form hook은 선택 장소를 effect에서 여러 필드로 복사한다. 장소 제거의 `reset`과 화면의 날짜 재주입도 함께 추적해야 한다. 생성 화면은 picker의 `onClose`를 선택 handler에 연결하고 picker 내부도 선택 뒤 `onClose`를 호출해 확인·취소·닫기 의미가 겹친다. 수정 Drawer는 최초 `defaultValues`와 일정 ID만 보는 effect를 함께 사용하므로 같은 ID의 새 데이터, 닫았다 재열기, 다른 일정 전환의 기준이 분명하지 않다.

좌표 `0`을 누락으로 처리하는 문제와 취소가 현재 값을 다시 선택하는 동작이 제품 결함인지 여부는 가독성 변경에 숨기지 않는다. form 생명주기는 확인된 기존 동작 범위에서 정리할 수 있지만, 값 결과를 바꿔야 하는 부분은 Main이 별도 결함 Work와 기대 UX를 배치한다. 그 결정이 필요한 시나리오에는 변경 후 기대값을 임의로 두지 않는다.

## 완료 조건과 확인 방법

- prefilled date 유무, 장소 선택·제거·재선택, picker 확인·취소, 동일 ID 재열기, 다른 ID 전환, 늦게 도착한 schedule data를 변경 전후 비교한다.
- render 단계에서 form 값을 바꾸지 않고, 초기화·사용자 수정·외부 선택 반영의 Owner가 겹치지 않는다.
- picker 확인은 값을 한 번 반영하고, 단순 닫기·취소는 채택된 UX 계약에 따라 값 변경과 구별된다.
- 저장 요청의 title·location·address·date/time·좌표 조립이 `@repo/schema`와 기존 공개 동작을 유지한다. 좌표나 취소의 결함 판단이 미정이면 그 관련 완료를 열어 둔다.
- hook/component Jest와 관련 정적 검사를 실행하고 mock 기반 결과와 실제 React Native modal 동작의 미확인을 구별한다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 제품 구현과 검증은 시작하지 않았다. picker 취소와 좌표 경계의 기대 동작은 실행 전 별도 결함 판단이 필요할 수 있으며 사용자 수락은 없다.
