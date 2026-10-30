# 002의 실제 축적과 현재 Context 대응

2026-10-30. 사용자 정정: “아니 근데 02에서 그렇게 작업을 많이 했는데 context 보완이 로그인 하나라고?” 직전 조사에서 인증 공백을 발견한 것은 유효하지만, 큰 재작업 사례만으로 전체 보완 후보를 대표하고 인증을 우선 추천한 판단은 철회한다. 문서에 한 기준이 있다는 사실도 해당 작업에서 얻은 조건·이유·책임 관계가 충분히 반영됐다는 뜻은 아니다.

별도 self-check는 재작업·실패 중심의 선별이 다시 범위를 좁혔고, 실제 수행·채택·좋은 구현·제품 의미·현재 제약을 먼저 펼쳐야 한다고 판단했다. Main은 이 기준을 적용했다. 아래는 새 Ticket 목록이나 파일 생성 계획이 아니라 실제 결과와 Context의 대응이다.

## 실제 작업에서 얻은 의미의 분포

002의 [Ticket 색인](../../002-code-readability-refactoring/current/memory/tickets/index.md), [전체 기록 색인](../../002-code-readability-refactoring/records/README.md), [현재 상태](../../002-code-readability-refactoring/current/state/index.md)와 [06 종료 대조](../../002-code-readability-refactoring/records/2026-10-06-03-ticket-06-closure-and-followups.md)를 기준으로 계획과 수행을 구별했다. 01–05의 초기 개선 이후 06에서 앱 준비·인증·네트워크·조회·작성·시간대·선택창까지 실제 작업이 이어졌다. 07–18은 계획 전체가 완료된 것이 아니라 일부 선행 결과가 반영된 상태다.

| 실제로 축적한 내용 | 현재 Context와 대조 | 보완 판단 |
| --- | --- | --- |
| 경비 합계의 강조·정밀도, 도시 선별·수도 예외, 저장 용량 집계·부분 실패 | Project의 currency, city-search, storage-statistics 및 리팩터링 가이드에 구체 의미와 사례가 있다. | 이미 반영된 축적이다. 새 문서 대상으로 재등록하지 않으며 후속 변경이 해당 계약을 바꿀 때 보완한다. |
| API 요청/응답 검증, 서버 serializer와 Schedule ownership·soft-delete, Trip·Expense 변환의 선행 조각 | api-contracts와 date-and-time이 응답 변환·입수 검사·각 경계의 역할 및 증명 범위를 설명한다. | 이미 상당 부분 반영됐다. 후속 route 전체·실제 JWT 검증까지 끝났다고 넓히지 않는다. |
| 앱 필수 준비와 실패·재시도, 화면 연결과 로그인 후 작업의 책임 | current/architecture는 09-14 구조를 설명하며 이후 추가된 application/AppInitialization과 준비 완료의 의미를 다루지 않는다. 당시 기록에는 DB 실패와 인증 복원 실패의 구별, 재시도·해제 후 늦은 완료가 있다. | 현재 구조·앱 진입 설명 보완 대상이다. 초기 인증 실패 결정은 후속 restore-failed 정책과 대조해 복원해야 한다. |
| 인증 복원·로컬 이용·재인증·세션 교체와 소비 방법 | 최종 계약이 결정·Work 기록·Store/서비스에 흩어져 있다. | 인증 설명 복원 후보는 유지한다. 전체 후보 비교 전 유일하거나 최우선이라고 정하지 않는다. |
| 네트워크 관측과 표시 override, unknown·재확인, 앱 복귀와 구독 수명 | policy-architecture에는 권한·unknown 안내와 실제/표시 구분이 있다. Network Store가 AppState/NetInfo 구독, 요청 공유, 늦은 응답 무시를 맡는 현재 관계는 이 설명만으로 복원하기 어렵다. | 기존 정책 내용과 연결되는 네트워크 수명·소비 설명을 보완한다. 모든 구현 helper를 나열할 필요는 없다. |
| sync 시작/중단, cleanup 대기, 세션 종료와 DB 작업 조율 | 현재 구조와 selective-activation은 engine·queue·Provider 경로를 소개하지만 세션 변경과 진행 중 작업의 종료 관계를 충분히 다루지 않는다. | 앱 수명·데이터 보존의 연결 설명 보완 대상이다. 당시 중간 종료 순서를 그대로 옮기지 않고 현재 withSessionChange와 대조한다. |
| 비동기 transaction 완료·동시 DB 작업 순서 | compact rule은 행과 queue의 원자성을 요구한다. 현재 DB 구현은 async callback을 기다리지 않는 동기 transaction의 한계를 피하고 작업을 직렬화하며 종료 중 새 저장을 막는다. | 원자성 원칙에 더해 올바른 구현 진입·선택 이유·사용 제약을 연결할 필요가 있다. sync/cleanup 전체의 안전 보장으로 확대하지 않는다. |
| 일정·경비 Query 복구, 상태/접근/실행/표시 분리, 홈 요약 | policy 문서는 읽기 제한과 cache 보존을 담는다. 성공한 빈 결과·최초 실패·갱신 실패·부분 cache 및 화면별 표현 책임은 Work의 조합·홈 기록이 더 구체적이다. | 기존 조회·오류 설명 보완 후보다. 사용자가 당시 Project 승격을 미룬 feature 재사용 예외와 현재 동작 설명의 복원은 구별한다. |
| 일정 단일 초안·검색 전환과 Places 책임 | policy/manual-input은 열린 초안과 기능별 제한을 담지만, 공통 장소 결과와 수정 화면의 0/0 호환 처리를 분리한 선택까지 설명하지 않는다. | 작성 수명·장소 서비스 소비 관계 보완 대상이다. legacy 0/0을 새 공통 정책으로 올리지 않는다. |
| 경비 날짜와 일정 연결, 전체 여행 후보, 저장 실패 때 초안 보존 | product·policy·manual-input·date-and-time에 날짜 독립·offline 연결·request/저장 경계가 반영됐다. submit 잠금·오류 이유·폼 유지의 역할은 실제 form과 기록에서 추가로 확인해야 한다. | 제품 의미는 재사용한다. 폼 가이드의 저장·실패 수명 설명은 보완 후보이며 경비 삭제 오류의 보류를 해결된 것으로 쓰지 않는다. |
| 도시 시간대와 UTC 시점, Expense date-only, DST와 기존 자료 호환 | date-and-time에 도시 기준·미확정 시간대·원본 시점 보존·호환 입력·Local/Remote 경계가 상세히 반영됐다. | 로그인 외에도 큰 Context 축적이 이미 있다는 직접 근거다. 문서 존재만이 아니라 이 조건들이 실제 본문에 있음을 확인했다. 이번에 전체 시간 구현을 새로 실행 검증한 것은 아니다. |
| DatePicker/TimePicker의 임시 선택, 확인·취소·재열기, TimeField adapter | form.md는 picker state를 feature hook 책임으로 설명하고 TimeField/useController의 현재 연결이 없다. 실제 TimeField가 구독·열기·확인 반영을 맡는다. components.md에는 제거된 ManualExpenseForm 예시도 남는다. | 기존 폼·컴포넌트 설명을 수정할 직접 근거다. 폼 값·저장값·선택창 임시값의 수명과 적용 범위를 함께 보완한다. |
| 여행 생성과 목록 사본 반영·선택 보존·취소/갱신 | selective-activation에 비활성 생성, remote/mixed/local, 미전송 부모 보존, 이전 응답 취소, application 단일 구독과 오류별 fallback이 반영됐다. | 이미 반영된 중요한 결과다. 002 후반 전체가 미반영이라는 결론도 틀리다. |
| client/server 검사 기반, 실제 hook·route·DB/native의 증명 경계 | current/architecture와 api-contracts·리팩터링 가이드에 Jest/Vitest/Supertest와 mock의 한계가 있다. | 검사 기반을 새 Context로 반복 생성하지 않는다. 실행 환경의 일시적 실패·검사 수는 Work에 남긴다. |

## Personal에 이어볼 의미

Personal에는 공통 제공과 사용처 선택, 계약과 수명, 이름·책임·완료 등의 기준과 기존 사례가 있다. 002에서 얻은 결과를 연결할 후보는 다음처럼 구체적이다.

- TimeField: 입력 UI의 독립성과 폼 연결의 응집성을 함께 유지한 사례. 모든 Field를 일체형으로 바꾸라는 일반화와 구별한다.
- 홈 요약: 기존 Query 결과를 새 상태로 다시 포장하지 않고, 화면이 필요한 표시 차이를 소유하도록 단순화한 사례. 기존 API가 있다는 이유로 무조건 재사용하라는 규칙은 아니다.
- foreground 재확인: 실행 위치가 앱 진입 근처라는 이유로 AppInitialization에 구독을 추가하지 않고, 기존 Network Store의 시작·종료 수명에 연결한 사례.
- 인증·DB·sync: 로컬 저장 완료, 작업 호출 완료, 모든 전송 성공을 이름과 테스트에서 구별해야 하는 사례.

이는 기존 Personal의 조건·사례를 실제 제품 경험과 대조할 후보다. 이 목록만으로 개인 일반 기준을 새로 채택하거나 prototype 사례를 실제 검증된 사례로 바꾸지 않는다. 본문 통합 시 기존 사례와 차이·효용을 대조하고 제품 계약은 Project에 둔다.

## 근거와 남은 확인

현재 코드에서 AppInitialization, TimeField, Network Store의 foreground 연결, DB transaction/중단, Places 결과 타입과 수정 화면 호환 adapter를 직접 읽었다. 인증·조회 공통 코드는 [직전 대조](2026-10-30-07-impact-and-context-reassessment.md)에서 확보한 근거를 재사용했다. 현재 Context는 Project 날짜·구조·API/리팩터링 안내, 기존 정책·form·manual-input·components·선택적 활성화·오류·transaction 규칙의 관련 본문을 대조했다.

작업의 이유·조건은 002의 [앱 준비](../../002-code-readability-refactoring/records/2026-09-18-02-app-initialization-and-style.md), [sync 종료 대기](../../002-code-readability-refactoring/records/2026-09-18-03-sync-start-and-session-teardown.md), [경비 날짜·연결](../../002-code-readability-refactoring/records/2026-10-02-03-expense-time-decisions-and-verification.md), [홈 요약](../../002-code-readability-refactoring/records/2026-10-04-01-home-summary-policy-and-ux-review.md), [foreground](../../002-code-readability-refactoring/records/2026-10-04-02-foreground-network-refresh.md), [picker/TimeField](../../002-code-readability-refactoring/records/2026-10-06-02-picker-wheel-time-field-and-remaining-scope.md) 및 직전 조사에 연결된 기록에서 확인했다. 일부 긴 기록은 관련 구간을 읽었으며 색인 순회가 모든 원문·구현의 전수 검증을 뜻하지 않는다.

현재 결론은 인증 단독 보완이 아니라 **여러 구조·수명 설명의 공백, 낡은 가이드, 이미 충분히 반영된 제품 의미, 사례로 발전시킬 경험이 함께 존재한다**는 것이다. 실제 보완에서는 먼저 확인된 내용 불일치와 빠진 관계를 기존 Owner에 통합하고, 새 주제·권위 이동·일반화는 필요한 만큼 선택한다. 한 행을 한 Ticket이나 한 파일로 만들지 않는다. 이번에는 전체 대응과 현재 판단을 정정했으며 Project·제품 코드·일반 기준은 변경하지 않았다.
