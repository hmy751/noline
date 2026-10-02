# 08 — 날짜 범위·그룹·대표 여행 계산

## 맡은 결과와 범위

일정·경비 화면의 여행 날짜 범위와 날짜별 그룹, 대표 여행 선택에서 날짜를 만드는 기준과 반복 계산을 가까운 코드에서 이해할 수 있게 한다. 같은 여행 기간을 두 화면이 서로 다른 방식으로 다시 만들거나 매 render 새 배열을 useMemo dependency로 넘기는 부담을 줄이고, 대표 여행의 우선순위는 유지하면서 반복 Date 변환을 정리한다.

범위는 `ScheduleScreen`, `ExpensesScreen`, `selectMainTrip`, `shared/lib/datetime.ts`의 관련 날짜 계산과 test다. `datetime.ts`에서는 입력 `Date` 직접 변경, offset 예제와 실제 반환, 미래 상대시간 설명과 실제 분기를 각각 확인해 유지·정리·별도 결함 중 하나로 판정한다. 서로 다른 결과를 억지로 하나의 범용 함수로 합치지 않고, 공통 날짜 경계와 각 consumer의 정렬·표시 책임을 구별한다. Schedule response의 ISO 생산 방식은 [05번](05-schedule-response.md)을 변경하지 않고 입력 계약으로만 사용한다.

## 실행 맥락과 접근

최초 조사에서는 두 화면이 start/end로 date range를 각각 만들고 매 render 새 배열을 생성했다. 2026-10-02 시간 작업에서 공통 UTC 일자 순회 helper와 memoized 소비로 정리했으므로 이 부분을 다시 미구현으로 다루지 않는다. 그룹 계산은 이 배열을 dependency로 사용해 memoized 계산을 다시 수행한다. 범위 생성의 UTC ISO date와 그룹에 쓰는 local date 변환도 함께 확인해야 한다. `selectMainTrip`은 진행 중·미래·과거·날짜 없음의 우선순위가 이미 읽히지만 filter와 sort에서 같은 날짜를 반복 변환한다. 추가 조사에서는 `datetime.ts`가 받은 `Date`에 직접 시간을 설정하는 부작용, offset 설명과 UTC ISO 반환, 미래 상대시간 설명과 실제 결과도 구별할 후보로 남겼다.

UTC/local 경계와 기간 밖 항목 접근은 [003-08](../../../../003-bug-investigation-and-fixes/current/memory/tickets/08-date-and-range-consistency.md)이 맡으며, 로스앤젤레스 날짜 이동과 기간 밖 일정 누락은 분리 재현 근거가 있다. 이 Ticket은 채택된 날짜 의미를 계산·그룹 consumer에 일관되게 전달하는 구조를 맡고 잘못된 날짜를 정상 보존값으로 고정하지 않는다. 미래 상대시간·입력 Date mutation이 단순 표현인지 동작 수정인지와 날짜 없는 여행 정책은 호출부·fixture를 보고 판단하며, 추가 수정 담당이 필요하면 Main이 정한다.

대표 여행의 순수 계산은 이 Ticket에 유지한다. [06번](06-app-startup-lifecycle.md)이 맡는 초기 선택의 적용 시점, [003-03](../../../../003-bug-investigation-and-fixes/current/memory/tickets/03-trip-management.md)이 맡는 사용자 선택 보존과는 다르다. 계산 특성화는 독립 착수할 수 있지만 기대 날짜 의미가 미정인 시나리오는 완료로 닫지 않는다.

## 완료 조건과 확인 방법

- 시간대 경계, 단일 날짜, 시작·종료 동일, 기간 밖 일정·경비, 빈 범위, 대표 여행 후보의 날짜 동률과 날짜 없는 입력을 변경 전후 비교한다.
- 두 화면은 같은 날짜 경계를 사용하고 memoized 그룹 계산은 실제 start/end/records 변화에 반응한다.
- 일정 날짜 순서, 경비의 기간 밖 그룹 위치와 대표 여행의 진행 중→미래→과거→날짜 없음 우선순위를 보존한다.
- 날짜 변환과 정렬 기준의 이름·타입이 실제 의미를 드러내며 새 helper를 따라가는 비용이 기존 반복보다 크지 않다.
- `datetime.ts`의 입력 mutation, offset 예제, 미래 상대시간 후보는 각각 실제 호출부와 fixture를 확인해 유지·개선·별도 결함으로 판정하고 근거를 남긴다.
- pure function Jest와 관련 projection test, 정적 검사를 실행하고 실제 기기 timezone 미확인을 구별한다.

## 현재 상태와 실제 결과

기존 10을 08로 옮긴 뒤 Ticket 06의 시간 후속 `4646752`·`d823b41`에서 Expense date-only, 일정 현지 날짜/시각 결합, Date 입력 비변경, DST 누락 시각 거부, 두 화면의 공통 UTC 날짜 범위를 선행 적용했다. Main은 시간 변경만 분리한 client 512개와 LA 시간대 132개 통과를 확인했다. [세션 기록](../../../records/2026-10-02-03-expense-time-decisions-and-verification.md)과 Project 날짜 기준을 재사용한다.

대표 여행 계산·미래 상대시간·날짜 없는 여행·기간 밖 일정 접근과 모든 grouping 의미의 대조는 남는다. Trip 날짜의 장기 domain 의미를 새로 정하지 않았으며 실제 기기 시간대/DST 검증이나 Ticket 전체 수락은 아니다.
