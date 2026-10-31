# 부모 화면까지 초안 수명을 확인한다

**언제 쓰나:** 작성 단계를 바꾸거나 폼 초기화·취소·재열기·정책 전환을 수정할 때 읽는다. 공통 기준과 제출은 [작성 기준](INDEX.md)이 맡는다.

**핵심 기준:** 컴포넌트의 hook과 effect뿐 아니라 부모가 넘기는 대상·key·장착 조건까지 따라간다. 같은 ID, 닫힘, 해제는 같은 사건이 아니다.

## 일정 생성: 검색을 오가도 같은 초안을 유지한다

[CreateScheduleScreen](../../../../apps/client/src/screens/CreateScheduleScreen.tsx)은 검색·작성·장소 변경 단계를 사용자 행동으로 전환한다. 초안·검색·제출 훅은 조건부 검색 패널과 폼보다 위에서 유지된다. 검색으로 돌아갈 때 훅까지 해제하면 초안 수명이 끊기므로, 단순히 폼 안으로 옮기는 것을 개선으로 보지 않는다.

[초안 훅](../../../../apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts)은 제목·장소 설명·날짜·시각과 채택한 장소를 소유한다. 여행 ID가 바뀌면 Screen의 key가 바뀌어 새 작성 상태가 된다. 연결 변화는 기능 가용성에 반영하고 작성 단계나 초안을 자동 초기화하지 않는다. 이 초안은 화면 안의 미저장 값이며 앱 종료 후 복원 기능은 아니다.

- 장소를 채택하면 이름·주소·좌표를 연결한다. 제목은 사용자가 수정하지 않은 경우에만 장소명으로 채운다.
- 장소를 직접 수정하면 기존 텍스트를 남기고 채택 장소의 좌표 연결을 해제한다. 새 설명에 이전 장소 좌표를 붙여 저장하지 않기 위해서다.
- 장소 변경 검색에서 돌아오거나 검색이 실패해도 제목·날짜와 기존 채택 장소는 유지한다. 새 장소를 명시적으로 선택하기 전에는 후보가 초안을 바꾸지 않는다.

## 경비: 날짜와 일정 연결은 독립적인 입력이다

[경비 생성 훅](../../../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts)은 초안·제출 수명을 유지하고, 생성·수정 폼은 [ExpenseScheduleField](../../../../apps/client/src/features/expense/expense-form/ExpenseScheduleField.tsx)와 [ExpenseSubmitActions](../../../../apps/client/src/features/expense/expense-form/ExpenseSubmitActions.tsx)를 공유한다. 별도의 ManualExpenseForm으로 교체하지 않는다.

일정 선택 영역은 같은 여행의 모든 날짜 일정을 시간순으로 제공하고, 경비 날짜는 초기 탐색 위치로만 사용한다. 경비 날짜 변경이 기존 연결을 해제하지 않는다. 연결을 없애면 요청에서 `scheduleId: null`로 명시한다. 데이터 관계와 선택 이유는 [Project 경비 초안·일정 연결 근거](../travel-access/_background/evidence.md#경비-초안과-일정-연결)을 따른다.

후보를 조회할 수 없는 동안에는 전체 일정 목록을 별도로 복제해 공개하지 않는다. 이미 선택한 일정의 설명만 초안의 여행 ID·일정 ID와 함께 기억한다. 기억한 설명이 없으면 기존 연결을 유지한다는 안내를 사용하며, 후보 제한 중에도 기존 연결을 설명하고 해제할 수 있다. 새 선택은 조회 `view`가 ready이고 `access.canFetch`가 허용해야 한다. 이 조건은 활성 여행의 Local 후보 조회와 비활성 여행의 제한을 같은 화면에서 구별한다.

## 현재 부모의 닫기·재열기까지 확인한다

| 대상 | 현재 초기화·보존 조건 |
| --- | --- |
| 일정 생성 | 여행 ID별 작성 수명. 검색/작성 전환과 연결 변화로 초기화하지 않음 |
| 일정 수정 | Drawer를 열거나 열린 상태에서 일정 ID가 바뀌면 해당 항목으로 폼을 다시 구성. 편집 중 같은 ID의 조회 갱신으로 날짜·시간대 기준을 바꾸지 않음 |
| 경비 생성 | 훅의 최초 기본값을 사용. 여행 시간대·연결 일정이 늦게 도착하면 사용자가 수정하지 않은 빈 날짜만 보완 |
| 경비 수정 | 컴포넌트는 경비 ID 변경 시 reset하며 isOpen만 바꾸면 초안 유지. 실제 ExpensesScreen은 닫을 때 expenseData를 null로 만들므로 같은 경비도 다시 열면 원본 값으로 reset. 성공 시 저장한 값을 비교 기준으로 reset |

실제 수정 경계는 [UpdateScheduleDrawer](../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)와 [UpdateExpenseDrawer](../../../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx)에서 확인한다. **닫힘과 해제는 다르다.** 소비자가 Drawer를 계속 장착하는지까지 보지 않고 모든 취소가 초안을 초기화한다고 설명하지 않는다. 전체 폼의 늦은 데이터·다른 항목 전환·취소 복원까지 하나의 공통 계약으로 완성된 상태는 아니다.

[ExpensesScreen](../../../../apps/client/src/screens/ExpensesScreen.tsx)은 Drawer를 장착한 채 닫을 때 선택 경비를 비운다. 이 `id → undefined → id` 변화가 재열기의 reset을 일으킨다. [ScheduleScreen](../../../../apps/client/src/screens/ScheduleScreen.tsx)도 닫을 때 선택 일정을 비우며, 일정 Drawer는 대상 ID뿐 아니라 열림 자체에도 reset한다. 부모에서 대상 객체를 계속 유지하도록 바꾸면 경비의 취소·재열기 동작도 달라지므로 Drawer 내부만 보고 변경 범위를 정하지 않는다.

## 연결 제한에서 가려진 입력과 보존된 값을 구별한다

현재 일정 수정은 비활성 여행의 offline/unknown에서 전체 입력 대신 제한 안내를 보여 줘 기본 입력을 계속 표시·편집한다는 계약을 충족하지 못한다. 그러나 `useForm`과 채택 장소의 상태는 그 분기 위에 있어 유지된다. 같은 항목을 계속 연 채 정책을 허용으로 복구하면 제목·확인한 폼 시각은 복원되고 명시적으로 저장할 수 있다. 복구가 자동 제출을 일으키지는 않는다.

입력 영역의 TimeField는 제한 중 해제된다. 따라서 폼에 확인해 둔 시각과 picker에서 아직 확인하지 않은 임시 선택의 보존은 다르다. 다시 입력이 나타나면 시간 선택창은 닫힌 상태로 시작한다. DatePicker·장소 검색의 열림 flag는 상위 Drawer 상태이므로 이 하위 상태들까지 모두 같은 수명이라고 일반화하지 않는다. 실제 연결 전환에서의 native modal·스크롤 동작 전체를 이 코드와 제어된 검사만으로 보장하지 않는다.

경비는 입력을 유지하면서 후보·저장 영역에 제한을 표시한다. 선택한 일정의 설명을 기억하는 것은 전체 목록 cache를 제한 중 공개하는 것과 다르다. 저장 실패 뒤 초안을 유지하고 사용자의 재저장을 기다리는 기준은 생성·수정에 함께 적용하되, 같은 tick 제출 잠금과 닫기 방어는 실제 구현별로 확인한다.
