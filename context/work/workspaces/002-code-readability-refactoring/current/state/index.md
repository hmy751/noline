# 현재 상태와 다음 행동

## 현재 위치

제품 브랜치는 `refactor/app-startup-lifecycle`이다. 홈 안내·앱 복귀 재확인·여행 생성과 목록 갱신에 이어, 도시 시간대 작업을 `c7e9193`부터 `e76c582`까지 일곱 단위로 커밋했다. Ticket 06과 Workspace 전체는 진행 중이다.

현재는 **기존 UX 보고서에서 발견한 날짜·시간 선택창의 초기 표시 문제**를 이어서 다룰 단계다. [Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)은 원래 버그 검토와 현재 결과를, [Ticket 10](../memory/tickets/10-schedule-form-lifecycle.md)은 선택창과 폼의 책임을 소유한다. [이번 대화·커밋·검증 기록](../../records/2026-10-06-01-city-time-zone-commits-and-original-bug-continuity.md)에 선택 과정과 범위 정정이 있다.

## 완료한 결과와 확인 범위

- Trip이 도시의 IANA 시간대를 소유한다. Trip 기간·Schedule은 기존 UTC ISO datetime 저장을 유지하고 입력·표시·그룹은 여행 도시 기준으로 연결했다. Expense 날짜는 기존 YYYY-MM-DD를 유지하며 기본 날짜·연결 일정 날짜만 도시 기준으로 얻는다.
- 기존 시간대 미확정 여행은 안내와 UTC 조회 fallback을 사용한다. 도시 좌표로 시간대를 확인해도 과거 timestamp를 자동 이동시키지 않는다. 홈 대표 여행·기간과 활성 만료·cleanup도 같은 도시 기준을 사용한다.
- 도시 시간대 조회 가능성과 저장 정책을 구분하고 기존 useAppPolicy·Query·Router를 재사용한다. 새 여행의 Server 생성과 활성 여행 Local 수정, 비활성 Remote 수정은 유지한다.
- 마지막 단위까지의 client 검사는 57 suites / 632 tests 통과, schema build 통과다. client 타입 검사의 기존 7개 진단은 남으며 전체 타입 검사 통과는 아니다. 단위별 검사와 server 계약 검사 범위는 위 기록을 따른다.
- 앞선 native 검증에서는 기존 파리 여행의 시간대 확인, 도시 날짜·일정 시각 표시, 일정 시각 수정·복원과 서버 반영·큐 0을 확인했다. 일곱 커밋을 마칠 때마다 native 전체를 재실행한 것은 아니다.

공통 제품 의미는 [날짜와 시각](../../../../../project/common/date-and-time.md)이 소유한다. 이전 작업의 책임 교정은 [홈 기록](../../records/2026-10-04-01-home-summary-policy-and-ux-review.md), [복귀 기록](../../records/2026-10-04-02-foreground-network-refresh.md), [여행 목록 기록](../../records/2026-10-05-01-trip-list-routing-and-query-lifecycle.md)에서 이어 읽는다.

## 다음 행동

선택창을 열 때 폼의 현재 날짜와 시간이 바로 보이도록 기존 폼·공통 picker 연결을 확인하고 수정한다. 현재 CreateScheduleScreen은 DatePicker에 선택된 날짜를 전달하지 않으며, TimePicker는 선택 상태만 받고 해당 시간으로 스크롤하지 않는다. 이 문제는 도시 시간대 저장·표시 기준과 별개이고 아직 수정하지 않았다.

해당 범위에서 열기·변경·확인·단순 닫기·다시 열기와 폼 값 보존을 검증한다. 확인/취소 callback의 의미를 현재 소비자와 함께 살피며 전체 폼 개편이나 임의 reset 규칙을 먼저 정하지 않는다. 원래 보고서의 수정 결과와 남은 경계를 대조해 06 종료를 판단한다.

## 미확인·보류·후속 책임

실제 통신 단절 Local 저장·복구, 열린 폼의 실제 연결 전환, 새 여행 생성부터 activation까지의 native 전체 검증은 미확인이다. 필요한 대표 검증 범위를 현재 버그와 결과에 맞춰 정하고, 이 모든 시나리오를 자동으로 06의 필수 선행 조건에 올리지 않는다.

경비 삭제 실패 이유 유실·특정 상세 재시도 불일치는 사용자 보류를 유지하며 복구 토스트는 현재 추가하지 않는다. 기간 밖 일정 접근·500ms 경로 준비·정상 0 좌표·검색 부분 성공·수정 fallback은 후속 범위다. 08은 이번 도시 날짜 계산을 재사용하고 남은 계산·그룹을, 10·11은 남은 전체 폼을, 14·15·16·17은 각각 원자성·sync·cleanup·서버의 나머지 책임을 유지한다.

기존 앱·계정을 유지했으며 앱 삭제는 하지 않았다. 개발 앱·서버·Metro가 다음 실행에도 살아 있다고 가정하지 않는다. 제품 Verify receipt와 기계 status는 이번 기록 요청으로 변경하지 않는다.
