# 02. 로그인 복구와 계정 전환의 데이터 보호

## 맡은 결과와 범위

저장된 계정으로 앱을 켰을 때 자동 갱신 가능한 인증은 복구하고, 실제 재인증이 필요하면 로그인 화면에서 끝까지 진행할 수 있게 한다. 로그아웃·계정 전환·계정 삭제에서 미전송 변경을 조용히 지우거나 이전 계정의 작업을 새 계정에 섞지 않게 한다.

일반 API와 sync 인증, 갱신 후 응답 형태, 통신 실패와 만료의 구분, 배너 이동, logout 안전 판단을 포함한다. DB 초기화 실패 화면은 01이 맡는다.

## 실행 맥락과 접근

[첫 사용 조사](../../../records/2026-09-13-01-first-use-scenario-investigation.md)에서 sync 401의 refresh 생략, 로그인 화면을 다시 홈으로 돌리는 effect, 갱신 후 응답의 이중 추출, 갱신 통신 실패의 만료 처리, FAILED-only 로그아웃의 정리 호출을 확인했다. 사용자 기기에서 본 안내문의 정확한 원인은 아직 로그와 대조하지 않았다.

[auth store](../../../../../../../apps/client/src/shared/store/auth.ts), [interceptor](../../../../../../../apps/client/src/shared/services/auth/auth-interceptor.ts), [logout](../../../../../../../apps/client/src/shared/services/auth/logout-service.ts), [sync API](../../../../../../../apps/client/src/shared/services/sync/api.ts), [root](../../../../../../../apps/client/app/_layout.tsx)가 시작점이다. 인증 복구는 독립 착수 가능하다. 계정 정리 완료는 10의 미전송 판정과 11의 진행 중 요청 격리 계약을 받아 검증한다.

공통 기준은 [기대 동작](../spec/02-behavior-and-cases.md)과 [품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 완료 조건과 확인 방법

- 유효 토큰·갱신 가능 만료·갱신 불가·갱신 중 통신 실패·오프라인 시작을 구별한다. 일반 API와 sync가 같은 계정 상태를 소비하며, 정상 요청과 갱신 후 요청이 같은 schema를 통과한다.
- 만료 배너에서 로그인 화면으로 이동해 같은 계정으로 복귀한다. Google 취소 후 재시도 대조군을 보존하고, 실제 Google·Apple 로그인/취소는 시험 계정에서 확인한다.
- FAILED·PENDING·IN_PROGRESS와 부분 UPDATE가 남으면 자동 정리를 막거나 기존 사용자 확인 절차를 거친다. 취소 시 로컬 입력과 queue가 그대로 남는다.
- A 계정 요청 도중 B 로그인, 로그아웃 직후 늦은 응답, 계정 삭제·재시작을 시험한다. 이전 데이터·query cache·native 지도와 진행 요청이 계정 경계를 넘는지 검증한다.
- 실제 사용자 안내 원인 대조가 안 됐다면 이 티켓의 재현 조건과 사용자 사례의 원인 확정을 구별해 보고한다.

## 현재 상태와 실제 결과

구성됨, 실행 전. 위 확인 계획을 수행하거나 제품 코드를 수정한 상태가 아니다. 기존 조사 근거는 위에 연결했으며, 실행할 때 현재 코드·환경과 수정 전 조건을 다시 대조한다.
