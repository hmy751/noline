# 리팩토링 후보 전체

기존 분석의 코드 표현·처리 방식 관찰에 추가로 확인한 폼·저장 결과·공통 구현의 조건을 합쳤다. 작은 요소부터 선택하며, 실제 결과가 바뀌는 부분은 버그 확인·수정과 구별한다.

아래는 실행 Ticket 목록이나 모든 항목을 무조건 변경하라는 결정이 아니다. 원래 관찰·현재 근거·검증 필요 여부를 보존한 후보이며, 채택할 때 해당 원문과 현재 코드를 직접 확인한다.

## 이름·주석·로그·catch

단순 API 처리에 조회 로그·오류 출력 후 재전파·코드 내용을 반복하는 주석이 겹친다. 함수 의도가 보이게 정리하고 기록할 오류의 책임을 확인한다. DELETE payload의 tripId처럼 이유를 설명하는 주석은 보존한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 오류 전달과 표시 변화는 별도 판정.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/code-style.md), [대표 코드](../../../../../../apps/client/src/entities/expense/api/expenses.ts).

## 조건식과 표시 규칙

경비 화면의 첫 통화 비교와 소수 자릿수 규칙이 JSX 안에 반복된다. 의미 있는 이름과 작은 계산으로 의도를 드러낸다. outsideTripRange/insideTripRange는 보존할 기존 예시다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 통화별 금액·정렬·표시 결과 보존.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/code-style.md), [대표 코드](../../../../../../apps/client/src/screens/ExpensesScreen.tsx).

## 불필요한 값 변환과 기본값

number를 String 후 parseFloat로 되돌리는 표현, 미전달·null·빈 문자열의 의미를 흐리는 기본값을 확인한다. 좌표 0이 사라지는 동작 수정은 버그 Work에 분리한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. ||를 일괄 교체하지 않는다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/code-style.md), [대표 코드](../../../../../../apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts).

## 타입으로 이어지는 검증 결과

normalizedTrips as never[], updateData: any, return updated!의 근거를 드러낸다. DB·API 경계에서 형태, 수정 가능 필드, 결과 존재를 확인한 사실을 이후 처리까지 전달한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 단언 제거만 완료 기준으로 삼지 않는다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/code-style.md), [대표 코드](../../../../../../apps/client/src/shared/services/sync/engine.ts).

## 중복 검증과 도달하지 않는 분기

목록의 entity를 검증한 뒤 같은 배열 응답을 다시 검증하는 처리, null을 허용하지 않는 여행 수정 schema 뒤의 null 분기를 검토한다. 요청과 응답 각각의 검증은 다른 경계다.

근거 수준과 경계: 기존 분석. 허용 입력·오류 계약을 유지하는 정리와 계약 변경을 구별.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/code-style.md), [대표 코드](../../../../../../apps/server/src/routes/trips.ts).

## 목록 계산과 useMemo

일정·경비 화면의 dateRange 배열이 매 렌더 새로 생성돼 useMemo가 계산을 재사용하지 못한다. 날짜별 그룹 계산과 반복되는 범위 생성을 읽기 쉽게 정리한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 성능 장애나 최적화 효과를 측정한 것은 아니다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/code-style.md), [대표 코드](../../../../../../apps/client/src/screens/ScheduleScreen.tsx).

## 폼 초기값·reset·값 변경 흐름

렌더 중 setValue, 장소 선택을 effect로 복사, 수정 Drawer의 ID 기준 초기화가 흩어져 있다. 취소·재열기·다른 항목·늦게 도착한 trip 데이터에 따른 기본 통화를 추적하기 쉽게 한다.

근거 수준과 경계: 기존 분석 + 비동기 기본 통화·동일 ID 재진입 추가 관찰. 의도 UX와 실제 영향 확인이 필요.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/components.md), [대표 코드](../../../../../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts).

## picker callback 의미

선택 후 onClose 호출, onClose에 선택 handler 연결로 값 저장·검증·닫기가 겹친다. 각각의 책임과 이름을 맞춘다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 닫기·취소 결과가 달라지면 버그 확인 대상으로 분리.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/components.md), [대표 코드](../../../../../../apps/client/src/shared/components/TimePicker/TimePicker.tsx).

## 저장 성공 이후 처리

여행·경비·일정 생성의 이동 책임과 일정 수정의 후속 경로 준비가 다르다. 저장 결과, 캐시 반영, 이동, 백그라운드 준비의 책임을 읽을 수 있게 한다. 500ms 타이머의 필요는 먼저 확인한다.

근거 수준과 경계: 기존 분석 + 저장된 결과 활용·오래된 좌표 확인. 타이머·좌표 결과 변경은 동작 수정.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/components.md), [대표 코드](../../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx).

## 생성·수정 컴포넌트의 반복과 차이

수정 Drawer에 조회·입력·저장·알림이 모여 있다. 경비의 연결 일정 선택, 공용 Input과 원시 TextInput 스타일, 날짜 그룹·메뉴 상태를 비교한다. 의도 UX는 보존하며 실제 공유 의미만 묶는다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 조회 정책·오류·loading 차이의 실제 영향은 버그 후보에도 남긴다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/components.md), [대표 코드](../../../../../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx).

## 공통 데이터·경로·정리 구현

활성화와 일정 변경의 경로 다운로드, 활성화와 sync의 upsert, 즉시 비활성화와 지연 cleanup을 비교한다. 같은 생명주기 규칙을 수정할 위치를 줄이되 기존 경로 판별과 미전송 보존 조건의 차이를 먼저 해소한다.

근거 수준과 경계: 기존 분석 + 일정 ID/이동 수단만 보는 routeExists의 재계산 위험. 함수 호출로 단순 통일하면 안 된다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/shared/services/directions/route-downloader.ts).

## 완료 상태와 조율 책임 표현

활성화 hook의 서버·여러 테이블·이전 활성 해제·지도·경로·캐시 조율, online이라는 비활성 상태 이름, 지도만 보는 ready를 구별한다. 동기화 실행 종료·전체 반영·정리 가능 상태도 이름과 반환 의미를 분명히 한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 완료/실패 의미 자체를 바꾸는 수정은 버그 Work.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/shared/services/offline-prep/metadata.ts).

## 설정과 실제 사용처

policy syncStrategy의 선언과 동기화 실행 사용처가 이어지는지 판단한다. 공통 함수가 두 곳에서 사용된다는 주석도 실제 호출과 대조한다. 미사용 설정을 실제 기능 보장처럼 남기지 않는다.

근거 수준과 경계: 기존 분석. 미사용이라는 이유만으로 계획 기능 구현이나 삭제를 자동 결정하지 않는다.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/engine-data.md), [대표 코드](../../../../../../apps/client/src/shared/policy/constants.ts).

## 서버 변환·오류 처리 책임

CRUD·활성화·sync의 데이터 변환과 auth·helper·middleware의 오류 변환 위치를 읽기 쉽게 한다. 좌표·날짜·불리언과 오류 형태의 공유 계약은 실제 소비자와 확인한다.

근거 수준과 경계: 기존 분석·추가 코드 확인. 누락 필드·소유권·응답 불일치는 버그 Work, 공개 오류 계약 변경은 별도 기대 동작 확인.

출처: [보존한 분석의 해당 영역](../../source/codebase-analysis/server-contracts.md), [대표 코드](../../../../../../apps/server/src/utils/http-errors.ts).
