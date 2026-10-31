# Ticket 07 — 통화·API·오류 이관 결과

Ticket 06의 작업 변경은 `57dd61d`, Workspace 기록은 `6d95e18`로 나눠 커밋한 뒤 진행했다. Ticket 07은 기존 통화·API 본문을 코드와 다시 대조해 보완하고 오류 설명·선택 이유와 남은 호환 경로를 Project로 이관한다. 제품 코드·지속 테스트는 수정하지 않았고 새 금액·공개 오류 정책도 확정하지 않았다. 독립 개선 검토와 별도 요구 검증을 마쳤고 Ticket 07 문서 이관 범위의 필수 미충족은 남지 않았다. 이번 변경은 아직 커밋하지 않았다.

## 실제 산출물과 내용·형식 판단

[통화와 금액](../../../../project/common/currency.md)은 기존 위치와 제품 의미의 Owner를 유지했다. 통화 분리·기본값·대표 표시·정밀도를 함께 읽어야 변경 영향을 판단할 수 있어 별도 current 문서로 나누지 않았다. 기존 설명의 유효한 이유·열린 선택은 보존하고 실제 화면별 차이를 비교 표로 보완했다. [통화 형성 자료](../../../../project/common/_background/currency/README.md)에 환산을 하지 않는 이유·비용, 대표 라벨과 정밀도를 별도 선택으로 남긴 근거를 붙였다.

[API 계약](../../../../project/guidance/api-contracts.md)도 기존 경로를 유지했다. 전송 검증·serializer·소유권의 책임 순서와 Schedule의 구체 적용은 유효해 보존하고 repository·query key·인증 전송을 연결했다. 정상 API 경계와 실패 응답의 변경 질문이 달라 [오류 처리](../../../../project/guidance/error-handling.md)는 독립 본문으로 두었다. 오류 매핑 전체를 API 본문에 반복하지 않고, [API·오류 형성 자료](../../../../project/guidance/_background/api-contracts/README.md)는 공유한다.

기존 오류 가이드의 책임 표는 유용하지만 현재 구현을 AppError로 일괄 설명한 내용은 부정확했다. 원래 기준과 실제 예외를 분리해 표를 다시 썼다. 존재하지 않는 tripService와 Express 4의 async throw만으로 중앙 처리를 보장하는 듯한 예시는 제외했고, 끝 체크리스트는 각 변경 조건 가까이에 통합했다. 기존 형식이 다르다는 이유로 삭제하거나 같은 목차로 통일한 것이 아니다.

## 원자료·코드 대조에서 바로잡은 의미

| 주제 | 확인한 차이와 반영 |
| --- | --- |
| 통화 합계와 대표 | baseCurrency가 있으면 우선하며 없으면 서로 다른 통화의 숫자 합계 내림차순이다. 사용 빈도·환산 가치가 아니다. getPrimaryCurrency/getAdditionalCurrencyCount는 현재 앱 consumer가 없고 홈은 이미 만든 그룹에서 직접 선택한다. |
| 표시 자릿수 | 경비 화면은 통화별 자릿수, 홈은 값이 있으면 고정 두 자리, 일정 상세는 formatter, 개별 카드는 amount 문자열 원문이다. 모든 화면이 공용 규칙을 사용한다는 일반화를 제거했다. |
| 금액·통화 입력과 저장 | 폼은 비어 있지 않은 문자열만 검사하고 공유 request도 숫자·통화 코드 유효성을 보장하지 않는다. 생성과 수정 request의 빈 문자열 허용도 다르다. Local TEXT와 server decimal(10,2), currency 길이와 Number 합산의 차이를 함께 설명했다. |
| 늦은 기본 통화 | 생성 폼의 통화는 첫 defaultValues이며 여행 조회가 늦어도 날짜처럼 보정되지 않는다. Ticket 06의 초안 수명과 연결했고 이번에 동작을 고치지는 않았다. |
| 서버 오류 기준과 실제 경로 | AppError/errorHandler 기준은 유지하지만 현재 AppError throw 소비자는 없고 Data routes는 자체 catch·sendInternalError, Places는 next(error)를 사용한다. 중앙 설치만으로 전체 연결을 보장하지 않는다. |
| 공개 오류와 client 변환 | sendInternalError의 details와 sync pull의 message에 raw error.message가 들어간다. 민감정보 미공개 기준의 미충족으로 남겼다. Fetcher는 최상위 message/code를 읽고 nested auth envelope는 직접 읽지 않으며, 401은 먼저 인증 갱신 흐름을 거친다. API 함수의 ZodError는 fetcher 변환 밖이다. |
| API 접근·검증 적용 | Schedule의 일곱 serializer 응답 경로는 유지한다. Expense create/update의 entity-only 검사와 delete 미검사, Trip delete 미검사, 대부분 path/query의 직접 사용은 최외곽·입력 검증의 전체 완료와 구별했다. Expense 부모 Trip/Schedule 관계 확인과 Trip mutation scope·non-deleted 조건의 공백도 현재 예외이지 허용 기준으로 쓰지 않았다. |
| 인증 전송 | 2025 Axios Factory의 독립 전송 이유·대안은 보존하되 현재 refresh는 auth-transport→authAxios라는 위치를 반영했다. sync는 별도 instance·timeout·5xx retry를 유지하면서 일반 API와 같은 401 갱신을 사용한다. 옛 무갱신 설명은 후속 결정·코드에 의해 대체됐다. |
| sync 입출력 | Sync는 일반 API의 unwrap/APIError 변환을 사용하지 않는다. Pull은 response.data를 검사하고, push engine은 REST mutation들을 쓰며 성공 body를 일반 entity API처럼 parse하지 않는다. /api/sync/push 상수·schema import는 501 stub의 구현 완료를 뜻하지 않는다. |

본문 사실은 Main과 조사 담당이 현재 코드·schema·실제 부모/소비자를 대조한 결과다. 기존 문서와 과거 Ticket의 실행 결과를 현재 전체 제품 보장으로 올리지 않았다. 원자료는 기존 Project 통화·API, 옛 currency/api-data/error-handling과 Auth Axios Factory 결정, 002 Ticket 01·04와 Schedule 응답·접근 기록, 004의 열린 선택, 2026-09 session 후속 결정 및 관련 코드다. 통화의 긴 역사 자료는 환산 없는 기록의 이유와 오래된 표현·후보를 구별하는 데 사용했다.

## 원본 처리와 현재 읽기 경로

다음 네 원본은 안내문을 붙인 역사 보존판으로 옮기고 옛 경로를 제거했다. 연결 stub은 남기지 않았다.

- currency.md → [currency 보존판](../../../../../.claude/_archive/currency-pre-project-2026-10-31.md)
- api-data.md → [API/Data 보존판](../../../../../.claude/_archive/api-data-pre-project-2026-10-31.md)
- error-handling.md → [오류 가이드 보존판](../../../../../.claude/_archive/error-handling-pre-project-2026-10-31.md)
- 2025-12-23-auth-axios-factory.md → [인증 전송 결정 보존판](../../../../../.claude/_archive/auth-axios-factory-pre-project-2026-10-31.md)

이 링크들은 006의 역사 대조 접근점이며 제품 기준의 일반 읽기 경로가 아니다. Project·client/server/schema guide·context map·runbook·auth-user-scope rule·문서 command reference는 새 Owner로 연결했다. 대표 통화를 무조건 getPrimaryCurrency로 고르라는 runbook은 그 helper의 실제 의미와 선택 조건을 설명하도록 고쳤다.

Live consumer는 session.json의 current generation과 workspace id만 확인했다. 현재 bound 002·006과 active/default 001의 Recover를 각각 실행했다. 기존 currency/api 경로를 유지해 002의 선택·current·output에는 의미가 바뀐 링크가 없었다. 001 Verify evidence의 이번 네 옛 입력은 새 Owner·형성 자료로 전환했고 claim·argv·receipt·status는 바꾸지 않았다. 현재 001에 남은 기존 누락 입력 8개는 Ticket 08의 전체 선언 점검 대상이다. 역사 Work·원문을 현재 정책으로 역동기화하지 않았다.

## 실행 근거와 한계

| 수행 | 결과와 입증 범위 |
| --- | --- |
| API 조사 담당의 client 기존 검사 | fetcher·auth-interceptor·Expense API·Trip API·sync HTTP retry, 5 suites / 39 tests 통과. 제어된 Axios adapter·인증 대역이며 실제 네트워크·OAuth·기기 UI가 아니다. |
| API 조사 담당의 server 기존 검사 | Schedule·Expense·Trip·sync response-contract 4개와 serializer 3개, 7 files / 44 tests 통과. Express status·JSON·schema 경계를 실행하나 DB/auth는 대역이다. PostgreSQL ownership·JWT·배포를 입증하지 않는다. |
| Main의 통화 임시 probe | 7 tests 통과. 그룹 분리·baseCurrency 유무·빈 통화 fallback·대표/개수·자릿수·입력 schema와 Number 계산을 관찰했다. 기존 동작의 특성 확인이며 올바른 금액 정책의 영구 기대값으로 채택하지 않았다. |
| 오류 helper 임시 probe | sendInternalError와 중앙 AppError/unknown handler를 직접 호출하고 status/json 대역에 결과를 수집했다. raw error.message 공개와 고정 문구의 차이를 확인했으며 실제 SQL 오류나 공격을 재현한 것은 아니다. |

Client 재실행은 apps/client에서 `../../node_modules/.bin/jest --config jest.config.cjs --runInBand tests/shared/api/fetcher.test.ts tests/shared/services/auth/auth-interceptor.test.ts tests/entities/expense/api/expenses.test.ts tests/entities/trip/api/trips.test.ts tests/shared/services/sync/http-retry.test.ts`다. Server는 apps/server에서 `../../node_modules/.bin/vitest run tests/routes/schedules.response-contract.test.ts tests/routes/expenses.response-contract.test.ts tests/routes/trips.response-contract.test.ts tests/routes/sync.response-contract.test.ts tests/serializers`다. 최초 pnpm 진입은 자동 의존 확인의 registry/TTY 단계에서, server는 첫 listen 권한에서 실패했으나 설치 없이 직접 실행 및 허용된 로컬 실행으로 해소했다. 조사 담당은 실행 파일을 별도로 남기지 않아, 최종 검증자가 실행 원본을 대조할 수 있도록 Main이 같은 범위를 다시 실행해 client 39·server 44 통과를 확인했다. 실행 로그는 `/tmp/noline-ticket07-client.log`와 `/tmp/noline-ticket07-server.log`다. 합계는 재실행을 중복 집계하지 않는다.

통화 probe 원본은 `/private/tmp/noline-ticket07-currency-probe/currency.test.ts`, config는 같은 폴더의 `jest.config.cjs`, 로그는 `/tmp/noline-ticket07-currency-probe.log`다. 임시 파일 없이도 판단을 재구성할 핵심 입력·관찰은 다음과 같다.

- USD 2.005 + USD 3, KRW 1000을 넣으면 USD 기본 통화에서는 USD 5.005가 먼저, EUR 기본 통화 또는 getPrimaryCurrency에서는 KRW 1000이 먼저다. 빈 통화 문자열은 helper에서 USD로 묶는다.
- Node에서 `(1.005).toFixed(2)`는 `1.00`, formatter는 `USD 1.01`이다. `0.1 + 0.2` 합계는 `0.30000000000000004`, 비숫자 abc는 NaN이다.
- 정상 나머지 필드와 amount=abc, currency=NOT_A_CURRENCY를 주면 생성·수정 form과 생성 request가 통과한다. 생성 request의 빈 currency와 수정 request의 빈 amount/currency도 통과한다. 이는 UI 조작이나 PostgreSQL 수용을 확인한 결과가 아니다.
- sendInternalError에 `new Error('private SQL detail')`을 주면 status 500의 details가 같은 문구다. 중앙 unknown handler는 고정 `Internal server error`/`INTERNAL_ERROR`; AppError(404, Trip not found, TRIP_NOT_FOUND)는 지정 status·message·code다. 이 probe는 응답 대역 호출이며 로그가 아닌 공개 body를 관찰했다.

## 독립 검토·검증과 다음 행동

독립 개선 검토자는 원문·현재 본문·코드를 대조하고 현재 구성 유지를 권했다. 기존 currency/API 위치 유지, 실패 질문의 별도 본문, 책임 표 보존과 부정확한 예시 제외가 읽기·관리 부담에 맞는다는 판단이며 필수 수정은 없었다. 선택 개선으로 제안한 AppError 기준의 적용 문장을 Main이 보완해, 기본 기준과 기존 자체 응답 경로의 보존·전달 확인을 더 분명히 했다. 별도 검증자는 원문·현재 문서·실제 코드를 대조하고 해당 이관 범위의 충족 근거가 충분하다고 판정했다. 홈의 그룹 배열 전달과 TripSummary 내부 대표값 계산을 구별하도록 한 문장을 정정했고 재확인했다. 원본 네 개는 안내 두 줄 외 HEAD 본문과 동일하며, 현재 guide·Project·rule·runbook·command에서 이번 옛 네 경로의 직접 참조는 0건이다. 통화 표시, API 추가, 오류 변경의 대표 읽기 세 경로도 새 본문·형성 자료만으로 필요한 판단을 복원했다.

최종 변경 문서 상대 링크 293개와 `git diff --check`, explicit 006·002·001 및 기본 001 Recover는 통과했다. 전체 Harness 검사는 45건의 옛 참조 때문에 실패한다. Ticket 06의 37건에서 원본 격리로 8건이 늘었으며, 역사 Work와 아직 이관하지 않은 2026-09 session 결정의 옛 연결이 포함된다. 새 제품 본문을 읽기 위해 옛 원본을 되살리지 않았고, 남은 결정·전체 읽기·Verify evidence 누락 8개는 Ticket 08에서 점검한다. 제품 코드·지속 테스트·Verify receipt/status는 변경하지 않았다.

다음 문서 실행은 Ticket 08의 개발 시작·전체 읽기·검증 선언 점검이다. 앱 실행·session 전체의 기존 형성 자료와 2026-09 session 결정, 남은 혼합 문서·결정의 현재 의존을 그 범위에서 마무리한다. Ticket 07의 인증 전송 설명을 읽는 데 필요한 2025 선택 이유와 후속 변경은 새 형성 자료에 직접 보존했지만 006 전체의 옛 문서 의존 제거가 끝난 것은 아니다.

제품 작업은 새 티켓을 자동 생성하거나 착수하지 않았다. 후속을 정한다면 접근·공개 안전성(Expense 부모 관계, Trip mutation scope, 내부 오류 문구)부터 기존 003과 겹침을 확인하는 것을 권한다. 금액은 입력·Local/Server 정밀도·합산·표시의 기대값을 한 묶음으로 정하고, 대표 라벨은 별도 사용자 의미 선택으로 둔다. 공개 오류 schema·중앙 처리 통일은 실패 분류·client 매핑·재시도·로그 이전 비용을 비교한 뒤 정한다. 안전성 공백 보완이 이 전체 표준화 결정을 기다려야 한다는 뜻은 아니다.
