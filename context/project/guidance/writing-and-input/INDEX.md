# 작성 중인 값과 저장할 값을 구별한다

**언제 쓰나:** 일정·경비 폼, 수동 입력, 장소 선택, 날짜·시간 선택창과 제출 흐름을 바꿀 때 읽는다.

**핵심 기준:** 연결 변화는 검색·후보 조회·저장의 가용성에 반영하고 열린 기본 입력과 초안을 유지한다. 초안, 아직 확인하지 않은 picker 값, 저장된 값은 다른 수명이다. 사용자가 확정한 값을 기존 entity·Repository·Activation Router 경로로 전달하며, 폼이 직접 Local/Remote를 선택하지 않는다.

| 변경할 것 | 적용할 본문 |
| --- | --- |
| 작성 단계, 초기화·취소·재열기, 제한·실패 뒤 입력 | [초안 수명](drafts.md)에서 현재 부모 화면까지 확인한다. |
| 장소 검색·지도 후보·채택 좌표·수동 입력 | [장소 선택](places.md)에서 정상 결과와 수정의 실패 호환값을 구별한다. |
| 날짜·시간 선택창과 RHF adapter | [선택창](pickers.md)에서 임시 선택과 확인·닫기·reset을 구별한다. |
| 날짜·시각의 입력·전송·저장·표시 | [날짜와 시각](../../common/date-and-time.md)의 필드 의미와 실제 호환 범위를 적용한다. |

활성 여행의 오프라인 일정은 장소 검색을 제한하고 텍스트로 기록한다. 좌표는 나중에 보강할 수 있으므로 기록 저장의 필수 조건으로 만들지 않는다. 같은 조건의 경비는 Local 일정 연결까지 가능하다. Trip 생성은 온라인 전제를 유지한다. 이 차이를 별도 수동 폼이나 별도 저장 경로로 구현하지 않는다. 구체적인 접근 계약은 [여행 접근](../travel-access/INDEX.md#작성과-읽기의-제한을-구별한다)을 따른다.

## 입력 연결과 제출의 책임을 유지한다

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

### 기본 입력은 Controller와 Field로 연결한다

React Native input은 `register` 대신 `Controller`로 연결한다. `Field`는 label·입력 영역·오류 표현을 조합한다.

```tsx
<Controller
  control={control}
  name='title'
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <Field>
      <Field.Title>제목</Field.Title>
      <Field.ElementsBox>
        <Input value={value} onChangeText={onChange} />
      </Field.ElementsBox>
      {error && <Field.Message>{error.message}</Field.Message>}
    </Field>
  )}
/>
```
## 입력값을 저장 요청으로 바꾸는 경계

| 입력 | 적용할 계약과 현재 연결 |
| --- | --- |
| 일정 날짜·시각 | 여행 도시의 날짜와 HH:mm을 폼에 보관하고 submit에서 timezone-aware helper로 시점 변환. DST의 없는 시각은 오류로 남기며 초안 유지 |
| 일정 수정 | 최종 날짜·시각이 처음 연 값과 다를 때만 `scheduledAt` 전송. 되돌린 입력·제목/장소만 변경하면 원본 offset·초·밀리초 보존 |
| 경비 날짜 | date-only를 그대로 전달. 날짜 변경 후 원래 값으로 되돌리면 update 요청에서 날짜 생략. 저장 성공 뒤 새 비교 기준 적용 |
| 여행 도시·시간대 | 도시 검색과 선택 도시의 시간대 확인은 별도 요청. 새 여행은 확인한 시간대가 필요하며 실패를 기기 시간대로 대체하지 않음 |
| 경비 통화·금액 | `baseCurrency`는 기본값 제안이고 경비의 통화는 별도 입력. 화면의 소수 자릿수를 저장 정밀도 계약으로 사용하지 않음 |

세부 의미·호환 입력·Repository 검사·서버 직렬화는 [날짜와 시각](../../common/date-and-time.md), [도시 검색](../../current/city-search.md), [통화](../../common/currency.md), [API 계약](../api-contracts.md)을 따른다. 폼의 변환과 서버 응답 serializer는 서로 다른 경계다. 서버가 응답을 변환한다는 이유로 요청 검증·Local 입력의 불일치가 해결되지는 않는다.

시간대가 없는 기존 여행은 읽기용 UTC 호환 표시와 시간대 확인 안내를 사용한다. 새 일정 시각·여행 기간은 기기 시간대로 추정해 저장하지 않는다. 일정 수정은 처음 연 날짜·시각·시간대를 고정하고, 미확정 상태에서 열었다면 시간대 확인 후 다시 열어 시각을 바꾼다. 경비는 사용자가 명시적으로 선택한 date-only를 저장할 수 있지만, 시간대 미확정 상태에서 오늘을 추정해 기본값으로 채우지 않는다.

늦게 도착한 경비 날짜 기본값은 미편집의 빈 날짜만 보완한다. 반면 현재 경비 생성의 기본 통화는 훅 초기값에 머물며 늦은 여행 조회를 같은 방식으로 보완하지 않는다. 날짜의 보호 동작을 전체 필드에 이미 적용된 계약으로 설명하지 않는다.

## 저장 제한·실패·종료를 별도로 처리한다

연결 변화는 장소 검색·일정 후보·저장 같은 해당 기능의 가용성에 반영한다. 작성 기준은 열린 기본 입력을 다른 폼이나 전체 차단 화면으로 교체하지 않는 것이다. 현재 일정 수정은 정책 제한 때 입력 영역을 대체하므로 아래 Project 작성 계약의 구현 차이를 함께 확인한다. 활성 여행의 일정 `manual-only`와 경비 `full`의 차이는 외부 장소 검색과 Local 일정 연결의 차이이며, 상세 제한은 [Policy](../travel-access/INDEX.md#작성과-읽기의-제한을-구별한다)가 소유하고, 현재 입력 보존 차이는 [초안 수명](drafts.md)에서 확인한다.

저장 영역의 정책 안내와 마지막 저장 실패는 서로 다른 정보다. 현재 생성 일정과 생성·수정 경비의 저장 버튼은 진행 중일 때 비활성화하고, 최종 실행 조건은 Repository/Router에서 검사한다. 사전 안내가 있다는 사실만으로 버튼이 항상 잠긴다고 가정하지 않는다. 저장 실패는 초안을 남기며 네트워크 복구만으로 다시 제출하지 않는다.

- **일정 생성:** [useSubmitSchedule](../../../../apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts)이 ID·시각·채택 좌표를 요청으로 만들고 mutation 진행·실패·성공 후 종료를 연결한다. 진행 중 저장·취소·헤더 뒤로가기·장소 변경을 제한한다.
- **경비 생성·수정:** `mutateAsync`의 완료를 기다리고 성공 후 종료한다. 같은 tick의 연속 제출과 닫기는 ref로 막고 표시 상태는 RHF가 소유한다. 검증 실패·요청 준비의 예외도 잠금을 해제하며 오류는 경비 submit에 필요한 범위에서 해석한다.
- **일정 수정:** 현재 Drawer가 제출·초기값·성공/실패 Alert를 연결한다. 저장·취소 버튼은 pending으로 잠그지만 Drawer onClose에는 별도 가드가 없어 backdrop/native 닫기 요청까지 막는 경비의 ref 방식과 다르다. 이 차이를 전체 pending 중 종료 방지의 완성으로 설명하지 않는다.

일정 저장 성공 뒤 별도의 경로 자동 준비는 현재 500ms 뒤 기존 조회 목록·좌표를 사용한다. 일정 저장 완료는 경로 준비 성공을 뜻하지 않는다. 새 장소 수정 뒤 좌표 소비, 0 좌표의 후속 처리, 기존 경로 재사용과 준비 완료 의미는 [지도·경로](../offline-maps-and-routes/routes.md)가 설명한다. 폼 저장 성공을 그 준비의 성공으로 표현하지 않는다.
