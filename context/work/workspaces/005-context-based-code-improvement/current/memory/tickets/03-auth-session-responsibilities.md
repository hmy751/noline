# 03 — 인증·세션 책임 재배치 재검토

## 맡은 결과와 범위

당시 복잡도 우려·일부 원복을 거쳐 정한 인증 책임이 현재 Local 이용과 세션 전환의 약속을 보존하면서 이해·수정 부담을 줄이는지 판단한다. 필요한 개선을 채택하면 구현·영향 검증까지 맡는다.

Auth Store, 토큰 저장·갱신, 로그인·로그아웃·계정 삭제의 조율과 직접 연결된 Local 소유권·sync 종료가 대상이다. 전체 sync 엔진·cleanup 재설계나 새 인증 정책은 자동 포함하지 않는다.

## 실행 맥락과 접근

먼저 [관리 복잡도 재검토](../../../../002-code-readability-refactoring/records/2026-09-19-01-auth-complexity-review-and-decisions.md), [소비 구조 검토와 원복](../../../../002-code-readability-refactoring/records/2026-09-21-02-auth-token-separation-consumer-review-and-rollback.md), [책임 재점검과 수정](../../../../002-code-readability-refactoring/records/2026-09-21-04-auth-responsibilities-and-regression-fixes.md), [분리 커밋·확인 범위](../../../../002-code-readability-refactoring/records/2026-09-22-02-five-stage-commits-and-verification.md)를 읽어 현재 선택과 철회안을 구별한다.

[Auth Store](../../../../../../../apps/client/src/shared/store/auth.ts), [세션 조율](../../../../../../../apps/client/src/shared/services/auth/session-lifecycle.ts), [요청 인증 연결](../../../../../../../apps/client/src/shared/services/auth/auth-interceptor.ts)에서 관련 실제 소비자를 찾는다. [세션 동시성 검사](../../../../../../../apps/client/tests/shared/services/auth/session-concurrency.test.ts), [Local 보존 검사](../../../../../../../apps/client/tests/shared/services/auth/local-preservation.test.ts)를 계약과 대조한다. [Context](../project-context.md)의 이름·완료·계약·수명을 적용하되 현재 제품 약속은 해당 기록과 실제 Owner에서 확인한다.

범위가 크므로 착수 시 실제 변경·결과 경계를 먼저 복원한다. 독립적인 결과로 나누어야 한다면 Main이 보존 계약과 선행 관계를 연결해 재구성한다. 분할 필요를 조사 완료나 제품 개선 완료로 취급하지 않는다.

## 완료 조건과 확인 방법

- 토큰·계정·세션 상태·요청 갱신·종료 조율의 Owner와 호출자가 믿을 완료·오류 의미를 복원한다.
- 인증 만료 후 Local 이용, 계정 전환, 늦은 갱신 응답과 겹친 종료에서 보존할 계약과 현재 동작을 대조한다. 데이터 보존과 파괴적 정리 조건을 낮추지 않는다.
- 최초안·철회안·최종안의 이유를 현재 코드와 구별하고, 현행과 대안의 관리 부담·정확성을 비교한다.
- 변경의 영향을 받는 동시성·Local 보존·요청 인증 경로를 검증하며 mock·SQLite·실제 인증 환경의 증명 범위를 구별한다.
- 채택한 수정과 필요한 검증을 마치거나 유지 근거를 제시한다. 핵심 보장을 막는 미해결·미배정이 있으면 완료하지 않는다.

## 현재 상태와 실제 결과

구성됨. 과거 기록 색인과 기존 결과 설명으로 범위를 잡았다. 이번 주체의 인증 코드 전체 재검토·실행 검증은 아직 없으며, 착수 때 필요한 분할과 확인 범위를 정한다.
