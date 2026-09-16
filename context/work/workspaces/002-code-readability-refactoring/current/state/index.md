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

## Ticket 06 — 네트워크 정책 합의, 구현 준비

현재는 [Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)의 Network Store·Activation Router·Policy·조회 화면·sync 시작을 함께 연결하는 첫 범위를 우선한다. 정책 인터뷰의 큰 선택은 정리됐고, 2026-09-16에 대화와 실제 문서를 대조해 누락된 합의를 반영했다. 선택 이유·조사 근거·정정은 [논의 기록](../../records/2026-09-16-01-network-policy-and-implementation-boundaries.md)에 있다.

이 범위에 직접 필요한 수정은 003으로 나누지 않고 002에서 함께 수행한다. 대상 여행별 Router 분기와 inactive child의 Local 선조회 문제를 06에서 정상화하고 [14번](../memory/tickets/14-local-mutation-router-transaction.md)이 결과를 재사용한다. Local mutation·queue 원자성은 14, sync 내부 결과·재시도는 15, cleanup은 16의 남은 범위다.

현재 코드에서는 Network Store의 임시 online 기본값, null의 offline 축약, override가 실제 요청 판단까지 바꾸는 구조, inactive Remote 경로와 제한 화면·일반 오류의 연결이 개선 대상이다. Store의 타입 변경만으로 끝낼 수 없으며 실제 소비자까지 함께 연결한다.

채택한 기준은 다음과 같다.

- 실제 상태는 unknown/online/offline이다. NetInfo의 두 값 중 명시적 false가 있으면 offline, 둘 다 true이면 online, 나머지는 unknown이다. 초기뿐 아니라 이후 미확정 관측에도 적용한다.
- 네트워크 확인 때문에 전체 Splash를 유지하지 않는다. 정상 모드의 활성 여행 Local 이용은 계속하고 비활성 여행 Remote 조회·쓰기, Network-First Service와 sync 시작은 실제 online을 기다린다.
- unknown의 제한 영역은 처음에 확인 중을 표시하고 10초 뒤에도 미확정이면 확인 불가·재확인으로 바꾼다. unknown 자체를 offline으로 바꾸지 않으며 늦은 관측은 반영한다.
- 탭·여행 기본 정보·활성 상태·사용자 선택을 유지한다. 비활성 여행 내용은 제한 안내로 표시하고 React Query 캐시는 그대로 둔다. 실제 online 복구 뒤 같은 여행을 보고 있을 때 재조회하고 성공하면 한 번의 복구 토스트를 표시한다. 초기 unknown 해소에는 토스트를 붙이지 않는다.
- 비활성 여행의 쓰기는 Router가 실행 시점에 차단하고 기존 오류 처리에서 이유를 안내한다. 버튼별 네트워크 검사는 추가하지 않는다. 폼 입력을 유지하고 복구 후 자동 저장 없이 사용자가 재시도한다.
- 온라인 비활성 여행은 일반 서버 기반 앱의 기존 생성·수정·삭제 계약을 따른다. 이미 전송한 요청의 오류도 일반 요청 처리로 다루며 별도 결과 추적·자동 복구 대조 시스템은 추가하지 않는다.
- debug는 기존 override를 화면 표시·제한 이유에 사용한다. 실제 요청은 실제 관측으로 판단하고 override 중 Local 변경·queue 추가·Remote 쓰기·새 sync 전송을 막는다. 별도 앱 전체 debug 모드 시스템은 만들지 않는다.
- weak/degraded와 선제적인 debounce·NetInfo 시간 조정은 추가하지 않는다. 반복 sync·토스트·자동 선택 변경 등 실제 부작용을 막고, 기기 관찰에서 문제가 확인되면 재검토한다.

다음 행동은 Ticket 06의 구현 접근을 현재 호출부에 연결해 변경 범위와 회귀 사례를 확정하는 것이다. Store lifecycle·재확인, 순수 정책 판단의 재사용, 대상 tripId·활성 상태 로딩, 기존 화면·오류 연결, DB·auth·실제 online·debug·동시 실행을 조합한 sync 시작을 구체화한다. Trip 신규 생성 분기와 PATCH/PUT는 기존 계약을 대조해 07·17과 필요한 수정 담당을 맞춘다. 사용자 경험을 바꾸는 추가 선택이 드러나면 그 부분만 논의한다.

앞선 NetInfo 11.4.1 소스·mock 특성화는 정상 online의 주기 검사마다 unknown이 반복되지 않는다는 판단 근거다. 실제 기기 변동 빈도를 측정하지 않았으며 실기기 확인을 정책 결정의 선행 조건으로 두지 않았다. 앞선 client baseline 18개 test 통과도 당시 제한된 실행 보고이고 이번 문서 갱신에서 재실행한 결과가 아니다.

로컬 환경 설정은 development의 LAN API·로컬 PostgreSQL과 production의 Render API·Neon PostgreSQL을 구분하지만 실행 앱·배포 서버·실제 데이터 격리는 미확인이다. 따라서 실제 쓰기를 허용하는 debug 실험은 환경 격리 확인 뒤 다시 판단한다.

제품 코드·영구 test 변경과 Ticket 06 최종 수락은 아직 없다. 이번 갱신은 Main의 명시적 문서 복원이며 Maintain generation 2의 실패·pending 재처리 성공을 뜻하지 않는다. 해당 자동 경로의 실패는 남아 있어 후속 자동 반영의 정상 동작도 확인되지 않았다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. DB·auth 실패, routing과 여행 선택 등 Ticket 06의 나머지 범위는 첫 네트워크 결과 뒤에 이어서 판단한다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
