# Ticket 07 — 통화·API·오류 재구성

상태: 완료. 2026-10-31, 통화·API·오류 설명을 실제 schema, client·server 구현과 소비 경로에 대조해 Project로 이관하고 독립 검토·검증을 마쳤다. 이 완료는 문서 이관 범위이며 확인한 접근·공개 안전성 공백의 수정, 새 금액·공개 오류 정책의 채택이나 006 전체 이관 완료를 뜻하지 않는다. 이번 변경은 아직 커밋하지 않았다.

## 맡은 결과와 범위

현재 Project context에서 통화별 그룹·대표값·표시 정밀도·입력과 저장 표현, API 전송·응답 검증·serializer·인증·소유권, 오류 생성·전달·공개 응답과 client 변환의 관계를 이해하고 관련 변경 기준을 선택할 수 있게 한다.

기존 통화와 API Owner는 유지하고, 실패 응답을 판단하는 질문이 정상 API 계약과 달라 오류 설명만 독립 본문으로 분리한다. 유효한 책임 표와 환산하지 않는 선택 이유, 인증 전송의 독립성은 보존하되 일부 helper나 route의 동작을 제품 전체 보장으로 확대하지 않는다.

## 실행 맥락과 접근

Ticket 06에서 확인한 늦은 경비 통화 기본값과 시간대 호환 입력을 이어받아 기존 Project 통화·API 본문, 옛 currency·api-data·error-handling 가이드와 Auth Axios Factory 결정을 맡았다. 앞선 Ticket과 session 결정, 실제 통화 소비 화면, form·request schema·Local·server 저장, fetcher·auth transport·sync HTTP, route·serializer·소유권·오류 helper를 대조했다.

[공통 내용·구성 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)에 따라 현재 적합성과 형식의 역할을 함께 판단했다. 통화의 분리·기본값·표시·정밀도는 함께 읽어야 영향이 드러나므로 기존 한 본문을 유지했다. API의 책임 순서와 Schedule 사례는 보존하고 repository·query key·인증 전송을 연결했다. 오류 본문에서는 유효한 책임 표를 유지하되 존재하지 않는 서비스와 중앙 처리가 전체 route에 적용된 듯한 예시를 제거했다.

## 완료 조건과 확인 방법

- `baseCurrency` 유무에 따른 대표 그룹 선택과 숫자 합계·빈 통화 fallback을 환산 가치나 사용 빈도와 구별한다.
- 화면별 금액 표시 자릿수, 입력 schema, Local TEXT·server decimal과 Number 합산의 차이를 설명한다.
- 정상 API의 전송 검증·serializer·소유권과 실제 route별 미검증·관계 확인 공백을 구별한다.
- 일반 API와 sync의 인증 갱신·unwrap·오류 변환·push/pull 경계 차이를 설명한다.
- AppError·중앙 handler의 기준과 실제 자체 catch·raw 오류 공개·client 매핑 경로를 구별한다.
- 옛 본문·결정과 archive가 현재 제품 의미를 소유하거나 일반 읽기 경로에 남지 않는다.
- 기존 검사와 임시 확인이 입증한 범위, 실제 network·OAuth·DB·기기에서 확인하지 않은 범위를 실제 결과에 남긴다.

제품의 올바른 금액 기대값, 대표 라벨이나 공개 오류 schema·중앙 처리 통일은 문서 이관 완료로 대신하지 않는다.

## 현재 상태와 실제 결과

[통화와 금액](../../../../../../project/common/currency.md)과 [API 계약](../../../../../../project/guidance/api-contracts.md)은 기존 Owner를 유지하면서 현재 구현 차이와 선택 근거를 보완했다. [오류 처리](../../../../../../project/guidance/error-handling.md)는 실패 응답의 생성·공개·client 변환을 독립적으로 설명한다. 상세 판단과 원본 대응, 실행 근거는 [이관 결과](../../../output/ticket-07-result.md)가 맡는다.

대표 통화는 `baseCurrency`가 있으면 우선하고 없으면 통화별 숫자 합계 내림차순으로 선택한다. 이는 사용 빈도나 환산 가치가 아니며 관련 helper는 현재 앱 소비자가 없다. 경비 화면은 통화별 자릿수, 홈은 값이 있으면 고정 두 자리, 일정 상세는 formatter, 개별 카드는 원문 문자열을 사용하므로 모든 화면이 한 표시 규칙을 공유한다는 설명을 제거했다.

금액 form과 공유 request는 비숫자 금액이나 임의 통화 코드를 충분히 막지 않으며 생성·수정의 빈 문자열 허용도 다르다. Local TEXT, server decimal(10,2), currency 길이와 JavaScript Number 합산의 차이를 현재 한계로 남겼다. 여행 조회가 늦게 도착해도 생성 폼의 초기 통화가 날짜처럼 보정되지 않는 문제는 Ticket 06의 초안 수명과 연결했으며 제품 코드는 수정하지 않았다.

AppError와 중앙 error handler는 기준으로 남아 있지만 현재 AppError를 throw하는 소비자는 없고 Data route는 자체 catch와 `sendInternalError`, Places는 `next(error)`를 사용한다. 일부 500 응답과 sync pull message는 raw `error.message`를 공개한다. fetcher는 최상위 message·code를 읽고 401이면 인증 갱신을 먼저 수행하지만 nested auth envelope와 API 함수 내부의 ZodError는 같은 변환 경로에 있지 않다.

Schedule의 serializer 적용은 유지되지만 Expense create·update의 entity-only 검사와 일부 delete·path·query 미검증, Expense 부모 Trip·Schedule 관계와 Trip mutation scope·non-deleted 확인 공백은 제품 전체 검증 완료와 구별했다. 인증 refresh는 현재 `auth-transport`에서 `authAxios`를 사용하고 sync도 별도 instance·timeout·5xx retry를 유지하면서 같은 401 갱신을 사용한다. Sync는 일반 API의 unwrap·APIError 변환을 사용하지 않으며 `/api/sync/push` 상수와 schema는 501 stub의 구현 완료를 뜻하지 않는다.

옛 currency·api-data·error-handling과 Auth Axios Factory 결정 4개는 안내문 뒤 원문을 보존한 archive로 옮겼고 옛 경로는 제거했다. Project와 client·server·schema guide, context map, runbook·rule·command 및 선택된 live consumer는 현재 Owner로 전환했다. 역사 Work를 현재 정책으로 일괄 역동기화하거나 compatibility stub을 만들지는 않았다.

Main 결과 문서에 따르면 client 기존 검사 5 suites·39 tests와 server 7 files·44 tests, 통화 임시 확인 7개가 통과했다. 오류 helper도 직접 호출해 raw 내부 문구 공개와 중앙 handler의 고정 응답 차이를 확인했다. 최종 변경 문서 상대 링크 293개, `git diff --check`, 관련 explicit·default Recover와 원본 보존·대표 읽기 검증도 통과했다. 독립 검토·검증은 문장 한 곳을 교정한 뒤 Ticket 07 문서 이관 범위의 필수 미충족을 남기지 않았다.

검사는 실제 network·OAuth·기기 UI, PostgreSQL ownership·JWT·배포나 실제 공격을 입증하지 않는다. 임시 확인은 지속 테스트로 추가되지 않았으며 관찰한 기존 숫자 동작을 새 제품 정책으로 채택하지 않았다. 전체 Harness 검사는 역사·미이관 링크 오류 45건 때문에 실패했고 default 001 Verify 선언의 기존 누락 입력 8개도 남아 있다. 제품 코드·지속 테스트·Verify receipt와 status는 변경하지 않았고 Ticket 07 변경은 아직 커밋하지 않았다. 다음 문서 실행은 Ticket 08의 개발 시작·전체 읽기·검증 선언 점검이다.
