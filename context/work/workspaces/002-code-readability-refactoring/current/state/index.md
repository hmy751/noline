# 현재 상태와 다음 행동

## 완료·수락된 범위

사용자는 [01번 Ticket](../memory/tickets/01-expense-totals.md)부터 [05번 Ticket](../memory/tickets/05-schedule-response.md)까지를 완료된 결과로 확정했다. 각 결과는 해당 Ticket의 검사와 미확인 한계를 포함한 범위에서 수락됐으며 Workspace나 제품 전체 완료를 뜻하지 않는다.

- 01은 제한된 fixture·정적 검사 범위에서 경비 합계 표시의 반복 해석을 줄였다.
- 02는 fixture·별도 verifier 범위에서 도시 선별과 변환을 정리했다.
- 03은 SQLite·Mapbox 집계, 부분 실패와 React 연결을 나눴다. development build·실기기·native module 미확인은 남아 있다.
- 04는 fetcher를 mock한 범위에서 Expense API 요청 검증·HTTP·응답 검증·반환 흐름을 정리했다.
- 05는 Schedule 날짜 직렬화, response schema, ownership·soft-delete를 완료했다. 실제 JWT·배포 process와 일부 통합 범위는 확인하지 않았다.

제품 Verify receipt는 없으며 이 수락을 native·외부 서비스·전체 서버 계약의 검증으로 확대하지 않는다. 선택된 제품 산출물과 저장 경계는 [output](../../output/index.md)에서 찾는다.

## 공통 기준과 Project Context 후보

Ticket 03의 초기 범위가 개선 깊이를 충분히 전달하지 못한 사례를 계기로 공통 운영 기준은 목표에 필요한 일을 찾고 맡은 결과·필요한 범위·완료 근거로 실행을 판단하도록 보완됐다. 현재 정본은 [공통 운영 기준](../../../spec-and-tickets/README.md)이 소유한다. 대화 맥락 없는 세션에서의 독립 적용 재검증은 아직 없다.

Project Context 후보 구성에는 Ticket 01–05와 관련 records·output·실제 코드를 주 자료로, `_archive`를 제외한 기존 `.claude/context`·decisions·sessions·CHANGELOG를 보조 자료로 사용한다. Ticket 06 이후는 이 구성 범위에서 제외하지만 Workspace의 후속 리팩토링 범위에는 남는다.

Project-wide 판단으로 남은 항목은 Expense 날짜 계약, 금액 반올림·정밀도와 서버 오류 처리의 목표 구조다. Project Context의 실제 반영은 이 Workspace Maintain의 소유 범위가 아니며 완료로 간주하지 않는다.

## Ticket 06 — 앱 준비·복원·선택·정리 연결 구현

[Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)은 DB 실패 안내·재시도, 인증 복원, 여행 선택 보존과 서버 제거 확인 후 전환, pending cleanup 공유 실행과 로그아웃/탈퇴 종료 조율을 구현했다. 앱 전체 준비의 상태·순서·Splash·실패/재시도는 `application/AppInitialization`에 모으고 `_layout.tsx`는 화면·Provider·인증 후 작업 연결을 보여 준다. Auth Store는 보안 저장소와 인증 상태를 소유한다. 독립 리뷰를 바탕으로 함수 배치·이름·주석·로그·테스트 구조를 보완했다.

Main이 직접 실행한 최신 전체 client Jest는 14개 suite·154개 test 통과다. 변경된 TypeScript 39개 파일의 ESLint 오류는 0개·경고는 26개이며 Prettier 규칙은 도구 연동 오류 때문에 별도로 검사했다. 포맷·diff 검사는 통과했고 타입 검사에는 기존 지도 관련 오류 3개만 남는다. 실제 기기·native·SQLite 데이터 보존·서버 실행은 미확인이다. 앱 초기화·스타일 개선과 관련 테스트·Workspace 기록은 `refactor(client): 앱 초기화 경계와 실패 복구 흐름 정리` 커밋으로 함께 저장했다. 기존 Network·Provider 저장 결과는 유지한다.

다음 실행 후보는 **DB 준비·인증 상태·실제 online·override 해제에 따른 SyncProvider 시작/해제와 Debug 수동 sync의 우회 연결**이다. DB 준비와 인증 복원 시도 완료 뒤 Provider가 mount되는 결과는 만들었지만, 비인증 시작 차단과 login/logout 반응까지 해결한 것은 아니다. 현재 startup 결과의 사용자 검토와 함께 다음 범위를 구체화한다.

Ticket 06에는 인증 route guard 전체, 대상별 Trip Router 분기·inactive child Local 선조회, 제한/복구 화면 전체와 foreground 재확인이 남는다. 이 미구현을 근거로 이번 기록 작업 중 제품 변경을 추가하지 않는다. 초기화·선택·cleanup의 현재 계약은 Ticket, 선택 이유·리뷰 반영과 검증의 상세는 [최신 기록](../../records/2026-09-18-02-app-initialization-and-style.md), 코드 읽기 경로는 [output](../../output/index.md)이 소유한다. Ticket 전체의 최종 수락과 Workspace 완료는 아직 없다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. Ticket 06의 DB·auth 실패 처리와 선택 적용은 위 결과에 포함하며, 남은 routing·sync·네트워크 소비 연결은 해당 Ticket에서 이어 간다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
