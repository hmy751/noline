---
alwaysApply: false
---

# 작성 초안·장소 선택·날짜 입력 가이드

> 문서 상태: active source. 일정·경비 폼의 현재 책임과 입력 수명을 설명한다.
> 과거 web component 구조가 섞인 폼 가이드는 [_archive/form-guide-legacy-web-patterns.md](../_archive/form-guide-legacy-web-patterns.md)에 보존되어 있다.

폼에서 입력한 값, 선택창에서 아직 확인하지 않은 값, 실제 저장된 값은 서로 다른 수명을 갖는다. 연결 변화나 검색 실패가 작성 중인 값을 잃게 하지 않으면서, 사용자가 확정한 값만 기존 저장 경로로 전달하는 것이 이 구조의 목적이다.

- **[초안과 작성 단계](#초안과-작성-단계):** 검색과 작성을 오갈 때 유지할 값, 초기화 시점, 저장 실패 뒤 남는 값을 구별한다.
- **[장소 후보와 채택](#장소-후보와-초안에-채택한-장소):** 지도에 보이는 위치, 선택 가능한 결과, 초안에 연결된 좌표를 구별한다.
- **[날짜·시간 선택](#날짜시간-선택창과-폼의-연결):** 선택창의 확인·닫기·재열기와 저장 요청의 날짜 의미를 연결한다.

날짜·시각·통화의 제품 의미와 요청 계약은 각각 [날짜와 시각](../../context/project/common/date-and-time.md), [통화와 금액](../../context/project/common/currency.md), [API 계약](../../context/project/guidance/api-contracts.md)이 소유한다. 읽기 제한·네트워크 재확인은 [Policy 본문](policy-architecture.md), 인증·실행 종료는 [앱 실행 구조](../../context/project/current/app-runtime/INDEX.md)를 참조한다.

## 기본 조합과 책임

현재 폼은 React Native/Expo에서 `react-hook-form`(RHF), `zodResolver`, `Field`를 사용한다. 기본 입력은 `Controller`로, 폼 값과 선택창의 연결은 해당 adapter로 구성한다. 아래는 현재 책임의 위치이며 모든 feature를 같은 개수의 훅으로 나누라는 규칙은 아니다.

| 책임 | 현재 담당과 경계 |
| --- | --- |
| 화면 흐름과 작성 수명 | Screen 또는 편집 Drawer가 진입 대상·작성 단계·열기/닫기·초기화 조건을 연결 |
| 초안과 입력 검사 | form/hook이 `useForm`, 채택한 장소와 초기 비교값, form schema를 소유 |
| 필드와 선택창 연결 | form component가 배치·입력을, `TimeField`가 시간 값 구독·오류·선택창 열기와 확인 반영을 소유 |
| 선택창 내부 | DatePicker의 달력 탐색, TimePicker의 미확정 시·분. 저장이나 RHF를 직접 소유하지 않음 |
| 제출 | feature의 submit handler/hook이 검증된 초안을 요청으로 변환하고 진행·실패·성공 후 화면 동작을 연결 |
| 데이터 저장 | Entity hook은 mutation·Query 갱신을, Repository는 공유 요청 검사와 Activation Router 연결을 담당 |

폼 UI가 직접 DB/API를 선택하지 않는다. 입력용 schema와 저장 요청 schema도 역할이 다르다. 예를 들어 일정 폼의 날짜·시각은 제출할 때 하나의 `scheduledAt`으로 바뀌지만, 경비 날짜는 date-only로 전달한다.

### Controller Pattern

React Native input은 `register` 대신 `Controller`로 연결한다. `Field`는 label·입력 영역·오류 표현을 조합한다.

```tsx
<Controller
  control={control}
  name='title'
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <Field>
      <Field.Title>제목</Field.Title>
      <Field.ElementsBox>
        <TextInput value={value} onChangeText={onChange} />
      </Field.ElementsBox>
      {error && <Field.Message>{error.message}</Field.Message>}
    </Field>
  )}
/>
```

## 초안과 작성 단계

### 일정 생성: 검색을 오가도 같은 초안을 유지한다

[CreateScheduleScreen](../../apps/client/src/screens/CreateScheduleScreen.tsx)은 검색·작성·장소 변경 단계를 사용자 행동으로 전환한다. 초안·검색·제출 훅은 조건부 검색 패널과 폼보다 위에서 유지된다. 검색으로 돌아갈 때 훅까지 해제하면 초안 수명이 끊기므로, 단순히 폼 안으로 옮기는 것을 개선으로 보지 않는다.

[초안 훅](../../apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts)은 제목·장소 설명·날짜·시각과 채택한 장소를 소유한다. 여행 ID가 바뀌면 Screen의 key가 바뀌어 새 작성 상태가 된다. 연결 변화는 기능 가용성에 반영하고 작성 단계나 초안을 자동 초기화하지 않는다. 이 초안은 화면 안의 미저장 값이며 앱 종료 후 복원 기능은 아니다.

- 장소를 채택하면 이름·주소·좌표를 연결한다. 제목은 사용자가 수정하지 않은 경우에만 장소명으로 채운다.
- 장소를 직접 수정하면 기존 텍스트를 남기고 채택 장소의 좌표 연결을 해제한다. 새 설명에 이전 장소 좌표를 붙여 저장하지 않기 위해서다.
- 장소 변경 검색에서 돌아오거나 검색이 실패해도 제목·날짜와 기존 채택 장소는 유지한다. 새 장소를 명시적으로 선택하기 전에는 후보가 초안을 바꾸지 않는다.

### 경비: 날짜와 일정 연결은 독립적인 입력이다

[경비 생성 훅](../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts)은 초안·제출 수명을 유지하고, 생성·수정 폼은 [ExpenseScheduleField](../../apps/client/src/features/expense/expense-form/ExpenseScheduleField.tsx)와 [ExpenseSubmitActions](../../apps/client/src/features/expense/expense-form/ExpenseSubmitActions.tsx)를 공유한다. 별도의 ManualExpenseForm으로 교체하지 않는다.

일정 선택 영역은 같은 여행의 모든 날짜 일정을 시간순으로 제공하고, 경비 날짜는 초기 탐색 위치로만 사용한다. 경비 날짜 변경이 기존 연결을 해제하지 않는다. 연결을 없애면 요청에서 `scheduleId: null`로 명시한다. 데이터 관계와 선택 이유는 [경비 초안·일정 연결 결정](../decisions/2026-10-02-expense-draft-and-schedule-association.md)을 따른다.

후보를 조회할 수 없는 동안에는 전체 일정 목록을 별도로 복제해 공개하지 않는다. 이미 선택한 일정의 설명만 초안의 여행 ID·일정 ID와 함께 기억한다. 기억한 설명이 없으면 기존 연결을 유지한다는 안내를 사용하며, 후보 제한 중에도 기존 연결을 설명하고 해제할 수 있다. 새 선택은 조회 `view`가 ready이고 `access.canFetch`가 허용해야 한다. 이 조건은 활성 여행의 Local 후보 조회와 비활성 여행의 제한을 같은 화면에서 구별한다.

### 현재 초기화 조건을 구별한다

| 대상 | 현재 초기화·보존 조건 |
| --- | --- |
| 일정 생성 | 여행 ID별 작성 수명. 검색/작성 전환과 연결 변화로 초기화하지 않음 |
| 일정 수정 | Drawer를 열거나 열린 상태에서 일정 ID가 바뀌면 해당 항목으로 폼을 다시 구성. 편집 중 같은 ID의 조회 갱신으로 날짜·시간대 기준을 바꾸지 않음 |
| 경비 생성 | 훅의 최초 기본값을 사용. 여행 시간대·연결 일정이 늦게 도착하면 사용자가 수정하지 않은 빈 날짜만 보완 |
| 경비 수정 | 경비 ID 변경 시 reset. 같은 ID의 닫기·재열기만으로 reset하는 구조는 아님. 저장 성공 시 저장한 값을 새 비교 기준으로 reset |

실제 수정 경계는 [UpdateScheduleDrawer](../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)와 [UpdateExpenseDrawer](../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx)에서 확인한다. **닫힘과 해제는 다르다.** 소비자가 Drawer를 계속 장착하는지까지 보지 않고 모든 취소가 초안을 초기화한다고 설명하지 않는다. 전체 폼의 늦은 데이터·다른 항목 전환·취소 복원까지 하나의 공통 계약으로 완성된 상태는 아니다.

## 장소 후보와 초안에 채택한 장소

공통 [Places 서비스](../../apps/client/src/shared/services/places/)는 요청·응답 검사, 검색 Query와 Service 정책을 소유한다. 생성·수정 기능은 반환된 결과를 어떻게 선택하고 초안에 적용할지 맡는다. Places는 여행 데이터의 Local/Remote 소유권 분기가 아니며, [장소 검색 Policy](../../apps/client/src/shared/policy/place-search.ts)는 실제 연결과 화면용 강제값을 함께 확인한다. 표시만 online으로 바꿔 실제 offline 요청을 열지 않는다.

| 결과 계약 | 보장과 소비자 |
| --- | --- |
| `PlaceCandidate` | 검색에서 찾은 후보. 상세 좌표 확인을 마친 장소와 구별 |
| `ResolvedPlace` / 생성 검색 | 상세 응답 검사를 통과한 장소. 상세 한 건이라도 실패하면 생성 검색 전체가 실패하며 정상 결과인 척 좌표를 채우지 않음 |
| `PlaceResolution` / 수정 검색 | `resolved` 또는 후보·오류를 가진 `unresolved-detail`로 부분 실패를 구별 |
| 수정의 compatibility adapter | 상세 실패를 기존 0/0 선택값으로 바꾸는 한정 호환 처리. 공통 서비스의 정상 장소 보장이 아님 |

생성용 정상 결과와 수정용 부분 실패 결과는 Query key도 구별한다. 유효한 위도·경도 0은 실패가 아니다. [수정 adapter](../../apps/client/src/features/schedule/update-schedule/place-search-compatibility.ts)의 `legacy-unresolved-detail`은 실패 대체 0/0임을 별도로 표시하며, 현재 수정 payload에는 기존처럼 좌표가 들어간다. 이 동작을 모든 장소 검색의 정책으로 확대하거나 이 설명으로 해결했다고 보지 않는다.

### 지도 표시가 곧 장소 채택은 아니다

[생성 검색 조합](../../apps/client/src/features/schedule/create-schedule/useCreateScheduleSearch.ts)은 지도에 보여 줄 결과와 지금 선택할 결과를 구별한다. 다른 검색어의 결과를 기다릴 때 이전 결과가 지도에 남아도 placeholder 결과는 새 선택 후보가 아니다. 선택 이벤트에서도 현재 검색 사용 여부·정책·결과 포함 여부를 확인한다.

A를 초안에 채택한 채 B를 검색하면 지도는 B 후보를 보여 줄 수 있지만 초안은 A다. B를 명시적으로 선택해야 초안이 바뀐다. 후보가 없으면 채택 장소를 지도에 전달한다. 지도에 보이는 위치만으로 제출 좌표를 결정하지 않는다.

서비스는 검색 시작·상세 요청·결과 반환에서 정책을 확인하며, 정책 중단은 상세 실패의 호환값으로 흡수하지 않는다. 닫힌 채 장착된 수정 검색은 새 조회를 멈추고 입력은 유지한다. 이미 보낸 HTTP 요청 전체의 취소나 수정 검색의 모든 오류 UX까지 보장하는 구조는 아니다. 지도·경로에서의 좌표 소비와 저장 후 경로 준비는 아래 남은 범위와 구별한다.

## 날짜·시간 선택창과 폼의 연결

| 동작 | DatePicker | TimePicker + TimeField |
| --- | --- | --- |
| 열기 | 현재 폼 날짜의 달과 선택 표시로 시작 | 현재 폼 시각에서 임시 시·분 선택 시작 |
| 선택 | 날짜 탭이 소비자의 `onSelectDate`를 호출해 폼에 반영 | 휠 조작은 선택창 내부 값만 바꿈 |
| 하단 확인 | 닫기 역할 | 최신 임시 시·분을 폼에 반영하고 닫기 |
| 단순 닫기 | 값을 다시 쓰지 않음 | 미확정 선택을 버리고 폼 값 유지 |
| 다시 열기 | 탐색하던 달 대신 현재 폼 날짜 사용 | 이전 임시값 대신 현재 폼 시각 사용 |

[DatePicker](../../apps/client/src/shared/components/DatePicker/DatePicker.tsx)는 닫힐 때 Calendar를 해제한다. 소비자는 `selectedDate`에 현재 폼 값을 연결하고 빈 날짜는 선택 없는 상태로 전달한다(경비 생성은 undefined). 안내 문구를 날짜 값으로 전달하지 않는다.

[TimeField](../../apps/client/src/shared/components/Form/TimeField.tsx)는 `useController`로 값과 오류를 구독하고 선택창 수명과 확인 반영을 함께 소유한다. `getValues`는 읽는 순간의 값만 반환하므로 구독의 대체가 아니다. 그렇다고 모든 소비자에 별도 watch가 필요한 것도 아니다. 현재 adapter의 구독을 재사용하고 `renderTrigger`로 필드 모양을 구성한다.

확인은 기존 `setValue(..., { shouldValidate: true })`로 값을 쓰고 검증한다. dirty/touched를 자동 변경하지 않는 기존 동작을 보존하므로, 단순히 `field.onChange`로 치환해 검증·편집 여부의 의미를 바꾸지 않는다. 같은 폼을 외부에서 reset해도 이미 열린 시간 선택의 임시값은 유지되며, 닫고 다시 열면 최신 폼 값을 쓴다. 일정 수정은 항목 ID·Drawer 열림을 TimeField key에 반영해 다른 일정으로 넘어갈 때 이전 임시 선택을 폐기한다.

예를 들어 **저장된 일정이 10:00이고 시간 선택창에서 11:00을 확인했다면**, 폼과 다음 선택창은 11:00이다. 아직 일정은 저장하지 않았으므로 수정 폼 자체를 취소하면 저장값은 10:00이다. 반대로 시간 선택창을 확인 없이 닫으면 폼의 확정값도 바뀌지 않는다.

[TimePicker](../../apps/client/src/shared/components/TimePicker/TimePicker.tsx)는 RHF에 의존하지 않는다. 중앙의 고정된 선택 줄에서 시·분을 읽고 스크롤 정지·탭 뒤 행을 중앙에 맞춘다. 시 00–23·분 00–59의 유한 목록이며 무한 순환이나 native iOS picker는 아니다. 공용 picker를 바꿀 때에는 폼 adapter와 이 내부 임시 선택의 책임을 구별한다.

## 입력값을 저장 요청으로 바꾸는 경계

| 입력 | 적용할 계약과 현재 연결 |
| --- | --- |
| 일정 날짜·시각 | 여행 도시의 날짜와 HH:mm을 폼에 보관하고 submit에서 timezone-aware helper로 시점 변환. DST의 없는 시각은 오류로 남기며 초안 유지 |
| 일정 수정 | 최종 날짜·시각이 처음 연 값과 다를 때만 `scheduledAt` 전송. 되돌린 입력·제목/장소만 변경하면 원본 offset·초·밀리초 보존 |
| 경비 날짜 | date-only를 그대로 전달. 날짜 변경 후 원래 값으로 되돌리면 update 요청에서 날짜 생략. 저장 성공 뒤 새 비교 기준 적용 |
| 여행 도시·시간대 | 도시 검색과 선택 도시의 시간대 확인은 별도 요청. 새 여행은 확인한 시간대가 필요하며 실패를 기기 시간대로 대체하지 않음 |
| 경비 통화·금액 | `baseCurrency`는 기본값 제안이고 경비의 통화는 별도 입력. 화면의 소수 자릿수를 저장 정밀도 계약으로 사용하지 않음 |

세부 의미·호환 입력·Repository 검사·서버 직렬화는 [날짜와 시각](../../context/project/common/date-and-time.md), [도시 검색](../../context/project/current/city-search.md), [통화](../../context/project/common/currency.md), [API 계약](../../context/project/guidance/api-contracts.md)을 따른다. 폼의 변환과 서버 응답 serializer는 서로 다른 경계다. 서버가 응답을 변환한다는 이유로 요청 검증·Local 입력의 불일치가 해결되지는 않는다.

시간대가 없는 기존 여행은 읽기용 UTC 호환 표시와 시간대 확인 안내를 사용한다. 새 일정 시각·여행 기간은 기기 시간대로 추정해 저장하지 않는다. 일정 수정은 처음 연 날짜·시각·시간대를 고정하고, 미확정 상태에서 열었다면 시간대 확인 후 다시 열어 시각을 바꾼다. 경비는 사용자가 명시적으로 선택한 date-only를 저장할 수 있지만, 시간대 미확정 상태에서 오늘을 추정해 기본값으로 채우지 않는다.

늦게 도착한 경비 날짜 기본값은 미편집의 빈 날짜만 보완한다. 반면 현재 경비 생성의 기본 통화는 훅 초기값에 머물며 늦은 여행 조회를 같은 방식으로 보완하지 않는다. 날짜의 보호 동작을 전체 필드에 이미 적용된 계약으로 설명하지 않는다.

## 저장 제한·실패·종료

연결 변화는 장소 검색·일정 후보·저장 같은 해당 기능의 가용성에 반영한다. 열린 기본 입력을 다른 폼이나 전체 차단 화면으로 교체하지 않는다. 활성 여행의 일정 `manual-only`와 경비 `full`의 차이는 외부 장소 검색과 Local 일정 연결의 차이이며, 상세 제한은 [Manual Input](manual-input.md)과 [Policy](policy-architecture.md#작성과-읽기의-제한을-구별한다)가 소유한다.

저장 영역의 정책 안내와 마지막 저장 실패는 서로 다른 정보다. 현재 생성 일정과 생성·수정 경비의 저장 버튼은 진행 중일 때 비활성화하고, 최종 실행 조건은 Repository/Router에서 검사한다. 사전 안내가 있다는 사실만으로 버튼이 항상 잠긴다고 가정하지 않는다. 저장 실패는 초안을 남기며 네트워크 복구만으로 다시 제출하지 않는다.

- **일정 생성:** [useSubmitSchedule](../../apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts)이 ID·시각·채택 좌표를 요청으로 만들고 mutation 진행·실패·성공 후 종료를 연결한다. 진행 중 저장·취소·헤더 뒤로가기·장소 변경을 제한한다.
- **경비 생성·수정:** `mutateAsync`의 완료를 기다리고 성공 후 종료한다. 같은 tick의 연속 제출과 닫기는 ref로 막고 표시 상태는 RHF가 소유한다. 검증 실패·요청 준비의 예외도 잠금을 해제하며 오류는 경비 submit에 필요한 범위에서 해석한다.
- **일정 수정:** 현재 Drawer가 제출·초기값·성공/실패 Alert를 연결한다. 경비의 ref 잠금·오류 표현과 동일하게 구현됐다고 확대하지 않는다.

일정 저장 성공 뒤 별도의 경로 자동 준비는 현재 500ms 뒤 기존 조회 목록·좌표를 사용한다. 일정 저장 완료는 경로 준비 성공을 뜻하지 않는다. 새 장소 수정 뒤 좌표 소비, 0 좌표의 후속 처리, 기존 경로 재사용과 준비 완료 의미는 별도 후속 범위다. 이번 폼 설명은 그 연결을 복원하며 경로 준비의 정확성까지 보장하지 않는다.

## 선택 근거와 확인 범위

일정 생성 기록에서 사용자는 “그러니까 이번 작업만 말고 우리가 해결하려던 스케줄 생성 이슈 시스템으로 해서 설명해봐”라고 요청했다. 값의 위치만이 아니라 검색·작성·지도·제출의 책임과 수명을 함께 설명해야 하는 이유다. [일정·Places 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-10-02-01-schedule-create-boundaries-and-verification.md)은 별도 폼과 reset이 초안을 덮던 문제, 단일 작성 수명과 Places 보장을 분리한 선택을 보존한다.

경비는 “일정을 연결할 수 있는건 말그대로 일정에 연결을 할거냐 안할거냐로 보면 어때?”라는 선택에 따라 날짜와 연결을 분리했다. [경비 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-10-02-03-expense-time-decisions-and-verification.md)에 Local 일정 연결과 후보 제한·초안 보존을 구별한 이유가 있다.

시간 선택은 “선택된 라인이 계속 가운데 유지하면서 도는 그런느낌”이라는 요청에서 중앙 휠을 채택했고, 이후 폼 값 구독·선택창 연결을 TimeField로 모았다. [picker·TimeField 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-10-06-02-picker-wheel-time-field-and-remaining-scope.md)은 실제로 옮긴 책임과 검증 단계별 차이를 남긴다. 위 발췌는 보존된 기록에 근거하며 원 대화 전체를 새로 검증한 것은 아니다.

2026-10-30 현재 소스와 [일정 생성](../../apps/client/tests/screens/create-schedule-flow.test.tsx), [경비 생성](../../apps/client/tests/screens/create-expense-flow.test.tsx), [수정 입력](../../apps/client/tests/features/edit/offline-values.test.tsx), [TimeField](../../apps/client/tests/components/time-field.test.tsx), [Places](../../apps/client/tests/shared/services/places/api.test.ts)의 기존 검사를 대조했다. 제어된 네트워크·저장 경계와 화면/훅의 근거이며 실제 HTTP·native 지도·Android 스크롤·실제 단절 후 동기화 전체를 입증하지 않는다.

[002 종료 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-10-06-03-ticket-06-closure-and-followups.md)의 전체 폼 수명·경로 준비 후속, 경비 삭제 실패 이유·특정 상세 재시도 보류를 유지한다. 입력 초기화·검색 결과 보장·picker adapter·요청 변환을 바꾸는 주체는 이 본문과 해당 제품 계약·실제 소비자·검사를 함께 다시 확인한다.

## 변경 시 확인

- form schema와 default value, 입력값에서 요청으로 바뀌는 필드의 의미가 맞는가?
- 입력 구독과 선택창 임시값, 확인·닫기·재열기·대상 전환의 수명이 분명한가?
- 장소 표시·선택 가능·채택 좌표와 상세 실패 호환 처리를 구별했는가?
- 날짜·시간·통화의 기존 의미와 변경하지 않은 값의 보존을 지켰는가?
- 정책 안내·최종 저장 검사·실패 후 초안·성공 후 종료를 실제 소비자까지 연결했는가?
