# 10 — 일정 생성·수정 입력 생명주기

## 맡은 결과와 범위

일정 생성과 수정에서 화면 진입, 기본값 적용, 장소 선택, picker 확인·취소, 같은 일정 재열기와 다른 일정 전환 때 어떤 값이 초기화되고 보존되는지 한 흐름으로 이해할 수 있게 한다. render 중 form mutation, effect와 `reset`·`setValue` 사이의 중복 책임, picker의 선택과 닫기 callback 혼선을 줄인다.

범위는 `CreateScheduleScreen`, `useCreateScheduleForm`, `UpdateScheduleDrawer`, 일정 form, `DatePicker`, `TimePicker`, 장소 선택 modal과 관련 test다. 저장 성공 뒤 경로 준비는 [13번](13-schedule-route-preparation.md)이 맡으므로 이 Ticket은 submit 직전까지의 입력 의미와 저장 요청 조립만 다룬다.

## 실행 맥락과 접근

최초 조사 당시 생성 화면은 render 중 watched date를 `setValue`하고, form hook은 선택 장소를 effect에서 여러 필드로 복사한다. 장소 제거의 `reset`과 화면의 날짜 재주입도 함께 추적해야 한다. 생성 화면은 picker의 `onClose`를 선택 handler에 연결하고 picker 내부도 선택 뒤 `onClose`를 호출해 확인·취소·닫기 의미가 겹친다. 수정 Drawer는 최초 `defaultValues`와 일정 ID만 보는 effect를 함께 사용하므로 같은 ID의 새 데이터, 닫았다 재열기, 다른 일정 전환의 기준이 분명하지 않다.

기본값·picker·재진입의 동작 판단은 [003-06](../../../../003-bug-investigation-and-fixes/current/memory/tickets/06-form-state-and-defaults.md), 좌표 `0`과 누락의 구분은 [003-09](../../../../003-bug-investigation-and-fixes/current/memory/tickets/09-map-search-route-behavior.md)이 맡는다. 003 조사에는 Drawer 부모가 닫을 때 선택값을 null로 만드는 정상 근거가 있으므로 같은 ID 재열기를 일괄 결함으로 전제하지 않는다. 실제 부모·picker까지 연결해 확인한다.

form 생명주기의 구조 정리는 독립 착수할 수 있지만, 값 결과를 바꿔야 하는 조건은 해당 003 결과나 명시적 추가 권한을 사용한다. 기대 UX가 미정인 취소·재진입 조건을 임의의 reset 규칙으로 숨겨 완료하지 않는다. 저장 오류의 표시·복구는 003-01, 저장된 결과의 경로 준비는 13과 연결하며 이 Ticket이 함께 완료했다고 하지 않는다.

## 완료 조건과 확인 방법

- prefilled date 유무, 장소 선택·제거·재선택, picker 확인·취소, 동일 ID 재열기, 다른 ID 전환, 늦게 도착한 schedule data를 변경 전후 비교한다.
- render 단계에서 form 값을 바꾸지 않고, 초기화·사용자 수정·외부 선택 반영의 Owner가 겹치지 않는다.
- picker 확인은 값을 한 번 반영하고, 단순 닫기·취소는 채택된 UX 계약에 따라 값 변경과 구별된다.
- 저장 요청의 title·location·address·date/time·좌표 조립이 `@repo/schema`와 기존 공개 동작을 유지한다. 좌표나 취소의 결함 판단이 미정이면 그 관련 완료를 열어 둔다.
- hook/component Jest와 관련 정적 검사를 실행하고 mock 기반 결과와 실제 React Native modal 동작의 미확인을 구별한다.

## 현재 상태와 실제 결과

Ticket 06에서 `78acff5`로 일정 생성의 단일 초안·장소 선택/검색 책임을 먼저 정리했다. 시간 후속 `d823b41`은 생성·수정의 날짜/시각 검사, 실제 시각 변경만 전송, 성공 후 baseline 갱신을 적용했다. 위 최초 조사에서 언급한 render·초기값·장소 책임은 현재 결과를 기준으로 다시 대조하며 처음부터 같은 수정을 반복하지 않는다. [세션 기록](../../../records/2026-10-02-03-expense-time-decisions-and-verification.md)이 커밋과 검증 한계를 연결한다.

이 조각만으로 picker 확인/취소·동일/다른 ID 재열기·늦은 데이터의 모든 조합이나 native modal을 완료하지 않는다. 003-06·09와 정상 재열기 근거는 유지하고 남은 시나리오를 확인한다. Ticket 전체 수락은 남는다.

### 현재 값 연결·중앙 휠·TimeField 결과

기존 보고서의 날짜 9/30→달력 10월, 시간 09:00→목록 00부터 표시 문제를 수정했다. `09b07f8`은 TimePicker의 중앙 고정 휠과 선택 세션 수명을, `3ab8f55`는 DatePicker의 현재 날짜·재열기와 TimeField의 폼 연결을 저장했다.

TimePicker는 RHF와 독립적으로 열린 동안 시·분 초안을 소유하고 확인할 때만 값을 전달한다. TimeField가 useController로 현재 값·오류를 구독하고 열기·닫기·확인 시 setValue를 소유한다. ScheduleForm과 UpdateScheduleDrawer에 적용해 화면·훅에 분산됐던 시간 선택 연결을 제거했다. 기존 shouldValidate와 dirty/touched 의미는 유지한다. 같은 폼의 reset은 열린 초안을 덮지 않으며, 다른 일정 ID 또는 바깥 Drawer 닫기는 key를 통해 선택 세션을 폐기한다.

DatePicker는 소비자의 현재 날짜로 달력과 선택 표시를 초기화한다. 날짜 선택은 기존 즉시 적용이며 하단 확인은 닫기다. 시간의 확인/취소와 날짜 동작을 같은 계약으로 강제하지 않았다. TimePicker API 개명과 별도 TimeWheel 분리는 수행하지 않았고 현재 범위의 필수 후속으로 채택하지 않았다.

최종 client 전체 60 suites / 650 tests가 통과했고 독립 리뷰의 미해결 지적은 없었다. 실제 useForm·picker 연결, 검증 오류 표시/해제, dirty/touched, 외부 reset·닫기·재열기와 다른 일정 전환을 검사했다. iOS에서는 날짜 초기 달·재열기, 시간 임시 선택 취소, 휠 이동·중앙 정렬, 생성·수정의 확인·재열기를 단계별로 관찰했다. 새 휠의 23:59는 자동 검사만 통과했으며 Android native는 미확인이다. client 타입 검사의 기존 7개 진단은 남는다.

이 결과는 이번 picker 범위의 완료다. 늦은 schedule data·장소·전체 폼 초기화 조합과 저장 요청의 나머지 책임은 앞선 결과와 대조해 남은 범위를 판단한다. Ticket 전체 수락으로 확대하지 않는다. 설계 선택, 리뷰 보완과 검증 단계별 차이는 [구현·검증 기록](../../../records/2026-10-06-02-picker-wheel-time-field-and-remaining-scope.md)에서 읽는다.
