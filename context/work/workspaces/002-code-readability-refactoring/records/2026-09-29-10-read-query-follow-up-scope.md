# 조회 조합 커밋과 다른 소비자의 적용 범위

일정·경비 조회 조합과 관련 검사·Workspace 기록은 `b4db89d refactor(client): 일정·경비 조회의 접근과 실행 조합 정리`로 저장됐다. Main이 Git 로그와 현재 소스를 확인했다. 완료된 교체는 일정 목록, 경비 목록·상세, 경비 상세의 연결 일정 조회이며 앱 전체 전환이나 Ticket 06 완료는 아니다. 앞선 [배치 기록](2026-09-29-09-policy-query-ownership-and-migration.md)의 미커밋 표시는 작성 당시 상태로 보존한다.

## 남은 조회를 일괄 교체하지 않는 이유

커밋 보고 후 사용자는 같은 대화에서 “그럼 미전환 부분은 그냥 다적용하면 되는건가?”라고 물었다. Main은 실제 소비자를 읽고 아래 접근을 제안했다. 이어진 사용자 요청은 “일단 워크스페이스 기록 남길거 다 남겼는지 확인해봐”이며, 이 질문과 기록 점검을 후속 전체 구현·순서의 확정으로 해석하지 않는다.

- [일정 상세](../../../../../apps/client/src/screens/ScheduleDetailScreen.tsx)는 일정 단건과 해당 일정의 경비를 조회하지만 읽기 제한 표시가 없다. 두 Entity 훅의 조회 범위·key를 유지한 채 접근·실행·표시를 조합하는 것이 우선 후보다. 여행 전체 목록으로 바꾸면 조회 범위와 캐시 사용까지 바뀌므로 단순 재사용을 위한 교체로 삼지 않는다.
- [경비 생성 폼](../../../../../apps/client/src/features/expense/create-expense/ExpenseForm.tsx)과 [경비 수정 폼](../../../../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx)은 연결 일정 선택에 조회를 사용한다. 생성 폼에는 이미 schedule.read 제한·조회 실패 표시가 있고, 수정 폼의 조회 수명에는 isOpen이 반영돼 있다. 해당 영역에 조합을 연결하되 입력값·mount·저장 정책을 보존하는 안을 제안했다.
- [홈 요약](../../../../../apps/client/src/screens/HomeScreen/MainTripSection.tsx)은 일정·경비의 data 기본값을 빈 배열로 두고 개수·통화별 합계로 바꾼다. 조회를 중지하는 변경만으로는 데이터 없는 제한 상태가 0개·0원으로 보일 수 있다. 여행 카드는 유지하고 요약 영역에서 조회 불가·실패·정상 빈 결과를 구별하는 표시까지 함께 검토해야 한다.
- [일정 생성](../../../../../apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts)과 [일정 수정](../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)의 일정 목록은 저장 후 경로 재계산에 사용된다. 화면에 보여 주는 목록과 목적이 다르다. 표시 정책을 계산용 조회에 적용할 필요가 있는지 먼저 판단하며, Entity 훅 유지 또는 새 조합의 query 소비 중 어느 쪽도 아직 확정하지 않았다.

Main이 제안한 순서는 일정 상세 → 경비 폼 → 홈 요약이다. 경로 재계산용 조회는 별도 판단으로 남겼다. 조회 조합의 유연성은 각 소비자가 필요한 query/access/actions/view를 선택할 수 있다는 뜻이며, 모든 소비자의 UI를 목록 화면처럼 만들거나 모든 Entity 훅을 폐기한다는 뜻이 아니다. query는 제한 중 캐시도 유지하므로 표시 정책 적용에는 소비 영역의 view/access 연결이 필요하다. 공통화의 조회 조건은 해당 observer·action에 적용되고, 다른 Entity observer나 QueryClient 무효화를 전역 통제하지 않는다.

## 기록 점검과 남은 경계

핵심 복구 정책, Query 상태·실행 분리, access 유지 이유, 일정·경비별 소유 위치, 제한적 feature 재사용, Project 문서 반영 보류, 393개 검사와 타입 오류·native 검증 한계는 기존 Ticket·records에 남아 있었다. 이번에는 커밋과 위 소비자별 조사·제안을 보완했다. Ticket에 남은 ‘경비 연결은 후속’ 표현과 Spec의 ‘먼저 일정에 적용’ 진행 문구도 현재 Owner에 맞게 정리했다. 기존 날짜별 기록은 고치지 않았다.

경비 상세에서 목록 캐시에 대상 ID가 없고 이전 오류가 있으며 Debug 표시 online·실제 offline이면 재시도 버튼이 보여도 canFetch가 false여서 요청하지 않는 기존 경계는 여전히 남는다. 이 문제와 일정 상세의 정책 누락은 앞선 [공통화 비교](2026-09-29-07-read-query-composition-trial.md)·[한 곳 시험](2026-09-29-08-schedule-read-query-actions-trial.md)에 연결된 후속 사항이며, 새 훅 도입만으로 해결됐다고 보지 않는다.

이번 확인은 문서·소스·Git 대조다. 제품 코드를 수정하거나 테스트를 새로 실행하지 않았다. 전체 client 41개 suite·393개 test 통과는 커밋 전 Main이 실행해 기록한 증거를 유지하며, 기존 타입 오류 3개·실기기/실서버 미확인·최종 UX 수락·2-C 토스트 및 Ticket 나머지 범위도 그대로 남는다. Project context와 기존 아키텍처·Policy guide는 변경하지 않았다.
