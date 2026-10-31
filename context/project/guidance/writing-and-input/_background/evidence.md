# 작성·입력 선택과 현재 대조의 근거

[형성 맥락](context.md)을 재검토할 최소 근거다. 아래 발췌는 보존된 002 작업 기록에 있는 사용자 발화이며 원 대화 전체를 다시 검증한 것이 아니다. 제품의 현재 기준은 [작성 본문](../INDEX.md)에 있다.

## 작성 전체의 책임을 설명해야 했다

2026-10-02 `schedule-create-boundaries-and-verification` 기록에서 사용자는 “그러니까 이번 작업만 말고 우리가 해결하려던 스케줄 생성 이슈 시스템으로 해서 설명해봐”라고 요청했다. 기록은 네트워크에 따라 폼이 교체되고 reset이 값을 덮던 문제, 단일 초안 수명과 Places 보장을 분리한 선택을 보존한다. 마지막 helper 변경만으로 전체 작성 문제를 설명하지 않는 근거다.

같은 기록의 비교에서는 폼 내부로 초안 hook을 이동하면 검색 전환 때 수명이 끊긴다는 비용을 확인했고, 표시 후보와 채택 장소를 분리했다. 당시 실제 HTTP 요청 전체의 취소·수정 검색 실패 UX·경로 준비를 함께 해결한 것으로 기록하지 않았다.

## Picker 요청에서 채택한 범위

2026-10-06 `picker-wheel-time-field-and-remaining-scope` 기록의 요청은 “선택된 라인이 계속 가운데 유지하면서 도는 그런느낌”이었다. 고정된 중앙 선택 줄에서 시·분을 읽는 UI를 채택했으며 유한 00–23/00–59 목록이다. 참고된 RHF 설명에서 채택한 것은 picker와 외부 상태 adapter의 책임 구분이다. 기존 picker가 RHF에 의존했다는 사실로 바꾸지 않는다.

같은 기록은 TimeField의 useController·renderTrigger·setValue와 실제 일정 생성/수정 소비자를 함께 이전했음을 보존한다. `field.onChange` 일괄 치환이나 별도 TimeWheel 분리·API 개명은 채택된 필수 작업이 아니다. 당시 native 관찰과 자동 검사에 범위 차이가 있었고 Android·실제 단절 전체 경로는 확인되지 않았다.

## 2026-10-31 현재 소비 경로를 대조했다

`ExpensesScreen`의 닫기 처리에서 선택 경비를 null로 만들고 `UpdateExpenseDrawer`는 expenseData?.id 변화에 reset한다. `ScheduleScreen`도 선택 일정을 비우며 `UpdateScheduleDrawer`는 id·isOpen 변화에 reset한다. 따라서 단일 컴포넌트의 isOpen만 바꾼 결과를 실제 취소·재열기로 일반화하지 않았다.

일정 수정의 policy early return 전에는 useForm·selectedLocation이 남고, 입력 영역의 TimeField는 반환에서 빠진다. 제어된 online→offline/unknown→online 검사에서 확인한 폼 제목·시각과 명시적 재저장을 대조했다. 실제 인터넷 단절·native modal 전체의 관찰이 아니며, 정상 입력 표시를 유지한다는 계약은 여전히 미충족이다. 구체 검사 실행과 재현 입력은 이관 Work가 보존한다.
