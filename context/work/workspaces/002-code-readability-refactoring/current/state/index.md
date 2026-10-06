# 현재 상태와 다음 행동

## 현재 위치

제품 브랜치는 `refactor/app-startup-lifecycle`, 최신 제품 커밋은 `3ab8f55`다. 날짜·시간 선택창의 현재 값 연결, 중앙 고정 시간 휠, TimeField adapter와 일정 생성/수정 적용을 완료해 두 커밋으로 저장했다. Ticket 06은 기존 UX 보고서·누적 결과를 대조하고 남은 경계를 설명한 뒤 사용자의 마무리 요청에 따라 합의된 범위를 완료했다. Workspace 전체와 후속 Ticket은 계속 남는다.

[Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)은 원래 UX 문제와 종료 경계를, [Ticket 10](../memory/tickets/10-schedule-form-lifecycle.md)은 picker·폼의 책임과 남은 입력 수명을 소유한다. [구현·검증 기록](../../records/2026-10-06-02-picker-wheel-time-field-and-remaining-scope.md)에 설계와 검증 근거를, [06 종료 기록](../../records/2026-10-06-03-ticket-06-closure-and-followups.md)에 보고서 대조·마무리 승인과 남은 네 범주의 의미를 보존했다.

## 현재 결과와 근거

- 앞선 도시 시간대 작업의 UTC ISO Trip/Schedule 저장, 도시 기준 입력·표시, Expense date-only 및 기존 데이터 보존 계약을 유지한다. [시간대 기록](../../records/2026-10-06-01-city-time-zone-commits-and-original-bug-continuity.md)과 [제품 날짜·시각 기준](../../../../../project/common/date-and-time.md)을 따른다.
- `09b07f8`: 시·분이 중앙 선택 줄에서 읽히는 유한 휠. `3ab8f55`: 현재 날짜로 달력 열기·재열기, 시간 확인/닫기 분리와 TimeField 소비 연결. 시간 picker는 RHF 독립 UI이고 adapter가 값·오류 구독과 선택창 수명을 맡는다.
- 최종 client Jest 60 suites / 650 tests 통과. 독립 리뷰의 미해결 지적은 없었으며 client 타입 검사의 기존 7개 진단은 남는다. 전체 타입 검사 통과와 구별한다.
- iOS 단계별 관찰에서 현재 날짜·시간 열기, 날짜 재열기, 휠 이동·중앙 정렬·시/분 독립 변경, 시간 확인·재열기와 폼 취소 후 저장값 보존을 확인했다. 새 휠의 23:59 native와 Android는 미확인이다. 마지막 TimeField smoke의 네트워크 redbox는 별도 관찰이며 이번에 원인을 해결한 결과는 아니다.

## 다음 행동

다음 기본 후보는 [07 — client API 경계](../memory/tickets/07-client-api-boundaries.md)다. 착수 시 오래된 최초 조사와 현재 코드를 대조하고, 이미 해결된 Trip PUT·인증 응답·inactive child 연결을 재사용한다. 다음 구현에 착수한 상태는 아니다.

다음 앱 실행에서 sync·목록 Network Error가 재발하면 실제 연결·API 가용성과 요청 경로를 확인해 환경 문제와 제품 문제를 구분한다. 원인 조사 제안은 남겨 두되, 이번 마무리에서 실행하거나 07의 필수 선행으로 정하지 않았다.

후속 위임은 사용자가 지정한 GPT-6-sol / medium을 구현·리뷰·검증에 적용한다.

## 미확인·보류·후속 책임

실제 통신 단절 Local 저장·복구, 열린 폼의 실제 연결 전환, 새 여행 생성부터 activation까지의 native 전체는 미확인이다. 이를 모두 자동으로 06의 필수 선행 조건에 올리지 않는다. 경비 삭제 실패 이유 유실·특정 상세 재시도 불일치는 사용자 보류이며 복구 토스트는 현재 추가하지 않는다.

07–18의 나머지 범위는 [Ticket 색인](../memory/tickets/index.md)에서 이어간다. 08은 기간 밖 접근·날짜 계산/그룹, 09는 활성화 준비, 10·11은 전체 폼 수명, 12는 경비 표시, 13은 저장 이후 경로 준비·좌표·검색 후속, 14–17은 원자성·sync·cleanup·서버 경계, 18은 전체 종료 검토를 맡는다. 선행 조각을 재사용하며 이들 전체를 완료로 보지 않는다.

기존 앱·계정·데이터를 유지했다. 개발 앱·서버·Metro가 다음 실행에도 살아 있다고 가정하지 않는다. 이번 문서 반영은 제품 Verify receipt·기계 status·자동 session binding을 변경하지 않는다.
