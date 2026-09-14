# 미합의된 제품 계약을 구체화하고 반영

## 맡은 결과

사용자가 실제 사용자 장면과 구현 차이를 이해하고 날짜·금액·통화 라벨·서버 오류 계약을 선택할 수 있게 한 뒤, 합의한 기준과 남은 구현 차이를 관련 Owner에 반영한다. 열린 문제 목록을 옮기는 것만으로 끝내지 않는다. Spec의 [대표 사례](../spec/02-behavior-and-cases.md)와 [완료 기준](../spec/04-quality-and-completion.md)을 적용한다.

## 실행 맥락과 접근

날짜는 [생성 form schema](../../../../../../../apps/client/src/features/expense/create-expense/schema.ts), [form hook](../../../../../../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts), [Expense request](../../../../../../../packages/schema/src/requests/expense.ts), [local datasource](../../../../../../../apps/client/src/entities/expense/lib/expense-local.ts), [entity](../../../../../../../packages/schema/src/entities/expense.ts), [server serializer](../../../../../../../apps/server/src/serializers/expense.ts)를 대조한다. Entity·수정 요청/응답의 date-only와 생성 form의 datetime, 생성 요청의 느슨한 검증, local 원값 저장을 먼저 구별한다. 현지 발생일을 timezone이 바뀌어도 보존해야 하는지 등 사용자 장면으로 선택지를 설명한다. Trip 날짜는 관련된 질문이지만 모든 시간 필드를 일괄 변경하는 결론을 먼저 정하지 않는다.

통화는 [helper](../../../../../../../apps/client/src/shared/lib/currency.ts), [합계 화면](../../../../../../../apps/client/src/screens/ExpensesScreen.tsx), [schema](../../../../../../../packages/schema/src/entities/expense.ts), [DB](../../../../../../../apps/server/src/db/schema.ts)와 기존 currency 문서의 commit 원문을 대조한다. ‘주 통화’가 기본값·첫 표시 그룹·빈도·환산 가치 중 무엇을 뜻할지, 입력 가능한 자릿수·합산 표현·반올림 시점이 어떻게 맞물리는지 논의한다. 환율 없는 통화 분리는 이미 유효한 기준이다. 환산 기능의 신규 도입을 이번 미합의 목록에서 자동 도출하지 않는다.

오류는 [.claude 오류 가이드](../../../../../../../.claude/context/error-handling.md), [client fetcher](../../../../../../../apps/client/src/shared/api/fetcher.ts), [server routes](../../../../../../../apps/server/src/routes/), [error middleware](../../../../../../../apps/server/src/middleware/errorHandler.ts)를 연결해 본다. Client가 해석할 status·code·message와 서버의 변환 책임을 논의하고, 단순 catch 정리로 공개 오류 계약을 바꾸지 않는다.

기존 통화 선택·금액과 통화 표시 기준의 누락과 날짜 본문의 사실 오류는 새 제품 선택과 구별해 바로잡을 수 있다. 제품 코드 수정이나 기존 003 Ticket의 실행은 이 Ticket의 문서 합의만으로 완료되지 않는다.

## 완료 확인

논의한 선택의 사용자 결과·이유·적용 범위가 남고, 실제 합의는 Project 기준 본문 및 영향받은 compact rule·진입점에서 일관되게 읽혀야 한다. 구현이 아직 다르면 그 차이와 후속 책임을 명시한다. 합의하지 않은 항목은 계속 열어 두며 완료로 표시하지 않는다. 기준 변경 뒤에는 관련 읽기 경로·직접 근거·live consumer를 확인한다.

## 현재 상태

다른 세션이 작성한 Project 문서를 Main이 기존 Owner와 실제 작업 진입점에서 다시 대조해 직접 보완했다. `current/architecture.md`의 실행 기록화와 날짜 본문의 사실 오류는 이미 해소돼 있었고, 남아 있던 통화 code/symbol 표시와 대표 금액·나머지 통화 개수 의미를 기존 기준에 맞게 복원했다. API·날짜·통화 runbook과 server/client guide도 새 Project Owner와 현재 경계에 연결했다.

보완한 통화·날짜·API 본문과 리팩터링·도시 검색·저장 용량·architecture 문서는 현재 Project 기준으로 채택했다. 기존 `.claude` 문서는 구현 위치와 호환 진입을 맡으며 004의 Recover·Project 선택·state·output도 이 권위 관계에 맞췄다.

Main 보고에 따르면 `git diff --check`, Harness 검사와 004 explicit Recover가 모두 통과했고, Recover packet에서 통화·날짜·API 본문을 실제로 읽는 것도 확인했다. 이 근거는 문서 형식·하네스 연결·재진입 선택을 확인하지만, 열린 제품 계약의 선택이나 실제 제품 동작 acceptance를 대신하지 않는다.

현재까지 채택하고 보완한 Project 계약과 읽기 경로는 commit `33bde33` (`docs(context): Project 계약과 읽기 경로 정비`)에 포함됐다. 이 커밋은 현재 문서 결과를 저장한 것이며, 아래의 열린 제품 선택을 완료했다는 뜻은 아니다.

Ticket의 남은 일은 새로운 제품 선택이다. 날짜의 장기 의미, 금액 정밀도와 `주 통화` 라벨, 서버 오류 계약은 현재 구현 차이와 사용자 결과를 설명한 뒤 합의해야 한다. 이 항목은 문서 보완으로 자동 결정하지 않았으며 합의 전까지 열린 판단으로 유지한다.
