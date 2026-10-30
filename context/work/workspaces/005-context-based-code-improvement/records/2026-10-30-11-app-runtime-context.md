# 앱 실행·세션·데이터 보존 Context 보완

사용자가 “그럼 티켓 04 부터 하자 구체화 할거 있나?”에 이어 “진행해봐”라고 요청했다. 04의 대표 질문을 구체화한 뒤, 002에서 채택한 의미와 현재 코드를 Project 본문으로 복원했다. 개인 판단·협업·스킬 개선은 후순위로 유지했다.

## 반영한 관계와 구성 이유

새 [app-runtime 본문](../../../../project/current/app-runtime/INDEX.md)은 앱 시작, 계정별 Local 이용, 로그인, 세션 변경 대기, 로그아웃·탈퇴 뒤 남는 데이터를 한 흐름으로 설명한다. 이 주제를 여러 모듈 요약으로 나누면 같은 데이터 보존 조건을 다시 조립해야 하므로 하나의 내용 본문으로 묶었다. [현재 구조](../../../../project/current/architecture.md)는 큰 관계와 상세 진입을 맡는다. 기존 Activation Router·Policy·transaction·cleanup 상세 Owner는 유지했다.

초기 auth 결정에는 자동 계정 전환과 후속 보완 대기 설명이 남아 있으나, 09-19 사용자 선택과 09-21 책임·회귀 수정 및 현재 소스가 이후 상태를 설명한다. 과거 결정은 덮어쓰지 않고, 현재 본문과 가까운 형성 자료에 대체 관계·선택 이유·기록에서 확인한 최소 발췌를 남겼다. 원 대화 전체를 새로 재검증했다는 주장은 하지 않는다.

## 대표 읽기와 직접 대조

Main이 편집 뒤 Project README와 실제 client 작업 진입에서 다음 질문을 적용했다. 이는 작성자의 읽기·소스 대조이며 독립 독자의 적용 결과가 아니다.

| 대표 변경 질문 | 본문에서 얻은 판단과 확인 경로 |
| --- | --- |
| DB 준비 실패 뒤 인증이 있으면 진입해도 되는가? | 앱 준비 절에서 DB 성공 전 진입 보류와 데이터 삭제 없는 재시도를 확인했다. 인증 복원 실패는 별도 로그인 안내라는 차이를 AppInitialization·Root·Store·LoginScreen에 대조했다. |
| 재인증 배너에서 다른 계정으로 바로 바꿀 수 있는가? | 상태·로그인 절에서 같은 계정의 Local 이용과 DB 보존, 명시적 로그아웃 뒤 전환의 이유를 확인했다. Store·local-account·local-access·completeLogin과 후속 결정에 대조했다. |
| 로그인 뒤 조회 실패를 로그인 실패로 처리할 것인가? | 저장·적용 성공 뒤 query 갱신의 실패를 분리한다는 완료 범위를 확인하고 completeLogin에 대조했다. |
| 종료 중 저장을 막으려면 어디를 바꿔야 하는가? | client guide 및 transaction rule에서 본문으로 들어가 sync→pending cleanup→DB 순서와 이유를 찾았다. session-lifecycle·DB 직렬 실행·cleanup/lifecycle에 대조했다. |
| 탈퇴 실패면 데이터가 모두 보존되는가? | 종료 표에서 서버 삭제 실패와 DB reset·인증 삭제 실패를 구별했다. 서버·SQLite·SecureStore 전체가 한 transaction은 아니라는 범위를 실제 서비스에 대조했다. |

Project README·current 색인·client guide·기존 context 지도·transaction rule이 동일한 현재 본문으로 연결된다. 현재 본문의 사용에는 형성 기록 전체를 먼저 읽을 필요가 없고, 선택을 바꿀 때 형성 자료에서 이유와 발췌를 찾도록 했다.

## 검증

제품 코드·테스트 변경 없이 현재 구현을 확인하는 기존 검사만 실행했다. Project root에서 `node_modules/.bin/jest --config apps/client/jest.config.cjs --runInBand --silent --runTestsByPath`에 아래 경로를 전달했다. **14개 suite·146개 test가 통과**했다.

- `apps/client/tests/app/layout.test.tsx`
- `apps/client/tests/shared/db/startup.test.ts`
- `apps/client/tests/shared/db/transaction-serialization.test.ts`
- `apps/client/tests/shared/store/auth.test.ts`
- `apps/client/tests/shared/services/auth/session-restoration.test.ts`
- `apps/client/tests/shared/services/auth/session-concurrency.test.ts`
- `apps/client/tests/shared/services/auth/local-preservation.test.ts`
- `apps/client/tests/shared/services/auth/local-access.test.ts`
- `apps/client/tests/shared/services/auth/login-service.test.ts`
- `apps/client/tests/shared/services/auth/auth-interceptor.test.ts`
- `apps/client/tests/shared/services/sync/lifecycle.test.ts`
- `apps/client/tests/shared/services/sync/cleanup-lifecycle.test.ts`
- `apps/client/tests/shared/services/sync/logout-sync.test.tsx`
- `apps/client/tests/shared/services/sync/auth-result.test.ts`

Node 메모리 SQLite와 실제 Drizzle SQL, 제어된 SecureStore·HTTP·native 대역과 React render의 범위다. 실기기 OAuth·SecureStore·서버 token rotation·앱 강제 종료 복구·전체 제품 acceptance는 확인하지 않았다. 이번 문서 변경으로 전체 타입·lint를 재실행하지 않았으며 이전 정적 검사 한계를 해소했다고 주장하지 않는다.

`node scripts/check-harness.mjs`는 [이전 기록](2026-10-30-03-review-and-save.md)과 같은 기존 002·003의 끊어진 링크 8건으로 실패했다. 오류 대상은 이번에 변경하지 않은 역사 기록·source·기존 Ticket이다. 새 Context 본문은 해당 오류에 포함되지 않는다. 변경·신규 문서의 상대 링크·anchor·형식과 명시적 005 Recover는 별도 최종 확인 대상이다.

## 구현 한계와 다음 작업

본문은 종료 대기가 전송 성공이 아님을 설명하고, 여행별 cleanup은 PENDING만 검사하며 처리 수가 실제 삭제 수와 다를 수 있음을 남겼다. 별도 지도 만료 정리 전체와 앱 강제 종료 뒤 복구도 세션 조율의 보장 밖이다. 기존 미완료 제품 작업을 이번 문서 작업에서 구현하거나 완료 처리하지 않았다.

04의 요구는 현재 관계·이유·조건과 읽기 경로의 복원이다. 위 제품 한계를 밝힌 본문 반영은 마쳤으며, 이를 제품 결함 해소나 Workspace 전체 완료로 확대하지 않는다. 다음 실행은 05의 네트워크·조회·화면 복구 Context다. commit·push와 active index·session binding·Verify machine 상태는 이번 요청으로 변경하지 않는다.
