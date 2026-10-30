# 작성 초안·장소·날짜 입력 Context 보완

사용자는 06 사전 대조 뒤 “그래 진행해봐”라고 요청했다. [앞선 구체화](2026-10-30-14-save05-and-review06.md)를 바탕으로 기록·현재 코드·기존 제품 계약을 대조하고 기존 본문을 보완했다. 제품 코드·테스트·Personal·스킬은 변경하지 않았다.

## 본문과 기존 의미의 보존

[form 가이드](../../../../../.claude/context/form.md)를 초안·장소 후보/채택·선택창·저장 요청의 흐름으로 구성했다. 첫머리에 세 읽기 경로를 두고, 책임·초기화 조건·결과 계약·picker 동작을 비교하는 표를 사용했다. Controller·Field·Zod·제출/저장 분리·Policy·날짜/통화 경계라는 기존 의미는 유지했다. picker 상태를 일괄 feature hook 소유로 둔 설명은 현재 TimeField 구독·선택창 수명에 맞췄다.

[components](../../../../../.claude/context/components.md)는 제거된 ManualExpenseForm을 실제 ExpenseForm으로 정정하고 adapter와 picker의 책임을 연결했다. [manual-input](../../../../../.claude/context/manual-input.md)은 기존 단일 폼과 Local/Remote 계약을 유지했다. 직접 입력 장소를 선택 입력처럼 보이게 하던 설명은 현재 생성 schema의 필수 제목·장소 텍스트·날짜·시각에 맞추고, 좌표 null과 수정의 상세 실패 0/0 호환을 구별했다.

Project README·client guide·Context 지도·Form runbook에서 같은 form 본문에 도달한다. 날짜 본문에는 선택창의 수명으로 가는 읽기 경로만 추가했다. 날짜·시각·통화·API·도시 검색의 충분한 상세 본문을 재사용하며 Owner를 옮기거나 별도 경쟁 문서를 만들지 않았다. 저장 용량·초기 리팩터링은 앞선 대조와 전용 본문의 결과를 유지했다.

## 대표 질문과 직접 대조

Main이 본문을 읽어 아래 판단을 복원한 뒤 구현·기존 검사와 대조했다. 작성자의 읽기 확인이며 별도 독자나 실제 후속 개발 효과를 입증한 것은 아니다.

| 질문 | 본문에서 확인한 답과 근거 |
| --- | --- |
| 검색 패널로 돌아가면 초안 훅도 폼 안으로 옮겨도 되는가? | CreateScheduleScreen의 조건부 UI 위에서 작성 수명을 유지하는 이유를 설명했다. 여행 ID key, 사용자 행동의 단계 변경, 제목 보존·직접 장소 편집의 좌표 해제를 대조했다. |
| 지도에 B 후보가 보이면 저장도 B인가? | A 초안과 B 후보를 구별했다. useCreateScheduleSearch·ScheduleSearchPanel과 생성 흐름 검사의 지도 props/초안 assertion을 대조했다. |
| 좌표 0과 상세 실패 0/0은 같은가? | Places의 resolved/resolution Query key·정상 상세와 update compatibility adapter를 구별했다. 실제 API 검사와 수정 payload 검사가 각각 지지하는 범위를 읽었다. |
| 시간 11:00 확인과 일정 저장은 같은가? | picker 임시값·폼 확정값·저장값을 예시로 나눴다. TimeField의 useController·setValue 검증과 TimePicker 확인·닫기, 다른 일정 ID의 key 폐기를 대조했다. |
| 모든 폼은 취소·재열기 때 초기화되는가? | 일정 수정의 열린 상태/ID reset과 경비 수정의 ID reset을 비교했다. 전체 폼 취소 복원까지 완성된 계약으로 올리지 않았다. |
| 날짜를 바꿨다가 원래대로 돌리면 시각을 다시 보내는가? | 현재 날짜 계약과 수정 payload의 원래 값 비교를 연결했다. offset·초·밀리초 보존과 저장 성공 후 새 비교 기준을 대조했다. |
| 비활성 여행의 후보 조회가 막히면 기존 경비 연결도 지우는가? | 후보 전체 복제 없이 선택한 설명·해제를 유지하는 ExpenseScheduleField와 Router 최종 차단, 실패 뒤 명시적 재시도 검사를 대조했다. |
| 시간대·통화가 늦게 오면 모든 기본값이 보완되는가? | 빈 미편집 날짜만 채우는 현재 코드와 통화 초기값의 차이를 남겼다. 도시 검색/시간대 확인, date-only와 시점, 표시 자릿수와 저장 정밀도는 기존 Owner에서 재사용했다. |

선택 이유는 002의 일정·Places·경비·picker 기록에서 최소 사용자 발췌와 링크로 보존했다. 당시 10월 2일 설명을 현재 시간대 계약으로 그대로 올리지 않고 이후 도시 시간대 변경과 최종 종료 기록을 함께 읽었다. 원 대화 전체를 새로 검증한 것으로 주장하지 않는다.

## 실행 검사와 한계

Project root에서 `node_modules/.bin/jest --config apps/client/jest.config.cjs --runInBand --silent --runTestsByPath`로 아래 기존 검사를 실행했다. **12개 suite·118개 test가 통과**했다.

- `apps/client/tests/screens/create-schedule-flow.test.tsx`
- `apps/client/tests/screens/create-expense-flow.test.tsx`
- `apps/client/tests/screens/update-place-search.test.tsx`
- `apps/client/tests/components/time-field.test.tsx`
- `apps/client/tests/components/picker-lifecycle.test.tsx`
- `apps/client/tests/components/time-picker-wheel.test.tsx`
- `apps/client/tests/features/edit/offline-values.test.tsx`
- `apps/client/tests/features/edit/city-time-zone.test.tsx`
- `apps/client/tests/features/edit/expense-city-default.test.tsx`
- `apps/client/tests/shared/services/places/api.test.ts`
- `apps/client/tests/shared/lib/datetime.test.ts`
- `apps/client/tests/shared/lib/timezone.test.ts`

TimeField 검사는 실제 useForm과 picker를 연결하지만 필드 shell·native 일부는 대체한다. 생성 흐름은 실제 정책·Router 연결을 이용하되 Local/API 호출을 대체하며, 수정 payload와 Places 검사는 저장 mutation·Axios를 대체한다. 휠은 이벤트·중앙 선택·확인 값을 검사한다. 이 근거를 실제 HTTP·디스크 저장·native 지도·Android 스크롤·실제 단절 후 동기화 전체로 확대하지 않는다. 과거 iOS 관찰과 이번 자동 재실행도 별개다.

Work 완료 반영 전 12개 변경·신규 Markdown의 상대 링크 228개·참조 anchor·EOF·끝 공백과 git diff --check, 명시적 005 Recover JSON 생성·파싱을 확인했다. `node scripts/check-harness.mjs`는 기존 002·003 역사 링크 8건으로 실패했다. 이번 변경으로 생긴 경로 오류는 없었으며 과거 원문을 수정하지 않았다. Work 반영 후 최종 링크·형식·Recover도 확인한다.

## 현재 완료 범위

04–06이 맡은 앱 실행·데이터 보존, 네트워크·조회·표시, 작성·장소·입력 Context의 보완과 대표 읽기를 마쳤다. review-scope의 기존 충분한 날짜·API·통화·도시 검색·저장 용량은 재사용했고, 명시적 후속·보류와 개인 판단 개선의 후순위를 유지했다.

전체 폼의 늦은 데이터·초기화, 늦은 기본 통화, 저장 후 500ms 경로 준비와 좌표 소비, 경비 삭제 실패 이유·특정 상세 재시도는 이번에 구현하지 않았다. 이 문서 보완을 002 전체 제품 완료나 실기기 수락으로 바꾸지 않는다. 새 제품 작업·추가 Ticket·자동 session 연결을 시작하지 않았고 machine Verify/status는 변경하지 않았다. 06과 앞선 사전 대조 기록은 현재 미커밋이다.
