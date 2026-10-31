# 선택창의 확인과 폼 저장을 구별한다

**언제 쓰나:** 날짜·시간 picker와 RHF adapter의 열기·선택·확인·닫기·reset을 바꿀 때 읽는다. 공통 기준은 [작성 기준](INDEX.md), 저장할 날짜 의미는 [날짜와 시각](../../common/date-and-time.md)을 따른다.

**핵심 기준:** 날짜 탭의 즉시 반영과 시간 확인의 확정은 다른 현재 동작이다. 두 선택창을 같은 형태로 보인다는 이유만으로 일괄 통일하지 않는다.

| 동작 | DatePicker | TimePicker + TimeField |
| --- | --- | --- |
| 열기 | 현재 폼 날짜의 달과 선택 표시로 시작 | 현재 폼 시각에서 임시 시·분 선택 시작 |
| 선택 | 날짜 탭이 소비자의 `onSelectDate`를 호출해 폼에 반영 | 휠 조작은 선택창 내부 값만 바꿈 |
| 하단 확인 | 닫기 역할 | 최신 임시 시·분을 폼에 반영하고 닫기 |
| 단순 닫기 | 값을 다시 쓰지 않음 | 미확정 선택을 버리고 폼 값 유지 |
| 다시 열기 | 탐색하던 달 대신 현재 폼 날짜 사용 | 이전 임시값 대신 현재 폼 시각 사용 |

[DatePicker](../../../../apps/client/src/shared/components/DatePicker/DatePicker.tsx)는 닫힐 때 Calendar를 해제한다. 소비자는 `selectedDate`에 현재 폼 값을 연결하고 빈 날짜는 선택 없는 상태로 전달한다(경비 생성은 undefined). 안내 문구를 날짜 값으로 전달하지 않는다.

[TimeField](../../../../apps/client/src/shared/components/Form/TimeField.tsx)는 `useController`로 값과 오류를 구독하고 선택창 수명과 확인 반영을 함께 소유한다. `getValues`는 읽는 순간의 값만 반환하므로 구독의 대체가 아니다. 그렇다고 모든 소비자에 별도 watch가 필요한 것도 아니다. 현재 adapter의 구독을 재사용하고 `renderTrigger`로 필드 모양을 구성한다.

확인은 기존 `setValue(..., { shouldValidate: true })`로 값을 쓰고 검증한다. dirty/touched를 자동 변경하지 않는 기존 동작을 보존하므로, 단순히 `field.onChange`로 치환해 검증·편집 여부의 의미를 바꾸지 않는다. 같은 폼을 외부에서 reset해도 이미 열린 시간 선택의 임시값은 유지되며, 닫고 다시 열면 최신 폼 값을 쓴다. 일정 수정은 항목 ID·Drawer 열림을 TimeField key에 반영해 다른 일정으로 넘어갈 때 이전 임시 선택을 폐기한다.

예를 들어 **저장된 일정이 10:00이고 시간 선택창에서 11:00을 확인했다면**, 폼과 다음 선택창은 11:00이다. 아직 일정은 저장하지 않았으므로 수정 폼 자체를 취소하면 저장값은 10:00이다. 반대로 시간 선택창을 확인 없이 닫으면 폼의 확정값도 바뀌지 않는다.

[TimePicker](../../../../apps/client/src/shared/components/TimePicker/TimePicker.tsx)는 RHF에 의존하지 않는다. 중앙의 고정된 선택 줄에서 시·분을 읽고 스크롤 정지·탭 뒤 행을 중앙에 맞춘다. 시 00–23·분 00–59의 유한 목록이며 무한 순환이나 native iOS picker는 아니다. 공용 picker를 바꿀 때에는 폼 adapter와 이 내부 임시 선택의 책임을 구별한다.
