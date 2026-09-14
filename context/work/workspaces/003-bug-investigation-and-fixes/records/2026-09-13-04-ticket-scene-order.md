# 첫 사용 장면 순서에 따른 티켓 번호 재배치

사용자는 티켓 구성 다음에 다음을 요청했다.

> “앱을 키면 초기 화면이잖아? 그리고 여기서 가장 나중에 볼 장면도 있고 그래서 먼저 볼 장면 순서대로 티켓 번호를 재배치 해줘”

Main은 기존 14개 티켓의 결과·범위·완료 조건을 유지하고 앱 시작에서 마지막 확인으로 읽는 순서로 번호를 바꿨다. 파일명·제목·현재 후보와 티켓 본문의 참조·색인·state를 함께 맞췄다. 제품 수정·검증이나 새로운 기능 분해는 하지 않았다.

앱 준비와 인증을 맨 앞에 두고 홈에서 여행 생성·선택, 활성화와 지도 준비를 이어 본다. 그다음 일정·경비 입력/편집·날짜·지도 확인, 오프라인 저장·재연결·서버 변경 수신을 배치했다. 서버 소유권/응답의 교차 대조와 실제 iOS 전체 검증을 마지막에 둔다. 홈의 활성화 흐름은 [TripsSection](../../../../../apps/client/src/screens/HomeScreen/TripsSection.tsx)에서 확인한 현재 코드에 근거하며 실제 앱 조작 결과는 아니다.

여러 시점에 걸친 티켓은 처음 관련되는 장면을 기준으로 뒀다. 로그인 티켓의 계정 종료/전환, 여행 관리 티켓의 삭제, 활성화 티켓의 재활성화는 후반 사용에서도 재확인한다. 뒤 번호의 데이터 보존·서버 계약이 앞 장면 구현의 선행 조건일 수 있으므로 본문의 기술 의존 관계를 삭제하거나 새 번호 순서로 바꾸지 않았다.

## 이전 번호와 현재 번호

[초기 구성 기록](2026-09-13-03-ticket-composition.md)은 당시 번호를 유지하는 과거 기록이다. 그 기록의 숫자는 아래 대응으로 읽으며, 현재 정의와 진행은 새 티켓 본문을 따른다.

| 이전 번호 | 현재 티켓 |
| --- | --- |
| 13 | [01. 앱 준비 실패와 조회·저장 오류 복구](../current/memory/tickets/01-startup-and-error-recovery.md) |
| 04 | [02. 로그인 복구와 계정 전환의 데이터 보호](../current/memory/tickets/02-auth-account-recovery.md) |
| 05 | [03. 여행 생성·선택·수정·삭제의 연결](../current/memory/tickets/03-trip-management.md) |
| 06 | [04. 활성화·비활성화·재활성화의 데이터 안전](../current/memory/tickets/04-activation-data-lifecycle.md) |
| 07 | [05. 오프라인 지도 준비 상태와 재시도](../current/memory/tickets/05-offline-map-readiness.md) |
| 09 | [06. 폼의 초기값·취소·재진입 일관성](../current/memory/tickets/06-form-state-and-defaults.md) |
| 08 | [07. 비활성 여행의 일정·경비 작업](../current/memory/tickets/07-inactive-child-operations.md) |
| 10 | [08. 날짜 의미와 여행 기간 밖 항목 접근](../current/memory/tickets/08-date-and-range-consistency.md) |
| 11 | [09. 장소 검색·지도 이동·경로 최신성](../current/memory/tickets/09-map-search-route-behavior.md) |
| 01 | [10. 로컬 저장과 미전송 작업 보존](../current/memory/tickets/10-local-write-queue-safety.md) |
| 02 | [11. 동기화 실패·재시도·중단 복구](../current/memory/tickets/11-sync-retry-recovery.md) |
| 03 | [12. Pull 누락과 미전송 수정 덮어쓰기 방지](../current/memory/tickets/12-pull-consistency.md) |
| 12 | [13. 서버 소유권과 응답 계약](../current/memory/tickets/13-server-scope-and-contracts.md) |
| 14 | [14. 개발자 첫 사용의 iOS 통합 검증](../current/memory/tickets/14-first-use-integrated-verification.md) |

현재 순서는 [Ticket 색인](../current/memory/tickets/index.md)에서 한 번에 볼 수 있다. 기존 티켓을 삭제해 내용을 버린 것이 아니라 13개 파일을 이름 변경했고, 마지막 14번은 그대로 유지했다.
