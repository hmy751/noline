# 04 — 경비 API의 요청·검증·반환 흐름

## 맡은 결과와 범위

`apps/client/src/entities/expense/api/expenses.ts`의 다섯 remote 함수에서 재전파 catch·반복 주석/로그가 작은 본문을 가리는 부담을 줄인다. repository/router, schema 계약과 전역 fetcher 오류 변환은 제외한다. [Spec 품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 실행 맥락과 접근

[기존 후보](../analysis-items.md)와 [추가 조사](../additional-research.md)를 출발점으로 삼는다. 요청 검증과 응답 검증은 서로 다른 경계이므로 중복으로 삭제하지 않는다. 삭제할 출력과 남아야 할 오류 기록 책임을 먼저 확인한다. 사용자 오류 표시·오류 종류·fallback을 바꾸지 않는다.

## 완료 조건과 확인 방법

변경 전 기존 API export를 호출해 정상 요청·반환, 잘못된 요청의 HTTP 전 실패, 잘못된 응답의 검증 실패, 네트워크 실패의 동일 오류 전달, 삭제 반환과 HTTP 횟수를 확인한다. 수정 후 같은 검사를 사용한다.

진단 로그 정리는 변경 내역과 남은 기록 책임을 별도로 설명하며 데이터/오류 계약 변경과 혼합하지 않는다. 개선은 요청·검증·반환이 직접 보이고 재전파를 읽기 위한 부수 코드가 줄었는지 비교한다. 범용 API framework를 만드는 것으로 목표를 대신하지 않는다.

## 현재 상태와 실제 결과

2026-09-11 Main이 제품 코드와 영구 검사를 수정했다. `expenses.ts`의 다섯 함수에서 오류를 기록한 뒤 같은 값을 다시 던지던 catch, 성공 로그와 함수 이름을 되풀이하던 주석을 제거했다. 새 공통 helper나 framework를 만들지 않고 `request schema parse → HTTP → response schema parse → data 반환`이 필요한 함수에서 바로 보이게 했다. repository/router, schema와 전역 fetcher는 수정하지 않았다.

진단 출력은 API 함수의 성공·실패 `console` 기록을 제거하는 것으로 정리했다. 생성·수정·삭제는 기존 React Query mutation hook의 `onError` 기록과 화면의 수정·삭제 실패 알림을 그대로 두었다. 목록 조회는 기존 React Query error state로 실패를 전달하며 별도 기록·표시를 새로 만들지 않았다. 따라서 조회 API의 기존 console 출력은 사라지지만 오류 객체·fallback·사용자 표시 흐름은 바꾸지 않았다.

`apps/client/tests/entities/expense/api/expenses.test.ts`를 추가했다. 동일한 8개 검사를 수정 전·후에 실행해 목록 두 경로의 정상 요청·반환, 생성·수정 입력의 HTTP 전 검증, 잘못된 응답의 검증 실패, 같은 네트워크 오류 객체 전달, 삭제 반환과 HTTP 횟수를 확인했고 두 번 모두 8개가 통과했다. 이 검사는 fetcher를 mock하므로 실제 네트워크·Axios interceptor·React Native 화면을 실행한 근거는 아니다.

변경 파일은 Prettier 검사와 Prettier rule을 제외한 나머지 ESLint 검사를 통과했다. 정상 ESLint는 기존 `prettier.resolveConfig.sync is not a function` 호환 오류로 실행되지 않았다. Client 전체 TypeScript 검사에서는 기존에 기록된 Mapbox 관련 3건만 다시 나타났고 변경 파일의 새 오류는 보고되지 않았다. 동시에 진행 중인 03번 Ticket의 변경이 있어 clean working tree는 주장하지 않는다.

사용자는 재전파 catch에 오류 처리 책임이 없고 조회 API의 console 출력이 제거된다는 경계를 확인한 뒤 결과 기록을 요청했다. Main은 위 근거와 미확인 범위를 포함해 04번 Ticket의 완료 조건이 충족됐다고 판단했고, 사용자가 수락해 완료했다. 이 수락은 전체 가독성 Work의 완료나 제품 Verify를 뜻하지 않는다. Main은 이 응답 시점의 변경 사항을 아직 커밋하지 않았다고 보고했다.
