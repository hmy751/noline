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

## 현재 상태와 실제 결과

실행 범위를 구성했다. 앞선 전체 대응 조사에서 관련 기록·Context·코드 일부를 확보했다. 본문 보완과 대표 읽기 확인은 아직 수행하지 않았다. 실제 편집 시 현재판과 후속 결정을 확인하고 결과를 이 본문에 갱신한다.
