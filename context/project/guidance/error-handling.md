# 오류 전달과 공개 응답

Server 오류 처리, client 오류 변환·표시·재시도를 바꿀 때 읽는다. **발생한 실패를 호출자에게 전달하되 공개 문구·진단 정보·정책 제한을 구별한다. 사용자에게 토큰·내부 SQL·stack trace를 공개하지 않는다.** 현재 HTTP 형식은 통일돼 있지 않으며, 아래 차이는 새 표준으로 승인한 것이 아니다. API의 검증·접근은 [API 계약](api-contracts.md), 화면 복구는 [여행 접근](travel-access/INDEX.md)이 소유한다. 기존 기준과 현재 예외를 함께 남긴 이유는 [형성 자료](_background/api-contracts/README.md)에 있다.

## 서버를 바꿀 때 기본 처리 기준과 실제 전달 경로를 구별한다

기존 서버 오류 기준은 `AppError + errorHandler` 흐름을 따른다. 서버 오류를 변경할 때 이 기본 기준을 유지하고, 기존 자체 응답 경로를 고칠 때는 status·envelope 보존과 실제 handler 전달을 함께 확인한다. 예상 오류의 status·공개 message·code는 중앙 handler에 전달할 값으로 정한다. 현재 [errorHandler](../../../apps/server/src/middleware/errorHandler.ts)는 app에 설치돼 있고 AppError와 unknown 오류를 처리하지만, server source에 AppError를 생성·throw하는 소비자는 없다. 주요 Data route는 자체 catch를 사용하며 Places는 `next(error)`로 중앙 handler에 넘긴다.

중앙 처리로 연결할 때는 실제 middleware 도달을 확인한다. 현재 Express 4의 async route에서 throw만 하는 예시는 충분하지 않다. route의 try/catch에서 `next(error)`로 전달하거나 사용 중인 async adapter의 연결을 확인해야 한다. 오류 처리를 설명하는 예시라도 인증·ownership·soft-delete 조건을 생략한 자원 조회를 실제 기본 구현처럼 복사하지 않는다.

| 현재 경계 | status와 공개 body |
| --- | --- |
| 중앙 AppError 처리 | 지정 status와 `{ message, code }` |
| 중앙 unknown 처리 | 500과 고정 `Internal server error`, `INTERNAL_ERROR` |
| [sendInternalError](../../../apps/server/src/utils/http-errors.ts)를 쓰는 Data route catch | 500과 `{ error, message, details }`. message는 호출부 문구, Error인 경우 details는 원래 error.message |
| [인증 middleware](../../../apps/server/src/middleware/auth.ts) | 401과 `{ success: false, error: { code, message } }` |
| Data route의 body 검증 실패 | 일반적으로 400과 `{ error, message, details }`, details에 Zod issues |
| [Sync pull catch](../../../apps/server/src/routes/sync.ts) | 500과 `{ success: false, error: 'Sync pull failed', message: error.message }` |

공통 성공 schema가 있다는 사실로 오류 envelope까지 통일됐다고 판단하지 않는다. 위 helper의 details와 sync pull의 message는 원래 오류 문구를 공개하므로 내부 정보가 노출되지 않는다는 기준을 현재 달성한 상태가 아니다. 중앙 unknown handler가 고정 문구를 쓴다는 사실도 다른 경로를 보호하지 않는다. 이 공백을 수정할 때는 HTTP body와 화면에 표시할 문구, 서버 진단 로그를 분리해 확인한다.

기존 AppError 기준을 모든 endpoint의 구현 완료로 서술하거나, Data route의 현재 예외를 새 권장 표준으로 올리지 않는다. 서버 전체를 중앙 handler로 통일할지, 어떤 공개 error schema와 code를 제공할지는 열린 선택이다. 국소 API 정리에서 catch를 일괄 제거하거나 status·envelope·사용자 문구를 조용히 바꾸지 않는다.

## 클라이언트는 HTTP 변환과 응답 검증 실패를 구별한다

일반 [fetcher](../../../apps/client/src/shared/api/fetcher.ts)는 인증 interceptor 다음에 응답을 한 번 unwrap하고 오류를 변환한다.

| 들어온 실패 | 현재 반환하는 오류 |
| --- | --- |
| Axios timeout | status 408, code `REQUEST_TIMEOUT`인 APIError |
| HTTP 오류 response | 실제 status, 최상위 data.message/code 또는 기본 문구·`SERVER_ERROR`. body 전체를 details로 보존 |
| response 없는 Axios 오류 | status 0, `NETWORK_ERROR`인 APIError |
| 이미 APIError 또는 AuthRequiredError | 원래 객체 유지 |
| 그 밖의 interceptor 오류 | status 0, `UNKNOWN_ERROR`인 APIError |

인증 middleware의 nested error.message/code는 이 변환기가 직접 읽지 않는다. 다만 401은 먼저 인증 interceptor의 갱신·재전송을 거치므로 모든 인증 실패가 즉시 일반 문구로 바뀐다고 설명하지 않는다. Sync client는 일반 fetcher의 APIError 변환을 사용하지 않는다. 인증 전송·재시도 차이는 [API 계약](api-contracts.md#인증-전송을-바꾸면-갱신-호출의-독립성과-세션-수명을-유지한다)에서 확인한다.

API 함수가 HTTP 전 request 또는 HTTP 뒤 response schema를 parse하다 발생시킨 ZodError는 fetcher의 HTTP 오류 변환을 거치지 않는다. Trip·Schedule·Expense API는 이를 그대로 전달한다. 반환 타입이나 한 종류의 catch만 보고 모든 실패를 APIError라고 가정하지 않는다.

일정·경비 직접 수정에서는 서버의 성공 응답을 검증한 뒤 기기에 편집 표식을 보관한다. 이 마지막 단계만 실패하면 `ConfirmedUpdateError`로 전달해 서버가 요청을 처리한 사실과 기기의 준비 미완료를 구별한다. 항목별 충돌 규칙이 적용되므로 요청 처리 완료가 요청값 전체의 채택을 뜻하지는 않는다. 수정 화면과 이전 입력 복구 화면은 일반 저장 실패 문구 대신 현재 값 재확인을 안내하고 초안·보류 입력을 유지한다. HTTP 실패나 응답 검증 실패에는 이 구분을 적용하지 않는다. 표식 서비스는 보관하지 못한 관찰값을 같은 실행의 메모리에 남기고, 이후 새 편집은 그 값까지 반영한 표식의 영속화에 성공해야 진행한다. 메모리 보존은 앱 재시작을 넘어서는 보장이 아니며 다시 조회·활성화할 때 서버 표식을 재수신한다.

직접 수정의 삭제 응답은 code만으로 기기 반영 완료를 판단하지 않는다. [직접 수정 실패 처리](../../../apps/client/src/shared/services/sync/direct-update-failure.ts)의 `handleDirectUpdateFailure`는 공유 응답 검증과 기록·여행 귀속 확인을 거쳐 삭제가 실제 반영됐을 때만 `APIError` 하위형인 `ConfirmedDeletionError`를 전달한다. 로컬 원본의 귀속이 모순돼 반영하지 않았거나 응답을 검증하지 못했다면 원래 오류와 입력을 유지한다. 이전 입력 복구 화면은 확인된 삭제에서 삭제 안내와 관련 목록 갱신을 제공하며, 이미 정리한 입력이 보관되어 있다고 안내하거나 다시 정리하지 않는다. 새 조회의 실패가 확인된 삭제를 일반 저장 실패로 바꾸지는 않는다.

## 오류와 정책 제한은 필요한 사용자 영역에서 처리한다

Data hook의 queryFn·mutationFn은 실패를 throw하고 React Query의 error·isError·onError로 호출부에 전달한다. 무조건 빈 배열·성공값으로 바꾸면 실패와 정상 빈 결과를 구별할 수 없다. 필요한 경계에서 오류를 기록하고 화면은 사용자 친화 문구와 재시도 행동을 제공한다. Error.message나 APIError.details를 사용자 공개에 안전한 값으로 가정하지 않는다.

정책상 실행 불가한 작업은 `useAppPolicy`의 결과와 `PolicyErrorDisplay` 같은 기존 policy UI를 우선한다. 서버/저장 오류와 제한 상태를 같은 예외로 합치지 않는다. 최초 실패, 기존 내용의 갱신 실패, 조회 차단과 캐시 표시의 우선순위는 [여행 접근·화면 복구](travel-access/INDEX.md#오류와-제한은-발생한-영역에서-표현한다)를 따른다. 저장 실패 때 초안·picker·닫기 수명은 [작성·입력](writing-and-input/INDEX.md)과 함께 확인한다. React Query가 오류를 가진다는 사실만으로 각 화면이 복구 UI를 제공했다고 보지 않는다.

[queryClient](../../../apps/client/src/shared/lib/queryClient.ts)는 AuthRequiredError를 자동 재시도하지 않는다. 인증 거부·전송 실패·서버 실패·검증 실패를 새로 매핑할 때는 기존 재시도와 세션 상태, 저장 후 부작용까지 대조한다.

## 개발자가 동기화 실패를 조사할 때

기기에서 요청을 격리하거나 전송 전에 중단하면 서버에는 조사할 요청이 없다. 앱은 실제 동기화 시작·종료, 새 격리와 push·pull 중단을 Sentry에 기록한다. 실행을 건너뛰거나 이미 격리한 항목을 다시 읽는 일은 새 사건으로 세지 않는다. 구버전 입력을 보관해 다음 요청으로 진행하거나 삭제 증거로 종결하면 앱은 `sync.push.resolved`를 info로 남긴다. HTTP 409만으로 큐가 막혔다고 해석하지 않는다. 실행 중단 신호인 `sync.push.blocked`를 받으면 중단 단계와 남은 큐를 함께 확인한다. 서버 처리와 기기의 요청 종결이 끝났어도 후속 화면 조회 갱신이 실패하면 표·작업 종류·이전 실패 횟수 같은 작업별 태그 없이 `local-after-response` 중단이 기록된다. 해당 요청이 큐에서 빠졌고 기기 확인본도 반영됐다면 화면 갱신 오류를 조사한다. [중단 단계별 검사](../../../apps/client/tests/shared/services/sync/blocked-diagnostics.test.ts) 정상 PUT이나 동일 표식 재전송에는 개별 경고를 남기지 않는다. 같은 실행의 시작만 수신했다면 결과는 미확인이다. 토큰을 갱신하다 실패했을 때는 갱신 실패를 기록한다. 이때의 HTTP 상태만으로 여행 데이터 요청이 전송됐거나 거절됐는지 판단할 수 없다. 서버는 5xx 응답과 여행 데이터·동기화 API에서 지원하는 4xx 거절 사유를 환경·릴리스별로 기록한다. 같은 작업이 앱과 서버 양쪽에 보일 수 있고, 일반 온라인 요청도 같은 API를 쓰므로 서버 요청 수로 동기화 횟수를 계산할 수 없다.

진단은 여행 DB와 별도로 전달한다. 진단 전달이 실패해도 원래의 저장·재시도·격리·인증 결과를 유지한다. 오프라인 진단은 로그아웃으로 기기 DB를 비운 뒤에도 SDK 캐시에서 전달될 수 있다. 사건에 계정·여행 식별자, 요청 본문, 토큰, 좌표나 원문 오류 메시지를 싣지 않는다. 수집 서버가 추가한 지역 정보는 앱에서 보낼 필드를 제한해도 남을 수 있어, 설정 변경 후 새 이벤트로 확인해야 한다. JS 필터를 통과하지 않는 네이티브 크래시와 화면 녹화는 자동 수집하지 않는다.

SDK나 필터를 바꾸면 최종 수신본에서 두 가지를 함께 확인한다. 요청 본문과 금지한 식별자가 빠져야 하고, 환경·릴리스와 허용된 코드 위치는 남아 어느 빌드의 어떤 오류인지 찾을 수 있어야 한다. SDK가 필터 뒤에 속성을 더한 경우와 필터가 릴리스 정보까지 지운 경우가 있었다. 앱 오류는 해당 빌드의 소스맵으로 허용된 프레임을 원래 코드 위치에 연결할 수 있는지도 확인한다. [실제 수신에서 발견한 문제](../../work/workspaces/007-sync-failure-recovery/records/2026-11-10-02-diagnostics-review.md) · [반복 실패 신호 해석과 수신 확인](../../../START_GUIDE.md#sentry-오류-수집을-연결할-때)

## 중앙 클라이언트 오류 계층은 반복되는 필요가 생길 때 재검토한다

현재 존재하지 않는 `_libs/error`, `errorService`, 클래스형 ErrorBoundary를 일반 작업에서 새 기본 인프라로 만들지 않는다. 같은 메시지 변환이 여러 화면에서 반복되거나 toast·inline·block·logging 분기가 중복될 때, 서버 code와 문구 매핑이 커질 때, 오류 추적 도구에 공통 boundary가 필요할 때 중앙화의 이득과 책임을 검토할 수 있다.

도입하면 먼저 결정 기록에 적용 범위·표시와 로그의 책임·기존 호출부의 이전 비용을 남긴다. 과거 설계안의 존재는 도입 결정이 아니다. 현재 API 실패와 화면 복구를 바꾸는 데 필요한 설명은 이 본문과 연결된 Project Owner에서 얻으며 옛 blueprint를 기본 읽기 경로로 삼지 않는다.
