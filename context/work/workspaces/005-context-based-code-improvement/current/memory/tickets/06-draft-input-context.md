# 06 — 작성·장소·날짜 입력 Context

## 맡은 결과와 범위

일정·경비 작성의 초안, 선택창의 임시값, 확정된 저장값이 어떻게 연결되는지 설명하고 Places·시간·일정 연결의 서로 다른 책임을 찾게 한다. 열린 폼의 입력 보존뿐 아니라 검색 전환·일정 연결·저장 실패·picker 재열기와 실제 adapter의 역할을 다룬다.

도시 시간대·Expense date-only·통화·API 입력/응답의 이미 채택한 계약은 재사용하고 실제 폼 설명과 연결한다. 미완료 폼 전체·경로 준비·좌표 오류를 문서 작업으로 해결하거나 새로운 공통 제품 규칙으로 만들지 않는다.

## 실행 맥락과 접근

form/components/manual-input의 낡은 설명을 수정하고 TimeField의 구독·선택 수명, 화면/feature의 초안·submit 수명을 함께 설명한다. 제거된 ManualExpenseForm 예시를 현재 구조와 맞춘다. 공통 Places가 보장하는 resolved/unresolved 결과와 수정 화면에 남은 0/0 호환 adapter의 범위를 구별한다.

날짜·통화·API 본문은 기존 의미를 유지한 채 작성 경계와 충돌·누락이 없는지 확인한다. 날짜가 다른 일정 연결, DST/시간대 미확정, 날짜를 바꿨다 되돌린 수정처럼 결과가 갈리는 조건을 포함한다. 저장 용량/도시 검색의 기존 Context도 해당 기능을 바꾸지 않는 유지 판단으로 review-scope에 연결한다.

- [일정·Places 책임](../../../../002-code-readability-refactoring/records/2026-10-02-01-schedule-create-boundaries-and-verification.md)
- [경비 초안·연결·날짜](../../../../002-code-readability-refactoring/records/2026-10-02-03-expense-time-decisions-and-verification.md)
- [picker·TimeField](../../../../002-code-readability-refactoring/records/2026-10-06-02-picker-wheel-time-field-and-remaining-scope.md)
- [현재 폼 가이드](../../../../../../../.claude/context/form.md)
- [실제 adapter](../../../../../../../apps/client/src/shared/components/Form/TimeField.tsx)
- [날짜·시각 제품 계약](../../../../../../project/common/date-and-time.md)

## 완료 조건과 확인 방법

- 폼 초안과 picker 임시값의 Owner·확인/취소/재열기·다른 항목 전환을 실제 소비자에 대조한다.
- 네트워크 제한 중 기본 입력·기존 연결·후보 조회·저장 가능의 차이를 본문에서 이해한다.
- 장소 상세 실패와 유효 좌표, legacy 호환 처리의 범위를 설명하고 새 공통 요구로 올리지 않는다.
- 날짜·시각·통화와 API의 기존 계약을 보존하며 form 가이드·제품 본문·현재 코드 간 연결을 확인한다.
- 기존 가이드와 Project 입구에서 대표 폼 변경의 책임·조건·지원 한계를 찾을 수 있다.

## 구체화한 본문 구성과 확인 질문

중심 본문은 기존 form 가이드에 둔다. 화면의 작성 단계·폼 초안·picker 임시값·저장값의 수명을 먼저 설명하고 장소 선택, 일정 연결, 저장 요청까지 연결한다. components는 실제 TimeField adapter와 picker 책임 및 제거된 예시를 맞추고, manual-input은 기능별 제한과 중심 본문의 읽기 경로를 잇는다. 날짜·통화·API의 기존 본문은 상세 Owner를 유지한다.

| 묶음 | 본문이 답할 질문과 확인한 공백 |
| --- | --- |
| 작성 초안과 제출 | 검색으로 돌아가거나 연결이 바뀌어도 어떤 값이 남는가? 제목을 고친 뒤 장소를 바꾸면 무엇이 달라지는가? 저장 실패·중복 입력·종료의 책임은 어디인가? 기존 form 가이드는 일반 계층 표만 있어 현재 수명을 설명하지 못한다. |
| 장소 후보와 채택 | 지도에 보이는 후보가 초안에 채택됐다는 뜻인가? 상세 실패·유효 좌표·이전 검색 결과의 선택 가능은 어떻게 다른가? 공통 Places의 정상 결과 보장과 수정 feature의 0/0 호환 처리를 구별한다. |
| 선택창과 날짜 입력 | 날짜 탭은 즉시 반영되지만 시간은 확인 때 반영된다. 닫기·재열기·다른 일정 전환에서 어느 값을 사용하는가? TimeField가 구독·열기·확인을 맡는 현재 구조를 반영한다. |
| 저장 요청과 기존 계약 | 최종 날짜·시간을 원래 값으로 되돌렸으면 왜 재전송하지 않는가? 시간대 미확정·DST 오류·경비 일정 연결은 어떤 계약을 따르는가? 이미 충분한 날짜·Policy 본문을 연결하고 새 공통 규칙을 만들지 않는다. |

날짜·시각은 10월 2일 기록 뒤 도시 시간대 후속 변경이 있었으므로 현재 Project 본문·소비자와 [최종 종료 기록](../../../../002-code-readability-refactoring/records/2026-10-06-03-ticket-06-closure-and-followups.md)을 함께 적용한다. 002의 당시 Ticket 06은 합의 범위가 종료됐으며, 그 뒤의 전체 폼 수명·경로 준비·native 미확인과 이번 005-06 Context 작업을 혼동하지 않는다.

## 현재 상태와 실제 결과

본문 보완과 대표 읽기·근거 대조를 마쳤다. [작성·입력 가이드](../../../../../../../.claude/context/form.md)에 작성 단계·초안·picker 임시값·저장값의 수명, 장소 후보/채택/상세 실패, 경비 일정 연결, 요청 변환과 저장 실패를 하나의 흐름으로 설명했다. 일정·경비 수정의 서로 다른 초기화 조건, 늦은 날짜와 통화 기본값의 차이도 현재 지원 범위로 남겼다.

components는 TimeField adapter·picker의 책임과 제거된 ManualExpenseForm 예시를 맞췄고, manual-input은 단일 폼·저장 경로를 보존하며 실제 생성 필수값과 장소 좌표 연결을 정정했다. Project·client·Context 지도·Form runbook·날짜 본문이 같은 가이드로 이어진다. 날짜·통화·API·도시 검색의 상세 Owner는 유지하고 중복 본문을 만들지 않았다.

Main이 본문에서 대표 질문의 답을 읽고 현재 소스와 기존 검사 입력·assertion·대역 범위를 대조했다. 기존 Jest 12개 suite·118개 test가 통과했다. 제품 코드·테스트는 수정하지 않았으며, 실제 인터넷 단절·HTTP·지도·Android나 모든 폼의 취소 복원을 검증한 결과는 아니다. 변경 문서의 링크·절 이동·형식과 명시적 005 Recover를 확인했고 전체 harness 검사의 기존 역사 링크 8건은 남는다.

경로 준비·좌표 후속과 전체 폼 수명, 경비 삭제 실패 이유·특정 상세 재시도 보류는 유지한다. [완료 기록](../../../records/2026-10-30-15-draft-input-context.md)에 읽기 질문·선택 이유·검사 범위를 남겼다. 04–06의 Context 보완 결과가 갖춰졌으며, Personal·협업·스킬 개선이나 002의 미완료 제품 구현은 별도 범위다.

사용자의 저장 요청에 따라 사전 대조·완료 기록과 본문을 함께 커밋한다. 최종 형식·재진입 확인과 저장 범위는 [정리 기록](../../../records/2026-10-30-16-context-completion-save.md)에 남긴다.
