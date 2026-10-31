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

API 함수가 HTTP 전 request 또는 HTTP 뒤 response schema를 parse하다 발생시킨 ZodError는 fetcher의 HTTP 오류 변환을 거치지 않는다. Expense API는 이를 그대로 전달하고 Trip·Schedule API의 catch는 기록 후 같은 오류를 다시 던진다. 반환 타입이나 한 종류의 catch만 보고 모든 실패를 APIError라고 가정하지 않는다.

## 오류와 정책 제한은 필요한 사용자 영역에서 처리한다

Data hook의 queryFn·mutationFn은 실패를 throw하고 React Query의 error·isError·onError로 호출부에 전달한다. 무조건 빈 배열·성공값으로 바꾸면 실패와 정상 빈 결과를 구별할 수 없다. 필요한 경계에서 오류를 기록하고 화면은 사용자 친화 문구와 재시도 행동을 제공한다. Error.message나 APIError.details를 사용자 공개에 안전한 값으로 가정하지 않는다.

정책상 실행 불가한 작업은 `useAppPolicy`의 결과와 `PolicyErrorDisplay` 같은 기존 policy UI를 우선한다. 서버/저장 오류와 제한 상태를 같은 예외로 합치지 않는다. 최초 실패, 기존 내용의 갱신 실패, 조회 차단과 캐시 표시의 우선순위는 [여행 접근·화면 복구](travel-access/INDEX.md#오류와-제한은-발생한-영역에서-표현한다)를 따른다. 저장 실패 때 초안·picker·닫기 수명은 [작성·입력](writing-and-input/INDEX.md)과 함께 확인한다. React Query가 오류를 가진다는 사실만으로 각 화면이 복구 UI를 제공했다고 보지 않는다.

[queryClient](../../../apps/client/src/shared/lib/queryClient.ts)는 AuthRequiredError를 자동 재시도하지 않는다. 인증 거부·전송 실패·서버 실패·검증 실패를 새로 매핑할 때는 기존 재시도와 세션 상태, 저장 후 부작용까지 대조한다.

## 중앙 클라이언트 오류 계층은 반복되는 필요가 생길 때 재검토한다

현재 존재하지 않는 `_libs/error`, `errorService`, 클래스형 ErrorBoundary를 일반 작업에서 새 기본 인프라로 만들지 않는다. 같은 메시지 변환이 여러 화면에서 반복되거나 toast·inline·block·logging 분기가 중복될 때, 서버 code와 문구 매핑이 커질 때, 오류 추적 도구에 공통 boundary가 필요할 때 중앙화의 이득과 책임을 검토할 수 있다.

도입하면 먼저 결정 기록에 적용 범위·표시와 로그의 책임·기존 호출부의 이전 비용을 남긴다. 과거 설계안의 존재는 도입 결정이 아니다. 현재 API 실패와 화면 복구를 바꾸는 데 필요한 설명은 이 본문과 연결된 Project Owner에서 얻으며 옛 blueprint를 기본 읽기 경로로 삼지 않는다.
